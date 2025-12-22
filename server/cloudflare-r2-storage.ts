import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class CloudflareR2Storage {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'edufiliova-products';
    
    if (!accountId || !accessKeyId || !secretAccessKey) {
      console.warn('⚠️ Cloudflare R2 credentials not found. Product uploads will be disabled.');
      this.s3Client = null as any;
      this.publicUrl = '';
      return;
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';
    
    if (!this.publicUrl) {
      console.warn('⚠️ CLOUDFLARE_R2_PUBLIC_URL not set. Files will be uploaded but require signed URLs for download or public bucket access.');
    }
    
    console.log(`✅ Cloudflare R2 storage initialized for bucket: ${this.bucketName}`);
  }

  async testConnection(): Promise<{
    success: boolean;
    details?: any;
    error?: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'R2 credentials not configured'
        };
      }

      console.log('🔍 Testing Cloudflare R2 connection...');

      await this.s3Client.send(new HeadBucketCommand({
        Bucket: this.bucketName,
      }));

      console.log('✅ Cloudflare R2 connection successful');

      return {
        success: true,
        details: {
          bucket: this.bucketName,
          endpoint: this.publicUrl,
          hasCredentials: true
        }
      };
    } catch (error) {
      console.error('❌ Cloudflare R2 connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    folderPath: string = 'products'
  ): Promise<{
    success: boolean;
    url?: string;
    key?: string;
    error?: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Cloudflare R2 credentials not configured. Please add CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY to your secrets.'
        };
      }

      const fileExtension = path.extname(originalName);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = `${folderPath}/${fileName}`;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        },
      }));

      let url: string;
      if (this.publicUrl) {
        url = `${this.publicUrl}/${key}`;
      } else {
        const signedUrlResult = await this.generateSignedUrl(key, 31536000);
        url = signedUrlResult.signedUrl || key;
      }
      
      console.log(`✅ File uploaded to Cloudflare R2: ${key}`);

      return {
        success: true,
        url,
        key,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Cloudflare R2 upload failed:', errorMessage);
      
      return {
        success: false,
        error: `Upload failed: ${errorMessage}`
      };
    }
  }

  async generateSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<{
    success: boolean;
    signedUrl?: string;
    error?: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Cloudflare R2 credentials not configured'
        };
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return {
        success: true,
        signedUrl,
      };
    } catch (error) {
      console.error('Error generating R2 signed URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteFile(key: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Cloudflare R2 credentials not configured'
        };
      }

      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));

      console.log(`✅ File deleted from Cloudflare R2: ${key}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting from Cloudflare R2:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getProductPath(
    category: string,
    fileType: 'image' | 'document' = 'image'
  ): string {
    const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
    return `products/${categorySlug}/${fileType}s`;
  }

  isConfigured(): boolean {
    return !!(
      this.s3Client &&
      process.env.CLOUDFLARE_ACCOUNT_ID && 
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID && 
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    );
  }
}

export const cloudflareR2Storage = new CloudflareR2Storage();
