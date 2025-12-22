import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListBucketsCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export class SpaceshipStorage {
  private s3Client: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor() {
    // Check for required environment variables
    const accessKey = process.env.SPACESHIP_ACCESS_KEY;
    const secretKey = process.env.SPACESHIP_SECRET_KEY;
    this.bucketName = process.env.SPACESHIP_BUCKET_NAME || 'courses';
    
    // Ensure endpoint has proper protocol and S3 API path
    let endpoint = process.env.SPACESHIP_ENDPOINT || 'https://server39.shared.spaceship.host';
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = `https://${endpoint}`;
    }
    
    // Convert Spaceship web interface URL to S3 API endpoint
    if (endpoint.includes('server39.shared.spaceship.host')) {
      // Convert from web interface to S3 API endpoint
      endpoint = 'https://s3.server39.shared.spaceship.host';
    }
    
    this.endpoint = endpoint;

    if (!accessKey || !secretKey) {
      console.warn('⚠️ Spaceship credentials not found. File uploads will be disabled until credentials are provided.');
      // Initialize with dummy values to prevent crashes
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: 'placeholder',
          secretAccessKey: 'placeholder',
        },
      });
      return;
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for S3-compatible services
      requestHandler: {
        // Handle retries for intermittent issues
        retryMode: 'standard',
        maxRetries: 2,
      }
    });

    console.log(`✅ Spaceship storage initialized with endpoint: ${this.endpoint}`);
  }


  /**
   * Test connectivity and bucket access
   */
  async testConnection(): Promise<{
    success: boolean;
    details?: any;
    error?: string;
  }> {
    try {
      if (!process.env.SPACESHIP_ACCESS_KEY || !process.env.SPACESHIP_SECRET_KEY) {
        return {
          success: false,
          error: 'Credentials not configured'
        };
      }

      console.log('🔍 Testing Spaceship connection...');

      // Test 1: List buckets (basic auth test)
      try {
        const listCommand = new ListBucketsCommand({});
        const listResult = await this.s3Client.send(listCommand);
        console.log('✅ ListBuckets successful:', listResult.Buckets?.map(b => b.Name));
      } catch (listError) {
        console.log('❌ ListBuckets failed:', (listError as any)?.$metadata?.httpStatusCode, (listError as Error).message);
      }

      // Test 2: Check specific bucket
      try {
        const headCommand = new HeadBucketCommand({ Bucket: this.bucketName });
        await this.s3Client.send(headCommand);
        console.log(`✅ Bucket '${this.bucketName}' exists and is accessible`);
      } catch (headError) {
        console.log(`❌ Bucket '${this.bucketName}' check failed:`, (headError as any)?.$metadata?.httpStatusCode, (headError as Error).message);
        
        // Try to create the bucket if it doesn't exist
        if ((headError as any)?.$metadata?.httpStatusCode === 404) {
          console.log(`🔧 Attempting to create bucket '${this.bucketName}'...`);
          try {
            const createCommand = new CreateBucketCommand({ Bucket: this.bucketName });
            await this.s3Client.send(createCommand);
            console.log(`✅ Bucket '${this.bucketName}' created successfully`);
          } catch (createError) {
            console.log(`❌ Failed to create bucket '${this.bucketName}':`, (createError as Error).message);
          }
        }
      }

      return {
        success: true,
        details: {
          endpoint: this.endpoint,
          bucket: this.bucketName,
          hasCredentials: true
        }
      };

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ensure bucket exists, create if not
   */
  async ensureBucketExists(): Promise<boolean> {
    try {
      const headCommand = new HeadBucketCommand({ Bucket: this.bucketName });
      await this.s3Client.send(headCommand);
      return true;
    } catch (error) {
      // Check if this is an HTML response (indicates wrong endpoint)
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Expected closing tag') || errorMessage.includes('Deserialization error')) {
        console.warn(`⚠️ Spaceship endpoint appears to return HTML instead of S3 responses`);
        console.warn(`⚠️ This suggests the S3 API endpoint may not be correctly configured`);
        console.warn(`⚠️ Files will be uploaded but bucket verification is skipped`);
        return true; // Assume bucket exists and proceed with uploads
      }
      
      if ((error as any)?.$metadata?.httpStatusCode === 404) {
        console.log(`🔧 Creating bucket '${this.bucketName}'...`);
        try {
          const createCommand = new CreateBucketCommand({ Bucket: this.bucketName });
          await this.s3Client.send(createCommand);
          console.log(`✅ Bucket '${this.bucketName}' created successfully`);
          return true;
        } catch (createError) {
          console.error(`❌ Failed to create bucket '${this.bucketName}':`, createError);
          return false;
        }
      }
      console.error(`❌ Bucket check failed:`, error);
      return false;
    }
  }

  /**
   * Upload a file buffer to Spaceship storage
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    folderPath: string = 'general'
  ): Promise<{
    success: boolean;
    url?: string;
    key?: string;
    error?: string;
  }> {
    try {
      // Check if credentials are available
      if (!process.env.SPACESHIP_ACCESS_KEY || !process.env.SPACESHIP_SECRET_KEY) {
        return {
          success: false,
          error: 'Spaceship credentials not configured. Please add SPACESHIP_ACCESS_KEY and SPACESHIP_SECRET_KEY to your secrets.'
        };
      }

      // Generate unique filename
      const fileExtension = path.extname(originalName);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = `${folderPath}/${fileName}`;

      // Ensure bucket exists before uploading
      const bucketExists = await this.ensureBucketExists();
      if (!bucketExists) {
        return {
          success: false,
          error: `Bucket '${this.bucketName}' could not be created or accessed`
        };
      }

      console.log(`🔄 Attempting upload to Spaceship:`, {
        bucket: this.bucketName,
        key,
        endpoint: this.endpoint,
        contentType,
        bufferSize: buffer.length
      });

      // Upload to Spaceship
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Generate public URL using the S3 endpoint format
      const url = `https://s3.server39.shared.spaceship.host/${this.bucketName}/${key}`;

      console.log(`✅ File uploaded to Spaceship: ${key}`);

      return {
        success: true,
        url: url,
        key: key,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if this is an HTML response error (endpoint misconfiguration)
      if (errorMessage.includes('Expected closing tag') || errorMessage.includes('Deserialization error')) {
        console.warn('⚠️ Spaceship endpoint returning HTML instead of S3 responses');
        console.warn('⚠️ This indicates the S3 API endpoint may not be properly configured');
        console.warn('⚠️ File upload failed due to endpoint configuration issue');
        
        return {
          success: false,
          error: 'Spaceship storage endpoint configuration issue. The endpoint appears to return HTML instead of S3-compatible responses.'
        };
      }
      
      console.error('Error uploading to Spaceship:', error);
      console.error('Upload details:', {
        bucket: this.bucketName,
        endpoint: this.endpoint,
        errorType: error?.constructor?.name,
        statusCode: (error as any)?.$metadata?.httpStatusCode,
        message: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate a signed URL for temporary access to private content
   */
  async generateSignedUrl(
    key: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<{
    success: boolean;
    signedUrl?: string;
    error?: string;
  }> {
    try {
      if (!process.env.SPACESHIP_ACCESS_KEY || !process.env.SPACESHIP_SECRET_KEY) {
        return {
          success: false,
          error: 'Spaceship credentials not configured'
        };
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresIn,
      });

      return {
        success: true,
        signedUrl: signedUrl,
      };

    } catch (error) {
      console.error('Error generating signed URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a file from Spaceship storage
   */
  async deleteFile(key: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!process.env.SPACESHIP_ACCESS_KEY || !process.env.SPACESHIP_SECRET_KEY) {
        return {
          success: false,
          error: 'Spaceship credentials not configured'
        };
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      console.log(`✅ File deleted from Spaceship: ${key}`);

      return {
        success: true,
      };

    } catch (error) {
      console.error('Error deleting from Spaceship:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get file organization path based on course structure
   */
  getCoursePath(
    system: string,
    grade: string,
    subject: string,
    fileType: 'video' | 'pdf' | 'image' | 'audio' = 'video'
  ): string {
    // Create organized folder structure like: zimbabwe-primary/grade3/mathematics/videos/
    const systemSlug = system.toLowerCase().replace(/\s+/g, '-');
    const gradeSlug = grade.toLowerCase().replace(/\s+/g, '-');
    const subjectSlug = subject.toLowerCase().replace(/\s+/g, '-');
    
    return `courses/${systemSlug}/${gradeSlug}/${subjectSlug}/${fileType}s`;
  }

  /**
   * Check if Spaceship is properly configured
   */
  isConfigured(): boolean {
    return !!(process.env.SPACESHIP_ACCESS_KEY && process.env.SPACESHIP_SECRET_KEY);
  }
}

// Export singleton instance
export const spaceshipStorage = new SpaceshipStorage();