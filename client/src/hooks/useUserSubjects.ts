import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface UserSubject {
  user_id: string;
  subject: string;
  updated_at: string;
}

export function useUserSubjects(userId: string) {
  const queryClient = useQueryClient();

  const { data: subjects, isLoading: loading, error: queryError } = useQuery<UserSubject[]>({
    queryKey: ['/api/supabase-proxy/user-subjects', userId],
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async (subject: string) => {
      const response = await apiRequest(`/api/supabase-proxy/user-subjects/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supabase-proxy/user-subjects', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subject: string) => {
      const response = await apiRequest(`/api/supabase-proxy/user-subjects/${userId}/${encodeURIComponent(subject)}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supabase-proxy/user-subjects', userId] });
    },
  });

  const updateSubject = async (subject: string) => {
    try {
      await updateMutation.mutateAsync(subject);
      return true;
    } catch (err) {
      console.error('Error updating user subject:', err);
      return false;
    }
  };

  const removeSubject = async (subject: string) => {
    try {
      await deleteMutation.mutateAsync(subject);
      return true;
    } catch (err) {
      console.error('Error removing user subject:', err);
      return false;
    }
  };

  const getLastSubject = () => {
    if (!subjects || subjects.length === 0) return null;
    
    return subjects.reduce((latest, current) => {
      const latestDate = new Date(latest.updated_at);
      const currentDate = new Date(current.updated_at);
      return currentDate > latestDate ? current : latest;
    });
  };

  return {
    subjects: subjects || [],
    loading,
    error: queryError ? (queryError as Error).message : null,
    updateSubject,
    removeSubject,
    getLastSubject,
    hasSubject: (subject: string) => subjects?.some(s => s.subject === subject) || false
  };
}
