import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { CheckmarkIcon } from '@/components/ui/checkmark-icon';
import { useAuth } from '@/hooks/useAuth';
// useToast removed - now using silent operations
import Logo from '@/components/Logo';

interface ResetPasswordProps {
  onComplete?: () => void;
  token?: string;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete, token: propToken }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  // Silent operations - no toast notifications
  
  // Get token from URL or props
  const token = propToken || new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      setErrors({ general: 'Invalid reset token. Please request a new password reset link.' });
    }
  }, [token]);

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      setErrors({ general: 'Invalid reset token' });
      return;
    }

    if (!newPassword.trim()) {
      setErrors({ newPassword: 'New password is required' });
      return;
    }

    if (!validatePassword(newPassword)) {
      setErrors({ newPassword: 'Password must be at least 6 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(token, newPassword);
      
      if (result.error) {
        setErrors({ general: result.error });
      } else {
        setSuccess(true);
        // Silent password reset success
        
        // Redirect after success
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          } else {
            window.location.href = '/';
          }
        }, 2000);
      }
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="flex justify-center">
            <CheckmarkIcon size="2xl" variant="success" />
          </div>
          <div>
            <CardTitle className="text-2xl text-green-700">Password Reset Complete!</CardTitle>
            <CardDescription>Your password has been successfully updated.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-4">
            You will be redirected to the login page shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-white from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl">Create New Password</CardTitle>
            <CardDescription>Enter a new password for your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-primary/10 border border-red-200 rounded-lg flex items-center gap-2 text-primary text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (6+ characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`pr-10 ${errors.newPassword ? "border-primary" : ""}`}
                  disabled={loading}
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-sm text-primary">{errors.newPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? "border-primary" : ""}
                disabled={loading}
                data-testid="input-confirm-password"
              />
              {errors.confirmPassword && <p className="text-sm text-primary">{errors.confirmPassword}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all duration-300 hover:shadow-sm hover:scale-105" 
              disabled={loading}
              data-testid="button-reset-password"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
