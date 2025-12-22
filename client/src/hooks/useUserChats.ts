import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface UserChat {
  user_id: string;
  messages: any[];
  updated_at: string;
}

export function useUserChats(userId: string) {
  const queryClient = useQueryClient();

  const { data: chats, isLoading: loading, error: queryError } = useQuery<UserChat>({
    queryKey: ['/api/supabase-proxy/user-chats', userId],
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async (messages: any[]) => {
      const response = await apiRequest(`/api/supabase-proxy/user-chats/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supabase-proxy/user-chats', userId] });
    },
  });

  const updateChatMessages = async (messages: any[]) => {
    try {
      await updateMutation.mutateAsync(messages);
      return true;
    } catch (err) {
      console.error('Error updating user chats:', err);
      return false;
    }
  };

  const addMessage = async (message: any) => {
    if (!chats) return false;

    const updatedMessages = [...chats.messages, message];
    return await updateChatMessages(updatedMessages);
  };

  const clearChatHistory = async () => {
    return await updateChatMessages([]);
  };

  return {
    chats: chats || { user_id: userId, messages: [], updated_at: new Date().toISOString() },
    loading,
    error: queryError ? (queryError as Error).message : null,
    updateChatMessages,
    addMessage,
    clearChatHistory,
    messages: chats?.messages || []
  };
}
