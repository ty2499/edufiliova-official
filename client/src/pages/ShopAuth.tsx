import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  ArrowLeft
} from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import VerificationCodeInput from '@/components/auth/VerificationCodeInput';
import { resolveApiUrl } from '@/lib/queryClient';

interface ShopAuthProps {
  onNavigate?: (page: string, transition?: string) => void;
  returnUrl?: string;
}

type AuthMode = 'signin' | 'signup';

export default function ShopAuth({ onNavigate, returnUrl }: ShopAuthProps) {
  const { user, profile, loading, refreshAuth } = useAuth();
  
  // Form states
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle verification callback from email link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const sessionId = params.get('session');
    const refCode = params.get('ref');
    
    if (refCode) {
      localStorage.setItem('pendingReferralCode', refCode);
    }
    
    // Handle successful email verification via link
    if (verified === 'true' && sessionId) {
      localStorage.setItem('sessionId', sessionId);
      
      // Track referral if we have a pending referral code
      const pendingReferralCode = localStorage.getItem('pendingReferralCode');
      if (pendingReferralCode) {
        fetch(resolveApiUrl('/api/shop/referral/track'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode: pendingReferralCode }),
        }).then(() => {
          localStorage.removeItem('pendingReferralCode');
        }).catch(console.error);
      }
      
      // Clear URL params and redirect
      window.history.replaceState({}, '', window.location.pathname);
      refreshAuth().then(() => {
        const destination = returnUrl || 'product-shop';
        onNavigate?.(destination, 'slide-left');
      });
    }
  }, [refreshAuth, onNavigate, returnUrl]);

  // Redirect authenticated users back to where they came from or to shop
  useEffect(() => {
    if (!loading && user && profile) {
      const destination = returnUrl || 'product-shop';
      onNavigate?.(destination, 'slide-left');
    }
  }, [user, profile, loading, onNavigate, returnUrl]);

  // Clear errors when user types
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (authMode === 'signup') {
      if (!name.trim()) {
        newErrors.name = 'Name is required';
      }
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (authMode === 'signup' && password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!agreeToTerms) {
        newErrors.terms = 'You must agree to the terms and conditions';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsProcessing(true);
    setErrors({});
    
    try {
      const endpoint = authMode === 'signup' ? '/api/shop/signup' : '/api/shop/signin';
      const response = await fetch(resolveApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(authMode === 'signup' && { fullName: name }),
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Check if OTP code-based verification is needed
        if (result.needsVerification) {
          setNeedsVerification(true);
          setVerificationCode('');
          setVerificationError(false);
          setErrors({});
          setResendSuccess(false);
          setIsProcessing(false);
          return;
        }
        
        // Store session data and refresh auth context
        if (result.sessionId) {
          localStorage.setItem('sessionId', result.sessionId);
          // Refresh auth context to load user data from database
          await refreshAuth();
        }
        
        // Track referral if this was a signup and we have a pending referral code
        if (authMode === 'signup') {
          const referralCode = localStorage.getItem('pendingReferralCode');
          if (referralCode) {
            try {
              await fetch(resolveApiUrl('/api/shop/referral/track'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ referralCode }),
              });
              localStorage.removeItem('pendingReferralCode');
            } catch (error) {
              console.error('Failed to track referral:', error);
            }
          }
        }
        
        // Redirect to shop or return URL
        const destination = returnUrl || 'product-shop';
        onNavigate?.(destination, 'slide-left');
      } else {
        if (result.error?.includes('Email already registered') && authMode === 'signup') {
          setAuthMode('signin');
          setErrors({ general: 'Email already registered. Please sign in instead.' });
        } else {
          setErrors({ general: result.error || `${authMode === 'signup' ? 'Signup' : 'Sign in'} failed. Please try again.` });
        }
      }
    } catch (error) {
      console.error(`${authMode} error:`, error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!code || code.length !== 6) {
      setErrors({ verification: 'Please enter all 6 digits' });
      return;
    }
    
    setIsVerifying(true);
    setErrors({});
    setResendSuccess(false);
    
    try {
      const response = await fetch(resolveApiUrl('/api/shop/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Clear verification state first before any async operations
        setNeedsVerification(false);
        setVerificationCode('');
        setVerificationError(false);
        
        // Store session data and refresh auth context
        if (result.sessionId) {
          localStorage.setItem('sessionId', result.sessionId);
          try {
            await refreshAuth();
          } catch (error) {
            console.error('Failed to refresh auth:', error);
          }
        }
        
        // Track referral if we have a pending referral code
        const referralCode = localStorage.getItem('pendingReferralCode');
        if (referralCode) {
          try {
            await fetch(resolveApiUrl('/api/shop/referral/track'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ referralCode }),
            });
            localStorage.removeItem('pendingReferralCode');
          } catch (error) {
            console.error('Failed to track referral:', error);
          }
        }
        
        // Redirect to shop or return URL
        const destination = returnUrl || 'product-shop';
        onNavigate?.(destination, 'slide-left');
      } else {
        setVerificationError(true);
        setVerificationCode('');
        setErrors({ verification: result.error || 'Invalid verification code. Please try again.' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError(true);
      setVerificationCode('');
      setErrors({ verification: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || !email.trim()) {
      setErrors({ general: 'Email not found. Please go back and sign up again.' });
      return;
    }
    
    setIsResending(true);
    setErrors({});
    setResendSuccess(false);
    
    try {
      const response = await fetch(resolveApiUrl('/api/shop/resend-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setErrors({});
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setErrors({ general: result.error || 'Failed to resend code. Please try again.' });
      }
    } catch (error) {
      console.error('Resend code error:', error);
      setErrors({ general: 'Failed to resend code. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Beautiful OTP verification screen
  if (needsVerification) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#e0f2fe' }}>
              <Mail className="h-10 w-10" style={{ color: '#0C332C' }} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
              <p className="text-gray-600">
                We sent a 6-digit code to<br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
            </div>

            {errors.verification && (
              <div className="p-3 bg-primary/10 border border-red-200 rounded-xl text-primary-700 text-sm">
                {errors.verification}
              </div>
            )}
            
            {errors.general && (
              <div className="p-3 bg-primary/10 border border-red-200 rounded-xl text-primary-700 text-sm">
                {errors.general}
              </div>
            )}
            
            {resendSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                A new verification code has been sent to your email.
              </div>
            )}

            <div className="py-4">
              <VerificationCodeInput
                value={verificationCode}
                onChange={(code) => {
                  setVerificationCode(code);
                  setVerificationError(false);
                  setErrors({});
                }}
                onComplete={handleVerifyCode}
                disabled={isVerifying}
                error={verificationError}
              />
            </div>

            {isVerifying && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <p className="text-sm text-gray-500">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="font-medium hover:underline disabled:opacity-50"
                  style={{ color: '#0C332C' }}
                  data-testid="button-resend-code"
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </button>
              </p>
              
              <button
                onClick={() => {
                  setNeedsVerification(false);
                  setVerificationCode('');
                  setErrors({});
                  setVerificationError(false);
                }}
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 mx-auto"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Signup Form
              </button>
            </div>

            <p className="text-xs text-gray-400 pt-4">
              Code expires in 15 minutes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      onNavigate={onNavigate}
      showNotNow={true}
      notNowAction={() => onNavigate?.(returnUrl || 'product-shop', 'slide-right')}
      heroPlacement="shop_auth"
    >
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {authMode === 'signin' ? 'Welcome Back!' : 'Join Our Shop'}
          </h2>
          <p className="text-gray-600">
            {authMode === 'signin' 
              ? 'Sign in to continue shopping' 
              : 'Create an account to start shopping'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-shop-auth">
          {errors.general && (
            <div className="p-4 bg-primary/10 border border-red-200 rounded-lg flex items-start gap-3 text-primary-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {authMode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError('name'); }}
                className={errors.name ? 'border-primary' : ''}
                disabled={isProcessing}
                data-testid="input-name"
              />
              {errors.name && <p className="text-sm text-primary-600">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
              className={errors.email ? 'border-primary' : ''}
              disabled={isProcessing}
              data-testid="input-email"
            />
            {errors.email && <p className="text-sm text-primary-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={authMode === 'signin' ? 'Enter your password' : 'Create a password (min 8 characters)'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                className={`pr-10 ${errors.password ? 'border-primary' : ''}`}
                disabled={isProcessing}
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isProcessing}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-primary-600">{errors.password}</p>}
          </div>

          {authMode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                className={errors.confirmPassword ? 'border-primary' : ''}
                disabled={isProcessing}
                data-testid="input-confirm-password"
              />
              {errors.confirmPassword && <p className="text-sm text-primary-600">{errors.confirmPassword}</p>}
            </div>
          )}

          {authMode === 'signup' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => { setAgreeToTerms(checked as boolean); clearError('terms'); }}
                  disabled={isProcessing}
                  className="h-4 w-4 mt-0.5"
                  data-testid="checkbox-terms"
                />
                <label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 leading-snug cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">Terms of Service</a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>
                </label>
              </div>
              {errors.terms && <p className="text-sm text-primary-600">{errors.terms}</p>}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-base font-semibold"
            disabled={isProcessing}
            data-testid={`button-${authMode}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              authMode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </Button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setErrors({});
                setName('');
                setPassword('');
                setConfirmPassword('');
                setAgreeToTerms(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline block w-full"
              disabled={isProcessing}
              data-testid={`button-switch-to-${authMode === 'signin' ? 'signup' : 'signin'}`}
            >
              {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
