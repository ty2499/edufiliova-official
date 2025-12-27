import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select';
import { Eye, EyeOff, Mail, Phone, AlertCircle, Loader2, User, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SocialAuthButtons } from '../SocialAuthButtons';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  onJoinAsStudent?: () => void;
  onApplyToTeach?: () => void;
  onJoinAsFreelancer?: () => void;
}

export default function LoginForm({ 
  onSuccess, 
  onSwitchToRegister, 
  onForgotPassword,
  onJoinAsStudent,
  onApplyToTeach,
  onJoinAsFreelancer
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
        <h2 className="text-2xl font-bold text-[#a0fab2] mb-2">
          Sign in to your account
        </h2>
        <p className="text-white/80 text-sm">
          Welcome back! Please enter your details.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2 text-white text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="login-method" className="text-sm font-medium text-white mb-1 block">
            Login Method
          </Label>
          <Select 
            value={formData.loginMethod} 
            onValueChange={(value: 'email' | 'phone' | 'id') => handleInputChange('loginMethod', value)}
          >
            <SelectTrigger className="h-11 rounded-lg border-white/20 bg-white/10 text-white" data-testid="select-login-method">
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
          <Label htmlFor="login-identifier" className="text-sm font-medium text-white mb-1 block">
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
              className={`h-11 pl-10 rounded-lg border-white/20 bg-white/10 text-white placeholder:text-white/50 ${errors.loginIdentifier ? 'border-red-500' : ''}`}
              data-testid="input-login-identifier"
            />
          </div>
          {errors.loginIdentifier && <p className="text-sm text-red-400 mt-1">{errors.loginIdentifier}</p>}
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium text-white mb-1 block">
            Password*
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter your password"
              className={`h-11 pr-10 rounded-lg border-white/20 bg-white/10 text-white placeholder:text-white/50 ${errors.password ? 'border-red-500' : ''}`}
              data-testid="input-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent text-white/70"
              onClick={() => setShowPassword(!showPassword)}
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-sm text-red-400 mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm ml-auto">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[#a0fab2] hover:text-white font-medium transition-all duration-300"
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
            'Sign In'
          )}
        </Button>

        <div className="space-y-3">
          {onJoinAsStudent && (
            <Button
              type="button"
              className="w-full h-11 font-medium rounded-lg hover:opacity-90 transition-all duration-300"
              style={{ backgroundColor: '#0c332c', color: '#a0fab2' }}
              disabled={loading}
              onClick={onJoinAsStudent}
              data-testid="button-join-student"
            >
              <User className="h-4 w-4 mr-2" />
              Join as Student
            </Button>
          )}

          {onApplyToTeach && (
            <Button
              type="button"
              onClick={onApplyToTeach}
              className="w-full h-11 font-medium rounded-lg hover:opacity-90 transition-all duration-300"
              style={{ backgroundColor: '#0c332c', color: '#a0fab2' }}
              data-testid="button-apply-teach"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Apply to teach
            </Button>
          )}

          {onJoinAsFreelancer && (
            <Button
              type="button"
              className="w-full h-11 font-medium rounded-lg hover:opacity-90 transition-all duration-300"
              style={{ backgroundColor: '#0c332c', color: '#a0fab2' }}
              disabled={loading}
              onClick={onJoinAsFreelancer}
              data-testid="button-join-freelancer"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Join as Freelancer
            </Button>
          )}
        </div>

        <SocialAuthButtons 
          onSuccess={onSuccess} 
          disabled={loading}
        />

        {onSwitchToRegister && (
          <div className="text-center text-sm text-white mt-6">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[#a0fab2] hover:text-white font-medium transition-all duration-300"
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
