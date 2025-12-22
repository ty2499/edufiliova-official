import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, Award } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface VerificationResult {
  valid: boolean;
  revoked?: boolean;
  revokedReason?: string;
  error?: string;
  certificate?: {
    studentName: string;
    courseTitle: string;
    courseDescription: string | null;
    completionDate: string;
    issueDate: string;
    instructorName: string | null;
    finalScore: number | null;
    verificationCode: string;
  };
}

export default function VerifyCertificatePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const verificationCode = urlParams.get('code');

  const { data, isLoading, error } = useQuery<VerificationResult>({
    queryKey: ['/api/certificates/verify', verificationCode],
    queryFn: async () => {
      const res = await fetch(`/api/certificates/verify/${verificationCode}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Verification failed');
      }
      return res.json();
    },
    enabled: !!verificationCode,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col pt-20">
        <div className="container mx-auto p-6 max-w-4xl flex-1 flex items-center justify-center">
          <div className="text-center">
            <Award className="w-12 h-12 text-[#ff5833] mx-auto mb-4" />
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff5833] mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying certificate...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col pt-20">
        <div className="container mx-auto px-6 max-w-4xl flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Award className="w-8 h-8 text-[#ff5833]" />
              Verify Certificate
            </h1>
            <p className="text-gray-600">Check the authenticity of certificates issued by Edufiliova</p>
          </div>
          
          <Card data-testid="card-verification-error" className="border-red-200">
            <CardContent className="pt-6">
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-5 w-5" />
                <AlertDescription className="ml-2">
                  {(error as Error)?.message || (!verificationCode ? 'No verification code provided' : 'Failed to verify certificate')}
                </AlertDescription>
              </Alert>
              
              {!verificationCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-900">
                    <strong>How to verify a certificate:</strong><br/>
                    Please use the verification link provided in your certificate email, or add a <code className="bg-white px-2 py-1 rounded font-mono">?code=YOUR_CODE</code> parameter to the URL.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data.valid || data.revoked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col pt-20">
        <div className="container mx-auto px-6 max-w-4xl flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Award className="w-8 h-8 text-[#ff5833]" />
              Verify Certificate
            </h1>
            <p className="text-gray-600">Check the authenticity of certificates issued by Edufiliova</p>
          </div>
          
          <Card data-testid="card-certificate-invalid" className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <CardTitle>Certificate {data.revoked ? 'Revoked' : 'Invalid'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  {data.revoked 
                    ? `This certificate has been revoked. Reason: ${data.revokedReason || 'Not specified'}`
                    : 'This certificate could not be verified. The verification code may be incorrect or the certificate does not exist.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const cert = data.certificate!;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Award className="w-8 h-8 text-[#ff5833]" />
            Verify Certificate
          </h1>
          <p className="text-gray-600">Check the authenticity of certificates issued by Edufiliova</p>
        </div>

        {/* Verification Status */}
        <div className="mb-6">
          <Alert className="border-green-200 bg-green-50" data-testid="alert-verification-success">
            <CheckmarkIcon size="md" variant="success" />
            <AlertDescription className="text-green-900 ml-2">
              <strong>Certificate Verified!</strong> This is an authentic certificate issued by Edufiliova.
            </AlertDescription>
          </Alert>
        </div>

        {/* Certificate Details */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-[#ff5833]" />
              <CardTitle>Certificate Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Recipient</h3>
              <p className="text-lg font-semibold" data-testid="text-student-name">{cert.studentName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Course</h3>
              <p className="text-lg font-semibold">{cert.courseTitle}</p>
              {cert.courseDescription && (
                <p className="text-sm text-gray-600 mt-1">{cert.courseDescription}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Completion Date</h3>
                <p className="text-base">{new Date(cert.completionDate).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issue Date</h3>
                <p className="text-base">{new Date(cert.issueDate).toLocaleDateString()}</p>
              </div>
            </div>
            {cert.finalScore && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Final Score</h3>
                <p className="text-base">{cert.finalScore}%</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Verification Code</h3>
              <p className="text-base font-mono bg-gray-100 px-3 py-2 rounded">{cert.verificationCode}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
