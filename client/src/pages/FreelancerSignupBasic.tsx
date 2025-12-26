import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Loader2, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthModern from "./AuthModern";
import VerificationCodeInput from "@/components/auth/VerificationCodeInput";
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

type AuthView = 'signup' | 'login';

interface FreelancerSignupBasicProps {
  onNavigate?: (page: string) => void;
}

export default function FreelancerSignupBasic({ onNavigate }: FreelancerSignupBasicProps = {}) {
  const [, navigate] = useLocation();
  const [currentView, setCurrentView] = useState<AuthView>('signup');
  const [verificationSent, setVerificationSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
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
      const response = await fetch(resolveApiUrl("/api/freelancer/applications/initiate"), {
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
      const response = await fetch(resolveApiUrl("/api/freelancer/applications/resend-code"), {
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
    if (code.length !== 6) return;
    
    setIsVerifying(true);
    setErrorMessage("");
    setVerificationError(false);
    
    try {
      const response = await fetch(resolveApiUrl("/api/freelancer/applications/verify-code"), {
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
          onNavigate('freelancer-signup');
        }
        navigate(`/?page=freelancer-signup&applicationId=${data.applicationId}`, { replace: true });
      } else {
        if (onNavigate) {
          onNavigate('freelancer-signup');
        }
        navigate('/?page=freelancer-signup', { replace: true });
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
      if (page === 'signup') setCurrentView('signup');
    }} />;
  }

  if (verificationSent) {
    return (
      <AuthLayout showNotNow={false}>
        <div className="flex items-center justify-center py-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#a0fab2' }}>
                <Mail className="h-10 w-10" style={{ color: '#0C332C' }} />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold" style={{ color: '#a0fab2' }}>Verify Your Email</h1>
                <p className="text-white/80">
                  We sent a 6-digit code to<br />
                  <span className="font-medium" style={{ color: '#a0fab2' }}>{userEmail}</span>
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-primary/10 border border-red-200 rounded-xl text-primary-700 text-sm">
                  {errorMessage}
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
                    setErrorMessage("");
                  }}
                  onComplete={handleVerifyCode}
                  disabled={isVerifying}
                  error={verificationError}
                />
              </div>

              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-white/80">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <p className="text-sm text-white/70">
                  Didn't receive the code?{" "}
                  <button
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="font-medium hover:underline disabled:opacity-50 transition-all duration-300"
                    style={{ color: '#a0fab2' }}
                    data-testid="button-resend-code"
                  >
                    {isResending ? "Sending..." : "Resend Code"}
                  </button>
                </p>
                
                <button
                  onClick={() => {
                    setVerificationSent(false);
                    setVerificationCode("");
                    setErrorMessage("");
                  }}
                  className="flex items-center justify-center gap-2 text-sm text-white/70 hover:text-white mx-auto transition-all duration-300"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Signup Form
                </button>
              </div>

              <p className="text-xs text-white/50 pt-4">
                Code expires in 24 hours
              </p>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div>
        <div className="mb-8">
          <h1 className="font-bold mb-2 text-[20px] text-center" style={{ color: '#a0fab2' }}>Apply as a Freelancer on EduFiliova</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              {errorMessage && (
                <div className="p-3 bg-primary/10 border border-red-200 rounded-lg text-primary-700 text-sm">
                  {errorMessage}
                </div>
              )}
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-white mb-1 block">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. John Doe"
                  className="h-12 text-base rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                  data-testid="input-full-name"
                  {...form.register("fullName")}
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="displayName" className="text-sm font-medium text-white mb-1 block">Display Name (Shown to Clients) *</Label>
                <Input
                  id="displayName"
                  placeholder="e.g. John D."
                  className="h-12 text-base rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                  data-testid="input-display-name"
                  {...form.register("displayName")}
                />
                {form.formState.errors.displayName && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-white mb-1 block">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. freelancer@example.com"
                  className="h-12 text-base rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white"
                  data-testid="input-email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-white mb-1 block">Phone Number *</Label>
                <div className="[&_input]:h-12 [&_input]:text-base [&_input]:rounded-lg [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:placeholder:text-base [&_input]:text-white [&_button]:h-12 [&_button]:rounded-lg [&_button]:border-white/20 [&_button]:bg-white/10 [&_button]:text-white">
                  <PhoneNumberInput
                    value={form.watch("phoneNumber") || ""}
                    onChange={(value) => form.setValue("phoneNumber", value)}
                    data-testid="input-phone"
                  />
                </div>
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="country" className="text-sm font-medium text-white mb-1 block">Country of Residence *</Label>
                <Select
                  value={form.watch("country")}
                  onValueChange={(value) => form.setValue("country", value)}
                >
                  <SelectTrigger className="h-12 text-base rounded-lg border-white/20 bg-white/10 text-white" data-testid="select-country">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map((country) => (
                      <SelectItem key={country.id} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.country && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.country.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-white mb-1 block">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    className="h-12 text-base rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white pr-12"
                    data-testid="input-password"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-all duration-300"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-white mb-1 block">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    className="h-12 text-base rounded-lg border-white/20 bg-white/10 placeholder:text-base text-white pr-12"
                    data-testid="input-confirm-password"
                    {...form.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-all duration-300"
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full font-semibold hover:opacity-100"
                style={{ backgroundColor: '#a0fab2', color: '#0c332c' }}
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-sm text-white text-center mt-4">
                Already have an account?{" "}
                <button 
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="font-medium hover:underline transition-all duration-300"
                  style={{ color: '#a0fab2' }}
                >
                  Sign in here
                </button>
              </p>
        </form>
      </div>
    </AuthLayout>
  );
}
