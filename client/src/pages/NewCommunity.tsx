import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Plus, 
  Search,
  Users,
  Heart,
  MessageCircle,
  Send,
  Globe,
  UserPlus,
  Clock,
  BookOpen,
  TrendingUp,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { EditReplyDialog } from '@/components/community/EditReplyDialog';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  subject?: string;
  grade?: number;
  likes: number;
  replyCount?: number;
  replies?: number;
  createdAt: string;
  groupId?: string;
  groupName?: string;
  author?: {
    id: string;
    name: string;
    profilePic?: string;
  };
}

interface Reply {
  id: string;
  postId: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content: string;
  likes: number;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    profilePic?: string;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  postCount: number;
  createdAt: string;
  creatorName: string;
}

interface Student {
  id: string;
  userId: string;
  name: string;
  grade: number;
  country: string;
  avatarUrl?: string;
  subscriptionTier: string;
  isOnline: boolean;
}

export default function NewCommunity() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  // Check if user is premium - only specific subscription tiers are premium
  const premiumTiers = ['elementary', 'high_school', 'college_university'];
  const isPremium = profile?.subscriptionTier && premiumTiers.includes(profile.subscriptionTier);
  
  // Force logging for debugging - CRITICAL
  useEffect(() => {
    console.log("🔍 [CRITICAL] NewCommunity render - isPremium:", isPremium, "subscriptionTier:", profile?.subscriptionTier, "profile:", profile);
  }, [isPremium, profile]);
  const [activeTab, setActiveTab] = useState('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  
  // Form states
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    subject: ''
  });
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });
  const [replyContent, setReplyContent] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditPost, setShowEditPost] = useState(false);
  const [editingReply, setEditingReply] = useState<Reply | null>(null);
  const [showEditReply, setShowEditReply] = useState(false);

  // Log isPremium after render
  useEffect(() => {
    console.log("📍 NewCommunity rendered - isPremium:", isPremium, "profileTier:", profile?.subscriptionTier);
  }, [isPremium, profile?.subscriptionTier]);

  // Fetch posts with proper data extraction
  const { data: posts = [], isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ['community-posts', searchQuery, selectedGroup],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedGroup) params.append('groupId', selectedGroup);
      
      const response = await apiRequest(`/api/community/posts?${params.toString()}`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      console.log('Posts API response:', response);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user
  });

  // Fetch groups with proper data extraction
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['community-groups'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/community/groups', {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      console.log('Groups API response:', response);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user
  });

  // Fetch students with proper data extraction
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['community-students', friendSearch],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      params.append('grade', '10'); // Filter for Grade 10 and above
      if (friendSearch) params.append('search', friendSearch);
      
      const response = await apiRequest(`/api/students/search?${params.toString()}`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      console.log('Students API response:', response);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!(user && activeTab === 'friends' && isPremium)
  });

  // Fetch replies for selected post
  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ['community-replies', selectedPost],
    queryFn: async () => {
      if (!selectedPost) return [];
      
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/posts/${selectedPost}/replies`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      console.log('Replies API response:', response);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!selectedPost && !!user
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: typeof newPost) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'Authorization': `Bearer ${sessionId}` })
        },
        body: JSON.stringify({
          ...postData,
          groupId: selectedGroup || null
        })
      });
      
      console.log('Create post response:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewPost({ title: '', content: '', subject: '' });
      setShowCreatePost(false);},
    onError: (error: any) => {
      console.error('Create post error:', error);}
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (replyData: { postId: string; content: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/community/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'Authorization': `Bearer ${sessionId}` })
        },
        body: JSON.stringify(replyData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-replies', selectedPost] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setReplyContent('');},
    onError: (error: any) => {}
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });},
    onError: (error: any) => {}
  });

  // Edit post mutation
  const editPostMutation = useMutation({
    mutationFn: async (postData: { id: string; title: string; content: string; subject?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/community/posts/${postData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'Authorization': `Bearer ${sessionId}` })
        },
        body: JSON.stringify({
          title: postData.title,
          content: postData.content,
          subject: postData.subject
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setShowEditPost(false);
      setEditingPost(null);},
    onError: (error: any) => {}
  });

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {return;
    }
    createPostMutation.mutate(newPost);
  };

  const handleCreateReply = () => {
    if (!replyContent.trim() || !selectedPost) return;
    createReplyMutation.mutate({ postId: selectedPost, content: replyContent });
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPost({ title: post.title, content: post.content, subject: post.subject || '' });
    setShowEditPost(true);
  };

  const handleUpdatePost = () => {
    if (!editingPost || !newPost.title.trim() || !newPost.content.trim()) {return;
    }
    editPostMutation.mutate({ 
      id: editingPost.id, 
      title: newPost.title, 
      content: newPost.content, 
      subject: newPost.subject 
    });
  };

  const handleDeleteReply = (replyId: string) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      deleteReplyMutation.mutate(replyId);
    }
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReply(reply);
    setShowEditReply(true);
  };

  // Edit reply mutation
  const editReplyMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/community/replies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'Authorization': `Bearer ${sessionId}` })
        },
        body: JSON.stringify({ content })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-replies', selectedPost] });
      setShowEditReply(false);
      setEditingReply(null);},
    onError: (error: any) => {}
  });

  const handleUpdateReply = (data: { content: string }) => {
    if (editingReply) {
      editReplyMutation.mutate({ id: editingReply.id, content: data.content });
    }
  };

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/community/replies/${replyId}`, {
        method: 'DELETE',
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-replies', selectedPost] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });},
    onError: (error: any) => {}
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Join the Community</h2>
              <p className="text-muted-foreground mb-4">
                Connect with students and teachers worldwide. Please sign in to access the community.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Debug - Posts:', posts);
  console.log('Debug - Students:', students);
  console.log('Debug - Groups:', groups);

  return (
    <div className="min-h-screen bg-background" data-testid="new-community-page">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-foreground" />
              <div>
                <h1 className="text-3xl font-bold">Community Hub</h1>
                <p className="text-muted-foreground">
                  Connect, share, and learn together with students worldwide
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreatePost(true)}
              data-testid="new-create-post-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts" data-testid="tab-posts">
              <MessageSquare className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="groups" data-testid="tab-groups">
              <Users className="h-4 w-4 mr-2" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="friends" data-testid="tab-friends">
              <UserPlus className="h-4 w-4 mr-2" />
              Find Friends
            </TabsTrigger>
            <TabsTrigger value="trending" data-testid="tab-trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-posts"
                />
              </div>
              {groups.length > 0 && (
                <select
                  value={selectedGroup || ''}
                  onChange={(e) => setSelectedGroup(e.target.value || null)}
                  className="px-3 py-2 border rounded-md"
                  data-testid="select-group"
                >
                  <option value="">All Groups</option>
                  {groups.map((group: Group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {postsLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading posts...</div>
              </div>
            ) : postsError ? (
              <div className="text-center py-8">
                <div className="text-primary-500">Error loading posts: {(postsError as Error).message}</div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to start a conversation!</p>
                <Button onClick={() => setShowCreatePost(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {posts.map((post: Post) => {
                    const displayName = post.author?.name || post.authorName || 'Anonymous';
                    const avatarUrl = post.author?.profilePic || post.authorAvatarUrl;
                    const postAuthorId = post.author?.id || post.authorId;
                    const replyCount = post.replyCount || post.replies || 0;
                    
                    return (
                      <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`post-${post.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback>
                                  {displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{displayName}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(post.createdAt).toLocaleDateString()}
                                  {post.subject && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="secondary">{post.subject}</Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Edit/Delete buttons for post author */}
                            {(postAuthorId === user?.id || postAuthorId === user?.userId) && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPost(post)}
                                data-testid={`edit-post-${post.id}`}
                                title="Edit post"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePost(post.id)}
                                data-testid={`delete-post-${post.id}`}
                                title="Delete post"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{post.content}</p>
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => likePostMutation.mutate(post.id)}
                            data-testid={`like-post-${post.id}`}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            {post.likes || 0}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                            data-testid={`replies-post-${post.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {replyCount} replies
                          </Button>
                        </div>

                        {/* Replies Section */}
                        {selectedPost === post.id && (
                          <div className="mt-4 border-t pt-4">
                            <div className="space-y-3 mb-4">
                              {repliesLoading ? (
                                <div className="text-sm text-muted-foreground">Loading replies...</div>
                              ) : replies.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No replies yet</div>
                              ) : (
                                replies.map((reply: Reply) => {
                                  const displayName = reply.author?.name || reply.authorName || 'Anonymous';
                                  const avatarUrl = reply.author?.profilePic || reply.authorAvatarUrl;
                                  const replyAuthorId = reply.author?.id || reply.authorId;
                                  
                                  return (
                                    <div key={reply.id} className="flex gap-3 p-2 bg-muted/50 rounded">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="text-xs">
                                          {displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <div className="text-sm font-medium">{displayName}</div>
                                          {(replyAuthorId === user?.id || replyAuthorId === user?.userId) && (
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditReply(reply)}
                                                className="h-6 w-6 p-0"
                                                title="Edit reply"
                                                data-testid={`edit-reply-${reply.id}`}
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteReply(reply.id)}
                                                className="h-6 w-6 p-0"
                                                title="Delete reply"
                                                data-testid={`delete-reply-${reply.id}`}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{reply.content}</div>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateReply()}
                                data-testid={`reply-input-${post.id}`}
                              />
                              <Button
                                size="sm"
                                onClick={handleCreateReply}
                                disabled={!replyContent.trim() || createReplyMutation.isPending}
                                data-testid={`reply-submit-${post.id}`}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Study Groups</h2>
              <Button onClick={() => setShowCreateGroup(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>

            {groupsLoading ? (
              <div className="text-center py-8">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground">Create the first study group!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group: Group) => (
                  <Card key={group.id} data-testid={`group-${group.id}`}>
                    <CardHeader>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{group.memberCount} members</span>
                        <span>{group.postCount} posts</span>
                      </div>
                      <Button className="w-full mt-3" size="sm">Join Group</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Find Friends Tab */}
          <TabsContent value="friends" className="space-y-4">
            {!isPremium ? (
              <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center max-w-md">
                  <MessageSquare className="h-16 w-16 text-blue-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-3">Unlock Find Friends</h3>
                  <p className="text-muted-foreground mb-6">
                    Upgrade to premium to discover and connect with students worldwide.
                  </p>
                  <Button className="w-full bg-primary hover:bg-primary h-12 text-base">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            ) : (
              // Premium user view
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Find Friends</h2>
                  <p className="text-muted-foreground">Connect with fellow students from Grade 10 and above</p>
                </div>

                <div className="flex gap-4 items-center mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search students by name, grade, or country..."
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                      className="pl-10"
                      data-testid="search-friends"
                    />
                  </div>
                </div>

                {studentsLoading ? (
                  <div className="text-center py-8">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No students found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {students.map((student: Student) => (
                      <Card key={student.id} data-testid={`student-${student.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={student.avatarUrl} />
                              <AvatarFallback>
                                {student.name?.split(' ').map(n => n[0]).join('') || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{student.name}</h3>
                              <div className="text-sm text-muted-foreground">
                                Grade {student.grade} • {student.country}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant={student.isOnline ? "default" : "secondary"}>
                              {student.isOnline ? "Online" : "Offline"}
                            </Badge>
                            <Button size="sm" data-testid={`add-friend-${student.id}`}>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add Friend
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-4">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Trending Topics</h3>
              <p className="text-muted-foreground">Popular discussions and trending content will appear here</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Post Dialog */}
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  placeholder="What's your post about?"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="new-post-title"
                />
              </div>
              <div>
                <Label htmlFor="post-content">Content</Label>
                <Textarea
                  id="post-content"
                  placeholder="Share your thoughts, questions, or knowledge..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[100px]"
                  data-testid="new-post-content"
                />
              </div>
              <div>
                <Label htmlFor="post-subject">Subject (optional)</Label>
                <Input
                  id="post-subject"
                  placeholder="Mathematics, Science, History..."
                  value={newPost.subject}
                  onChange={(e) => setNewPost(prev => ({ ...prev, subject: e.target.value }))}
                  data-testid="new-post-subject"
                />
              </div>
              <Button 
                onClick={handleCreatePost}
                disabled={createPostMutation.isPending || !newPost.title.trim() || !newPost.content.trim()}
                className="w-full"
                data-testid="new-post-submit"
              >
                {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Post Dialog */}
        <Dialog open={showEditPost} onOpenChange={setShowEditPost}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-post-title">Title</Label>
                <Input
                  id="edit-post-title"
                  placeholder="What's your post about?"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="edit-post-title"
                />
              </div>
              <div>
                <Label htmlFor="edit-post-content">Content</Label>
                <Textarea
                  id="edit-post-content"
                  placeholder="Share your thoughts, questions, or knowledge..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[100px]"
                  data-testid="edit-post-content"
                />
              </div>
              <div>
                <Label htmlFor="edit-post-subject">Subject (optional)</Label>
                <Input
                  id="edit-post-subject"
                  placeholder="Mathematics, Science, History..."
                  value={newPost.subject}
                  onChange={(e) => setNewPost(prev => ({ ...prev, subject: e.target.value }))}
                  data-testid="edit-post-subject"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdatePost}
                  disabled={editPostMutation.isPending || !newPost.title.trim() || !newPost.content.trim()}
                  className="flex-1"
                  data-testid="edit-post-submit"
                >
                  {editPostMutation.isPending ? 'Updating...' : 'Update Post'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditPost(false);
                    setEditingPost(null);
                    setNewPost({ title: '', content: '', subject: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Reply Dialog */}
        {editingReply && editingReply.author && (
          <EditReplyDialog
            reply={{
              id: editingReply.id,
              content: editingReply.content,
              createdAt: editingReply.createdAt,
              author: editingReply.author
            }}
            open={showEditReply}
            onOpenChange={setShowEditReply}
            onSubmit={handleUpdateReply}
            isLoading={editReplyMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
