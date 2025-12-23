import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Trash2, Reply } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  workId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
    verificationBadge: 'none' | 'green' | 'blue';
  };
  replies?: Comment[];
}

interface PortfolioCommentSectionProps {
  workId: string;
  currentUserId?: string;
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  currentUserId?: string;
  replyingTo: string | null;
  replyContent: string;
  expandedReplies: Set<string>;
  setReplyingTo: (id: string | null) => void;
  setReplyContent: (content: string) => void;
  toggleReplies: (id: string) => void;
  handleDeleteComment: (id: string) => void;
  handlePostReply: (parentId: string) => void;
  createCommentMutation: any;
  deleteCommentMutation: any;
}

const CommentItem = ({ 
  comment, 
  isReply = false, 
  currentUserId, 
  replyingTo, 
  replyContent, 
  expandedReplies,
  setReplyingTo, 
  setReplyContent, 
  toggleReplies,
  handleDeleteComment,
  handlePostReply,
  createCommentMutation,
  deleteCommentMutation
}: CommentItemProps) => {
  const displayName = comment.user?.displayName || comment.user?.name || 'Anonymous';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`${isReply ? 'ml-8 mt-3' : 'mt-4'} group`} data-testid={`comment-${comment.id}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.user?.avatarUrl || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-0.5 mb-1">
            <span className="font-medium text-sm text-gray-900" data-testid={`comment-author-${comment.id}`}>
              {displayName}
            </span>
            {comment.user?.verificationBadge && comment.user.verificationBadge !== 'none' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0">
                {comment.user.verificationBadge === 'blue' ? (
                  <>
                    <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                    <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                  </>
                ) : (
                  <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                )}
              </svg>
            )}
            <span className="text-xs text-gray-500" data-testid={`comment-time-${comment.id}`}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words" data-testid={`comment-content-${comment.id}`}>
            {comment.content}
          </p>
          
          <div className="flex items-center gap-4 mt-2">
            {!isReply && currentUserId && comment.userId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-600 hover:text-blue-600"
                onClick={() => setReplyingTo(comment.id)}
                data-testid={`button-reply-${comment.id}`}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            {currentUserId && comment.userId && currentUserId === comment.userId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-600 hover:text-primary"
                onClick={() => handleDeleteComment(comment.id)}
                disabled={deleteCommentMutation.isPending}
                data-testid={`button-delete-comment-${comment.id}`}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}

            {!isReply && comment.replies && comment.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => toggleReplies(comment.id)}
                data-testid={`button-toggle-replies-${comment.id}`}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                {expandedReplies.has(comment.id) 
                  ? `Hide replies` 
                  : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                }
              </Button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] text-sm"
                data-testid={`textarea-reply-${comment.id}`}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePostReply(comment.id)}
                  disabled={!replyContent.trim() || createCommentMutation.isPending}
                  data-testid={`button-post-reply-${comment.id}`}
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  data-testid={`button-cancel-reply-${comment.id}`}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && expandedReplies.has(comment.id) && (
        <div className="space-y-2 mt-3">
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              isReply
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              replyContent={replyContent}
              expandedReplies={expandedReplies}
              setReplyingTo={setReplyingTo}
              setReplyContent={setReplyContent}
              toggleReplies={toggleReplies}
              handleDeleteComment={handleDeleteComment}
              handlePostReply={handlePostReply}
              createCommentMutation={createCommentMutation}
              deleteCommentMutation={deleteCommentMutation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function PortfolioCommentSection({ workId, currentUserId }: PortfolioCommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showAllComments, setShowAllComments] = useState(false);
  
  const INITIAL_COMMENTS_COUNT = 5;

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['/api/portfolio/works', workId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/works/${workId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!workId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      return await apiRequest(`/api/portfolio/works/${workId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/works', workId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/works'] });
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest(`/api/portfolio/works/${workId}/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/works', workId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/works'] });
    },
  });

  const handlePostComment = () => {
    if (!newComment.trim() || !currentUserId) return;
    createCommentMutation.mutate({ content: newComment });
  };

  const handlePostReply = (parentId: string) => {
    if (!replyContent.trim() || !currentUserId) return;
    createCommentMutation.mutate({ content: replyContent, parentId });
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  return (
    <div className="border-t pt-6 mt-6" data-testid="portfolio-comment-section">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments {comments && comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {currentUserId ? (
        <div className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[80px] mb-2"
            data-testid="textarea-new-comment"
          />
          <Button
            onClick={handlePostComment}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-post-comment"
          >
            <Send className="h-4 w-4 mr-2" />
            {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">Please log in to leave a comment</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <>
          <div className="space-y-1">
            {(showAllComments ? comments : comments.slice(0, INITIAL_COMMENTS_COUNT)).map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                currentUserId={currentUserId}
                replyingTo={replyingTo}
                replyContent={replyContent}
                expandedReplies={expandedReplies}
                setReplyingTo={setReplyingTo}
                setReplyContent={setReplyContent}
                toggleReplies={toggleReplies}
                handleDeleteComment={handleDeleteComment}
                handlePostReply={handlePostReply}
                createCommentMutation={createCommentMutation}
                deleteCommentMutation={deleteCommentMutation}
              />
            ))}
          </div>
          
          {!showAllComments && comments.length > INITIAL_COMMENTS_COUNT && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllComments(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                data-testid="button-show-more-comments"
              >
                Show More Comments ({comments.length - INITIAL_COMMENTS_COUNT} more)
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
