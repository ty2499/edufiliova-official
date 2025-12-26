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
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const { forgotPassword, resetPassword } = useAuth();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    setLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setStep('code');
      } else {
        setErrors({ general: result.error || 'Failed to send code' });
      }
    } catch (err) {
      setErrors({ general: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setErrors({ code: 'Enter 6-digit code' });
      return;
    }
    setStep('password');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!newPassword.trim()) {
      setErrors({ newPassword: 'New password is required' });
      return;
    }

    if (newPassword.length < 8) {
      setErrors({ newPassword: 'Password must be at least 8 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email, code, newPassword);
      
      if (result.error) {
        setErrors({ general: result.error });
      } else {
        setSuccess(true);
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl">
              {step === 'email' ? 'Forgot Password' : step === 'code' ? 'Verify Code' : 'Create New Password'}
            </CardTitle>
            <CardDescription>
              {step === 'email' ? 'Enter your email to receive a reset code' : 
               step === 'code' ? 'Enter the 6-digit code sent to your email' : 
               'Enter a new password for your account'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{ color: '#000000 !important', WebkitTextFillColor: '#000000 !important' }}
                />
                {errors.email && <p className="text-sm text-primary">{errors.email}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Send Reset Code
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">6-Digit Code</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ color: '#000000 !important', WebkitTextFillColor: '#000000 !important' }}
                />
                {errors.code && <p className="text-sm text-primary">{errors.code}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary">
                Verify Code
              </Button>
            </form>
          )}

          {step === 'password' && (
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
                    placeholder="Enter new password (8+ characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`pr-10 ${errors.newPassword ? "border-primary" : ""}`}
                    style={{ color: '#000000 !important', WebkitTextFillColor: '#000000 !important' }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400"
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
                  style={{ color: '#000000 !important', WebkitTextFillColor: '#000000 !important' }}
                  disabled={loading}
                />
                {errors.confirmPassword && <p className="text-sm text-primary">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full bg-primary" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
