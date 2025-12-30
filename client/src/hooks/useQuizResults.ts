import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface QuizResult {
  studentId: string;
  lessonId: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  answers: number[];
}

export interface SupabaseQuizData {
  user_id: string;
  subject: string;
  quiz_results: QuizResult[];
  updated_at: string;
}

export function useQuizResults(userId: string, subject: string = 'mathematics') {
  const queryClient = useQueryClient();

  const { data: quizResults, isLoading: loading, error: queryError } = useQuery<QuizResult[]>({
    queryKey: ['/api/supabase-proxy/quiz-results', userId, subject],
    enabled: !!userId,
  });

  const saveMutation = useMutation({
    mutationFn: async (params: { lessonId: string; score: number; totalQuestions: number; answers: number[] }) => {
      const response = await apiRequest(`/api/supabase-proxy/quiz-results/${userId}/${encodeURIComponent(subject)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supabase-proxy/quiz-results', userId, subject] });
      queryClient.invalidateQueries({ queryKey: ['/api/supabase-proxy/user-chats', userId] });
    },
  });

  const saveQuizResult = async (lessonId: string, score: number, totalQuestions: number, answers: number[]) => {
    try {
      await saveMutation.mutateAsync({ lessonId, score, totalQuestions, answers });
      return true;
    } catch (err) {
      console.error('Error saving quiz result:', err);
      return false;
    }
  };

  const getQuizResult = (lessonId: string): QuizResult | null => {
    return quizResults?.find(r => r.lessonId === lessonId) || null;
  };

  return {
    quizResults: quizResults || [],
    loading,
    error: queryError ? (queryError as Error).message : null,
    saveQuizResult,
    getQuizResult
  };
}
