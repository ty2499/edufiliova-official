import { MultiLogoManagement } from '@/components/MultiLogoManagement';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogoManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              window.location.search = '?page=admin-dashboard';
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Logo Management</h1>
            <p className="text-gray-600 mt-1">
              Upload and manage custom logos for home, student, teacher, freelancer, customer, and footer sections
            </p>
          </div>
        </div>

        {/* Logo Management Component */}
        <MultiLogoManagement />
      </div>
    </div>
  );
}
