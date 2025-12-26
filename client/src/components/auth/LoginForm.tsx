import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Mail, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

export default function LoginForm({ 
  onSuccess, 
  onSwitchToRegister, 
  onForgotPassword 
}: LoginFormProps) {
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    loginMethod: 'email' as 'email' | 'phone' | 'id',
    loginIdentifier: '',
    password: ''
  });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const clearErrors = () => setErrors({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.loginIdentifier.trim()) {
      newErrors.loginIdentifier = `${formData.loginMethod === 'email' ? 'Email' : formData.loginMethod === 'phone' ? 'Phone number' : 'ID number'} is required`;
    } else {
      // Validate based on login method
      if (formData.loginMethod === 'email' && !validateEmail(formData.loginIdentifier)) {
        newErrors.loginIdentifier = "Please enter a valid email address";
      } else if (formData.loginMethod === 'phone' && !/^[\+]?[\d\s\-\(\)]{7,20}$/.test(formData.loginIdentifier)) {
        newErrors.loginIdentifier = "Please enter a valid phone number";
      } else if (formData.loginMethod === 'id' && !/^[0-9]{9}[A-Z]{2}$/.test(formData.loginIdentifier)) {
        newErrors.loginIdentifier = "Please enter a valid ID number (9 digits + 2 letters)";
      }
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(formData.loginIdentifier, formData.password);
      
      if (result.error) {
        if (result.error?.includes("Invalid credentials")) {
          setErrors({ general: "Invalid credentials. Please check your information and try again." });
        } else {
          setErrors({ general: result.error || 'Login failed' });
        }
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const getLoginPlaceholder = () => {
    switch (formData.loginMethod) {
      case 'email':
        return 'Enter your email address';
      case 'phone':
        return 'Enter your phone number';
      case 'id':
        return 'Enter your ID number';
      default:
        return 'Enter your login details';
    }
  };

  const getLoginIcon = () => {
    switch (formData.loginMethod) {
      case 'phone':
        return <Phone className="h-4 w-4 text-gray-400" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sign in to your account
        </h2>
        <p className="text-gray-600 text-sm">
          Welcome back! Please enter your details.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-primary/10 border border-red-200 rounded-lg flex items-center gap-2 text-primary text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="login-method" className="text-sm font-medium text-gray-700 mb-1 block">
            Login Method
          </Label>
          <Select 
            value={formData.loginMethod} 
            onValueChange={(value: 'email' | 'phone' | 'id') => handleInputChange('loginMethod', value)}
          >
            <SelectTrigger className="h-11 rounded-lg" data-testid="select-login-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email" data-testid="option-email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
              </SelectItem>
              <SelectItem value="phone" data-testid="option-phone">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </div>
              </SelectItem>
              <SelectItem value="id" data-testid="option-id">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  ID Number
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="login-identifier" className="text-sm font-medium text-gray-700 mb-1 block">
            {formData.loginMethod === 'email' ? 'Email Address' : 
             formData.loginMethod === 'phone' ? 'Phone Number' : 'ID Number'}*
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {getLoginIcon()}
            </div>
            <Input
              id="login-identifier"
              type={formData.loginMethod === 'email' ? 'email' : 'text'}
              value={formData.loginIdentifier}
              onChange={(e) => handleInputChange('loginIdentifier', e.target.value)}
              placeholder={getLoginPlaceholder()}
              className={`h-11 pl-10 rounded-lg ${errors.loginIdentifier ? 'border-primary' : ''}`}
              data-testid="input-login-identifier"
            />
          </div>
          {errors.loginIdentifier && <p className="text-sm text-primary mt-1">{errors.loginIdentifier}</p>}
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 block">
            Password*
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter your password"
              className={`h-11 pr-10 rounded-lg ${errors.password ? 'border-primary' : ''}`}
              data-testid="input-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent text-gray-400 transition-all duration-300"
              onClick={() => setShowPassword(!showPassword)}
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-sm text-primary mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-primary hover:text-purple-800 font-medium transition-all duration-300"
              data-testid="button-forgot-password"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium rounded-lg"
          style={{ backgroundColor: '#A0FAB2', color: '#1f2937' }}
          disabled={loading}
          data-testid="button-login"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-gray-900 transition-all duration-300"
          disabled={loading}
          data-testid="button-google-login"
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </Button>

        {onSwitchToRegister && (
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary hover:text-purple-800 font-medium transition-all duration-300"
              data-testid="link-register"
            >
              Sign up
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
