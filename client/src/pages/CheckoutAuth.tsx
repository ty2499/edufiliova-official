import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from 'wouter';
import { 
  Mail, 
  Lock,
  Eye, 
  EyeOff,
  Loader2,
  AlertCircle,
  ShoppingCart,
  X
} from "lucide-react";
import Logo from "@/components/Logo";

interface CheckoutAuthProps {
  onSuccess?: () => void;
}

export function CheckoutAuth({ onSuccess }: CheckoutAuthProps) {
  const [, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    agreeToTerms: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = "You must agree to the terms of service";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      let result;
      
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        // For checkout registration, we create a minimal profile
        result = await signUp(formData.email, formData.password, {
          name: formData.name,
          age: 18, // Default age for checkout users
          grade: 12, // Default grade for checkout users  
          country: "United States" // Default country for checkout users
        });
        
        // Mark as checkout user
        if (result.success) {
          await fetch('/api/auth/mark-checkout-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
            },
            body: JSON.stringify({ isFromCheckout: true }),
          });
        }
      }

      if (result.error) {
        setErrors({ general: result.error });
      } else {// Navigate to role selection for checkout users
        navigate('/checkout/role-selection');
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Checkout auth error:', error);
      setErrors({ general: error.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSuccess = () => {
    // Social auth will redirect to callback which handles checkout flow
    onSuccess?.();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Close button for mobile */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-[100] text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium text-sm p-2 rounded-lg transition-colors lg:hidden"
        data-testid="button-close-mobile"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Close button for desktop */}
      <button
        onClick={() => navigate('/')}
        className="hidden lg:block absolute top-6 right-6 z-[100] text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium text-sm p-2 rounded-lg transition-colors"
        data-testid="button-close-desktop"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-6 sm:px-10 lg:px-14 pt-32 lg:pt-12">
        {/* Logo - visible on mobile only, centered */}
        <div className="mb-3 md:hidden flex justify-center">
          <Logo 
            size="sm" 
            variant="default" 
            type="auth"
            onClick={() => navigate('/')}
            className="cursor-pointer"
            data-testid="auth-logo"
          />
        </div>
        
        <Card className="w-full max-w-md shadow-none border-0 bg-transparent">
          <CardHeader className="space-y-1 text-center pt-8 pb-6">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Sign in to continue" : "Create account to continue"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Sign in to complete your purchase" 
                : "Create an account to access our platform and complete your purchase"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-checkout-auth">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-primary-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                  required
                  data-testid="input-name"
                />
                {errors.name && <p className="text-sm text-primary-600">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                  required
                  data-testid="input-email"
                />
              </div>
              {errors.email && <p className="text-sm text-primary-600">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Enter your password" : "Create a password (min 8 characters)"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                  required
                  data-testid="input-password"
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
              {errors.password && <p className="text-sm text-primary-600">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-primary-600">{errors.confirmPassword}</p>}
              </div>
            )}

            {!isLogin && (
              <div className="flex items-center space-x-2">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-terms"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </label>
                {errors.agreeToTerms && <p className="text-sm text-primary-600">{errors.agreeToTerms}</p>}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid={`button-${isLogin ? 'login' : 'register'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>

            {/* Social Authentication */}
            <SocialAuthButtons 
              disabled={loading}
              isCheckout={true}
              redirectTo="/auth/callback"
              onSuccess={handleSocialSuccess}
            />

            {/* Toggle between login and register */}
            <div className="text-center pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setFormData({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    name: "",
                    agreeToTerms: false
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={loading}
                data-testid={`button-switch-to-${isLogin ? 'register' : 'login'}`}
              >
                {isLogin 
                  ? "Don't have an account? Create one" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
