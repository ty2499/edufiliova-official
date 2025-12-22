import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ThumbsUp, Send, User as UserIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface Comment {
  id: string;
  courseId: string;
  userId: string;
  comment: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  userName: string;
  userAvatar: string | null;
}

interface Reply {
  id: string;
  commentId: string;
  userId: string;
  reply: string;
  likesCount: number;
  createdAt: string;
  userName: string;
  userAvatar: string | null;
}

interface CourseCommentsProps {
  courseId: string;
}

interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function CourseComments({ courseId }: CourseCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  // Fetch comments with pagination
  const { data: commentsData, isLoading } = useQuery<CommentsResponse>({
    queryKey: ['/api/courses', courseId, 'comments', { page, showAll }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', showAll ? '20' : '5');
      if (showAll) params.set('showAll', 'true');
      const response = await fetch(`/api/courses/${courseId}/comments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });
  
  const comments = commentsData?.comments || [];
  const pagination = commentsData?.pagination;

  // Post comment mutation
  const postCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      return await apiRequest(`/api/courses/${courseId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'comments'] });
      setNewComment('');
      setPage(1);
    },
    onError: () => {
      // Silent error handling - AJAX only
    },
  });

  // Post reply mutation
  const postReplyMutation = useMutation({
    mutationFn: async ({ commentId, reply }: { commentId: string; reply: string }) => {
      return await apiRequest(`/api/comments/${commentId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ reply }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comments', variables.commentId, 'replies'] });
      setReplyingTo(null);
      setReplyText('');
    },
    onError: () => {
      // Silent error handling - AJAX only
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'comments'] });
    },
  });

  const handleShowAll = () => {
    setShowAll(true);
    setPage(1);
  };

  const handleShowLess = () => {
    setShowAll(false);
    setPage(1);
  };

  // Like reply mutation
  const likeReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      return await apiRequest(`/api/replies/${replyId}/like`, {
        method: 'POST',
      });
    },
    onSuccess: (_, replyId) => {
      // Find which comment this reply belongs to and invalidate its replies
      queryClient.invalidateQueries({ queryKey: ['/api/comments'] });
    },
  });

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    if (!user) {
      return;
    }
    postCommentMutation.mutate(newComment);
  };

  const handlePostReply = (commentId: string) => {
    if (!replyText.trim()) return;
    if (!user) {
      return;
    }
    postReplyMutation.mutate({ commentId, reply: replyText });
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Discussion ({pagination?.total || comments.length})</h3>
        </div>
        {pagination && pagination.total > 5 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={showAll ? handleShowLess : handleShowAll}
          >
            {showAll ? 'Show Less' : 'Show All'}
          </Button>
        )}
      </div>

      {/* Post new comment */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <Textarea
              placeholder="Share your thoughts about this course..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-3"
              rows={3}
              data-testid="input-new-comment"
            />
            <div className="flex justify-end">
              <Button
                onClick={handlePostComment}
                disabled={!newComment.trim() || postCommentMutation.isPending}
                data-testid="button-post-comment"
              >
                <Send className="h-4 w-4 mr-2" />
                {postCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            Please login to join the discussion
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2 w-1/4"></div>
                  <div className="h-3 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No comments yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your thoughts about this course
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                courseId={courseId}
                user={user}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyingTo={setReplyingTo}
                setReplyText={setReplyText}
                handlePostReply={handlePostReply}
                likeCommentMutation={likeCommentMutation}
                likeReplyMutation={likeReplyMutation}
                postReplyMutation={postReplyMutation}
                isExpanded={expandedComments.has(comment.id)}
                toggleReplies={toggleReplies}
                formatDate={formatDate}
              />
            ))}
            
            {/* Pagination controls */}
            {pagination && !showAll && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Comment item component with replies
interface CommentItemProps {
  comment: Comment;
  courseId: string;
  user: any;
  replyingTo: string | null;
  replyText: string;
  setReplyingTo: (id: string | null) => void;
  setReplyText: (text: string) => void;
  handlePostReply: (commentId: string) => void;
  likeCommentMutation: any;
  likeReplyMutation: any;
  postReplyMutation: any;
  isExpanded: boolean;
  toggleReplies: (id: string) => void;
  formatDate: (date: string) => string;
}

function CommentItem({
  comment,
  courseId,
  user,
  replyingTo,
  replyText,
  setReplyingTo,
  setReplyText,
  handlePostReply,
  likeCommentMutation,
  likeReplyMutation,
  postReplyMutation,
  isExpanded,
  toggleReplies,
  formatDate,
}: CommentItemProps) {
  const { data: replies = [] } = useQuery<Reply[]>({
    queryKey: ['/api/comments', comment.id, 'replies'],
    enabled: isExpanded,
  });

  return (
    <Card data-testid={`comment-${comment.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {comment.userAvatar ? (
            <img
              src={comment.userAvatar}
              alt={comment.userName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium" data-testid={`comment-author-${comment.id}`}>{comment.userName}</span>
              <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
            </div>
            
            <p className="text-sm mb-3" data-testid={`comment-text-${comment.id}`}>{comment.comment}</p>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => user && likeCommentMutation.mutate(comment.id)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-like-comment-${comment.id}`}
                disabled={!user}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{comment.likesCount}</span>
              </button>
              
              <button
                onClick={() => user ? setReplyingTo(comment.id) : null}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-reply-${comment.id}`}
                disabled={!user}
              >
                Reply
              </button>
              
              {comment.repliesCount > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="text-sm text-[#0d3d6b] dark:text-blue-400 hover:underline"
                  data-testid={`button-toggle-replies-${comment.id}`}
                >
                  {isExpanded ? 'Hide' : 'View'} {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
            
            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  data-testid={`input-reply-${comment.id}`}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    data-testid={`button-cancel-reply-${comment.id}`}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePostReply(comment.id)}
                    disabled={!replyText.trim() || postReplyMutation.isPending}
                    data-testid={`button-submit-reply-${comment.id}`}
                  >
                    {postReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Replies list */}
            {isExpanded && replies.length > 0 && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-muted">
                {replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-3" data-testid={`reply-${reply.id}`}>
                    {reply.userAvatar ? (
                      <img
                        src={reply.userAvatar}
                        alt={reply.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm" data-testid={`reply-author-${reply.id}`}>{reply.userName}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                      </div>
                      
                      <p className="text-sm mb-2" data-testid={`reply-text-${reply.id}`}>{reply.reply}</p>
                      
                      <button
                        onClick={() => user && likeReplyMutation.mutate(reply.id)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`button-like-reply-${reply.id}`}
                        disabled={!user}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>{reply.likesCount}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
