import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

export default function FreelancerVerifyEmail() {
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
      const token = params.get("token");

      if (!token) {
        setVerificationResult({
          success: false,
          message: "No verification token provided",
        });
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/freelancer/applications/verify?token=${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setVerificationResult({
            success: true,
            message: "Email verified successfully! Redirecting to application form...",
            applicationId: data.applicationId,
          });

          setTimeout(() => {
            navigate(`/?page=freelancer-signup&applicationId=${data.applicationId}`);
          }, 2000);
        } else {
          setVerificationResult({
            success: false,
            message: data.error || "Verification failed",
          });
        }
      } catch (error) {
        setVerificationResult({
          success: false,
          message: "An error occurred during verification",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              {verifying ? "Verifying your email..." : "Verification complete"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verifying ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {verificationResult?.success ? (
                    <CheckmarkIcon size="xl" variant="success" />
                  ) : (
                    <XCircle className="w-8 h-8 text-destructive" />
                  )}
                  <p className="text-lg">
                    {verificationResult?.message}
                  </p>
                </div>

                {!verificationResult?.success && (
                  <Button
                    onClick={() => navigate("/?page=freelancer-signup-basic")}
                    data-testid="button-back"
                  >
                    Back to Signup
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
