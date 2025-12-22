import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { openExternalUrl } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, XCircle, FileText, ArrowLeft } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

export default function TeacherApplicationStatus() {
  const [, navigate] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const applicationId = urlParams.get("id");

  const { data: application, isLoading } = useQuery<any>({
    queryKey: [`/api/teacher-applications/${applicationId}`],
    enabled: !!applicationId,
  });

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
            <Button onClick={() => navigate("/")} data-testid="button-back-home">
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
        return "bg-red-500";
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
        return <XCircle className="w-5 h-5 text-red-500" />;
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
              <h2 className="text-2xl font-bold mb-4">Welcome to EduFiliova Teaching Dashboard</h2>
              <p className="text-muted-foreground mb-4">
                Congratulations! Your teacher application has been approved.
              </p>
              <Button
                onClick={() => navigate("/?page=teacher-dashboard")}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-go-dashboard"
              >
                Access Teaching Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {isPending && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Application Received</h2>
              <p className="text-muted-foreground mb-2">
                Thank you for applying to become a teacher on EduFiliova.
              </p>
              <p className="text-muted-foreground mb-2">
                Our team will review your information within 24-72 hours.
              </p>
              <p className="text-muted-foreground">
                You will receive an email and in-app notification once your profile is approved.
              </p>
            </CardContent>
          </Card>
        )}

        {isRejected && (
          <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Application Not Approved</h2>
              <p className="text-muted-foreground mb-4">
                We're sorry, but your application was not approved at this time.
              </p>
              {application.adminNotes && (
                <div className="bg-background p-4 rounded-lg text-left">
                  <p className="font-medium mb-2">Feedback:</p>
                  <p className="text-sm text-muted-foreground">{application.adminNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Teacher Application Status</CardTitle>
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
                    {new Date(application.submittedAt).toLocaleDateString()}
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
                    {isApproved && "You can now access the teaching dashboard"}
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
              <h3 className="font-medium mb-2">Teaching Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {application.teachingCategories && application.teachingCategories.length > 0 ? (
                      application.teachingCategories.map((cat: string) => (
                        <Badge key={cat} variant="secondary" data-testid={`badge-category-${cat}`}>
                          {cat}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Grade Levels:</p>
                  <div className="flex flex-wrap gap-2">
                    {application.gradeLevels && application.gradeLevels.length > 0 ? (
                      application.gradeLevels.map((level: string) => (
                        <Badge key={level} variant="secondary" data-testid={`badge-grade-${level}`}>
                          {level}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Qualifications & Experience</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Highest Qualification:</dt>
                <dd data-testid="text-qualification">{application.highestQualification || 'N/A'}</dd>
                <dt className="text-muted-foreground">Years of Experience:</dt>
                <dd data-testid="text-experience">{application.yearsOfExperience || 'N/A'}</dd>
              </dl>
              <div className="mt-2">
                <p className="text-muted-foreground text-sm mb-1">Experience Summary:</p>
                <p className="text-sm" data-testid="text-experience-summary">{application.experienceSummary || 'N/A'}</p>
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
              {application.reviewedAt && (
                <p className="text-sm text-muted-foreground mt-2">
                  Reviewed on: {new Date(application.reviewedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            onClick={() => openExternalUrl('https://edufiliova.com')}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-explore-website"
          >
            Explore Website
          </Button>
        </div>
      </div>
    </div>
  );
}
