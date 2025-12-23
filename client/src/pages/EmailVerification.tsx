import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { XCircle, Loader2 } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface EmailVerificationProps {
  onNavigate?: (route: string) => void;
}

export default function EmailVerification({ onNavigate }: EmailVerificationProps) {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [applicationId, setApplicationId] = useState<number | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/teacher-applications/verify/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          setApplicationId(data.applicationId);
          
          setTimeout(() => {
            setLocation(`/teacher-apply?continue=true&applicationId=${data.applicationId}`);
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Verifying your email</h2>
            <p className="text-gray-600 text-lg">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckmarkIcon size="2xl" variant="success" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Email verified!</h2>
            <p className="text-gray-600 text-lg mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to complete your application...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-primary/15 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-primary-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Verification failed</h2>
            <p className="text-gray-600 text-lg mb-6">
              {message}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => onNavigate?.('teacher-apply')}
                className="bg-gradient-to-r from-orange-600 to-primary hover:from-orange-700 hover:to-red-700"
                data-testid="button-try-again"
              >
                Try Again
              </Button>
              <Button
                onClick={() => onNavigate?.('portfolio-gallery')}
                variant="outline"
                data-testid="button-back-home"
              >
                Back to Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
