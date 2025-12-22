import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { resolveApiUrl } from "@/lib/queryClient";

export default function TeacherVerifyEmail() {
  const [, navigate] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    applicationId?: string;
  } | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setVerificationResult({
          success: false,
          message: "No verification token provided"
        });
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(resolveApiUrl(`/api/teacher-applications/verify?token=${token}`));
        const data = await response.json();

        if (response.ok && data.success) {
          setVerificationResult({
            success: true,
            message: data.message,
            applicationId: data.applicationId
          });

          setTimeout(() => {
            navigate(`/teacher-signup?applicationId=${data.applicationId}`);
          }, 2000);
        } else {
          setVerificationResult({
            success: false,
            message: data.error || "Verification failed"
          });
        }
      } catch (error) {
        setVerificationResult({
          success: false,
          message: "Failed to verify email. Please try again."
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              Verifying your email address...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verifying ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Verifying your email...</p>
              </div>
            ) : verificationResult ? (
              <div className="flex flex-col items-center justify-center py-8">
                {verificationResult.success ? (
                  <>
                    <CheckmarkIcon size="2xl" variant="success" className="mb-4" />
                    <p className="text-lg font-semibold text-center mb-2">Email Verified Successfully!</p>
                    <p className="text-muted-foreground text-center mb-4">
                      {verificationResult.message}
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      Redirecting you to complete your application...
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-destructive mb-4" />
                    <p className="text-lg font-semibold text-center mb-2">Verification Failed</p>
                    <p className="text-muted-foreground text-center mb-4">
                      {verificationResult.message}
                    </p>
                    <Button
                      onClick={() => navigate("/teacher-signup-basic")}
                      data-testid="button-back"
                    >
                      Back to Sign Up
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
