import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { PostItem } from './PostItem';
import { CreatePostDialog } from './CreatePostDialog';

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

interface PostsListProps {
  currentUserId: string;
}

export function PostsList({ currentUserId }: PostsListProps) {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const queryClient = useQueryClient();

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/community/posts'],
    queryFn: () => apiRequest('/api/community/posts')
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (newPost: { title: string; content: string; subject?: string }) =>
      apiRequest('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify(newPost)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setShowCreatePost(false);
    }
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: (postId: string) =>
      apiRequest(`/api/community/posts/${postId}/like`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    }
  });

  // Edit post mutation
  const editPostMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title: string; content: string; subject?: string }) =>
      apiRequest(`/api/community/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) =>
      apiRequest(`/api/community/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    }
  });

  const handleCreatePost = async (postData: { title: string; content: string; subject?: string }) => {
    await createPostMutation.mutateAsync(postData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-1">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-32 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post Button */}
      <Button 
        onClick={() => setShowCreatePost(true)}
        className="w-full"
        data-testid="create-post-button"
      >
        Create New Post
      </Button>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post: Post) => (
          <PostItem
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onLike={() => likePostMutation.mutate(post.id)}
            onEdit={(data) => editPostMutation.mutate({ id: post.id, ...data })}
            onDelete={() => deletePostMutation.mutate(post.id)}
          />
        ))
      )}

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        onSubmit={handleCreatePost}
        isLoading={createPostMutation.isPending}
      />
    </div>
  );
}
