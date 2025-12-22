import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface GenerateCertificateParams {
  courseId: string;
}

interface Certificate {
  id: string;
  courseTitle: string;
  verificationCode: string;
  certificateUrl: string | null;
}

export function useCertificate() {
  const queryClient = useQueryClient();

  const generateCertificate = useMutation<Certificate, Error, GenerateCertificateParams>({
    mutationFn: async ({ courseId }) => {
      const res = await apiRequest('/api/certificates/generate', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate certificate');
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate certificates list
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/my-certificates'] });
    },
    onError: (error) => {
      // Silent error handling - AJAX only
    },
  });

  return {
    generateCertificate: generateCertificate.mutate,
    isGenerating: generateCertificate.isPending,
  };
}
