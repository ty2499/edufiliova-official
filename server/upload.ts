import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";

// Local storage configuration
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Created uploads directory:', UPLOADS_DIR);
}

// File type configurations
export const FILE_CONFIGS = {
  voice: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["audio/webm", "audio/mp4", "audio/wav", "audio/mpeg"],
    folder: "voice-messages",
  },
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    folder: "images",
  },
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ["video/mp4", "video/webm", "video/mov", "video/avi"],
    folder: "videos",
  },
  document: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    folder: "documents",
  },
  logo: {
    maxSize: 10 * 1024 * 1024, // 10MB for logos
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    folder: "logos",
  },
};

// Interface for file metadata
export interface FileMetadata {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number; // for audio/video files
  thumbnail?: string; // for video files
}

// Multer configuration for memory storage (for Cloudinary uploads)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (will be filtered by file type)
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Auto-detect file type from mime type
    const detectedFileType = getFileType(file.mimetype);
    const config = FILE_CONFIGS[detectedFileType];
    
    if (!config) {
      return cb(new Error("Unsupported file type"));
    }
    
    if (!config.allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not supported`));
    }
    
    // Store detected file type for later use
    req.body.detectedFileType = detectedFileType;
    
    cb(null, true);
  },
});

// Upload file to local storage
export async function uploadToLocal(
  file: Express.Multer.File
): Promise<FileMetadata> {
  const fileType = getFileType(file.mimetype);
  const config = FILE_CONFIGS[fileType];
  
  // Validate file size
  if (file.size > config.maxSize) {
    throw new Error(`File size exceeds limit of ${config.maxSize / (1024 * 1024)}MB`);
  }
  
  // Validate file type
  if (!config.allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} not allowed`);
  }
  
  // File is already saved by multer, just need to generate metadata
  const relativePath = path.relative(process.cwd(), file.path);
  const url = `/${relativePath.replace(/\\/g, '/')}`; // Ensure forward slashes for URLs
  
  console.log(`✅ File uploaded locally: ${file.filename}`);
  
  return {
    url,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  };
}

// Generate local file URL
export function generateLocalFileUrl(filePath: string): string {
  return filePath;
}

// Generate thumbnail for video files (placeholder for now)
export async function generateVideoThumbnail(videoUrl: string): Promise<string> {
  // This would typically use ffmpeg or similar to generate a thumbnail
  // For now, return a placeholder
  return `${videoUrl}?thumbnail=true`;
}

// Extract audio duration (placeholder for now)
export async function extractAudioDuration(audioBuffer: Buffer): Promise<number> {
  // This would typically use audio analysis libraries
  // For now, return a default duration
  return 0;
}

// Validate file before upload
export function validateFile(file: Express.Multer.File, fileType: keyof typeof FILE_CONFIGS): void {
  const config = FILE_CONFIGS[fileType];
  
  if (file.size > config.maxSize) {
    throw new Error(`File size exceeds limit of ${config.maxSize / (1024 * 1024)}MB`);
  }
  
  if (!config.allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} not allowed for ${fileType}`);
  }
}

// Get file type from extension/mime type
export function getFileType(mimeType: string): keyof typeof FILE_CONFIGS {
  if (mimeType.startsWith("audio/")) return "voice";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

export function getMimeTypeFromFileType(fileType: string): string {
  switch (fileType) {
    case "voice": return "audio/webm";
    case "image": return "image/jpeg";
    case "video": return "video/mp4";
    case "document": return "application/octet-stream";
    default: return "application/octet-stream";
  }
}