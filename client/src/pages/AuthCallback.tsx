import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthCallback } from '@/hooks/useSocialAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const [, navigate] = useLocation();
  const { handleAuthCallback, processing } = useAuthCallback();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const result = await handleAuthCallback();
        
        if (result?.success) {
          const { user, needsProfileCompletion, needsRoleSelection, isFromCheckout } = result;
          
          if (isFromCheckout) {
            // Redirect to checkout role selection
            navigate('/checkout/role-selection');
          } else if (needsProfileCompletion) {
            // Redirect to profile completion
            navigate('/profile-completion');
          } else if (needsRoleSelection) {
            // Redirect to role selection
            navigate('/role-selection');
          } else {
            // Redirect to dashboard based on role
            const role = user?.profile?.role || 'student';
            switch (role) {
              case 'teacher':
                navigate('/?page=teacher-dashboard');
                break;
              case 'freelancer':
                navigate('/?page=freelancer-dashboard');
                break;
              case 'general':
                navigate('/?page=product-shop');
                break;
              case 'student':
              default:
                navigate('/?page=student-dashboard');
                break;
            }
          }
        } else {
          setError('Failed to complete authentication');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    // Small delay to ensure URL parameters are available
    const timer = setTimeout(processCallback, 100);
    return () => clearTimeout(timer);
  }, [handleAuthCallback, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-6 sm:px-10 lg:px-14">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <button
                onClick={() => navigate('/auth')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Return to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-6 sm:px-10 lg:px-14">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Completing Authentication
          </CardTitle>
          <CardDescription className="text-center">
            Please wait while we set up your account...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    </div>
  );
}
