import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Award, ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { useState } from 'react';
import { ShareCertificateDialog } from '@/components/certificates/ShareCertificateDialog';

interface Certificate {
  id: string;
  courseTitle: string;
  courseDescription: string | null;
  studentName: string;
  completionDate: string;
  issueDate: string;
  verificationCode: string;
  certificateUrl: string | null;
  finalScore: number | null;
  instructorName: string | null;
}

export default function MyCertificatesPage() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ['/api/certificates/my-certificates'],
  });

  const handleShare = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShareDialogOpen(true);
  };

  const handleDownload = (certificateId: string) => {
    window.open(`/api/certificates/download/${certificateId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your certificates...</p>
          </div>
        </div>
      </div>
    );
  }

  const noCertificates = !certificates || certificates.length === 0;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-blue-600" data-testid="icon-certificates" />
          <h1 className="text-3xl font-bold" data-testid="heading-my-certificates">My Certificates</h1>
        </div>
        <p className="text-muted-foreground" data-testid="text-certificates-description">
          All your course completion certificates in one place
        </p>
      </div>

      {noCertificates ? (
        <Card data-testid="card-no-certificates">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Complete courses to earn certificates. Once you finish a course with 100% progress, 
              your certificate will be automatically generated!
            </p>
            <Button asChild data-testid="button-browse-courses">
              <a href="/courses">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Courses
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {certificates.map((certificate, index) => (
            <Card 
              key={certificate.id}
              className="border-2 hover:shadow-lg transition-shadow" transition-all duration-300
              data-testid={`card-certificate-${certificate.id}`}
            >
              {/* Certificate Visual Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-center gap-3">
                  <CheckmarkIcon size="2xl" variant="success" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">Certificate of Completion</h3>
                    <p className="text-sm text-blue-100">Issued via Certifier.io</p>
                  </div>
                </div>
              </div>

              <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1" data-testid={`text-course-title-${certificate.id}`}>
                        {certificate.courseTitle}
                      </CardTitle>
                      <CardDescription data-testid={`text-student-name-${certificate.id}`}>
                        Awarded to {certificate.studentName}
                      </CardDescription>
                    </div>
                    <Award className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Certificate Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Completed: {new Date(certificate.completionDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      {certificate.finalScore && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Award className="w-4 h-4" />
                          <span>Score: {certificate.finalScore}%</span>
                        </div>
                      )}

                      {certificate.instructorName && (
                        <div className="text-muted-foreground">
                          Instructor: {certificate.instructorName}
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Code: <span className="font-mono">{certificate.verificationCode}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        onClick={() => handleDownload(certificate.id)}
                        size="sm"
                        data-testid={`button-download-${certificate.id}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      
                      <Button
                        onClick={() => handleShare(certificate)}
                        variant="outline"
                        size="sm"
                        data-testid={`button-share-${certificate.id}`}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>

                    {/* View Certificate Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      asChild
                      data-testid={`button-view-${certificate.id}`}
                    >
                      <a 
                        href={`/verify-certificate/${certificate.verificationCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Certificate
                      </a>
                    </Button>
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Share Dialog */}
      {selectedCertificate && (
        <ShareCertificateDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          certificate={selectedCertificate}
        />
      )}
    </div>
  );
}
