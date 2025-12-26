import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { 
  Upload, 
  X, 
  Camera, 
  Loader2, 
  ImageIcon,
  Edit3
} from 'lucide-react';

// Image compression utility
const compressImage = (
  file: File, 
  quality: number = 0.8,
  maxWidth: number = 1200,
  maxHeight: number = 400
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
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
          URL.revokeObjectURL(img.src);
          
          if (blob) {
            const compressedFile = new File(
              [blob], 
              `cover_${Date.now()}.webp`,
              { 
                type: 'image/webp',
                lastModified: Date.now()
              }
            );
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };
    
    const objectURL = URL.createObjectURL(file);
    img.src = objectURL;
  });
};

interface CoverImageUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  currentCoverUrl?: string | null;
  onCoverChange: (url: string | null) => void;
  isEditing?: boolean;
  className?: string;
}

export default function CoverImageUpload({ 
  currentCoverUrl, 
  onCoverChange, 
  isEditing = false,
  className = '',
  ...htmlProps
}: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'portfolio'); // Use your Cloudinary upload preset
      formData.append('folder', 'covers');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dl2lomrhp/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Compress image
      const compressedFile = await compressImage(file);
      setUploadProgress(30);

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(compressedFile);
      setUploadProgress(80);

      // Update profile with new cover image
      console.log('🖼️ Saving cover image URL to profile:', imageUrl);
      const profileResponse = await apiRequest('/api/profile/cover-image', {
        method: 'POST',
        body: JSON.stringify({ coverImageUrl: imageUrl })
      });
      console.log('✅ Profile update response:', profileResponse);
      
      setUploadProgress(100);
      onCoverChange(imageUrl);
      setShowEditOverlay(false);} catch (error) {
      console.error('Cover upload error:', error);} finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveCover = async () => {
    try {
      await apiRequest('/api/profile/cover-image', {
        method: 'DELETE'
      });
      
      onCoverChange(null);
      setShowEditOverlay(false);} catch (error) {}
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    multiple: false,
    onDrop: handleFileUpload,
    disabled: uploading
  });

  return (
    <div className={`relative ${className}`} {...htmlProps}>
      {/* Cover Image Display */}
      <div 
        className="relative h-full bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50 overflow-hidden group"
        onMouseEnter={() => isEditing && setShowEditOverlay(true)}
        onMouseLeave={() => setShowEditOverlay(false)}
      >
        {currentCoverUrl ? (
          <img 
            src={currentCoverUrl} 
            alt="Profile cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">No cover image</p>
            </div>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 max-w-xs w-full mx-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Uploading cover...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </div>
        )}

        {/* Edit Overlay */}
        {isEditing && (showEditOverlay || isDragActive) && !uploading && (
          <div 
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
              isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <div {...getRootProps()} className="text-center cursor-pointer">
              <input {...getInputProps()} ref={fileInputRef} />
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 max-w-xs">
                {isDragActive ? (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-gray-900">Drop image here</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {currentCoverUrl ? 'Change cover' : 'Add cover image'}
                    </p>
                    <p className="text-xs text-gray-500">Click or drag to upload</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Button */}
        {isEditing && !uploading && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300"
            onClick={() => fileInputRef.current?.click()}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit Cover
          </Button>
        )}

        {/* Remove Button */}
        {isEditing && currentCoverUrl && !uploading && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-20 bg-primary/90 backdrop-blur-sm hover:bg-primary transition-all duration-300"
            onClick={handleRemoveCover}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
