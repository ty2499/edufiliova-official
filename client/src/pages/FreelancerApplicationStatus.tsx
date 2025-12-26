import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { openExternalUrl } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { getFriendlyErrorMessage, logError } from '@/lib/error-handler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { useState } from "react";

export default function FreelancerApplicationStatus() {
  const [, navigate] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const applicationId = urlParams.get("id");
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");

  const { data: application, isLoading, refetch } = useQuery<any>({
    queryKey: [`/api/freelancer/applications/status/${applicationId}`],
    queryFn: () => apiRequest(`/api/freelancer/applications/status/${applicationId}`),
    enabled: !!applicationId,
  });

  const handleResubmit = async () => {
    if (!application?.id) {
      setResubmitError("Please refresh and try again.");
      return;
    }
    setIsResubmitting(true);
    setResubmitError("");
    try {
      const data = await apiRequest(`/api/freelancer/applications/${application.id}/resubmit`, {
        method: 'POST',
      });
      if (data.success) {
        refetch();
      } else {
        const friendlyError = getFriendlyErrorMessage(data.error);
        setResubmitError(friendlyError);
        logError(data.error, 'FreelancerApplicationStatus.handleResubmit');
      }
    } catch (error: any) {
      const friendlyError = getFriendlyErrorMessage(error);
      setResubmitError(friendlyError);
      logError(error, 'FreelancerApplicationStatus.handleResubmit');
    } finally {
      setIsResubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find your application. Please check the link or contact support.
            </p>
            <Button onClick={() => window.location.href = "/"} data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-primary";
      case "under_review":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckmarkIcon size="md" variant="success" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-primary-500" />;
      case "under_review":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const isApproved = application?.status === "approved";
  const isRejected = application?.status === "rejected";
  const isPending = application?.status === "pending" || application?.status === "under_review";

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {isApproved && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6 text-center">
              <CheckmarkIcon size="2xl" variant="success" className="mx-auto mb-4 h-16 w-16" />
              <h2 className="text-2xl font-bold mb-4">Welcome to EduFiliova Freelancer Dashboard</h2>
              <p className="text-muted-foreground mb-4">
                Congratulations! Your freelancer application has been approved.
              </p>
              <Button
                onClick={() => navigate("/?page=freelancer-dashboard")}
                className="bg-primary hover:bg-primary/80 hover:shadow-xl hover:scale-105 transition-all duration-300"
                data-testid="button-go-dashboard"
              >
                Access Freelancer Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {isPending && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Application Received</h2>
              <p className="text-muted-foreground mb-2">
                Thank you for applying to become a freelancer on EduFiliova.
              </p>
              <p className="text-muted-foreground mb-2">
                Our team will review your information and portfolio within 2-3 business days.
              </p>
              <p className="text-muted-foreground">
                You will receive an email and in-app notification once your profile is approved.
              </p>
            </CardContent>
          </Card>
        )}

        {isRejected && (
          <Card className="mb-6" style={{ backgroundColor: '#a0fab2', borderColor: '#2f5a4e' }}>
            <CardContent className="pt-6 text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#2f5a4e' }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#2f5a4e' }}>Application Not Approved</h2>
              <p className="mb-4" style={{ color: '#2f5a4e' }}>
                We're sorry, but your application was not approved at this time.
              </p>
              {application.adminNotes && (
                <div className="bg-white/50 p-4 rounded-lg text-left mb-4 border" style={{ borderColor: '#2f5a4e' }}>
                  <p className="font-medium mb-2" style={{ color: '#2f5a4e' }}>Feedback:</p>
                  <p className="text-sm" style={{ color: '#2f5a4e' }}>{application.adminNotes}</p>
                </div>
              )}
              {resubmitError && (
                <div className="bg-red-100 border border-red-300 p-3 rounded-lg text-left mb-4">
                  <p className="text-sm text-red-700">{resubmitError}</p>
                </div>
              )}
              <Button
                onClick={handleResubmit}
                disabled={isResubmitting}
                style={{ backgroundColor: '#2f5a4e' }}
                className="hover:opacity-90"
                data-testid="button-resubmit"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isResubmitting ? "Resubmitting..." : "Resubmit Application"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Freelancer Application Status</CardTitle>
            <CardDescription>Track your application progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full ${getStatusColor("pending")} flex items-center justify-center text-white font-bold`}>
                  ✓
                </div>
                <div className="flex-1">
                  <p className="font-medium">Application Sent</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="ml-5 h-12 w-0.5 bg-border"></div>

              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full ${application.status !== "pending" ? getStatusColor("under_review") : "bg-gray-300"} flex items-center justify-center text-white font-bold`}>
                  {application.status !== "pending" ? "..." : ""}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Under Review</p>
                  <p className="text-sm text-muted-foreground">
                    {application.status !== "pending" ? "Being reviewed by our team" : "Waiting for review"}
                  </p>
                </div>
              </div>

              <div className="ml-5 h-12 w-0.5 bg-border"></div>

              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full ${isApproved || isRejected ? getStatusColor(application.status) : "bg-gray-300"} flex items-center justify-center text-white font-bold`}>
                  {isApproved && "✓"}
                  {isRejected && "✗"}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{isApproved ? "Approved" : isRejected ? "Rejected" : "Decision Pending"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isApproved && "You can now access the freelancer dashboard"}
                    {isRejected && "Application was not approved"}
                    {isPending && "Waiting for final decision"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Submission Details</CardTitle>
            <CardDescription>Read-only view of your application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Personal Information</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Full Name:</dt>
                <dd data-testid="text-full-name">{application.fullName || 'N/A'}</dd>
                <dt className="text-muted-foreground">Display Name:</dt>
                <dd data-testid="text-display-name">{application.displayName || 'N/A'}</dd>
                <dt className="text-muted-foreground">Email:</dt>
                <dd data-testid="text-email">{application.email || 'N/A'}</dd>
                <dt className="text-muted-foreground">Phone:</dt>
                <dd data-testid="text-phone">{application.phoneNumber || 'N/A'}</dd>
                <dt className="text-muted-foreground">Country:</dt>
                <dd data-testid="text-country">{application.country || 'N/A'}</dd>
              </dl>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Freelancer Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Primary Category:</p>
                  <p data-testid="text-category">{application.primaryCategory || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tagline:</p>
                  <p data-testid="text-tagline">{application.tagline || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">About:</p>
                  <p data-testid="text-about">{application.about || 'N/A'}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Application Status</h3>
              <div className="flex items-center gap-2">
                {getStatusIcon(application?.status || 'pending')}
                <Badge className={getStatusColor(application?.status || 'pending')} data-testid="badge-status">
                  {(application?.status || 'pending').replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              {application.approvedAt && (
                <p className="text-sm text-muted-foreground mt-2">
                  Reviewed on: {new Date(application.approvedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
