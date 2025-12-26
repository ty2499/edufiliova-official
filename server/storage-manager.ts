import { cloudinaryStorage } from './cloudinary-storage';
import { cloudflareR2Storage } from './cloudflare-r2-storage';

export type UploadType = 
  | 'product-image' 
  | 'product-file'
  | 'course-video'
  | 'course-image'
  | 'portfolio-image'
  | 'blog-image'
  | 'profile-image'
  | 'general';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  storage?: 'cloudinary' | 'r2';
}

export class StorageManager {
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    uploadType: UploadType,
    metadata?: { category?: string; courseId?: string }
  ): Promise<UploadResult> {
    
    const folderMap: Record<UploadType, string> = {
      'product-image': 'uploads/products/images',
      'product-file': 'uploads/products/documents',
      'course-video': metadata?.courseId ? `uploads/courses/${metadata.courseId}/videos` : 'uploads/courses/videos',
      'course-image': metadata?.courseId ? `uploads/courses/${metadata.courseId}/images` : 'uploads/courses/images',
      'portfolio-image': 'uploads/portfolio-samples',
      'blog-image': 'uploads/blog/images',
      'profile-image': 'uploads/avatars',
      'general': 'uploads/general',
    };
    
    const folderPath = folderMap[uploadType];
    
    if (cloudflareR2Storage.isConfigured()) {
      console.log(`📤 Uploading to Cloudflare R2: ${folderPath}/${originalName}`);
      
      const result = await cloudflareR2Storage.uploadFile(
        buffer,
        originalName,
        contentType,
        folderPath
      );
      
      if (result.success) {
        console.log(`✅ Successfully uploaded to R2: ${result.url}`);
        return {
          ...result,
          storage: 'r2'
        };
      } else {
        console.warn('⚠️ Cloudflare R2 upload failed, attempting Cloudinary failover...');
        console.error('R2 Error:', result.error);
      }
    } else {
      console.log('⚠️ Cloudflare R2 not configured, using Cloudinary');
    }
    
    if (cloudinaryStorage.isConfigured()) {
      const cloudinaryFolder = folderPath.replace('uploads/', '');
      console.log(`📤 Uploading to Cloudinary: ${cloudinaryFolder}/${originalName}`);
      
      const result = await cloudinaryStorage.uploadFile(
        buffer,
        originalName,
        contentType,
        cloudinaryFolder
      );
      
      return {
        ...result,
        storage: 'cloudinary'
      };
    }
    
    return {
      success: false,
      error: 'No storage service configured. Please configure Cloudflare R2 or Cloudinary.'
    };
  }

  async deleteFile(key: string, storage: 'cloudinary' | 'r2'): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (storage === 'r2') {
      return await cloudflareR2Storage.deleteFile(key);
    } else {
      return await cloudinaryStorage.deleteFile(key);
    }
  }

  async generateSignedUrl(
    key: string,
    storage: 'cloudinary' | 'r2',
    expiresIn: number = 3600
  ): Promise<{
    success: boolean;
    signedUrl?: string;
    error?: string;
  }> {
    if (storage === 'r2') {
      return await cloudflareR2Storage.generateSignedUrl(key, expiresIn);
    } else {
      return await cloudinaryStorage.generateSignedUrl(key, expiresIn);
    }
  }

  getStorageStatus() {
    return {
      cloudinary: cloudinaryStorage.isConfigured(),
      r2: cloudflareR2Storage.isConfigured(),
      recommendation: cloudflareR2Storage.isConfigured() 
        ? 'Using R2 for all uploads (zero egress fees!), Cloudinary as fallback'
        : cloudinaryStorage.isConfigured()
        ? 'Using Cloudinary for all uploads. Consider adding R2 to eliminate bandwidth costs.'
        : 'No storage configured'
    };
  }
}

export const storageManager = new StorageManager();
