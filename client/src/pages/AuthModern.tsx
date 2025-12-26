import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { resolveApiUrl } from "@/lib/queryClient";
import AuthLayout from "@/components/auth/AuthLayout";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  GraduationCap, 
  Calendar,
  Shield,
  AlertCircle,
  Loader2,
  MessageCircle,
  X,
  ArrowLeft,
  Briefcase,
  Lock,
  Star,
  BookOpen,
  Bell,
  MessageSquare,
  Award
} from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import TeacherSignupBasic from "./TeacherSignupBasic";
import VerificationCodeInput from "@/components/auth/VerificationCodeInput";

interface AuthModernProps {
  onLogin: () => void;
  onTeacherRegistration?: () => void;
  onNavigate?: (page: string) => void;
  userType?: 'student' | 'teacher' | 'freelancer' | 'general';
  hideSkipButton?: boolean;
}

type AuthStep = "login" | "register" | "register-teacher" | "verify-email" | "verify-phone" | "forgot-password" | "reset-pin-entry";

const AuthModern = ({ onLogin, onTeacherRegistration, onNavigate, userType = 'student', hideSkipButton = false }: AuthModernProps) => {
  // Set initial step based on userType prop
  const getInitialStep = (): AuthStep => {
    if (userType === 'teacher') return 'register-teacher';
    if (userType === 'student') return 'login';
    if (userType === 'freelancer') return 'login'; // Freelancers have their own page
    return 'login'; // Default to login for 'general' or undefined
  };
  
  const [currentStep, setCurrentStep] = useState<AuthStep>(getInitialStep());
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationError, setVerificationError] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [userTypeState, setUserType] = useState<"student" | "teacher">("student");
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | null>(null);
  
  // Password Reset PIN entry state
  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [resetPin, setResetPin] = useState('');
  // Countries data - fetch from API
  const [countries, setCountries] = useState<Array<{id: number, name: string}>>([]);
  const [gradeSystems, setGradeSystems] = useState<Array<{id: number, gradeNumber: number, displayName: string}>>([]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    name: "",
    age: "",
    grade: "",
    country_id: "",
    educationSystem: "",
    schoolName: "",
    learningPreferences: [] as string[],
    whatsappOptIn: false,
    agreeToTerms: false,
    confirmStudent: false,
    contactType: "email", // Default to email
    verificationMethod: "sms", // sms or whatsapp
    loginMethod: "email", // email, phone, or id
    loginIdentifier: "", // The actual login value (email, phone, or ID)
  });


  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(resolveApiUrl('/api/countries'));
        const result = await response.json();
        if (result.success) {
          setCountries(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Fetch grade systems when country changes
  useEffect(() => {
    const fetchGradeSystems = async () => {
      if (formData.country_id) {
        try {
          const response = await fetch(resolveApiUrl(`/api/grade-systems/${formData.country_id}`));
          const result = await response.json();
          if (result.success) {
            setGradeSystems(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch grade systems:', error);
        }
      }
    };
    fetchGradeSystems();
  }, [formData.country_id]);

  // Get available grades for selected country
  const selectedCountryGrades = gradeSystems.map(grade => ({
    value: grade.gradeNumber,
    label: grade.displayName
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp, signIn, forgotPassword, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      onLogin();
    }
  }, [user, onLogin]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const clearErrors = () => setErrors({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleLearningPreferenceToggle = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      learningPreferences: prev.learningPreferences.includes(preference)
        ? prev.learningPreferences.filter(p => p !== preference)
        : [...prev.learningPreferences, preference]
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.loginIdentifier.trim()) {
      newErrors.loginIdentifier = `${formData.loginMethod === 'email' ? 'Email' : formData.loginMethod === 'phone' ? 'Phone number' : 'ID number'} is required`;
    } else {
      // Validate based on login method
      if (formData.loginMethod === 'email' && !validateEmail(formData.loginIdentifier)) {
        newErrors.loginIdentifier = "Please enter a valid email address";
      } else if (formData.loginMethod === 'phone' && !/^\+[\d]{7,15}$/.test(formData.loginIdentifier.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.loginIdentifier = "Please enter a valid phone number with country code";
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
        console.log('Login successful, calling onLogin callback');
        if (onLogin) {
          onLogin();
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    const newErrors: Record<string, string> = {};
    
    // Validate email (required)
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Validate phone number (required for WhatsApp)
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number (WhatsApp) is required";
    } else if (!/^\+[\d]{7,15}$/.test(formData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phoneNumber = "Please enter a valid phone number with country code (e.g., +1234567890)";
    }
    
    // Validate personal information
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    
    if (!formData.age.trim() || parseInt(formData.age) < 5 || parseInt(formData.age) > 100) {
      newErrors.age = "Please enter a valid age between 5 and 100";
    }
    
    if (!formData.country_id) {
      newErrors.country_id = "Please select your country";
    }
    
    if (!formData.educationSystem) {
      newErrors.educationSystem = "Please select your education system";
    }
    
    if (!formData.grade) {
      newErrors.grade = "Please select your grade";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    // Validate agreements
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the Terms of Use and Privacy Policy";
    }
    
    if (!formData.confirmStudent) {
      newErrors.confirmStudent = "Please confirm you are a student or signing up on behalf of a student";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(resolveApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phoneNumber,
          password: formData.password,
          age: formData.age,
          grade: formData.grade,
          country: countries.find(c => c.id.toString() === formData.country_id)?.name || '',
          countryId: parseInt(formData.country_id),
          educationSystem: formData.educationSystem,
          schoolName: formData.schoolName || null,
          learningPreferences: formData.learningPreferences,
          whatsappOptIn: formData.whatsappOptIn,
          educationLevel: 'grade'
        }),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error occurred. Please try again later.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setUserType("student");
        // Only use WhatsApp verification if user opted in AND provided phone number
        if (formData.whatsappOptIn && formData.phoneNumber && formData.phoneNumber.trim()) {
          setCurrentStep("verify-phone"); // WhatsApp verification
        } else {
          setCurrentStep("verify-email"); // Email verification
        }
      } else {
        setErrors({ general: result.error || 'Registration failed' });
      }
      
    } catch (error: any) {
      if (error.message.includes("Email already registered")) {
        setErrors({ email: "This email is already registered. Try signing in instead." });
      } else if (error.message.includes("Failed to send verification SMS")) {
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
          setErrors({ general: "SMS service is in development mode. Check the browser console for your verification code." });
        } else {
          setErrors({ general: "Failed to send SMS verification. Please try again or use email registration." });
        }
      } else {
        setErrors({ general: error.message || "Registration failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(resolveApiUrl('/api/teacher-applications'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.name,
          displayName: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber || '',
          dateOfBirth: '1990-01-01',
          country: 'To be completed',
          teachingCategories: ['To be specified'],
          gradeLevels: ['To be specified'],
          highestQualification: 'To be completed',
          yearsOfExperience: 'To be completed',
          experienceSummary: 'Will be completed after email verification',
          idPassportDocument: 'To be uploaded',
          agreementTruthful: true,
          agreementContent: true,
          agreementTerms: true,
          agreementUnderstand: true,
          agreementSafety: true,
        }),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error occurred. Please try again later.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Store application ID and redirect to detailed form
        sessionStorage.setItem('teacherApplicationId', result.id);
        sessionStorage.setItem('teacherEmail', formData.email);
        
        if (onNavigate) {
          onNavigate('/teacher-signup');
        } else {
          window.location.href = '/teacher-signup';
        }
      } else {
        setErrors({ general: result.error || 'Application submission failed' });
      }
      
    } catch (error: any) {
      setErrors({ general: error.message || "Application submission failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setErrors({ code: "Please enter the verification code" });
      return;
    }

    setLoading(true);
    try {
      const endpoint = userTypeState === "teacher" ? '/api/teacher/verify' : '/api/auth/verify-registration';
      
      const response = await fetch(resolveApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          emailCode: verificationCode,
          contactType: 'email'
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error occurred. Please try again later.');
      }

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Registration verification successful, signing in user');
        
        try{
          let loginResult;
          
          if (userTypeState === "teacher") {
            // For teachers, redirect to detailed application page after verification
            if (onNavigate) {
              onNavigate('/teacher-signup');
            } else {
              window.location.href = '/teacher-signup';
            }
            return;
          } else {
            loginResult = await signIn(formData.email, formData.password);
          }
          
          if (loginResult.error) {
            console.error('Failed to sign in after registration:', loginResult.error);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('profile', JSON.stringify(result.profile));
            window.location.reload();
          } else {
            console.log('Sign in successful after registration, calling onLogin callback');
            if (onLogin) {
              onLogin();
            }
          }
        } catch (error) {
          console.error('Error during sign in after registration:', error);
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('profile', JSON.stringify(result.profile));
          window.location.reload();
        }
      } else {
        setErrors({ code: result.error || "Invalid verification code" });
      }
    } catch (error: any) {
      setErrors({ code: error.message || "Invalid verification code" });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setErrors({ code: "Please enter the verification code" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(resolveApiUrl('/api/auth/verify-registration'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactInfo: formData.phoneNumber,
          code: verificationCode,
          contactType: 'phone'
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Phone verification successful, signing in user');
        
        try {
          const loginResult = await signIn(formData.email, formData.password);
          if (loginResult.error) {
            console.error('Failed to sign in after registration:', loginResult.error);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('profile', JSON.stringify(result.profile));
            window.location.reload();
          } else {
            console.log('Sign in successful after phone verification, calling onLogin callback');
            if (onLogin) {
              onLogin();
            }
          }
        } catch (error) {
          console.error('Error during sign in after phone verification:', error);
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('profile', JSON.stringify(result.profile));
          window.location.reload();
        }
      } else {
        setErrors({ code: result.error || "Invalid verification code" });
      }
    } catch (error: any) {
      setErrors({ code: error.message || "Invalid verification code" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (type: "email" | "phone") => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      const contactInfo = type === 'email' ? formData.email : formData.phoneNumber;
      
      const endpoint = userTypeState === "teacher" ? "/api/teacher/resend-verification" : "/api/auth/resend-verification";
      
      const response = await fetch(resolveApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactInfo,
          contactType: type,
          verificationMethod: type === 'phone' ? formData.verificationMethod : undefined
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResendCooldown(60);
      } else {
        console.error('Failed to send verification code:', data.error);
      }
    } catch (err) {
      console.error('Network error during resend');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      setErrors({ forgotPasswordEmail: "Email is required" });
      return;
    }
    
    if (!validateEmail(forgotPasswordEmail)) {
      setErrors({ forgotPasswordEmail: "Please enter a valid email address" });
      return;
    }
    
    setForgotPasswordLoading(true);
    setErrors({});
    
    try {
      const result = await forgotPassword(forgotPasswordEmail);
      
      if (result.error) {
        setErrors({ forgotPasswordEmail: result.error });
      } else {
        if ((result as any).resetLink) {
          setErrors({ forgotPasswordEmail: `Your reset link: ${(result as any).resetLink}` });
        } else {
          setPasswordResetEmail(forgotPasswordEmail);
          setCurrentStep("reset-pin-entry");
        }
      }
    } catch (err) {
      setErrors({ forgotPasswordEmail: "An unexpected error occurred. Please try again." });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const renderLoginForm = () => (
    <div>
      <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#a0fab2] mb-2">
            Sign in to your account
          </h2>
          <p className="text-white/80 text-sm">
            Welcome back! Please enter your details
          </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-primary/10 border border-red-200 rounded-lg flex items-center gap-2 text-primary-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="login-method" className="text-sm font-medium text-white mb-1 block">
            Login Method
          </Label>
          <Select 
            value={formData.loginMethod} 
            onValueChange={(value: any) => handleInputChange('loginMethod', value)}
          >
            <SelectTrigger className="h-12 text-base rounded-lg border-white/20 bg-white/10 text-white" data-testid="select-login-method">
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
                  <User className="h-4 w-4" />
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
          <Input
            id="login-identifier"
            type={formData.loginMethod === 'email' ? 'email' : 'text'}
            value={formData.loginIdentifier}
            onChange={(e) => handleInputChange('loginIdentifier', e.target.value)}
            placeholder={`Enter your ${formData.loginMethod === 'email' ? 'email address' : formData.loginMethod === 'phone' ? 'phone number' : 'ID number'}`}
            className="h-12 text-base rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
            data-testid="input-login-identifier"
          />
          {errors.loginIdentifier && <p className="text-sm text-primary-500 mt-1">{errors.loginIdentifier}</p>}
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
              className="h-12 text-base pr-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
              data-testid="input-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent text-white/70 transition-all duration-300"
              onClick={() => setShowPassword(!showPassword)}
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-sm text-primary-500 mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep("forgot-password")}
              className="text-sm font-medium ml-auto transition-all duration-300 text-white/80 hover:text-white"
              data-testid="button-forgot-password"
            >
              Forgot password?
            </button>
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

        <Button
          type="button"
          className="w-full h-11 font-medium rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#0c332c', color: '#a0fab2' }}
          disabled={loading}
          onClick={() => setCurrentStep("register")}
          data-testid="button-blue-action"
        >
          <User className="h-4 w-4 mr-2" />
          Join as Student
        </Button>

        <Button
          type="button"
          onClick={() => setCurrentStep("register-teacher")}
          className="w-full h-11 font-medium rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#0c332c', color: '#a0fab2' }}
          data-testid="link-teacher-signup"
        >
          <GraduationCap className="h-4 w-4 mr-2" />
          Apply to teach
        </Button>

        <Button
          type="button"
          className="w-full h-11 font-medium rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#0c332c', color: '#a0fab2' }}
          disabled={loading}
          onClick={() => {
            onNavigate?.('freelancer-signup-basic');
          }}
          data-testid="button-join-freelancer"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Join as Freelancer
        </Button>
      </form>
    </div>
  );

  const renderRegisterForm = () => {
    const gradeNum = parseInt(formData.grade) || 0;
    const isElementary = gradeNum >= 1 && gradeNum <= 7;
    const isHighSchool = gradeNum >= 8 && gradeNum <= 12;
    const planTier = isElementary ? 'Elementary (Grades 1-7)' : isHighSchool ? 'High School (Grades 8-12)' : 'College/University';
    const planPrice = isElementary ? '$5.99/month' : isHighSchool ? '$9.99/month' : '$99.00/month';

    return (
      <div>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#a0fab2] mb-2">
            Create your student account
          </h2>
          <p className="text-white/80 text-sm">
            Join thousands of learners and unlock your potential
          </p>
        </div>
        {errors.general && (
          <div className="mb-4 p-3 bg-primary/10 border border-red-200 rounded-lg flex items-center gap-2 text-primary-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Section A - Account Details */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-white mb-3">Account Details</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-white mb-1 block">
                  Full Name*
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Keith Williams"
                    className="h-12 text-base pl-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                    data-testid="input-name"
                  />
                </div>
                {errors.name && <p className="text-sm text-primary-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-white mb-1 block">
                  Email*
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="e.g. student@example.com"
                    className="h-12 text-base pl-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                    data-testid="input-email"
                  />
                </div>
                {errors.email && <p className="text-sm text-primary-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="register-password" className="text-sm font-medium text-white mb-1 block">
                  Password*
                </Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="h-12 text-base pr-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                    data-testid="input-register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-all duration-300"
                    data-testid="button-toggle-register-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/60 mt-1">Minimum 6-8 characters</p>
                {errors.password && <p className="text-sm text-primary-500 mt-1">{errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium text-white mb-1 block">
                  Confirm Password*
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="h-12 text-base rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                  data-testid="input-confirm-password"
                />
                {errors.confirmPassword && <p className="text-sm text-primary-500 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Section B - Contact & WhatsApp */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-white mb-3">Contact & WhatsApp</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-white mb-1 block">
                  Phone Number (WhatsApp)*
                </Label>
                <PhoneNumberInput
                  value={formData.phoneNumber}
                  onChange={(value: any) => handleInputChange('phoneNumber', value)}
                  placeholder="e.g. +15551234567"
                  data-testid="input-phone"
                />
                <p className="text-xs text-white/60 mt-1">
                  This number is used for login codes, homework and learning updates on WhatsApp.
                </p>
                {errors.phoneNumber && <p className="text-sm text-primary-500 mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <Label htmlFor="age" className="text-sm font-medium text-white mb-1 block">
                  Age*
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="age"
                    type="number"
                    min="5"
                    max="100"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="e.g. 14"
                    className="h-12 text-base pl-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                    data-testid="input-age"
                  />
                </div>
                {errors.age && <p className="text-sm text-primary-500 mt-1">{errors.age}</p>}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="whatsapp-opt-in"
                  checked={formData.whatsappOptIn}
                  onChange={(e) => handleCheckboxChange('whatsappOptIn', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-purple-500"
                  data-testid="checkbox-whatsapp-opt-in"
                />
                <Label htmlFor="whatsapp-opt-in" className="text-sm text-white cursor-pointer">
                  I agree to receive learning reminders and homework on WhatsApp
                </Label>
              </div>
            </div>
          </div>

          {/* Section C - Education Info */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-white mb-3">Education Info</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="country" className="text-sm font-medium text-white mb-1 block">
                  Country*
                </Label>
                <Select 
                  value={formData.country_id} 
                  onValueChange={(value: any) => handleInputChange('country_id', value)}
                >
                  <SelectTrigger className="h-12 text-base rounded-lg border-white/20 bg-white/10 text-white" data-testid="select-country">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.id} value={country.id.toString()}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country_id && <p className="text-sm text-primary-500 mt-1">{errors.country_id}</p>}
              </div>

              <div>
                <Label htmlFor="education-system" className="text-sm font-medium text-white mb-1 block">
                  Education System*
                </Label>
                <Select 
                  value={formData.educationSystem} 
                  onValueChange={(value: any) => handleInputChange('educationSystem', value)}
                >
                  <SelectTrigger className="h-12 text-base rounded-lg border-white/20 bg-white/10 text-white" data-testid="select-education-system">
                    <SelectValue placeholder="Select your education system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cambridge" data-testid="option-cambridge">Cambridge</SelectItem>
                    <SelectItem value="American" data-testid="option-american">American</SelectItem>
                    <SelectItem value="Local" data-testid="option-local">Local / National</SelectItem>
                    <SelectItem value="Other" data-testid="option-other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.educationSystem && <p className="text-sm text-primary-500 mt-1">{errors.educationSystem}</p>}
              </div>

              <div>
                <Label htmlFor="grade" className="text-sm font-medium text-white mb-1 block">
                  Current Grade / Level*
                </Label>
                <Select 
                  value={formData.grade} 
                  onValueChange={(value: any) => handleInputChange('grade', value)}
                >
                  <SelectTrigger className="h-12 text-base rounded-lg border-white/20 bg-white/10 text-white" data-testid="select-grade">
                    <SelectValue placeholder="Select your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCountryGrades.map(grade => (
                      <SelectItem key={grade.value} value={grade.value.toString()}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grade && <p className="text-sm text-primary-500 mt-1">{errors.grade}</p>}
              </div>

              <div>
                <Label htmlFor="school-name" className="text-sm font-medium text-white mb-1 block">
                  School Name (optional)
                </Label>
                <Input
                  id="school-name"
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange('schoolName', e.target.value)}
                  placeholder="e.g. Greenwood High School"
                  className="h-12 text-base rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                  data-testid="input-school-name"
                />
              </div>
            </div>
          </div>

          {/* Section D - Learning Preferences */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-white mb-3">Learning Preferences (optional)</h3>
            <Label className="text-sm text-white mb-2 block">What do you want to focus on?</Label>
            
            <div className="grid grid-cols-2 gap-2">
              {['Mathematics', 'English / Languages', 'Science', 'Exam preparation', 'Homework help', 'University / career prep'].map((pref) => (
                <div key={pref} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={`pref-${pref}`}
                    checked={formData.learningPreferences.includes(pref)}
                    onChange={() => handleLearningPreferenceToggle(pref)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-purple-500"
                    data-testid={`checkbox-pref-${pref.toLowerCase().replace(/[\s\/]/g, '-')}`}
                  />
                  <Label htmlFor={`pref-${pref}`} className="text-sm text-white cursor-pointer">
                    {pref}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Section E - Plan Preview */}
          {formData.grade && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">Your Plan</h3>
              <p className="text-sm text-purple-800 mb-2">
                <strong>Your level:</strong> {planTier}
              </p>
              <div className="text-sm text-primary space-y-1">
                <p className="font-medium">You can:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Access 1 free lesson per subject</li>
                  <li>Upgrade to the {isElementary ? 'Elementary' : isHighSchool ? 'High School' : 'College & University'} Plan ({planPrice}) to unlock all lessons, homework and certificates</li>
                </ul>
              </div>
            </div>
          )}

          {/* Section F - Agreements */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="agree-terms"
                checked={formData.agreeToTerms}
                onChange={(e) => handleCheckboxChange('agreeToTerms', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
                data-testid="checkbox-agree-terms"
              />
              <Label htmlFor="agree-terms" className="text-sm text-white cursor-pointer">
                I agree to EduFiliova's <button type="button" onClick={() => setActiveLegalModal('terms')} className="hover:underline" style={{ color: '#a0fab2' }} data-testid="link-student-terms">Student Terms of Use</button> and <button type="button" onClick={() => setActiveLegalModal('privacy')} className="hover:underline transition-all duration-300" style={{ color: '#a0fab2' }} data-testid="link-privacy-policy">Privacy Policy</button>
              </Label>
            </div>
            {errors.agreeToTerms && <p className="text-sm text-primary-500">{errors.agreeToTerms}</p>}

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirm-student"
                checked={formData.confirmStudent}
                onChange={(e) => handleCheckboxChange('confirmStudent', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
                data-testid="checkbox-confirm-student"
              />
              <Label htmlFor="confirm-student" className="text-sm text-white cursor-pointer">
                I confirm I am a student or signing up on behalf of a student
              </Label>
            </div>
            {errors.confirmStudent && <p className="text-sm text-primary-500">{errors.confirmStudent}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-medium rounded-lg border-0"
            style={{ backgroundColor: '#A0FAB2', color: '#1f2937' }}
            disabled={loading}
            data-testid="button-register"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <div className="text-center text-sm text-white">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setCurrentStep("login")}
              className="text-white hover:text-white/80 font-medium transition-all duration-300"
              data-testid="link-login"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderTeacherRegistrationForm = () => (
    <div className="-mx-4 -my-6">
      <TeacherSignupBasic />
    </div>
  );

  const renderOldTeacherRegistrationForm_DEPRECATED = () => (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-[#a0fab2] mb-2">
          Apply to Teach
        </h2>
        <p className="text-white/80 text-sm">
          Join our community of verified educators.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-primary/10 border border-red-200 rounded-lg flex items-center gap-2 text-primary-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleTeacherRegistration} className="space-y-4">
        <div>
          <Label htmlFor="teacher-name" className="text-sm font-medium text-white mb-1 block">
            Full Name*
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="teacher-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              className="h-12 text-base pl-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
              data-testid="input-teacher-name"
            />
          </div>
          {errors.name && <p className="text-sm text-primary-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="teacher-email" className="text-sm font-medium text-white mb-1 block">
            Email Address*
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="teacher-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              className="h-12 text-base pl-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
              data-testid="input-teacher-email"
            />
          </div>
          {errors.email && <p className="text-sm text-primary-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="teacher-phone" className="text-sm font-medium text-white mb-1 block">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="teacher-phone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="Enter your phone number"
              className="h-12 text-base pl-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
              data-testid="input-teacher-phone"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="teacher-password" className="text-sm font-medium text-white mb-1 block">
            Password*
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="teacher-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a password"
              className="h-12 text-base pl-10 pr-10 rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
              data-testid="input-teacher-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-all duration-300"
              data-testid="button-toggle-teacher-password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-primary-500 mt-1">{errors.password}</p>}
        </div>

        <div>
          <Label htmlFor="confirm-teacher-password" className="text-sm font-medium text-white mb-1 block">
            Confirm Password*
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="confirm-teacher-password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              className="h-12 text-base pl-10 rounded-lg border-gray-300"
              data-testid="input-confirm-teacher-password"
            />
          </div>
          {errors.confirmPassword && <p className="text-sm text-primary-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium rounded-lg border-0"
          style={{ backgroundColor: '#A0FAB2', color: '#1f2937' }}
          disabled={loading}
          data-testid="button-submit-teacher-application"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting application...
            </>
          ) : (
            <>
              <User className="h-4 w-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>

        <div className="text-center text-sm text-white">
          <button
            type="button"
            onClick={() => setCurrentStep("login")}
            className="text-white hover:text-white font-medium flex items-center justify-center gap-1 transition-all duration-300"
            data-testid="link-back-to-login"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </button>
        </div>
      </form>
    </div>
  );


  const handleVerifyCodeComplete = async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setErrors({});
    setVerificationError(false);

    try {
      const endpoint = userTypeState === "teacher" ? '/api/teacher/verify' : '/api/auth/verify-registration';
      
      const response = await fetch(resolveApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          emailCode: code,
          contactType: 'email'
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        if (userTypeState === "teacher") {
          if (onNavigate) {
            onNavigate('/teacher-signup');
          } else {
            window.location.href = '/teacher-signup';
          }
          return;
        } else {
          const loginResult = await signIn(formData.email, formData.password);
          if (loginResult.error) {
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('profile', JSON.stringify(result.profile));
            window.location.reload();
          } else {
            if (onLogin) {
              onLogin();
            }
          }
        }
      } else {
        setVerificationError(true);
        setVerificationCode("");
        setErrors({ code: result.error || "Invalid verification code" });
      }
    } catch (error: any) {
      setVerificationError(true);
      setVerificationCode("");
      setErrors({ code: error.message || "Invalid verification code" });
    } finally {
      setLoading(false);
    }
  };

  const renderEmailVerificationForm = () => (
    <div className="flex items-center justify-center py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#e0f2fe' }}>
            <Mail className="h-10 w-10" style={{ color: '#0C332C' }} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
            <p className="text-white">
              We sent a 6-digit code to<br />
              <span className="font-medium text-white">{formData.email}</span>
            </p>
          </div>

          {errors.code && (
            <div className="p-3 bg-primary/10 border border-red-200 rounded-xl text-primary-700 text-sm">
              {errors.code}
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
              onComplete={handleVerifyCodeComplete}
              disabled={loading}
              error={verificationError}
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-white">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <p className="text-sm text-white/60">
              Didn't receive the code?{" "}
              <button
                onClick={() => handleResendCode("email")}
                disabled={resendCooldown > 0 || loading}
                className="font-medium hover:underline disabled:opacity-50 transition-all duration-300"
                style={{ color: '#0C332C' }}
                data-testid="button-resend-email"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </p>
            
            <button
              onClick={() => {
                setCurrentStep("register");
                setVerificationCode("");
                setErrors({});
              }}
              className="flex items-center justify-center gap-2 text-sm text-white hover:text-white mx-auto transition-all duration-300"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign Up
            </button>
          </div>

          <p className="text-xs text-white/70 pt-4">
            Code expires in 10 minutes
          </p>
        </div>
      </div>
    </div>
  );

  const handlePhoneVerifyComplete = async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setErrors({});
    setVerificationError(false);

    try {
      const response = await fetch(resolveApiUrl('/api/auth/verify-registration'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactInfo: formData.phoneNumber,
          code: code,
          contactType: 'phone'
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        const loginResult = await signIn(formData.email, formData.password);
        if (loginResult.error) {
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('profile', JSON.stringify(result.profile));
          window.location.reload();
        } else {
          if (onLogin) {
            onLogin();
          }
        }
      } else {
        setVerificationError(true);
        setVerificationCode("");
        setErrors({ code: result.error || "Invalid verification code" });
      }
    } catch (error: any) {
      setVerificationError(true);
      setVerificationCode("");
      setErrors({ code: error.message || "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneVerificationForm = () => (
    <div className="flex items-center justify-center py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#dcfce7' }}>
            <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#a0fab2]">Check Your WhatsApp</h1>
            <p className="text-white">
              We sent a 6-digit code to<br />
              <span className="font-medium text-white">{formData.phoneNumber}</span>
            </p>
          </div>

          {errors.code && (
            <div className="p-3 bg-primary/10 border border-red-200 rounded-xl text-primary-700 text-sm">
              {errors.code}
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
              onComplete={handlePhoneVerifyComplete}
              disabled={loading}
              error={verificationError}
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-white">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <p className="text-sm text-white/60">
              Didn't receive the code?{" "}
            <button
              onClick={() => handleResendCode("phone")}
              disabled={resendCooldown > 0 || loading}
              className="font-medium hover:underline disabled:opacity-50 text-white transition-all duration-300"
              data-testid="button-resend-phone"
            >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </p>
            
            <button
              onClick={() => {
                setCurrentStep("register");
                setVerificationCode("");
                setErrors({});
              }}
              className="flex items-center justify-center gap-2 text-sm text-white hover:text-white mx-auto transition-all duration-300"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign Up
            </button>
          </div>

          <p className="text-xs text-white/70 pt-4">
            Code expires in 10 minutes
          </p>
        </div>
      </div>
    </div>
  );

  const renderForgotPasswordForm = () => (
    <div>
          <h2 className="text-2xl font-bold text-[#a0fab2] mb-2">
            Reset Password
          </h2>
          <p className="text-white/80 text-sm">
            Enter your email to receive a reset link.
          </p>

      {errors.forgotPasswordEmail && (
        <div className="mb-4 p-3 bg-primary/10 border border-red-200 rounded-lg flex items-center gap-2 text-primary-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errors.forgotPasswordEmail}</span>
        </div>
      )}

      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div>
          <Label htmlFor="forgot-password-email" className="text-sm font-medium text-white mb-1 block">
            Email Address*
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="forgot-password-email"
              type="email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-12 text-base pl-10 rounded-lg border-gray-300 text-gray-900"
              data-testid="input-forgot-password-email"
            />
          </div>
          {errors.forgotPasswordEmail && <p className="text-sm text-primary-500 mt-1">{errors.forgotPasswordEmail}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium rounded-lg border-0"
          style={{ backgroundColor: '#A0FAB2', color: '#1f2937' }}
          disabled={forgotPasswordLoading}
          data-testid="button-send-reset-link"
        >
          {forgotPasswordLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>

        <div className="text-center text-sm text-white">
            <button
              type="button"
              onClick={() => setCurrentStep("login")}
              className="text-[#a0fab2] hover:text-[#a0fab2]/80 font-medium flex items-center justify-center gap-1 transition-all duration-300"
              data-testid="link-back-to-login-from-forgot"
            >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </button>
        </div>
      </form>
    </div>
  );

  const renderResetPinEntryForm = () => (
    <div>
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Enter Reset Code
        </h2>
        <p className="text-white text-sm">
          We've sent a 6-digit code to <strong>{passwordResetEmail}</strong>
        </p>
      </div>

      <form className="space-y-4">
        <div>
          <Label htmlFor="reset-pin" className="text-sm font-medium text-white mb-1 block">
            Reset Code*
          </Label>
          <Input
            id="reset-pin"
            type="text"
            value={resetPin}
            onChange={(e) => setResetPin(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code"
            className="h-12 text-base text-center text-lg tracking-wider rounded-lg border-gray-300"
            maxLength={6}
            data-testid="input-reset-pin"
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-medium">Also check WhatsApp</p>
              <p className="text-xs text-green-600">We've also sent the code to your WhatsApp number if linked to your account</p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium rounded-lg"
          style={{ backgroundColor: '#A0FAB2', color: '#1f2937' }}
          disabled={loading || resetPin.length !== 6}
          data-testid="button-verify-reset-pin"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying Code...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>

        <div className="text-center text-sm text-white">
          <p className="mb-2">Didn't receive the code?</p>
          <button
            type="button"
            onClick={() => setCurrentStep("forgot-password")}
            className="text-primary hover:text-purple-800 font-medium transition-all duration-300"
            data-testid="button-resend-reset-code"
          >
            Request new code
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setCurrentStep("login")}
            className="text-primary hover:text-purple-800 font-medium text-sm flex items-center justify-center gap-1 mx-auto transition-all duration-300"
            data-testid="link-back-to-login-from-reset"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </button>
        </div>
      </form>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "login":
        return renderLoginForm();
      case "register":
        return renderRegisterForm();
      case "verify-email":
        return renderEmailVerificationForm();
      case "verify-phone":
        return renderPhoneVerificationForm();
      case "forgot-password":
        return renderForgotPasswordForm();
      case "reset-pin-entry":
        return renderResetPinEntryForm();
      default:
        return renderLoginForm();
    }
  };

  if (currentStep === "register-teacher") {
    return <TeacherSignupBasic onNavigate={onNavigate} />;
  }

  return (
    <AuthLayout
      onNavigate={onNavigate}
      showNotNow={!hideSkipButton && currentStep !== "verify-email" && currentStep !== "verify-phone"}
      notNowText="Not now"
    >
      {renderCurrentStep()}
      
      {/* Student Terms Modal */}
      <Dialog open={activeLegalModal === 'terms'} onOpenChange={(open) => !open && setActiveLegalModal(null)}>
        <DialogContent className="max-w-full md:max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 md:p-6 pb-3 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-lg md:text-xl font-bold text-white">Student Terms of Use</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-70px)] px-4 md:px-6">
            <div className="py-4 space-y-4">
              {[
                {
                  title: "Eligibility",
                  content: ["To register as a student on EduFiliova, you confirm that:", "• You are at least 13 years old, or", "• You have permission from a parent/guardian if under local age requirements", "• The information you provide is accurate and true", "EduFiliova may request verification if needed."]
                },
                {
                  title: "Account Registration",
                  content: ["When creating an account, you must provide:", "• Your full name", "• A valid email address", "• A valid phone number (for login and WhatsApp features)", "• Your grade level and education system", "You are responsible for keeping your login credentials secure.", "Do not share your password or access with anyone else."]
                },
                {
                  title: "Student Responsibilities",
                  content: ["As a student using EduFiliova, you agree to:", "• Act respectfully towards teachers, staff, and other students", "• Use the learning content only for personal education", "• Not upload or share violent, hateful, or inappropriate content", "• Not cheat, bypass assessments, or misuse platform tools", "• Not attempt to access features you have not subscribed to", "• Follow all instructions provided by teachers and administrators", "Violation may lead to suspension or permanent removal of your account."]
                },
                {
                  title: "Use of Learning Content",
                  content: ["All lessons, notes, videos, quizzes, documents, and materials on EduFiliova are:", "• Copyrighted", "• Owned by EduFiliova or the original creators (teachers or freelancers)", "• Provided for personal learning only", "You agree not to:", "• Copy, download, or redistribute paid content illegally", "• Share your access with others", "• Record or leak live classes without permission", "• Sell or upload our content to other platforms", "EduFiliova may take legal action against unauthorized distribution."]
                },
                {
                  title: "Subscriptions & Payments",
                  content: ["Student plans (Elementary, High School, or other available plans):", "• Provide access to premium lessons, quizzes, certificates, live classes, and other features", "• Are billed on a recurring monthly basis until cancelled", "• Are non-refundable unless required by law", "If your plan expires:", "• Access will switch to Free Mode", "• Only 1 free lesson per subject will be available", "• You cannot join live classes or message teachers", "Pricing may change in the future, and you will be notified."]
                },
                {
                  title: "Free Mode Limitations",
                  content: ["If you do not have an active subscription, you understand that you will:", "• Access only a limited number of lessons", "• Not participate in live classes", "• Not message teachers", "• Not post in community forums (Grade 8–12)", "• Not receive daily homework or reminders on WhatsApp", "• Only download limited free shop items", "• See locked content requiring subscription", "These limitations ensure fairness and platform security."]
                },
                {
                  title: "Certificates",
                  content: ["Certificates are issued automatically upon completing:", "• All lessons in a course", "• All required assessments (where applicable)", "Certificates may display:", "• Your name", "• Course title", "• Completion date", "• Verification code", "You may share your certificate publicly but must not modify or falsify it."]
                },
                {
                  title: "WhatsApp Learning Services",
                  content: ["By opting in, you agree to receive:", "• Homework reminders", "• Learning updates", "• Registration or account notices", "• Course notifications", "• Payment confirmations", "You can turn these off at any time by replying STOP on WhatsApp or disabling the switch in your dashboard."]
                },
                {
                  title: "Communication Rules",
                  content: ["Students must use messaging responsibly:", "• No spam", "• No bullying or harassment", "• No sharing inappropriate media", "• No asking teachers for personal contact or private payment", "EduFiliova monitors safety and may restrict messaging if rules are broken."]
                },
                {
                  title: "Data & Privacy",
                  content: ["EduFiliova collects necessary information to provide educational services, such as:", "• Login details", "• Progress and grades", "• Payment history", "Refer to our Privacy Policy for full details on data handling."]
                },
                {
                  title: "Account Suspension",
                  content: ["Your account may be suspended or terminated if you:", "• Violate these terms", "• Engage in harmful behavior", "• Share copyrighted content illegally", "• Impersonate others or commit fraud", "EduFiliova reserves the right to investigate and take action."]
                },
                {
                  title: "Changes to Terms",
                  content: ["EduFiliova may update these Terms of Service at any time.", "We will notify you of changes via email or by posting the new Terms on our platform.", "Your continued use of the platform after changes means you accept the new Terms.", "If you disagree with changes, you may close your account."]
                }
            ].map((section, idx) => (
              <div key={idx} className="border-white/20 pl-3 py-2">
                  <h3 className="text-sm font-semibold text-white mb-1">{section.title}</h3>
                  <div className="text-sm text-white space-y-1">
                    {section.content.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>
              ))}
              <div className="border-t pt-4 text-center text-sm text-white">
                <p>Questions? Email us at <a href="mailto:support@edufiliova.com" className="text-primary hover:underline transition-all duration-300">support@edufiliova.com</a></p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={activeLegalModal === 'privacy'} onOpenChange={(open) => !open && setActiveLegalModal(null)}>
        <DialogContent className="max-w-full md:max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 md:p-6 pb-3 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-lg md:text-xl font-bold text-white">Privacy Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-70px)] px-4 md:px-6">
            <div className="py-4 space-y-4">
              <div className="bg-primary/10 border-white/20 p-3 rounded">
                <h3 className="text-sm font-semibold text-white mb-1">Your Privacy Matters to Us</h3>
                <p className="text-sm text-white">At EduFiliova, we're committed to protecting your privacy and ensuring your personal information is secure. This policy explains how we collect, use, and protect your data.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">1. Information We Collect</h3>
                <div className="grid gap-3 text-sm">
                  <div className="bg-primary/10 p-3 rounded border border-orange-200">
                    <h4 className="text-sm font-medium text-white mb-1">Account Information</h4>
                    <ul className="text-white space-y-1 text-sm">
                      <li>• Name and email address</li>
                      <li>• Profile photo (optional)</li>
                      <li>• Educational background</li>
                      <li>• Learning preferences</li>
                    </ul>
                  </div>
                  <div className="bg-primary/10 p-3 rounded border border-orange-200">
                    <h4 className="text-sm font-medium text-white mb-1">Learning Data</h4>
                    <ul className="text-white space-y-1 text-sm">
                      <li>• Course progress and scores</li>
                      <li>• Study time and patterns</li>
                      <li>• Quiz and test results</li>
                      <li>• Certificate achievements</li>
                    </ul>
                  </div>
                  <div className="bg-primary/10 p-3 rounded border border-orange-200">
                    <h4 className="text-sm font-medium text-white mb-1">Technical Information</h4>
                    <ul className="text-white space-y-1 text-sm">
                      <li>• Device type and browser</li>
                      <li>• IP address and location</li>
                      <li>• Platform usage analytics</li>
                      <li>• Error logs for improvement</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">2. How We Use Your Information</h3>
                <div className="text-sm text-white space-y-1">
                  <p>• Provide and improve our educational services</p>
                  <p>• Personalize your learning experience</p>
                  <p>• Process payments and subscriptions</p>
                  <p>• Send important updates and notifications</p>
                  <p>• Analyze platform usage to improve features</p>
                  <p>• Ensure platform security and prevent fraud</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">3. Data Sharing</h3>
                <div className="text-sm text-white space-y-1">
                  <p>We do not sell your personal information. We may share data with:</p>
                  <p>• Teachers (for course delivery and grading)</p>
                  <p>• Payment processors (Stripe, PayPal) for transactions</p>
                  <p>• Analytics services (to improve the platform)</p>
                  <p>• Legal authorities (if required by law)</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">4. Data Security</h3>
                <div className="text-sm text-white space-y-1">
                  <p>We protect your data using:</p>
                  <p>• Encrypted connections (HTTPS/SSL)</p>
                  <p>• Secure password hashing</p>
                  <p>• Regular security audits</p>
                  <p>• Access controls and monitoring</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">5. Your Rights</h3>
                <div className="text-sm text-white space-y-1">
                  <p>You have the right to:</p>
                  <p>• Access your personal data</p>
                  <p>• Request data correction or deletion</p>
                  <p>• Opt out of marketing communications</p>
                  <p>• Export your learning data</p>
                  <p>• Close your account at any time</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">6. Cookies</h3>
                <p className="text-sm text-white">We use cookies to improve your experience, remember your preferences, and analyze platform usage. You can control cookie settings in your browser.</p>
              </div>

              <div className="border-t pt-4 text-center text-sm text-white">
                <p>Privacy questions? Email us at <a href="mailto:privacy@edufiliova.com" className="text-primary hover:underline transition-all duration-300">privacy@edufiliova.com</a></p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
};

export default AuthModern;
