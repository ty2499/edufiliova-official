import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Upload, RotateCcw, AlertCircle } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import Logo from '@/components/Logo';

interface LogoSettings {
  logoUrl: string | null;
}

export function LogoManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch current logo
  const { data: logoSettings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings/logo', 'home'],
    queryFn: async () => {
      return await apiRequest('/api/admin/settings/logo/home') as LogoSettings;
    }
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const sessionId = localStorage.getItem('sessionId');
      return await apiRequest('/api/admin/settings/logo/home', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/logo', 'home'] });
      setSelectedFile(null);
      setUploadError(null);
      setUploadSuccess('Home logo updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(null);
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Home logo upload failed:', error);
      setUploadError(error.message || 'Failed to upload logo. Please try again.');
      setUploadSuccess(null);
    }
  });

  // Reset to default logo mutation
  const resetLogoMutation = useMutation({
    mutationFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      return await apiRequest('/api/admin/settings/logo/home', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/logo', 'home'] });
      setUploadError(null);
      setUploadSuccess('Home logo reset to default successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(null);
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Home logo reset failed:', error);
      setUploadError(error.message || 'Failed to reset logo. Please try again.');
      setUploadSuccess(null);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadLogoMutation.mutate(selectedFile);
    }
  };

  const handleReset = () => {
    resetLogoMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading logo settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Logo Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a custom logo for your platform. Image will be automatically resized to 500×500 pixels.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Message */}
        {uploadSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {uploadSuccess}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {uploadError}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Logo Display */}
        <div>
          <Label className="text-base font-medium">Current Logo</Label>
          <div className="mt-2 flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            {logoSettings?.logoUrl ? (
              <img
                src={logoSettings.logoUrl}
                alt="Current logo"
                className="w-full h-full object-contain rounded-lg"
                data-testid="current-logo"
              />
            ) : (
              <div className="flex items-center justify-center">
                <Logo size="2xl" type="home" data-testid="default-logo-fallback" />
              </div>
            )}
          </div>
        </div>

        {/* Upload New Logo */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Upload New Logo</Label>
          
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              data-testid="logo-file-input"
            />
            <p className="text-xs text-muted-foreground">
              • Recommended size: 500×500 pixels
              • Supported formats: PNG, JPG, JPEG, GIF
              • Maximum file size: 10MB
            </p>
          </div>

          {selectedFile && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm font-medium">Selected file:</p>
              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadLogoMutation.isPending}
              className="bg-[#c4ee3d] hover:bg-[#b8e234] text-black transition-all duration-300"
              data-testid="upload-logo-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
            </Button>

            {logoSettings?.logoUrl && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={resetLogoMutation.isPending}
                data-testid="reset-logo-button"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {resetLogoMutation.isPending ? 'Resetting...' : 'Reset to Default'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
