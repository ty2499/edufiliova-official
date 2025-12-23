import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileCheck, Mail, RefreshCw, XCircle } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import { useState } from 'react';

interface TeacherDashboardPendingProps {
  onNavigate?: (page: string, transition?: string) => void;
}

export function TeacherDashboardPending({ onNavigate }: TeacherDashboardPendingProps) {
  const { teacherApplicationStatus, logout } = useAuth();
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");

  const handleResubmit = async () => {
    if (!teacherApplicationStatus?.id) return;
    setIsResubmitting(true);
    setResubmitError("");
    try {
      const response = await fetch(`/api/teacher-applications/${teacherApplicationStatus.id}/resubmit`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        setResubmitError(data.error || "Failed to resubmit application");
      } else {
        window.location.reload();
      }
    } catch (error) {
      setResubmitError("An error occurred while resubmitting");
    } finally {
      setIsResubmitting(false);
    }
  };

  const getStatusInfo = () => {
    const status = teacherApplicationStatus?.status;
    
    switch (status) {
      case 'pending':
        return {
          title: 'Application Submitted',
          description: 'Your application is awaiting initial review',
          badgeText: 'Pending Review',
          badgeVariant: 'secondary' as const,
          progressValue: 33,
          icon: Clock,
          iconColor: 'text-yellow-500'
        };
      case 'under_review':
        return {
          title: 'Documents Under Review',
          description: 'Our team is currently reviewing your application',
          badgeText: 'Under Review',
          badgeVariant: 'default' as const,
          progressValue: 66,
          icon: FileCheck,
          iconColor: 'text-blue-500'
        };
      case 'rejected':
        return {
          title: 'Application Not Approved',
          description: 'Unfortunately, your application was not approved at this time',
          badgeText: 'Not Approved',
          badgeVariant: 'destructive' as const,
          progressValue: 100,
          icon: Mail,
          iconColor: 'text-primary'
        };
      default:
        return {
          title: 'Application Submitted',
          description: 'Your application is being processed',
          badgeText: 'Processing',
          badgeVariant: 'secondary' as const,
          progressValue: 33,
          icon: Clock,
          iconColor: 'text-gray-500'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  EduFiliova Teacher Portal
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Application Status
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={async () => {
                await logout();
                onNavigate?.('home', 'fade');
              }}
              data-testid="button-logout"
            >
              Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {teacherApplicationStatus?.status === 'rejected' && (
            <Card className="mb-6" style={{ backgroundColor: '#a0fab2', borderColor: '#2f5a4e' }}>
              <CardContent className="pt-6 text-center">
                <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#2f5a4e' }} />
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#2f5a4e' }}>Application Not Approved</h2>
                <p className="mb-4" style={{ color: '#2f5a4e' }}>
                  We're sorry, but your application was not approved at this time.
                </p>
                {teacherApplicationStatus?.adminNotes && (
                  <div className="bg-white/50 p-4 rounded-lg text-left mb-4 border" style={{ borderColor: '#2f5a4e' }}>
                    <p className="font-medium mb-2" style={{ color: '#2f5a4e' }}>Feedback:</p>
                    <p className="text-sm" style={{ color: '#2f5a4e' }}>{teacherApplicationStatus.adminNotes}</p>
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
                  className="hover:opacity-90 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isResubmitting ? "Resubmitting..." : "Resubmit Application"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">
                    {statusInfo.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {statusInfo.description}
                  </CardDescription>
                </div>
                <Badge variant={statusInfo.badgeVariant} data-testid="badge-status">
                  {statusInfo.badgeText}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Application Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {statusInfo.progressValue}%
                  </span>
                </div>
                <Progress value={statusInfo.progressValue} data-testid="progress-application" />
              </div>

              {/* Timeline */}
              <div className="space-y-4 pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Application Timeline</h3>
                
                <div className="space-y-3">
                  {/* Step 1: Submitted */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full p-1" style={{ backgroundColor: '#2f5a4e' }}>
                        <CheckmarkIcon size="sm" variant="default" className="bg-transparent text-white" />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-gray-900 dark:text-white">Application Submitted</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {teacherApplicationStatus?.submittedAt 
                          ? new Date(teacherApplicationStatus.submittedAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Recently'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full p-1" style={{
                        backgroundColor: teacherApplicationStatus?.status === 'under_review' || teacherApplicationStatus?.status === 'approved' || teacherApplicationStatus?.status === 'rejected'
                          ? '#2f5a4e'
                          : '#d1d5db'
                      }}>
                        <CheckmarkIcon size="sm" variant="default" className="bg-transparent text-white" />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1" />
                    </div>
                    <div className="pb-4">
                      <p className={`font-medium ${
                        teacherApplicationStatus?.status === 'under_review' || teacherApplicationStatus?.status === 'approved' || teacherApplicationStatus?.status === 'rejected'
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        Documents Under Review
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {teacherApplicationStatus?.status === 'under_review' || teacherApplicationStatus?.status === 'approved' || teacherApplicationStatus?.status === 'rejected'
                          ? 'In progress'
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Decision */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full p-1" style={{
                        backgroundColor: teacherApplicationStatus?.status === 'approved'
                          ? '#2f5a4e'
                          : teacherApplicationStatus?.status === 'rejected'
                          ? '#2f5a4e'
                          : '#d1d5db'
                      }}>
                        <CheckmarkIcon size="sm" variant="default" className="bg-transparent text-white" />
                      </div>
                    </div>
                    <div>
                      <p className={`font-medium ${
                        teacherApplicationStatus?.status === 'approved' || teacherApplicationStatus?.status === 'rejected'
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {teacherApplicationStatus?.status === 'approved' 
                          ? 'Application Approved' 
                          : teacherApplicationStatus?.status === 'rejected'
                          ? 'Application Decision'
                          : 'Final Decision'
                        }
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {teacherApplicationStatus?.status === 'approved' || teacherApplicationStatus?.status === 'rejected'
                          ? teacherApplicationStatus?.reviewedAt
                            ? new Date(teacherApplicationStatus.reviewedAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'Recently'
                          : 'Waiting for review completion'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#2f5a4e' }} />
                <div className="space-y-1">
                  <p className="font-medium" style={{ color: '#2f5a4e' }}>
                    Email Notification
                  </p>
                  <p className="text-sm" style={{ color: '#2f5a4e' }}>
                    You will receive an email notification once your application has been reviewed and approved. 
                    This typically takes 2-3 business days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          {teacherApplicationStatus?.status === 'rejected' && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    What's Next?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    If you believe this decision was made in error or would like to reapply, please contact our support team 
                    at <a href="mailto:support@edufiliova.com" className="hover:underline" style={{ color: '#2f5a4e' }}>support@edufiliova.com</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
