import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus,
  MessageSquare, 
  Users, 
  Globe,
  Lock,
  Hash,
  ThumbsUp,
  Heart,
  Laugh,
  Angry,
  Frown,
  Zap,
  Send,
  Filter,
  UserPlus,
  Settings,
  Pin,
  Flag,
  MoreHorizontal,
  Star,
  Bookmark
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface CommunityPost {
  id: string;
  authorId: string;
  groupId?: string;
  title: string;
  content: string;
  subject?: string;
  grade?: number;
  tags: string[];
  likes: number;
  replies: number;
  isAnonymous: boolean;
  isPinned: boolean;
  isModerated: boolean;
  createdAt: string;
  authorName: string;
  authorPronouns?: string;
  authorAvatar?: string;
  groupName?: string;
  userReaction?: string;
}

interface CommunityGroup {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  memberCount: number;
  postCount: number;
  isPublic: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  creatorName: string;
  isMember: boolean;
}

interface CommunityReply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  replyToId?: string;
  likes: number;
  isAnonymous: boolean;
  createdAt: string;
  authorName: string;
  authorPronouns?: string;
  authorAvatar?: string;
}

// Community features use dynamic reactions from the database - no hardcoded data

export default function Community() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedTab, setSelectedTab] = useState('feed');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [newPost, setNewPost] = useState({ title: '', content: '', subject: '', isAnonymous: false });
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPublic: true, tags: '' });
  const [replyContent, setReplyContent] = useState<{[postId: string]: string}>({});
  // Community features - no rate limiting

  // Real-time connection for live updates
  useEffect(() => {
    if (!user) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('🔗 Community WebSocket connected');
      socket.send(JSON.stringify({ 
        type: 'join_community',
        userId: user.id,
        groupId: selectedGroup || 'global'
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_post' || data.type === 'new_reply' || data.type === 'reaction_update') {
          // Invalidate relevant queries to get fresh data
          queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
          queryClient.invalidateQueries({ queryKey: ['community', 'replies'] });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('🔌 Community WebSocket disconnected');
    };
    
    return () => socket.close();
  }, [user, selectedGroup, queryClient]);

  // Get community posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['community', 'posts', selectedGroup, searchQuery],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (selectedGroup) params.append('groupId', selectedGroup);
      if (searchQuery) params.append('search', searchQuery);
      
      const result = await apiRequest(`/api/community/posts?${params.toString()}`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      console.log('🎯 Community posts API result:', result);
      console.log('🎯 Posts data:', result.data);
      
      // Ensure tags is always an array and handle data structure
      const processedPosts = (result.data || []).map((post: any) => ({
        ...post,
        tags: Array.isArray(post.tags) ? post.tags : [],
        authorAvatar: post.authorAvatar || post.authorAvatarUrl,
        replies: post.replies || post.replyCount || 0
      }));
      
      console.log('🎯 Processed posts:', processedPosts);
      return processedPosts;
    },
    enabled: !!user
  });

  // Get community groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['community', 'groups'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const result = await apiRequest('/api/community/groups', {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      return result.data || [];
    },
    enabled: !!user
  });

  // Create post mutation with validation - available to all users
  const createPostMutation = useMutation({
    mutationFn: (postData: typeof newPost) => {
      // Enhanced validation
      if (postData.title.length > 200) {
        throw new Error('Title too long. Maximum 200 characters allowed.');
      }
      if (postData.content.length > 2000) {
        throw new Error('Content too long. Maximum 2000 characters allowed.');
      }
      if (postData.title.trim().length < 5) {
        throw new Error('Title too short. Minimum 5 characters required.');
      }
      if (postData.content.trim().length < 10) {
        throw new Error('Content too short. Minimum 10 characters required.');
      }
      
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/community/posts', {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
      setNewPost({ title: '', content: '', subject: '', isAnonymous: false });
      setShowCreatePost(false);},
    onError: (error: any) => {}
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (groupData: any) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/community/groups', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(sessionId && { 'Authorization': `Bearer ${sessionId}` })
        },
        body: JSON.stringify({
          ...groupData,
          tags: groupData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'groups'] });
      setNewGroup({ name: '', description: '', isPublic: true, tags: '' });
      setShowCreateGroup(false);}
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: (groupId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/community/groups/${groupId}/join`, {
        method: 'POST',
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'groups'] });}
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: (data: { targetType: 'post' | 'reply', targetId: string, emoji: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/community/reactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(sessionId && { 'Authorization': `Bearer ${sessionId}` })
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    }
  });

  // Community features available to all users - no rate limiting

  // Add reply mutation - available to all users
  const addReplyMutation = useMutation({
    mutationFn: (data: { postId: string, content: string }) => {
      // Validate content length
      if (data.content.length > 500) {
        throw new Error('Reply too long. Maximum 500 characters allowed.');
      }
      
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/community/replies', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(sessionId && { 'Authorization': `Bearer ${sessionId}` })
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'replies', variables.postId] });
      setReplyContent(prev => ({ ...prev, [variables.postId]: '' }));},
    onError: (error: any) => {}
  });

  const canCreateGroup = true; // Community features available to all users

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

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

  return (
    <div className="min-h-screen bg-background" data-testid="community-page">
      <div className="px-4 md:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Community</h1>
                <p className="text-muted-foreground">
                  Connect, share, and learn together with the global EduFiliova community
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canCreateGroup && (
                <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="create-group-button">
                      <Users className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          placeholder="Enter group name..."
                          value={newGroup.name}
                          onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="input-group-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-description">Description</Label>
                        <Textarea
                          id="group-description"
                          placeholder="Describe your group..."
                          value={newGroup.description}
                          onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                          data-testid="input-group-description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-tags">Tags (comma-separated)</Label>
                        <Input
                          id="group-tags"
                          placeholder="math, homework, study..."
                          value={newGroup.tags}
                          onChange={(e) => setNewGroup(prev => ({ ...prev, tags: e.target.value }))}
                          data-testid="input-group-tags"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="group-public"
                          checked={newGroup.isPublic}
                          onCheckedChange={(checked) => setNewGroup(prev => ({ ...prev, isPublic: checked }))}
                          data-testid="switch-group-public"
                        />
                        <Label htmlFor="group-public">Public group</Label>
                      </div>
                      <Button 
                        onClick={() => createGroupMutation.mutate(newGroup)}
                        disabled={createGroupMutation.isPending || !newGroup.name.trim()}
                        className="w-full"
                        data-testid="button-submit-group"
                      >
                        {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogTrigger asChild>
                  <Button data-testid="create-post-button">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </DialogTrigger>
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
                        data-testid="input-post-title"
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
                        data-testid="input-post-content"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{newPost.content.length}/2000 characters</span>
                        <span className={newPost.content.length > 1800 ? "text-orange-500" : ""}>
                          {newPost.content.length > 1800 ? "Approaching limit" : ""}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="post-subject">Subject (optional)</Label>
                      <Input
                        id="post-subject"
                        placeholder="Mathematics, Science, History..."
                        value={newPost.subject}
                        onChange={(e) => setNewPost(prev => ({ ...prev, subject: e.target.value }))}
                        data-testid="input-post-subject"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="post-anonymous"
                        checked={newPost.isAnonymous}
                        onCheckedChange={(checked) => setNewPost(prev => ({ ...prev, isAnonymous: checked }))}
                        data-testid="switch-post-anonymous"
                      />
                      <Label htmlFor="post-anonymous">Post anonymously</Label>
                    </div>
                    <Button 
                      onClick={() => createPostMutation.mutate(newPost)}
                      disabled={
                        createPostMutation.isPending || 
                        !newPost.title.trim() || 
                        !newPost.content.trim() ||
                        newPost.title.length > 200 ||
                        newPost.content.length > 2000
                      }
                      className="w-full"
                      data-testid="button-submit-post"
                    >
                      {createPostMutation.isPending ? 'Publishing...' : 'Publish Post'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar - Groups */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant={selectedGroup === '' ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedGroup('')}
                    data-testid="button-global-feed"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Global Feed
                  </Button>
                  
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {groupsLoading ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Loading groups...
                        </div>
                      ) : groups.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No groups yet
                        </div>
                      ) : (
                        groups.map((group: CommunityGroup) => (
                          <div key={group.id} className="space-y-2">
                            <Button
                              variant={selectedGroup === group.id ? "default" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => setSelectedGroup(group.id)}
                              data-testid={`button-group-${group.id}`}
                            >
                              {group.isPublic ? <Hash className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                              <div className="flex-1 text-left">
                                <div className="text-sm font-medium truncate">{group.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {group.memberCount} members • {group.postCount} posts
                                </div>
                              </div>
                            </Button>
                            {selectedGroup === group.id && !group.isMember && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => joinGroupMutation.mutate(group.id)}
                                disabled={joinGroupMutation.isPending}
                                data-testid={`button-join-group-${group.id}`}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                {joinGroupMutation.isPending ? 'Joining...' : 'Join Group'}
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="mb-6 flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts by title, content, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-posts"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {postsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading community posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No posts yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedGroup ? 'This group is waiting for its first post.' : 'Be the first to start a conversation!'}
                    </p>
                    <Button onClick={() => setShowCreatePost(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Post
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post: CommunityPost) => (
                  <Card key={post.id} className="overflow-hidden" data-testid={`post-${post.id}`}>
                    <CardContent className="p-6">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.authorAvatar} />
                            <AvatarFallback>
                              {post.isAnonymous ? 'A' : (post.authorName?.split(' ').map(n => n[0]).join('') || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {post.isAnonymous ? 'Anonymous' : post.authorName}
                              </span>
                              {!post.isAnonymous && post.authorPronouns && (
                                <span className="text-xs text-muted-foreground">
                                  ({post.authorPronouns})
                                </span>
                              )}
                              {post.isPinned && <Pin className="h-3 w-3 text-primary" />}
                              {post.groupName && (
                                <Badge variant="secondary" className="text-xs">
                                  {post.groupName}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              {post.subject && (
                                <>
                                  <span>•</span>
                                  <span>{post.subject}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">{post.title}</h3>
                        <p className="text-sm leading-relaxed">{post.content}</p>
                        {post.tags.length > 0 && (
                          <div className="flex gap-1 mt-3">
                            {post.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Actions - Like and Reply */}
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addReactionMutation.mutate({ 
                            targetType: 'post', 
                            targetId: post.id, 
                            emoji: '👍' 
                          })}
                          data-testid={`like-post-${post.id}`}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes} likes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePostExpansion(post.id)}
                          data-testid={`button-toggle-replies-${post.id}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {post.replies} replies
                        </Button>
                      </div>

                      {/* Reply Section */}
                      {expandedPosts.has(post.id) && (
                        <div className="space-y-4">
                          {/* Add Reply */}
                          <div className="flex gap-3">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={profile?.avatarUrl || undefined} />
                              <AvatarFallback>
                                {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <div className="flex-1">
                                <Input
                                  placeholder="Write a reply..."
                                  value={replyContent[post.id] || ''}
                                  onChange={(e) => setReplyContent(prev => ({ 
                                    ...prev, 
                                    [post.id]: e.target.value 
                                  }))}
                                  className="flex-1"
                                  data-testid={`input-reply-${post.id}`}
                                  maxLength={500}
                                />
                                {replyContent[post.id] && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {replyContent[post.id].length}/500 characters
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addReplyMutation.mutate({ 
                                  postId: post.id, 
                                  content: replyContent[post.id] || '' 
                                })}
                                disabled={
                                  addReplyMutation.isPending || 
                                  !(replyContent[post.id]?.trim())
                                }
                                data-testid={`button-submit-reply-${post.id}`}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Replies would be loaded here */}
                          <div className="pl-10 text-sm text-muted-foreground">
                            Replies will appear here in real-time
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
