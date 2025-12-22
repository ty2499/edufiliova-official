import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { resolveApiUrl } from "@/lib/queryClient";

export default function VerifyTeacherEmail() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!email || !code) {
      setErrorMessage("Please enter both your email and verification code");
      return;
    }

    if (code.length !== 6) {
      setErrorMessage("Verification code must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(resolveApiUrl("/api/teacher-applications/verify-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setTimeout(() => {
        navigate(`/teacher-apply?applicationId=${data.applicationId}`);
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              Check your email for the verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  data-testid="input-code"
                  className="text-2xl text-center tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-verify"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate("/teacher-apply/signup")}
                  data-testid="link-back"
                >
                  Back to Sign Up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
