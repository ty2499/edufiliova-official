import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  GripVertical,
  Eye,
  Trash2,
  Plus,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Image compression utilities
const compressImage = (
  file: File, 
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  convertToWebP: boolean = true
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          // Clean up object URL
          URL.revokeObjectURL(img.src);
          
          if (blob) {
            const outputFormat = convertToWebP ? 'webp' : file.type.split('/')[1];
            const compressedFile = new File(
              [blob], 
              `${file.name.split('.')[0]}.${outputFormat}`,
              { 
                type: convertToWebP ? 'image/webp' : file.type,
                lastModified: Date.now()
              }
            );
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original
          }
        },
        convertToWebP ? 'image/webp' : file.type,
        quality
      );
    };
    
    const objectURL = URL.createObjectURL(file);
    img.src = objectURL;
  });
};

const getImageDimensions = (file: File): Promise<{width: number; height: number}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
};

export interface UploadedImage {
  id: string;
  url: string;
  thumbUrl: string;
  originalName: string;
  size: number;
  format: string;
  order: number;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface BehanceStyleUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in MB
  compressionQuality?: number; // 0.1 to 1.0
  maxWidth?: number; // Max width for resizing
  maxHeight?: number; // Max height for resizing
  convertToWebP?: boolean; // Auto-convert to WebP format
}

interface SortableImageProps {
  image: UploadedImage;
  onDelete: (id: string) => void;
  onPreview: (image: UploadedImage) => void;
}

