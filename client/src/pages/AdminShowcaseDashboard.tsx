import { useAuth } from '@/hooks/useAuth';
import { PortfolioMonitoringDashboard } from '@/components/PortfolioMonitoringDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function AdminShowcaseDashboard() {
  const { user, profile } = useAuth();
  const [, setLocation] = useLocation();

  // Check admin access
  if (!user || !profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You need administrator privileges to access this dashboard.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mb-4"
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Main Content */}
        <PortfolioMonitoringDashboard />
      </div>
    </div>
  );
}
