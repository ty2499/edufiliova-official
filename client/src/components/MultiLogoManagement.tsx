import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Upload, RotateCcw, AlertCircle, Home, GraduationCap, Users, Briefcase, ShoppingBag, Info, Lock } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import Logo from '@/components/Logo';

type LogoType = 'home' | 'student' | 'teacher' | 'freelancer' | 'customer' | 'footer' | 'auth';
type LogoSize = 'square' | 'wide';

interface LogoSettings {
  logoUrl: string | null;
  type: LogoType;
  size: LogoSize;
}

interface AllLogos {
  home: { square: string | null; wide: string | null };
  student: { square: string | null; wide: string | null };
  teacher: { square: string | null; wide: string | null };
  freelancer: { square: string | null; wide: string | null };
  customer: { square: string | null; wide: string | null };
  footer: { square: string | null; wide: string | null };
  auth: { square: string | null; wide: string | null };
}

interface LogoSectionProps {
  type: LogoType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function LogoSection({ type, title, description, icon }: LogoSectionProps) {
  const [selectedSquareFile, setSelectedSquareFile] = useState<File | null>(null);
  const [selectedWideFile, setSelectedWideFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch current logos for this type (both square and wide)
  const { data: squareLogo, isLoading: isLoadingSquare } = useQuery({
    queryKey: ['/api/admin/settings/logo', type, 'square'],
    queryFn: async () => {
      return await apiRequest(`/api/admin/settings/logo/${type}/square`) as LogoSettings;
    },
    retry: false
  });

  const { data: wideLogo, isLoading: isLoadingWide } = useQuery({
    queryKey: ['/api/admin/settings/logo', type, 'wide'],
    queryFn: async () => {
      return await apiRequest(`/api/admin/settings/logo/${type}/wide`) as LogoSettings;
    },
    retry: false
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async ({ file, size }: { file: File; size: LogoSize }) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const sessionId = localStorage.getItem('sessionId');
      return await apiRequest(`/api/admin/settings/logo/${type}/${size}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
        body: formData
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate specific logo queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/logo', type, variables.size] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/logos'] });
      // Also invalidate the system-settings queries used by Logo component
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'logo', type] });
      // Invalidate all logo-related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'logo'] });
      
      if (variables.size === 'square') {
        setSelectedSquareFile(null);
      } else {
        setSelectedWideFile(null);
      }
      setUploadError(null);
      setUploadSuccess(`${title} ${variables.size} logo updated successfully!`);
      
      setTimeout(() => {
        setUploadSuccess(null);
      }, 3000);
    },
    onError: (error: any) => {
      console.error(`${title} logo upload failed:`, error);
      let errorMessage = `Failed to upload ${title.toLowerCase()} logo. Please try again.`;
      
      if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        errorMessage = 'Authentication required. Please log in as an admin to upload logos.';
      } else if (error.message?.includes('403') || error.message?.includes('Insufficient')) {
        errorMessage = 'Admin privileges required. Please log in as an admin to upload logos.';
      } else if (error.message?.includes('400')) {
        errorMessage = 'Invalid request. Please check your file and try again.';
      }
      
      setUploadError(errorMessage);
      setUploadSuccess(null);
    }
  });

  // Reset to default logo mutation
  const resetLogoMutation = useMutation({
    mutationFn: async (size: LogoSize) => {
      const sessionId = localStorage.getItem('sessionId');
      return await apiRequest(`/api/admin/settings/logo/${type}/${size}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        }
      });
    },
    onSuccess: (_, size) => {
      // Invalidate specific logo queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/logo', type, size] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/logos'] });
      // Also invalidate the system-settings queries used by Logo component
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'logo', type] });
      // Invalidate all logo-related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'logo'] });
      
      setUploadError(null);
      setUploadSuccess(`${title} ${size} logo reset to default successfully!`);
      
      setTimeout(() => {
        setUploadSuccess(null);
      }, 3000);
    },
    onError: (error: any) => {
      console.error(`${title} logo reset failed:`, error);
      setUploadError(error.message || `Failed to reset ${title.toLowerCase()} logo. Please try again.`);
      setUploadSuccess(null);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, size: LogoSize) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      if (size === 'square') {
        setSelectedSquareFile(file);
      } else {
        setSelectedWideFile(file);
      }
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUpload = (size: LogoSize) => {
    const file = size === 'square' ? selectedSquareFile : selectedWideFile;
    if (file) {
      uploadLogoMutation.mutate({ file, size });
    }
  };

  const handleReset = (size: LogoSize) => {
    resetLogoMutation.mutate(size);
  };

  if (isLoadingSquare || isLoadingWide) {
    return (
      <div className="space-y-4">
        <div className="text-center text-muted-foreground">Loading {title.toLowerCase()} logos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {uploadSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {uploadSuccess}
          </AlertDescription>
        </Alert>
      )}

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadError}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Square Logo (500x500) */}
        <div className="space-y-4 p-4 border rounded-lg">
          <Label className="text-base font-medium flex items-center gap-2">
            {icon}
            Square Logo (500×500)
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mx-auto">
            {squareLogo?.logoUrl ? (
              <img
                src={squareLogo.logoUrl}
                alt={`Current ${title.toLowerCase()} square logo`}
                className="w-full h-full object-contain rounded-lg"
                data-testid={`current-${type}-square-logo`}
              />
            ) : (
              <div className="flex items-center justify-center">
                <Logo size="2xl" type={type} data-testid={`default-${type}-square-logo-fallback`} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => handleFileSelect(e, 'square')}
              data-testid={`${type}-square-logo-file-input`}
            />
            <p className="text-xs text-muted-foreground">
              • Recommended: 500×500 pixels • Max 10MB
            </p>
          </div>

          {selectedSquareFile && (
            <div className="p-3 border rounded-lg bg-gray-50 text-sm">
              <p className="font-medium">{selectedSquareFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedSquareFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleUpload('square')}
              disabled={!selectedSquareFile || uploadLogoMutation.isPending}
              className="bg-[#c4ee3d] hover:bg-[#b8e234] text-black flex-1" transition-all duration-300
              data-testid={`upload-${type}-square-logo-button`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>

            {squareLogo?.logoUrl && (
              <Button
                variant="outline"
                onClick={() => handleReset('square')}
                disabled={resetLogoMutation.isPending}
                data-testid={`reset-${type}-square-logo-button`}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Wide Logo (500x250) */}
        <div className="space-y-4 p-4 border rounded-lg">
          <Label className="text-base font-medium flex items-center gap-2">
            {icon}
            Wide Logo (500×250)
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            {wideLogo?.logoUrl ? (
              <img
                src={wideLogo.logoUrl}
                alt={`Current ${title.toLowerCase()} wide logo`}
                className="w-full h-full object-contain rounded-lg"
                data-testid={`current-${type}-wide-logo`}
              />
            ) : (
              <div className="flex items-center justify-center">
                <Logo size="2xl" type={type} data-testid={`default-${type}-wide-logo-fallback`} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => handleFileSelect(e, 'wide')}
              data-testid={`${type}-wide-logo-file-input`}
            />
            <p className="text-xs text-muted-foreground">
              • Recommended: 500×250 pixels • Max 10MB
            </p>
          </div>

          {selectedWideFile && (
            <div className="p-3 border rounded-lg bg-gray-50 text-sm">
              <p className="font-medium">{selectedWideFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedWideFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleUpload('wide')}
              disabled={!selectedWideFile || uploadLogoMutation.isPending}
              className="bg-[#c4ee3d] hover:bg-[#b8e234] text-black flex-1" transition-all duration-300
              data-testid={`upload-${type}-wide-logo-button`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>

            {wideLogo?.logoUrl && (
              <Button
                variant="outline"
                onClick={() => handleReset('wide')}
                disabled={resetLogoMutation.isPending}
                data-testid={`reset-${type}-wide-logo-button`}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MultiLogoManagement() {
  const { data: allLogos } = useQuery({
    queryKey: ['/api/admin/settings/logos'],
    queryFn: async () => {
      return await apiRequest('/api/admin/settings/logos') as { success: boolean; logos: AllLogos };
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Logo Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload and manage custom logos for different sections. Each section supports both square (500×500) and wide (500×250) logos.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="flex flex-wrap gap-2 w-full h-auto mb-6 sm:grid sm:grid-cols-7">
            <TabsTrigger value="home" className="flex items-center gap-1 sm:gap-2 px-3 py-2" data-testid="home-logo-tab">
              <Home className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Home</span>
            </TabsTrigger>
            <TabsTrigger value="student" className="flex items-center gap-1 sm:gap-2 px-3 py-2" data-testid="student-logo-tab">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Student</span>
            </TabsTrigger>
            <TabsTrigger value="teacher" className="flex items-center gap-1 sm:gap-2 px-3 py-2" data-testid="teacher-logo-tab">
              <Users className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Teacher</span>
            </TabsTrigger>
            <TabsTrigger value="freelancer" className="flex items-center gap-1 sm:gap-2 px-3 py-2" data-testid="freelancer-logo-tab">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Freelancer</span>
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-1 sm:gap-2 px-3 py-2" data-testid="customer-logo-tab">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Customer</span>
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-1 sm:gap-2 px-3 py-2" data-testid="footer-logo-tab">
              <Info className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Footer</span>
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-1 sm:gap-2 px-3 py-2" data-testid="auth-logo-tab">
              <Lock className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Auth</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="home">
            <LogoSection
              type="home"
              title="Home"
              description="Logo displayed on the homepage and main navigation"
              icon={<Home className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="student">
            <LogoSection
              type="student"
              title="Student"
              description="Logo displayed in the student dashboard and learning interface"
              icon={<GraduationCap className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="teacher">
            <LogoSection
              type="teacher"
              title="Teacher"
              description="Logo displayed in the teacher dashboard and management interface"
              icon={<Users className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="freelancer">
            <LogoSection
              type="freelancer"
              title="Freelancer"
              description="Logo displayed in the freelancer dashboard and portfolio interface"
              icon={<Briefcase className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="customer">
            <LogoSection
              type="customer"
              title="Customer"
              description="Logo displayed in the customer/shop dashboard"
              icon={<ShoppingBag className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="footer">
            <LogoSection
              type="footer"
              title="Footer"
              description="Logo displayed in the footer section across all pages"
              icon={<Info className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="auth">
            <LogoSection
              type="auth"
              title="Auth"
              description="Logo displayed on authentication and login pages"
              icon={<Lock className="h-4 w-4" />}
            />
          </TabsContent>
        </Tabs>

        {allLogos?.logos && (
          <div className="mt-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-sm font-medium mb-3">Logo Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              {Object.entries(allLogos.logos).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    {key === 'home' && <Home className="h-3 w-3" />}
                    {key === 'student' && <GraduationCap className="h-3 w-3" />}
                    {key === 'teacher' && <Users className="h-3 w-3" />}
                    {key === 'freelancer' && <Briefcase className="h-3 w-3" />}
                    {key === 'customer' && <ShoppingBag className="h-3 w-3" />}
                    {key === 'footer' && <Info className="h-3 w-3" />}
                    {key === 'auth' && <Lock className="h-3 w-3" />}
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Square: {value.square ? '✓' : '✗'}</div>
                    <div>Wide: {value.wide ? '✓' : '✗'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
