/**
 * Image optimization utilities for fast uploads like WhatsApp
 * Compresses, resizes, and optimizes images before upload
 */

export interface OptimizedImage {
  file: File;
  dataUrl: string;
  thumbnail?: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  thumbnailSize?: number;
}

/**
 * Default compression settings optimized for messaging
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'jpeg',
  thumbnailSize: 300
};

/**
 * Check if browser supports WebP format
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Create a canvas from an image file
 */
const createCanvasFromImage = (file: File): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Scale down if larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    
    if (width > height) {
      width = Math.min(width, maxWidth);
      height = width / aspectRatio;
    } else {
      height = Math.min(height, maxHeight);
      width = height * aspectRatio;
    }
  }
  
  return { width: Math.floor(width), height: Math.floor(height) };
};

/**
 * Compress and resize an image
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<OptimizedImage> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Check if it's an image file
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  // For small images, return as-is with minimal processing
  if (file.size < 100 * 1024) { // Less than 100KB
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1
    };
  }

  try {
    const { canvas, ctx } = await createCanvasFromImage(file);
    
    // Calculate optimal dimensions
    const { width, height } = calculateOptimalDimensions(
      canvas.width,
      canvas.height,
      opts.maxWidth!,
      opts.maxHeight!
    );
    
    // Create optimized canvas
    const optimizedCanvas = document.createElement('canvas');
    const optimizedCtx = optimizedCanvas.getContext('2d')!;
    
    optimizedCanvas.width = width;
    optimizedCanvas.height = height;
    
    // Use high-quality scaling
    optimizedCtx.imageSmoothingEnabled = true;
    optimizedCtx.imageSmoothingQuality = 'high';
    
    // Draw resized image
    optimizedCtx.drawImage(canvas, 0, 0, width, height);
    
    // Determine output format
    let outputFormat = 'image/jpeg';
    if (opts.format === 'webp' && await supportsWebP()) {
      outputFormat = 'image/webp';
    } else if (opts.format === 'png') {
      outputFormat = 'image/png';
    }
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      optimizedCanvas.toBlob((blob) => {
        resolve(blob!);
      }, outputFormat, opts.quality);
    });
    
    // Create optimized file
    const optimizedFile = new File([blob], file.name, {
      type: outputFormat,
      lastModified: Date.now()
    });
    
    // Generate data URL for preview
    const dataUrl = await fileToDataUrl(optimizedFile);
    
    // Generate thumbnail if requested
    let thumbnail: string | undefined;
    if (opts.thumbnailSize) {
      thumbnail = await generateThumbnail(optimizedCanvas, opts.thumbnailSize);
    }
    
    // Clean up
    URL.revokeObjectURL(canvas.toDataURL());
    
    return {
      file: optimizedFile,
      dataUrl,
      thumbnail,
      originalSize: file.size,
      compressedSize: optimizedFile.size,
      compressionRatio: optimizedFile.size / file.size
    };
    
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fallback to original file
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1
    };
  }
};

/**
 * Generate thumbnail from canvas
 */
const generateThumbnail = (canvas: HTMLCanvasElement, size: number): Promise<string> => {
  return new Promise((resolve) => {
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailCtx = thumbnailCanvas.getContext('2d')!;
    
    thumbnailCanvas.width = size;
    thumbnailCanvas.height = size;
    
    // Calculate crop dimensions for square thumbnail
    const sourceSize = Math.min(canvas.width, canvas.height);
    const sourceX = (canvas.width - sourceSize) / 2;
    const sourceY = (canvas.height - sourceSize) / 2;
    
    // Draw square thumbnail
    thumbnailCtx.drawImage(
      canvas,
      sourceX, sourceY, sourceSize, sourceSize,
      0, 0, size, size
    );
    
    resolve(thumbnailCanvas.toDataURL('image/jpeg', 0.7));
  });
};

/**
 * Convert file to data URL
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Calculate compression savings
 */
export const getCompressionSavings = (originalSize: number, compressedSize: number): string => {
  const savings = ((originalSize - compressedSize) / originalSize) * 100;
  return `${Math.round(savings)}% smaller`;
};

/**
 * Batch compress multiple images
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<OptimizedImage[]> => {
  const results: OptimizedImage[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (file.type.startsWith('image/')) {
      const optimized = await compressImage(file, options);
      results.push(optimized);
    } else {
      // For non-images, return as-is
      const dataUrl = await fileToDataUrl(file);
      results.push({
        file,
        dataUrl,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1
      });
    }
    
    onProgress?.(i + 1, files.length);
  }
  
  return results;
};
