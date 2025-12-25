import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Loader2, Eye, EyeOff, Mail, Phone, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import TeacherLogin from "./TeacherLogin";
import VerificationCodeInput from "@/components/auth/VerificationCodeInput";
import AuthLayout from "@/components/auth/AuthLayout";
import { resolveApiUrl } from "@/lib/queryClient";

const basicSignupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  displayName: z.string().min(2, "Display name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  country: z.string().min(1, "Country is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type BasicSignupForm = z.infer<typeof basicSignupSchema>;

type AuthView = 'choice' | 'signup' | 'login' | 'verify';
type SignupMethod = 'email' | 'phone';

interface TeacherSignupBasicProps {
  onNavigate?: (page: string) => void;
}

export default function TeacherSignupBasic({ onNavigate }: TeacherSignupBasicProps = {}) {
  const [, navigate] = useLocation();
  const [currentView, setCurrentView] = useState<AuthView>('choice');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('email');
  const [verificationSent, setVerificationSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else if (page === 'home') {
      navigate('/');
    } else {
      navigate(`/${page}`);
    }
  };
  const [verificationError, setVerificationError] = useState(false);

  const { data: countries } = useQuery<Array<{id: number, name: string}>>({
    queryKey: ['/api/countries'],
  });

  const form = useForm<BasicSignupForm>({
    resolver: zodResolver(basicSignupSchema),
    defaultValues: {
      fullName: "",
      displayName: "",
      email: "",
      phoneNumber: "",
      country: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BasicSignupForm) => {
      const response = await fetch(resolveApiUrl("/api/teacher-applications/initiate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          displayName: data.displayName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          country: data.country,
          password: data.password,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Unable to submit your application. Please try again.";
        try {
          const error = await response.json();
          if (error.error) {
            errorMessage = error.error;
          }
        } catch {
          errorMessage = "Unable to connect to our servers. Please check your connection and try again.";
        }
        throw new Error(errorMessage);
      }

      try {
        return await response.json();
      } catch {
        throw new Error("Something went wrong. Please try again.");
      }
    },
    onSuccess: (data) => {
      setUserEmail(data.email);
      setVerificationSent(true);
      setCurrentView('verify');
      setErrorMessage("");
    },
    onError: (error: Error) => {
      const message = error.message;
      if (message.includes("JSON") || message.includes("DOCTYPE") || message.includes("Unexpected token")) {
        setErrorMessage("Unable to submit your application right now. Please try again in a moment.");
      } else {
        setErrorMessage(message);
      }
    },
  });

  const onSubmit = (data: BasicSignupForm) => {
    submitMutation.mutate(data);
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setErrorMessage("");
    setResendSuccess(false);
    try {
      const response = await fetch(resolveApiUrl("/api/teacher-applications/resend-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Unable to resend code. Please try again.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to resend verification code");
      }

      setResendSuccess(true);
      setVerificationCode("");
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error: any) {
      const message = error.message;
      if (message.includes("JSON") || message.includes("DOCTYPE") || message.includes("Unexpected token")) {
        setErrorMessage("Unable to resend code. Please try again in a moment.");
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (code.length !== 6 || isVerifying) return;
    
    setIsVerifying(true);
    setErrorMessage("");
    setVerificationError(false);
    
    try {
      const response = await fetch(resolveApiUrl("/api/teacher-applications/verify-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Unable to verify code. Please try again.");
      }

      if (!response.ok) {
        setVerificationError(true);
        setVerificationCode("");
        throw new Error(data.error || "Invalid verification code");
      }

      if (data.applicationId) {
        if (onNavigate) {
          onNavigate('teacher-signup');
        }
        navigate(`/?page=teacher-signup&applicationId=${data.applicationId}`, { replace: true });
      } else {
        if (onNavigate) {
          onNavigate('teacher-signup');
        }
        navigate('/?page=teacher-signup', { replace: true });
      }
    } catch (error: any) {
      const message = error.message;
      if (message.includes("JSON") || message.includes("DOCTYPE") || message.includes("Unexpected token")) {
        setErrorMessage("Unable to verify code. Please try again in a moment.");
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Switch to login view if requested
  if (currentView === 'login') {
    return <AuthModern onLogin={() => {}} onNavigate={(page) => {
      if (page === 'signup') setCurrentView('choice');
    }} userType="teacher" />;
  }

  // Verification Screen
  if (currentView === 'verify' || verificationSent) {
    return (
      <AuthLayout 
        variant="teacher" 
        heroTitle="Almost there!"
        heroSubtitle="Just one more step to start your teaching journey."
        onNavigate={handleNavigate}
        showNotNow={false}
        showBackButton={true}
        onBack={() => {
          setVerificationSent(false);
          setCurrentView('signup');
          setVerificationCode("");
          setErrorMessage("");
        }}
      >
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-[#0C332C]/10">
            <Mail className="h-10 w-10 text-foreground" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Enter code</h2>
            <p className="text-gray-500 text-sm">
              We sent a verification code to your email<br />
              <span className="font-medium text-gray-800">{userEmail}</span>
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-primary/10 border border-red-200 rounded-xl text-primary-600 text-sm">
              {errorMessage}
            </div>
          )}
          
          {resendSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
              A new verification code has been sent to your email.
            </div>
          )}

          <div className="py-6">
            <VerificationCodeInput
              value={verificationCode}
              onChange={(code) => {
                setVerificationCode(code);
                setVerificationError(false);
                setErrorMessage("");
              }}
              onComplete={handleVerifyCode}
              disabled={isVerifying}
              error={verificationError}
              darkMode={false}
            />
          </div>

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </div>
          )}

          <Button
            onClick={() => handleVerifyCode(verificationCode)}
            disabled={verificationCode.length !== 6 || isVerifying}
            className="w-full h-12 bg-[#A0FAB2] hover:bg-[#b5e02c] text-black font-semibold rounded-xl text-base transition-all duration-300"
            data-testid="button-continue"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Continue"
            )}
          </Button>

          <div className="pt-4 space-y-3">
            <p className="text-sm text-gray-500">
              You didn't receive any code?{" "}
              <button
                onClick={handleResendCode}
                disabled={isResending}
                className="font-medium text-foreground hover:underline disabled:opacity-50 transition-all duration-300"
                data-testid="button-resend-code"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Method Choice Screen (like reference design)
  if (currentView === 'choice') {
    return (
      <AuthLayout 
        variant="teacher" 
        heroTitle="Welcome to\nEduFiliova"
        heroSubtitle="Your gateway to learning, teaching, and creating amazing things."
        onNavigate={handleNavigate}
      >
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#a0fab2' }}>Get started</h2>
            <p className="text-white text-sm">
              Register as a teacher and create amazing<br />
              learning experiences for students.
            </p>
          </div>

          {/* Sign up method buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setSignupMethod('email');
                setCurrentView('signup');
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#0C332C] text-white font-medium rounded-xl"
              data-testid="button-signup-email"
            >
              <Mail className="h-5 w-5" />
              Sign up with email
            </button>

            <button
              onClick={() => {
                setSignupMethod('phone');
                setCurrentView('signup');
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#A0FAB2] font-medium rounded-xl"
              style={{ color: '#0C332C' }}
              data-testid="button-signup-phone"
            >
              <Phone className="h-5 w-5" />
              Sign up with phone number
            </button>
          </div>

          <div className="pt-6 text-center">
            <p className="text-sm text-white">
              Already have an account?{" "}
              <button 
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-white hover:text-white/80 font-medium transition-all duration-300"
                style={{ color: '#a0fab2' }}
                data-testid="link-login"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Signup Form Screen
  return (
    <AuthLayout 
      variant="teacher"
      heroTitle="Create your\naccount"
      heroSubtitle="Fill in your details to join our teaching community."
      onNavigate={handleNavigate}
      showBackButton={true}
      onBack={() => setCurrentView('choice')}
    >
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#a0fab2' }}>
            {signupMethod === 'email' ? 'Sign up with email' : 'Sign up with phone'}
          </h2>
          <p className="text-gray-500 text-sm">
            Enter your details to create your account
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-primary/10 border border-red-200 rounded-xl text-primary-600 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-gray-700 text-sm">Full Name</Label>
            <Input
              id="fullName"
              placeholder="e.g. Purity Johns"
              className="h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-[#0C332C] focus:ring-[#0C332C]/20"
              data-testid="input-full-name"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-primary-500 mt-1">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-gray-700 text-sm">Display Name</Label>
            <Input
              id="displayName"
              placeholder="e.g. Mrs. P Johns"
              className="h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-[#0C332C] focus:ring-[#0C332C]/20"
              data-testid="input-display-name"
              {...form.register("displayName")}
            />
            {form.formState.errors.displayName && (
              <p className="text-sm text-primary-500 mt-1">{form.formState.errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-gray-700 text-sm">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. teacher@example.com"
              className="h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-[#0C332C] focus:ring-[#0C332C]/20"
              data-testid="input-email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-primary-500 mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber" className="text-gray-700 text-sm">Phone Number</Label>
            <div className="[&_input]:bg-gray-50 [&_input]:border-gray-200 [&_input]:text-gray-900 [&_input]:placeholder:text-gray-400 [&_input]:rounded-xl [&_input]:h-12 [&_button]:bg-gray-50 [&_button]:border-gray-200 [&_button]:text-gray-700 [&_button]:h-12">
              <PhoneNumberInput
                value={form.watch("phoneNumber") || ""}
                onChange={(value) => form.setValue("phoneNumber", value)}
                data-testid="input-phone"
              />
            </div>
            {form.formState.errors.phoneNumber && (
              <p className="text-sm text-primary-500 mt-1">{form.formState.errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-gray-700 text-sm">Country</Label>
            <Select
              value={form.watch("country")}
              onValueChange={(value) => form.setValue("country", value)}
            >
              <SelectTrigger 
                className="h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:border-[#0C332C] focus:ring-[#0C332C]/20"
                data-testid="select-country"
              >
                <SelectValue placeholder="Select your country" className="text-gray-400" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {countries?.map((country) => (
                  <SelectItem 
                    key={country.id} 
                    value={country.name}
                    className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 transition-all duration-300"
                  >
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.country && (
              <p className="text-sm text-primary-500 mt-1">{form.formState.errors.country.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                className="h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl pr-12 focus:border-[#0C332C] focus:ring-[#0C332C]/20"
                data-testid="input-password"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-primary-500 mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-gray-700 text-sm">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                className="h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl pr-12 focus:border-[#0C332C] focus:ring-[#0C332C]/20"
                data-testid="input-confirm-password"
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300"
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-primary-500 mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#A0FAB2] text-black font-semibold rounded-xl text-base mt-6"
            disabled={submitMutation.isPending}
            data-testid="button-submit"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account?{" "}
            <button 
              type="button"
              onClick={() => setCurrentView('login')}
              className="text-foreground font-semibold hover:underline transition-all duration-300"
              data-testid="link-login-form"
            >
              Sign in here
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