// Sortable Image Component
function SortableImage({ image, onDelete, onPreview }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all duration-200 ${
        isDragging ? 'shadow-xl scale-105' : 'hover:shadow-lg'
      }`}
      data-testid={`sortable-image-${image.id}`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>

      {/* Image Container */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {image.uploading ? (
          // Upload Progress
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600 mb-2">Uploading...</p>
            {image.progress !== undefined && (
              <div className="w-3/4">
                <Progress value={image.progress} className="h-2" />
                <p className="text-xs text-center mt-1">{Math.round(image.progress)}%</p>
              </div>
            )}
          </div>
        ) : image.error ? (
          // Error State
          <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10 text-primary">
            <X className="h-8 w-8 mb-2" />
            <p className="text-sm text-center px-2">{image.error}</p>
          </div>
        ) : (
          // Successful Upload
          <>
            <img
              src={image.thumbUrl || image.url}
              alt={image.originalName}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Success Indicator */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <CheckCircle2 className="h-5 w-5 text-green-500 bg-white rounded-full" />
            </div>

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPreview(image)}
                data-testid={`button-preview-${image.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(image.id)}
                data-testid={`button-delete-${image.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Image Info */}
      <div className="p-3">
        <p className="text-sm font-medium truncate" title={image.originalName}>
          {image.originalName}
        </p>
        <div className="flex items-center justify-between mt-1">
          <Badge variant="outline" className="text-xs">
            {image.format?.toUpperCase()}
          </Badge>
          <span className="text-xs text-gray-500">
            {(image.size / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BehanceStyleUpload({ 
  images, 
  onImagesChange, 
  maxImages = 20,
  maxSizePerImage = 10,
  compressionQuality = 1.0,
  maxWidth = 99999,
  maxHeight = 99999,
  convertToWebP = false
}: BehanceStyleUploadProps) {
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<UploadedImage[]>(images);

  // Keep ref in sync with prop
  React.useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // File drop handling
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxImages) {
        // File limit validation removed - no toast notification
        return;
      }

      // Validate each file
      const validFiles = acceptedFiles.filter(file => {
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > maxSizePerImage) {
          // File size validation removed - no toast notification
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Create placeholder images with processing state
      const newImages: UploadedImage[] = validFiles.map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: '',
        thumbUrl: URL.createObjectURL(file), // Temporary preview
        originalName: file.name,
        size: file.size,
        format: file.type.split('/')[1] || 'unknown',
        order: images.length + index,
        uploading: true,
        progress: 0
      }));

      // Add processing images to state
      onImagesChange([...images, ...newImages]);

      // Processing status removed - no toast notification

      // Process files for upload (no compression)
      try {
        const filesWithDimensions = await Promise.all(
          validFiles.map(async (file, index) => {
            if (file.type.startsWith('image/')) {
              // Update progress to show processing
              const currentImages = [...images, ...newImages];
              const updatedImages = currentImages.map(img => 
                img.id === newImages[index].id 
                  ? { ...img, progress: 25 } // 25% for processing step
                  : img
              );
              onImagesChange(updatedImages);
              
              // Get original dimensions
              const dimensions = await getImageDimensions(file);
              
              return {
                file: file, // Use original file without compression
                width: dimensions.width,
                height: dimensions.height
              };
            }
            return { file, width: null, height: null };
          })
        );

        // Upload files
        if (filesWithDimensions.length === 1) {
          // Single upload
          await uploadSingleImage(filesWithDimensions[0].file, newImages[0], {
            width: filesWithDimensions[0].width,
            height: filesWithDimensions[0].height
          });
        } else {
          // Batch upload
          await uploadMultipleImages(
            filesWithDimensions.map(item => item.file), 
            newImages,
            filesWithDimensions.map(item => ({ width: item.width, height: item.height }))
          );
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    },
    [images, onImagesChange, maxImages, maxSizePerImage, compressionQuality, maxWidth, maxHeight, convertToWebP]
  );

  // Single file upload with progress
  const uploadSingleImage = async (file: File, tempImage: UploadedImage, dimensions?: { width: number | null; height: number | null }) => {
    console.log('🚀 Starting single image upload:', file.name);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Simulate progress for UX (since we can't get real progress from fetch)
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 10, 90);
        const updatedImages = imagesRef.current.map(img => 
          img.id === tempImage.id 
            ? { ...img, progress: currentProgress }
            : img
        );
        onImagesChange(updatedImages);
      }, 200);

      const response = await apiRequest('/api/portfolio/upload/image', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      console.log('✅ Upload response:', response);

      // apiRequest returns the data directly on success, not wrapped in {success: true, data: ...}
      if (response && response.url) {
        console.log('✅ Upload successful, URL:', response.url);
        const updatedImages = imagesRef.current.map(img =>
          img.id === tempImage.id
            ? {
                ...img,
                ...response,
                id: `uploaded-${Date.now()}`,
                uploading: false,
                progress: 100
              }
            : img
        );
        onImagesChange(updatedImages);

        // Clean up temporary object URL
        URL.revokeObjectURL(tempImage.thumbUrl);

        // Upload success toast removed
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const updatedImages = imagesRef.current.map(img =>
        img.id === tempImage.id
          ? {
              ...img,
              uploading: false,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : img
      );
      onImagesChange(updatedImages);

      // Upload failed toast removed
    }
  };

  // Batch upload
  const uploadMultipleImages = async (files: File[], tempImages: UploadedImage[], dimensionsArray?: Array<{ width: number | null; height: number | null }>) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      // Simulate progress
      let batchProgress = 0;
      const progressInterval = setInterval(() => {
        batchProgress = Math.min(batchProgress + 10, 90);
        const updatedImages = imagesRef.current.map(img => {
          if (tempImages.some(temp => temp.id === img.id)) {
            return { ...img, progress: batchProgress };
          }
          return img;
        });
        onImagesChange(updatedImages);
      }, 300);

      const response = await apiRequest('/api/portfolio/upload/images', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      // apiRequest returns the data directly (array of uploaded images)
      if (response && Array.isArray(response)) {
        const updatedImages = [...imagesRef.current];
        tempImages.forEach((tempImg, index) => {
          const uploadedData = response[index];
          if (uploadedData) {
            const imgIndex = updatedImages.findIndex(img => img.id === tempImg.id);
            if (imgIndex !== -1) {
              updatedImages[imgIndex] = {
                ...tempImg,
                ...uploadedData,
                id: `uploaded-${Date.now()}-${index}`,
                uploading: false,
                progress: 100
              };
              // Clean up temporary URL
              URL.revokeObjectURL(tempImg.thumbUrl);
            }
          }
        });
        onImagesChange(updatedImages);

        // Batch upload success toast removed
      } else {
        throw new Error('Batch upload failed - no data returned');
      }
    } catch (error) {
      // Mark all as errored
      const updatedImages = imagesRef.current.map(img => {
        if (tempImages.some(temp => temp.id === img.id)) {
          return {
            ...img,
            uploading: false,
            error: error instanceof Error ? error.message : 'Upload failed'
          };
        }
        return img;
      });
      onImagesChange(updatedImages);

      // Batch upload failed toast removed
    }
  };

  // Handle drag reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedImages = [...images];
        const [reorderedItem] = reorderedImages.splice(oldIndex, 1);
        reorderedImages.splice(newIndex, 0, reorderedItem);

        // Update order values
        const updatedImages = reorderedImages.map((img, index) => ({
          ...img,
          order: index
        }));

        onImagesChange(updatedImages);
      }
    }
  };

  // Delete image
  const handleDelete = async (imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;

    // Remove from state immediately for better UX
    onImagesChange(images.filter(img => img.id !== imageId));

    // If it was successfully uploaded, delete from Cloudinary
    if (imageToDelete.url && !imageToDelete.uploading && !imageToDelete.error) {
      try {
        await apiRequest('/api/portfolio/upload/image', {
          method: 'DELETE',
          body: JSON.stringify({ url: imageToDelete.url })
        });
      } catch (error) {
        console.error('Failed to delete image from server:', error);
        // Don't show error to user since image is already removed from UI
      }
    }

    // Clean up object URL if it exists
    if (imageToDelete.thumbUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageToDelete.thumbUrl);
    }

    // Image removal toast removed
  };

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: images.length >= maxImages
  });

  return (
    <div className="space-y-6" data-testid="behance-style-upload">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          data-testid="upload-dropzone"
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isDragActive ? 'Drop images here' : 'Upload your portfolio images'}
              </h3>
              <p className="text-gray-600 mt-2">
                Drag & drop images here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports: JPG, PNG, GIF, WebP • Max {maxSizePerImage}MB per image • Up to {maxImages} images
              </p>
              
            </div>

            <Button
              type="button"
              className="bg-primary hover:bg-primary text-white"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-browse-files"
            >
              <Plus className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Portfolio Images ({images.length}/{maxImages})
            </h3>
            {images.length > 1 && (
              <p className="text-sm text-gray-500">
                Drag to reorder images
              </p>
            )}
          </div>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map(img => img.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onDelete={handleDelete}
                    onPreview={setPreviewImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
          data-testid="image-preview-modal"
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImage.url}
              alt={previewImage.originalName}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setPreviewImage(null)}
              data-testid="button-close-preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-8">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No images uploaded yet
          </h3>
          <p className="text-gray-600">
            Upload your first image to start building your portfolio showcase
          </p>
        </div>
      )}
    </div>
  );
}
