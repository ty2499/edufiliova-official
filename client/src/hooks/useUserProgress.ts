import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface UserProgress {
  user_id: string;
  level: number;
  updated_at: string;
}

export function useUserProgress(userId: string) {
  const queryClient = useQueryClient();

  const { data: progress, isLoading: loading, error: queryError } = useQuery<UserProgress>({
    queryKey: ['/api/supabase-proxy/user-progress', userId],
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async (level: number) => {
      const response = await apiRequest(`/api/supabase-proxy/user-progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supabase-proxy/user-progress', userId] });
    },
  });

  const updateProgress = async (level: number) => {
    try {
      await updateMutation.mutateAsync(level);
      return true;
    } catch (err) {
      console.error('Error updating user progress:', err);
      return false;
    }
  };

  return {
    progress: progress || { user_id: userId, level: 1, updated_at: new Date().toISOString() },
    loading,
    error: queryError ? (queryError as Error).message : null,
    updateProgress,
    currentLevel: progress?.level || 1
  };
}
