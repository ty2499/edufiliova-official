import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { getCloudinaryConfig } from './utils/settings';

let cloudinaryConfigured = false;
let cloudinaryCloudName: string | null = null;

export class CloudinaryStorage {
  private configPromise: Promise<void> | null = null;

  constructor() {
    this.configPromise = this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    const config = await getCloudinaryConfig();
    
    if (config.cloudName && config.apiKey && config.apiSecret) {
      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
      });
      cloudinaryConfigured = true;
      cloudinaryCloudName = config.cloudName;
      console.log(`✅ Cloudinary storage initialized for cloud: ${config.cloudName}`);
    } else {
      console.warn('⚠️ Cloudinary credentials not found. File uploads will be disabled until credentials are provided.');
    }
  }

  async ensureConfigured(): Promise<void> {
    if (this.configPromise) {
      await this.configPromise;
    }
  }

  /**
   * Test connectivity to Cloudinary
   */
  async testConnection(): Promise<{
    success: boolean;
    details?: any;
    error?: string;
  }> {
    try {
      await this.ensureConfigured();
      
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Credentials not configured'
        };
      }

      console.log('🔍 Testing Cloudinary connection...');

      // Test connection by getting cloud details
      const result = await cloudinary.api.ping();
      
      console.log('✅ Cloudinary connection successful');

      return {
        success: true,
        details: {
          cloud_name: cloudinaryCloudName,
          status: result.status,
          hasCredentials: true
        }
      };

    } catch (error) {
      console.error('❌ Cloudinary connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload a file to Cloudinary
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
      await this.ensureConfigured();
      
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Cloudinary credentials not configured. Please add them in Admin Dashboard or as environment variables.'
        };
      }

      // Generate unique filename
      const fileExtension = path.extname(originalName);
      const fileName = `${uuidv4()}${fileExtension}`;
      const publicId = `${folderPath}/${fileName}`;

      // console.log(`🔄 Attempting upload to Cloudinary:`, {
      //   folder: folderPath,
      //   fileName,
      //   contentType,
      //   bufferSize: buffer.length
      // }); // Removed for performance

      // Determine resource type based on content type
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      if (contentType.startsWith('image/')) {
        resourceType = 'image';
      } else if (contentType.startsWith('video/')) {
        resourceType = 'video';
      }

      // Optimized upload settings for faster performance
      const uploadOptions: any = {
        public_id: publicId,
        resource_type: resourceType,
        folder: folderPath,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        context: {
          original_name: originalName,
          uploaded_at: new Date().toISOString(),
        }
      };

      // Add image-specific optimizations
      if (resourceType === 'image') {
        uploadOptions.quality = 'auto:good'; // Automatic quality optimization
        uploadOptions.fetch_format = 'auto'; // Auto WebP/AVIF conversion
        uploadOptions.flags = 'progressive:semi'; // Progressive JPEG loading
        uploadOptions.dpr = 'auto'; // Auto device pixel ratio
        uploadOptions.responsive = true; // Enable responsive breakpoints
        uploadOptions.f_auto = true; // Auto format selection
        uploadOptions.q_auto = true; // Auto quality
      }

      // Upload to Cloudinary with optimizations
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(buffer);
      });

      const uploadResult = result as any;
      
      console.log(`✅ File uploaded to Cloudinary: ${uploadResult.public_id}`);

      return {
        success: true,
        url: uploadResult.secure_url,
        key: uploadResult.public_id,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Cloudinary upload failed:', errorMessage);
      
      return {
        success: false,
        error: `Upload failed: ${errorMessage}`
      };
    }
  }

  /**
   * Generate a signed URL for private content access
   */
  async generateSignedUrl(
    publicId: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<{
    success: boolean;
    signedUrl?: string;
    error?: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Cloudinary credentials not configured'
        };
      }

      // Generate signed URL with expiration
      const signedUrl = cloudinary.utils.private_download_url(publicId, 'jpg', {
        expires_at: Math.floor(Date.now() / 1000) + expiresIn
      });

      return {
        success: true,
        signedUrl: signedUrl,
      };

    } catch (error) {
      console.error('Error generating Cloudinary signed URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Cloudinary credentials not configured'
        };
      }

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        console.log(`✅ File deleted from Cloudinary: ${publicId}`);
        return {
          success: true,
        };
      } else {
        console.warn(`⚠️ Cloudinary delete result: ${result.result} for ${publicId}`);
        return {
          success: false,
          error: `Delete operation returned: ${result.result}`
        };
      }

    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
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
    // Create organized folder structure like: courses/zimbabwe-primary/grade3/mathematics/videos
    const systemSlug = system.toLowerCase().replace(/\s+/g, '-');
    const gradeSlug = grade.toLowerCase().replace(/\s+/g, '-');
    const subjectSlug = subject.toLowerCase().replace(/\s+/g, '-');
    
    return `courses/${systemSlug}/${gradeSlug}/${subjectSlug}/${fileType}s`;
  }

  /**
   * Check if Cloudinary is properly configured
   */
  isConfigured(): boolean {
    return cloudinaryConfigured;
  }
}

// Create and export a singleton instance to prevent multiple initializations
export const cloudinaryStorage = new CloudinaryStorage();