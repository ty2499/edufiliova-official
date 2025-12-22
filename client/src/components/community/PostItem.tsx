import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, Edit, Trash2, Send, Reply, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { ReplyItem } from './ReplyItem';
import { EditPostDialog } from './EditPostDialog';
import { EditReplyDialog } from './EditReplyDialog';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  title: string;
  content: string;
  subject?: string;
  createdAt: string;
  likes: number;
  replyCount: number;
  likedByCurrentUser: boolean;
  author: {
    id: string;
    name: string;
    profilePic?: string;
  };
}

interface ReplyData {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profilePic?: string;
  };
}

interface PostItemProps {
  post: Post;
  currentUserId: string;
  onLike: () => void;
  onEdit: (data: { title: string; content: string; subject?: string }) => void;
  onDelete: () => void;
}

export function PostItem({ post, currentUserId, onLike, onEdit, onDelete }: PostItemProps) {
  const [showRepliesDialog, setShowRepliesDialog] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingReply, setEditingReply] = useState<ReplyData | null>(null);
  const [showEditReplyDialog, setShowEditReplyDialog] = useState(false);
  const queryClient = useQueryClient();

  const isAuthor = post.author.id === currentUserId;
  const displayName = post.author.name || 'Anonymous';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ['/api/community/posts', post.id, 'replies'],
    queryFn: () => apiRequest(`/api/community/posts/${post.id}/replies`),
    enabled: showRepliesDialog
  });

  const createReplyMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest('/api/community/replies', {
        method: 'POST',
        body: JSON.stringify({ postId: post.id, content })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts', post.id, 'replies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setReplyContent('');
      setShowReplyInput(false);
    }
  });

  const handleReply = () => {
    if (replyContent.trim()) {
      createReplyMutation.mutate(replyContent);
    }
  };

  const handleEdit = (data: { title: string; content: string; subject?: string }) => {
    onEdit(data);
    setShowEditDialog(false);
  };

  const editReplyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiRequest(`/api/community/replies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts', post.id, 'replies'] });
      setShowEditReplyDialog(false);
      setEditingReply(null);
    }
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: string) =>
      apiRequest(`/api/community/replies/${replyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts', post.id, 'replies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    }
  });

  const handleEditReply = (reply: ReplyData) => {
    setEditingReply(reply);
    setShowEditReplyDialog(true);
  };

  const handleUpdateReply = (data: { content: string }) => {
    if (editingReply) {
      editReplyMutation.mutate({ id: editingReply.id, content: data.content });
    }
  };

  const handleDeleteReply = (replyId: string) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      deleteReplyMutation.mutate(replyId);
    }
  };

  return (
    <>
      <Card className="overflow-hidden" data-testid={`post-${post.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={post.author.profilePic} />
              <AvatarFallback className="text-sm font-medium bg-primary/10 text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-base">{post.title}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">by {displayName}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                
                {isAuthor && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowEditDialog(true)}
                      data-testid={`edit-post-${post.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={onDelete}
                      data-testid={`delete-post-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {post.subject && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {post.subject}
                </Badge>
              )}
              
              <div 
                className="mt-3 text-sm text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              
              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLike}
                  className={`h-8 px-2 ${post.likedByCurrentUser ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                  data-testid={`like-post-${post.id}`}
                >
                  <Heart className={`h-4 w-4 mr-1 ${post.likedByCurrentUser ? 'fill-current' : ''}`} />
                  {post.likes}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRepliesDialog(true);
                    setShowReplyInput(true);
                  }}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  data-testid={`reply-button-${post.id}`}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Reply
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRepliesDialog(true)}
                  className="h-8 px-2 text-foreground hover:text-foreground/80 font-medium"
                  data-testid={`replies-post-${post.id}`}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.replyCount} {post.replyCount === 1 ? 'Reply' : 'Replies'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRepliesDialog} onOpenChange={setShowRepliesDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Replies to "{post.title}"
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0">
            {showReplyInput && (
              <div className="flex gap-2 mb-4 pb-4 border-b">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] text-sm resize-none flex-1"
                  data-testid={`reply-input-${post.id}`}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim() || createReplyMutation.isPending}
                    className="h-8"
                    data-testid={`reply-submit-${post.id}`}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReplyInput(false)}
                    className="h-8"
                    data-testid={`reply-cancel-${post.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!showReplyInput && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplyInput(true)}
                className="mb-4"
              >
                <Reply className="h-4 w-4 mr-2" />
                Write a Reply
              </Button>
            )}

            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {repliesLoading ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">Loading replies...</div>
                ) : replies.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">No replies yet. Be the first to reply!</div>
                ) : (
                  replies.map((reply: ReplyData) => (
                    <ReplyItem 
                      key={reply.id} 
                      reply={reply} 
                      currentUserId={currentUserId}
                      onEdit={() => handleEditReply(reply)}
                      onDelete={() => handleDeleteReply(reply.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <EditPostDialog
        post={post}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleEdit}
      />

      {editingReply && (
        <EditReplyDialog
          reply={editingReply}
          open={showEditReplyDialog}
          onOpenChange={setShowEditReplyDialog}
          onSubmit={handleUpdateReply}
          isLoading={editReplyMutation.isPending}
        />
      )}
    </>
  );
}
