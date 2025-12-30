import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  GraduationCap,
  Briefcase,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Clock,
  X
} from "lucide-react";

interface TeacherLoginProps {
  onNavigate?: (page: string) => void;
  onLogin?: () => void;
}

type TeacherStep = "login" | "apply" | "verify" | "status";

import { SocialAuthButtons } from "@/components/SocialAuthButtons";

const TeacherLogin = ({ onNavigate, onLogin }: TeacherLoginProps) => {
  const { signIn } = useAuth();
  const [currentStep, setCurrentStep] = useState<TeacherStep>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  
  const [formData, setFormData] = useState({
    // Login data
    email: "",
    password: "",
    
    // Application data
    fullName: "",
    phoneNumber: "",
    qualifications: "",
    experience: "",
    portfolioLinks: "",
    certifications: "",
    country: "",
    city: "",
    availableHours: "",
    hourlyRate: "",
    bio: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applicationStatus, setApplicationStatus] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === "login") {
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.password) newErrors.password = "Password is required";
    } else if (currentStep === "apply") {
      if (!formData.fullName) newErrors.fullName = "Full name is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.qualifications) newErrors.qualifications = "Qualifications are required";
      if (!formData.experience) newErrors.experience = "Experience is required";
      if (!formData.availableHours) newErrors.availableHours = "Available hours are required";
      if (!formData.country) newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result.error) {
        setErrors({ general: result.error });
      } else {
        console.log('Teacher login successful, calling onLogin callback');
        if (onLogin) {
          onLogin();
        }
      }
    } catch (error: any) {
      setErrors({ general: error.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const portfolioArray = formData.portfolioLinks ? 
        formData.portfolioLinks.split('\n').filter(link => link.trim()) : [];
      const certificationArray = formData.certifications ? 
        formData.certifications.split('\n').filter(cert => cert.trim()) : [];

      const response = await fetch('/api/teacher/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          portfolioLinks: portfolioArray,
          certifications: certificationArray
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setCurrentStep("verify");
      } else {
        setErrors({ general: result.error || "Application submission failed" });
      }
    } catch (error: any) {
      setErrors({ general: error.message || "Application submission failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setErrors({ code: "Please enter the verification code" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/teacher/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setCurrentStep("status");
        checkApplicationStatus();
      } else {
        setErrors({ code: result.error || "Invalid verification code" });
      }
    } catch (error: any) {
      setErrors({ code: error.message || "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(`/api/teacher/status/${encodeURIComponent(formData.email)}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setApplicationStatus(result.application);
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
    }
  };

  const renderLoginForm = () => (
    <Card className="w-full max-w-md mx-auto shadow-none border-0 bg-transparent">
      <CardHeader className="text-center pt-8 pb-6">
        <CardTitle className="text-2xl font-bold text-gray-900">Teacher Login</CardTitle>
        <CardDescription>
          Sign in to your verified teacher account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTeacherLogin} className="space-y-4">
          {errors.general && (
            <div className="bg-primary/10 border border-red-200 rounded-md p-3 flex items-center gap-2 text-primary-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="teacher-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="teacher-email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`pl-10 ${errors.email ? "border-primary" : ""}`}
                disabled={loading}
                data-testid="input-teacher-email"
              />
            </div>
            {errors.email && <p className="text-sm text-primary-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher-password">Password</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="teacher-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? "border-primary" : ""}`}
                disabled={loading}
                data-testid="input-teacher-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" transition-all duration-300
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-primary-600">{errors.password}</p>}
          </div>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => onNavigate?.('signup')}
              className="text-sm"
              data-testid="link-teacher-apply"
            >
              Don't have a teacher account? Apply here
            </Button>
          </div>

          <SocialAuthButtons 
            onSuccess={onLogin || (() => {})} 
            disabled={loading}
          />
        </form>
      </CardContent>
    </Card>
  );

  const renderApplicationForm = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-none border-0 bg-transparent">
      <CardHeader className="text-center pt-8 pb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep("login")}
          className="absolute left-6 top-6"
          data-testid="button-back-to-login"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <CardTitle className="text-2xl font-bold text-gray-900">Apply to Teach</CardTitle>
        <CardDescription>
          Join our community of verified educators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTeacherApplication} className="space-y-6">
          {errors.general && (
            <div className="bg-primary/10 border border-red-200 rounded-md p-3 flex items-center gap-2 text-primary-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={`pl-10 ${errors.fullName ? "border-primary" : ""}`}
                  disabled={loading}
                  data-testid="input-full-name"
                />
              </div>
              {errors.fullName && <p className="text-sm text-primary-600">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apply-email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="apply-email"
                  type="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 ${errors.email ? "border-primary" : ""}`}
                  disabled={loading}
                  data-testid="input-apply-email"
                />
              </div>
              {errors.email && <p className="text-sm text-primary-600">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Your phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  data-testid="input-phone-number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="country"
                  type="text"
                  placeholder="Your country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className={`pl-10 ${errors.country ? "border-primary" : ""}`}
                  disabled={loading}
                  data-testid="input-country"
                />
              </div>
              {errors.country && <p className="text-sm text-primary-600">{errors.country}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qualifications">Qualifications *</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="qualifications"
                placeholder="Describe your educational qualifications and degrees..."
                value={formData.qualifications}
                onChange={(e) => handleInputChange("qualifications", e.target.value)}
                className={`pl-10 min-h-[100px] ${errors.qualifications ? "border-primary" : ""}`}
                disabled={loading}
                data-testid="textarea-qualifications"
              />
            </div>
            {errors.qualifications && <p className="text-sm text-primary-600">{errors.qualifications}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Teaching Experience *</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="experience"
                placeholder="Describe your teaching experience and background..."
                value={formData.experience}
                onChange={(e) => handleInputChange("experience", e.target.value)}
                className={`pl-10 min-h-[100px] ${errors.experience ? "border-primary" : ""}`}
                disabled={loading}
                data-testid="textarea-experience"
              />
            </div>
            {errors.experience && <p className="text-sm text-primary-600">{errors.experience}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="availableHours">Available Hours *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="availableHours"
                placeholder="e.g., Monday-Friday 9AM-5PM, Weekends available"
                value={formData.availableHours}
                onChange={(e) => handleInputChange("availableHours", e.target.value)}
                className={`pl-10 min-h-[80px] ${errors.availableHours ? "border-primary" : ""}`}
                disabled={loading}
                data-testid="textarea-available-hours"
              />
            </div>
            {errors.availableHours && <p className="text-sm text-primary-600">{errors.availableHours}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                placeholder="Your city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                disabled={loading}
                data-testid="input-city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                placeholder="25"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                disabled={loading}
                data-testid="input-hourly-rate"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolioLinks">Portfolio Links</Label>
            <Textarea
              id="portfolioLinks"
              placeholder="List your portfolio links, one per line..."
              value={formData.portfolioLinks}
              onChange={(e) => handleInputChange("portfolioLinks", e.target.value)}
              className="min-h-[80px]"
              disabled={loading}
              data-testid="textarea-portfolio-links"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications</Label>
            <Textarea
              id="certifications"
              placeholder="List your certifications, one per line..."
              value={formData.certifications}
              onChange={(e) => handleInputChange("certifications", e.target.value)}
              className="min-h-[80px]"
              disabled={loading}
              data-testid="textarea-certifications"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your teaching philosophy..."
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              className="min-h-[100px]"
              disabled={loading}
              data-testid="textarea-bio"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="button-submit-application"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              "Submit Teacher Application"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderVerificationForm = () => (
    <Card className="w-full max-w-md mx-auto shadow-none border-0 bg-transparent">
      <CardHeader className="text-center pt-8 pb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
        <CardDescription>
          We've sent a verification link to<br />
          <strong className="text-foreground">{formData.email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.code && (
          <div className="bg-primary/10 border border-red-200 rounded-md p-3 flex items-center gap-2 text-primary-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{errors.code}</span>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3 text-left">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Click the link in your email to verify your application</p>
              <p className="text-green-600 text-xs">The link will expire in 24 hours</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Didn't receive the email?</p>
              <p className="text-xs">Check your spam folder or contact support at support@edufiliova.com</p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setCurrentStep("apply")}
          className="w-full"
          data-testid="button-back"
        >
          Back to Application Form
        </Button>
      </CardContent>
    </Card>
  );

  const renderStatusPage = () => (
    <Card className="w-full max-w-md mx-auto shadow-none border-0 bg-transparent">
      <CardHeader className="text-center pt-8 pb-6">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Application Verified!</CardTitle>
        <CardDescription>
          Your teacher application has been successfully verified
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applicationStatus && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Application Status: {applicationStatus.status}</span>
              </div>
              <p className="text-sm text-green-600">
                Your application is now under review. You'll receive an email within 24-48 hours with the next steps.
              </p>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Once approved, you'll be able to log in and start teaching!
            </p>
            <Button
              variant="outline"
              onClick={() => setCurrentStep("login")}
              className="w-full"
              data-testid="button-back-to-login-final"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50 flex items-center justify-center p-4">
      <div className={`w-full ${currentStep === "apply" ? "max-w-2xl" : "max-w-md"}`}>
        {/* Logo - centered above the form with more top spacing */}
        <div className="flex justify-center mb-12 mt-8">
          <Logo 
            size="md" 
            variant="default" 
            type="teacher"
            onClick={() => onNavigate?.("home")}
            className="cursor-pointer"
            data-testid="auth-logo"
          />
        </div>
        
        {/* Form content */}
        <div>
          {currentStep === "login" && renderLoginForm()}
          {currentStep === "apply" && renderApplicationForm()}
          {currentStep === "verify" && renderVerificationForm()}
          {currentStep === "status" && renderStatusPage()}
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
