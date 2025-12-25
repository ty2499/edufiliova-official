import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Plus, 
  Search,
  Users,
  Heart,
  MessageCircle,
  Send,
  TrendingUp,
  Clock,
  User,
  BookOpen,
  UserPlus,
  ThumbsUp,
  Reply,
  Hash,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import SubscriptionPaymentModal from '@/components/SubscriptionPaymentModal';
import { GRADE_SUBSCRIPTION_PLANS } from '@shared/schema';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripePromise } from '@/lib/stripe';

interface Post {
  id: string;
  title: string;
  content: string;
  subject?: string;
  grade?: number;
  communityReactions: number;
  replyCount: number;
  createdAt: string;
  groupId?: string;
  groupName?: string;
  isLiked?: boolean;
  author: {
    id: string;
    name: string;
    profilePic?: string;
  };
}

interface Reply {
  id: string;
  postId: string;
  content: string;
  likes: number;
  createdAt: string;
  isLiked?: boolean;
  author: {
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
  createdBy: string;
  isMember?: boolean;
  status?: string;
  maxMembers?: number;
  isPrivate?: boolean;
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
  friendshipStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
}

export function CommunityChat() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  // Check if user has premium subscription
  const isPremium = profile?.subscriptionTier && profile.subscriptionTier !== null;
  
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'post-details'>('list');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [showRepliesDialog, setShowRepliesDialog] = useState(false);
  const [repliesDialogPost, setRepliesDialogPost] = useState<Post | null>(null);

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);
  
  // Form states
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    subject: '',
    groupId: ''
  });
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });
  const [editPost, setEditPost] = useState({
    title: '',
    content: '',
    subject: ''
  });
  const [replyContent, setReplyContent] = useState('');
  const [editingReply, setEditingReply] = useState<Reply | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [showReplyToReply, setShowReplyToReply] = useState<string | null>(null);
  const [replyToReplyContent, setReplyToReplyContent] = useState('');

  // Fetch posts with search functionality
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', searchQuery, selectedGroup, activeTab],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedGroup) params.append('groupId', selectedGroup);
      if (activeTab === 'my-posts' && user?.id) params.append('authorId', user.id);
      
      const response = await apiRequest(`/api/community/posts?${params.toString()}`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      // apiRequest already returns result.data, so response is the posts array
      return response || [];
    },
    enabled: !!user && ['discover', 'my-posts'].includes(activeTab)
  });

  // Fetch groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['community-groups', searchQuery],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await apiRequest(`/api/community/groups?${params.toString()}`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      // apiRequest already returns result.data, so response is the groups array
      return response || [];
    },
    enabled: !!user && activeTab === 'groups'
  });

  // Fetch students for find friends with real search
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['community-students', friendSearch],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (friendSearch) params.append('search', friendSearch);
      // Only show grade 10+ students
      params.append('grade', '10');
      
      const response = await apiRequest(`/api/students/search?${params.toString()}`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      // apiRequest already returns result.data, so response is the students array
      return response || [];
    },
    enabled: !!(user && activeTab === 'friends' && isPremium)
  });

  // Fetch replies for selected post
  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ['community-replies', selectedPost?.id],
    queryFn: async () => {
      if (!selectedPost) return [];
      
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/posts/${selectedPost.id}/replies`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      // apiRequest already returns result.data, so response is the replies array
      return response || [];
    },
    enabled: !!selectedPost && viewMode === 'post-details'
  });

  // Fetch replies for dialog popup
  const { data: dialogReplies = [], isLoading: dialogRepliesLoading } = useQuery({
    queryKey: ['community-dialog-replies', repliesDialogPost?.id],
    queryFn: async () => {
      if (!repliesDialogPost) return [];
      
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/posts/${repliesDialogPost.id}/replies`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });
      
      return response || [];
    },
    enabled: !!repliesDialogPost && showRepliesDialog
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: typeof newPost) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify(postData)
      });
      return response.data;
    },
    onSuccess: () => {
      setShowCreatePost(false);
      setNewPost({ title: '', content: '', subject: '', groupId: '' });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof newGroup) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/community/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify(groupData)
      });
      return response.data;
    },
    onSuccess: () => {
      setShowCreateGroup(false);
      setNewGroup({ name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
    }
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      // Also refresh the messaging interface groups
      queryClient.invalidateQueries({ queryKey: ['messaging', 'user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      // Also refresh the messaging interface groups
      queryClient.invalidateQueries({ queryKey: ['messaging', 'user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  // Delete group mutation (Admin/Creator only)
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      // Also refresh the messaging interface groups
      queryClient.invalidateQueries({ queryKey: ['messaging', 'user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  // Remove user from group mutation
  const removeUserMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/groups/${groupId}/remove-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ userId })
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
    }
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (userId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/community/friend-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-students'] });
    }
  });

  // Reply to post mutation
  const replyMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/community/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ postId, content })
      });
      return response.data;
    },
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['community-replies', selectedPost?.id] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }
  });

  // Edit post mutation
  const editPostMutation = useMutation({
    mutationFn: async ({ postId, title, content, subject }: { postId: string; title: string; content: string; subject?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ title, content, subject })
      });
      return response.data;
    },
    onSuccess: () => {
      setShowEditPost(false);
      setEditingPost(null);
      setEditPost({ title: '', content: '', subject: '' });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }
  });

  // Edit reply mutation
  const editReplyMutation = useMutation({
    mutationFn: async ({ replyId, content }: { replyId: string; content: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ content })
      });
      return response.data;
    },
    onSuccess: () => {
      setEditingReply(null);
      setEditReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['community-replies', selectedPost?.id] });
    }
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-replies', selectedPost?.id] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }
  });

  // Like reply mutation
  const likeReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/community/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-replies', selectedPost?.id] });
    }
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      return;
    }
    createPostMutation.mutate(newPost);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      return;
    }
    createGroupMutation.mutate(newGroup);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPost({
      title: post.title,
      content: post.content,
      subject: post.subject || ''
    });
    setShowEditPost(true);
  };

  const handleUpdatePost = () => {
    if (!editingPost || !editPost.title.trim() || !editPost.content.trim()) {
      return;
    }
    editPostMutation.mutate({
      postId: editingPost.id,
      title: editPost.title,
      content: editPost.content,
      subject: editPost.subject
    });
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReply(reply);
    setEditReplyContent(reply.content);
  };

  const handleUpdateReply = () => {
    if (!editingReply || !editReplyContent.trim()) {
      return;
    }
    editReplyMutation.mutate({
      replyId: editingReply.id,
      content: editReplyContent
    });
  };

  const handleCancelEditReply = () => {
    setEditingReply(null);
    setEditReplyContent('');
  };

  // Check if user is grade 7 or above
  if (!profile?.grade || profile.grade < 7) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Community Access</h2>
          <p className="text-muted-foreground max-w-md">
            Community features are available for students in Grade 7 and above. 
            You can still chat with teachers and administrators for support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 bg-white border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Community</h1>
            <p className="text-muted-foreground">Connect & Learn Together</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowCreatePost(true)}
              className="bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] hover:scale-100 active:scale-100"
              data-testid="button-create-topic"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Topic
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="px-6 py-4 bg-white border-b border-border">
            <div className="flex flex-col gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === 'friends' ? "Search students by name, grade, or country..." : "Search topics, subjects, or groups..."}
                  value={activeTab === 'friends' ? friendSearch : searchQuery}
                  onChange={(e) => {
                    if (activeTab === 'friends') {
                      setFriendSearch(e.target.value);
                    } else {
                      setSearchQuery(e.target.value);
                    }
                  }}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              
              {/* Tabs */}
              <TabsList className={`grid w-full ${(profile?.role === 'teacher' || profile?.role === 'customer_service') ? 'grid-cols-3' : 'grid-cols-4'} lg:w-auto lg:flex`}>
                <TabsTrigger value="discover" className="text-xs">
                  <TrendingUp className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Discover</span>
                </TabsTrigger>
                <TabsTrigger value="groups" className="text-xs">
                  <Hash className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Groups</span>
                </TabsTrigger>
                {profile?.role !== 'teacher' && profile?.role !== 'customer_service' && (
                  <TabsTrigger value="friends" className="text-xs">
                    <UserPlus className="h-4 w-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">Find Friends</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="my-posts" className="text-xs">
                  <User className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">My Posts</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {/* Discover Tab */}
            <TabsContent value="discover" className="h-full m-0">
              <div className="h-full overflow-y-auto p-4 md:p-6">
                {postsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading topics...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No topics found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? "Try adjusting your search terms" : "Be the first to start a discussion!"}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowCreatePost(true)} className="bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] hover:scale-100 active:scale-100">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Topic
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post: Post) => (
                      <Card 
                        key={post.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer" transition-all duration-300
                        onClick={() => {
                          setSelectedPost(post);
                          setViewMode('post-details');
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={post.author.profilePic} />
                              <AvatarFallback>{post.author.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-foreground">
                                    {post.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    by {post.author.name} • {formatTimeAgo(post.createdAt)}
                                  </p>
                                </div>
                              </div>
                              
                              <p className="text-foreground mb-3 line-clamp-3">{post.content}</p>
                              
                              {/* Tags */}
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {post.subject && (
                                  <Badge variant="secondary" className="text-xs">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {post.subject}
                                  </Badge>
                                )}
                                {post.grade && (
                                  <Badge variant="outline" className="text-xs">
                                    Grade {post.grade}
                                  </Badge>
                                )}
                                {post.groupName && (
                                  <Badge variant="outline" className="text-xs">
                                    <Hash className="h-3 w-3 mr-1" />
                                    {post.groupName}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      likePostMutation.mutate(post.id);
                                    }}
                                    className={cn(
                                      "gap-1",
                                      post.isLiked && "text-primary"
                                    )}
                                  >
                                    <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} />
                                    {post.communityReactions}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRepliesDialogPost(post);
                                      setShowRepliesDialog(true);
                                    }}
                                    className="gap-1"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    {post.replyCount} {post.replyCount === 1 ? 'Reply' : 'Replies'}
                                  </Button>
                                </div>
                                {/* Edit/Delete buttons for post author or admin */}
                                {profile && (post.author.id === profile.userId || profile.role === 'admin') && (
                                  <div className="flex items-center gap-2">
                                    {/* Only show edit button for post author, not admin */}
                                    {post.author.id === profile.userId && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditPost(post);
                                        }}
                                        disabled={editPostMutation.isPending}
                                        className="gap-1 text-muted-foreground hover:text-foreground" transition-all duration-300
                                        data-testid={`button-edit-post-${post.id}`}
                                      >
                                        {editPostMutation.isPending && editingPost?.id === post.id ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                        ) : (
                                          <Edit2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                    {/* Delete button for post author or admin */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const isAdmin = profile.role === 'admin';
                                        const message = isAdmin && post.author.id !== profile.userId 
                                          ? `Are you sure you want to delete this post by ${post.author.name}? (Admin action)`
                                          : 'Are you sure you want to delete this post?';
                                        if (confirm(message)) {
                                          deletePostMutation.mutate(post.id);
                                        }
                                      }}
                                      disabled={deletePostMutation.isPending}
                                      className="gap-1 text-muted-foreground hover:text-primary disabled:opacity-50" transition-all duration-300
                                      data-testid={`button-delete-post-${post.id}`}
                                    >
                                      {deletePostMutation.isPending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="h-full m-0">
              <div className="h-full overflow-y-auto p-4 md:p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Study Groups</h2>
                    <Button 
                      onClick={() => setShowCreateGroup(true)}
                      size="sm"
                      className="bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] hover:scale-100 active:scale-100"
                      data-testid="button-new-group"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Group
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Join approved study groups to collaborate with peers. Groups require admin approval.
                  </p>
                </div>

                {groupsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading groups...</p>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No approved groups found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a group and wait for admin approval, or join existing approved groups
                    </p>
                    <Button onClick={() => setShowCreateGroup(true)} className="bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] hover:scale-100 active:scale-100">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group (Pending Approval)
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group: Group) => (
                      <Card key={group.id} className="hover:shadow-md transition-shadow" transition-all duration-300>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold">{group.name}</h3>
                              {group.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {group.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {group.isPrivate ? 'Private' : 'Public'}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {group.memberCount}/{group.maxMembers || 100000}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {group.postCount} posts
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Created by {group.creatorName} • {formatTimeAgo(group.createdAt)}
                            </p>
                            {group.isMember ? (
                              <div className="space-y-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="w-full" 
                                  disabled
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Already Joined
                                </Button>
                                
                                {/* Group Management Options */}
                                <div className="flex gap-2">
                                  {/* Leave Group Button */}
                                  {group.createdBy !== user?.id && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        if (confirm('Are you sure you want to leave this group?')) {
                                          leaveGroupMutation.mutate(group.id);
                                        }
                                      }}
                                      disabled={leaveGroupMutation.isPending}
                                      className="flex-1 text-primary hover:text-primary hover:bg-primary/10" transition-all duration-300
                                    >
                                      Leave Group
                                    </Button>
                                  )}
                                  
                                  {/* Delete Group Button (Admin/Creator only) */}
                                  {(profile?.role === 'admin' || group.createdBy === user?.id) && (
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => {
                                        if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                                          deleteGroupMutation.mutate(group.id);
                                        }
                                      }}
                                      disabled={deleteGroupMutation.isPending}
                                      className="flex-1"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => joinGroupMutation.mutate(group.id)}
                                disabled={joinGroupMutation.isPending || group.memberCount >= (group.maxMembers || 100000)}
                                className="w-full bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] hover:scale-100 active:scale-100"
                              >
                                {joinGroupMutation.isPending ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                ) : (
                                  <UserPlus className="h-4 w-4 mr-2" />
                                )}
                                {group.memberCount >= (group.maxMembers || 100000) ? 'Group Full' : 'Join Group'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Find Friends Tab */}
            {profile?.role !== 'teacher' && profile?.role !== 'customer_service' && (
              <TabsContent value="friends" className="h-full m-0">
              <div className="h-full overflow-y-auto p-4 md:p-6">
                {!isPremium ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center max-w-md">
                      <UserPlus className="h-16 w-16 text-blue-500 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold mb-3">Unlock Find Friends</h3>
                      <p className="text-muted-foreground mb-6">
                        Upgrade to premium to discover and connect with students worldwide from Grade 10 and above.
                      </p>
                      <Button 
                        size="lg" 
                        className="bg-primary hover:bg-primary text-white" transition-all duration-300
                        onClick={() => setShowPaymentModal(true)}
                        data-testid="button-upgrade-premium"
                      >
                        Upgrade to Premium
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold">Find Friends</h2>
                      <p className="text-sm text-muted-foreground">Connect with fellow students from Grade 10 and above</p>
                    </div>

                    {studentsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading students...</p>
                      </div>
                    ) : students.length === 0 ? (
                      <div className="text-center py-12">
                        <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No students found</h3>
                        <p className="text-muted-foreground">Try adjusting your search terms</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {students.map((student: Student) => (
                          <Card key={student.id} className="hover:shadow-md transition-shadow" transition-all duration-300>
                            <CardContent className="p-4">
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
                                {student.friendshipStatus === 'none' || student.friendshipStatus === 'rejected' ? (
                                  <Button 
                                    size="sm" 
                                    onClick={() => sendFriendRequestMutation.mutate(student.userId)}
                                    disabled={sendFriendRequestMutation.isPending}
                                    className="bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] hover:scale-100 active:scale-100"
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Add Friend
                                  </Button>
                                ) : student.friendshipStatus === 'pending' ? (
                                  <Badge variant="outline" className="text-xs">
                                    Request Sent
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs">
                                    Friends
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
            )}

            {/* My Posts Tab */}
            <TabsContent value="my-posts" className="h-full m-0">
              <div className="h-full overflow-y-auto p-4 md:p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">My Posts</h2>
                  <p className="text-sm text-muted-foreground">Topics and discussions you've started</p>
                </div>

                {postsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading your posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">Start sharing your thoughts and knowledge</p>
                    <Button onClick={() => setShowCreatePost(true)} className="bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] hover:scale-100 active:scale-100">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post: Post) => (
                      <Card 
                        key={post.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer" transition-all duration-300
                        onClick={() => {
                          setSelectedPost(post);
                          setViewMode('post-details');
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={post.author.profilePic} />
                              <AvatarFallback>{post.author.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Posted {formatTimeAgo(post.createdAt)}
                                  </p>
                                </div>
                              </div>
                              
                              <p className="text-foreground mb-3 line-clamp-3">{post.content}</p>
                              
                              {/* Tags */}
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {post.subject && (
                                  <Badge variant="secondary" className="text-xs">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {post.subject}
                                  </Badge>
                                )}
                                {post.grade && (
                                  <Badge variant="outline" className="text-xs">
                                    Grade {post.grade}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Stats */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  {post.communityReactions} likes
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4" />
                                  {post.replyCount} replies
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="post-title">Title *</Label>
              <Input
                id="post-title"
                placeholder="What's your topic about?"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                data-testid="new-topic-title"
              />
            </div>
            <div>
              <Label htmlFor="post-content">Content *</Label>
              <Textarea
                id="post-content"
                placeholder="Share your thoughts, questions, or knowledge..."
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[120px]"
                data-testid="new-topic-content"
              />
            </div>
            <div>
              <Label htmlFor="post-subject">Subject (Optional)</Label>
              <Input
                id="post-subject"
                placeholder="e.g. Mathematics, Science, English"
                value={newPost.subject}
                onChange={(e) => setNewPost(prev => ({ ...prev, subject: e.target.value }))}
                data-testid="new-topic-subject"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePost} 
                disabled={createPostMutation.isPending}
                className="bg-[#0C332C] text-[#ffffff]"
              >
                {createPostMutation.isPending ? 'Creating...' : 'Create Topic'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={showEditPost} onOpenChange={setShowEditPost}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editPost.title}
                onChange={(e) => setEditPost(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's your topic about?"
                data-testid="input-edit-post-title"
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Subject (Optional)</Label>
              <Input
                id="edit-subject"
                value={editPost.subject}
                onChange={(e) => setEditPost(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Mathematics, Science, History..."
                data-testid="input-edit-post-subject"
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                value={editPost.content}
                onChange={(e) => setEditPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts, questions, or discussion points..."
                className="min-h-[120px]"
                data-testid="textarea-edit-post-content"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditPost(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdatePost} 
                disabled={editPostMutation.isPending}
                className="bg-[#A0FAB2] hover:bg-[#0C332C] text-black" transition-all duration-300
                data-testid="button-update-post"
              >
                {editPostMutation.isPending ? 'Updating...' : 'Update Topic'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                placeholder="Enter group name..."
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Textarea
                id="group-description"
                placeholder="What is this group about?"
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroup} 
                disabled={createGroupMutation.isPending}
                className="bg-[#A0FAB2] hover:bg-[#0C332C] text-black" transition-all duration-300
              >
                {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Details View */}
      {viewMode === 'post-details' && selectedPost && (
        <div className="h-full flex flex-col bg-white">
          {/* Back Navigation Header */}
          <div className="p-4 bg-card border-b border-border">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  setSelectedPost(null);
                }}
                className="gap-2"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Back to Posts
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Selected Post */}
            <div className="p-6 bg-card border-b border-border">
              <div className="flex gap-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={selectedPost.author.profilePic} />
                  <AvatarFallback>{selectedPost.author.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedPost.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        by {selectedPost.author.name} • {formatTimeAgo(selectedPost.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-foreground mb-4 leading-relaxed">{selectedPost.content}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {selectedPost.subject && (
                      <Badge variant="secondary" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {selectedPost.subject}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Post Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {selectedPost.communityReactions} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {replies.length} replies
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Input */}
            <div className="p-4 bg-card border-b border-border">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback>{profile?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="flex-1 min-h-[60px] resize-none"
                  />
                  <Button
                    onClick={() => selectedPost && replyMutation.mutate({ postId: selectedPost.id, content: replyContent })}
                    disabled={!replyContent.trim() || replyMutation.isPending}
                    size="sm"
                    className="self-end bg-[#A0FAB2] hover:bg-[#0C332C] text-black" transition-all duration-300
                  >
                    {replyMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Replies List */}
            <div className="p-4">
              {repliesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading replies...</p>
                </div>
              ) : replies.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
                </div>
              ) : (
                <div className="space-y-4">
                {replies.map((reply: Reply) => (
                  <div key={reply.id} className="flex gap-3 p-3 hover:bg-muted/20 transition-colors duration-200 rounded-lg" transition-all duration-300>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={reply.author.profilePic} />
                      <AvatarFallback>{reply.author.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">{reply.author.name}</span>
                          <span className="text-sm text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
                        </div>
                        {/* Edit/Delete buttons for reply author */}
                        {profile && reply.author.id === profile.userId && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReply(reply)}
                              disabled={editReplyMutation.isPending}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-50" transition-all duration-300
                              data-testid={`button-edit-reply-${reply.id}`}
                            >
                              {editReplyMutation.isPending && editingReply?.id === reply.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                              ) : (
                                <Edit2 className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this reply?')) {
                                  deleteReplyMutation.mutate(reply.id);
                                }
                              }}
                              disabled={deleteReplyMutation.isPending}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary disabled:opacity-50" transition-all duration-300
                              data-testid={`button-delete-reply-${reply.id}`}
                            >
                              {deleteReplyMutation.isPending ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                      {editingReply?.id === reply.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editReplyContent}
                            onChange={(e) => setEditReplyContent(e.target.value)}
                            className="min-h-[60px] text-sm"
                            data-testid={`textarea-edit-reply-${reply.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleUpdateReply}
                              disabled={editReplyMutation.isPending}
                              className="h-6 text-xs bg-[#A0FAB2] hover:bg-[#0C332C] text-black" transition-all duration-300
                              data-testid={`button-save-reply-${reply.id}`}
                            >
                              {editReplyMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEditReply}
                              className="h-6 text-xs"
                              data-testid={`button-cancel-edit-reply-${reply.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="inline-block p-3 bg-muted/30 rounded-2xl border border-border/50 max-w-[85%]">
                            <p className="text-foreground leading-relaxed text-sm">{reply.content}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => likeReplyMutation.mutate(reply.id)}
                          disabled={likeReplyMutation.isPending}
                          className={`text-sm transition-colors p-2 h-auto rounded-full hover:bg-primary/10 dark:hover:bg-red-950/20 ${
                            reply.isLiked 
                              ? 'text-primary hover:text-primary' 
                              : 'text-muted-foreground hover:text-primary'
                          }`}
                        >
                          <Heart className={`h-4 w-4 mr-1 transition-colors ${
                            reply.isLiked ? 'fill-current text-primary' : ''
                          }`} />
                          <span className="text-xs font-medium">{reply.likes || 0}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            // Handle reply to reply functionality
                            console.log('Reply to reply:', reply.id);
                          }}
                          className="text-sm text-muted-foreground hover:text-[#A0FAB2] hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors p-1 h-auto rounded-full" transition-all duration-300
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Reply</span>
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Payment Modal */}
      {showPaymentModal && (
        <Elements stripe={stripePromise}>
          <SubscriptionPaymentModal
            plan={{
              tier: 'high_school',
              name: GRADE_SUBSCRIPTION_PLANS.high_school.name,
              price: GRADE_SUBSCRIPTION_PLANS.high_school.pricing.monthly,
              interval: 'monthly',
              description: GRADE_SUBSCRIPTION_PLANS.high_school.description,
              features: [...GRADE_SUBSCRIPTION_PLANS.high_school.features]
            }}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              setShowPaymentModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
            }}
          />
        </Elements>
      )}

      {/* Replies Popup Dialog */}
      <Dialog open={showRepliesDialog} onOpenChange={setShowRepliesDialog}>
        <DialogContent className="max-w-2xl w-[90vw] h-[85vh] max-h-[700px] flex flex-col p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              Replies
            </DialogTitle>
            {repliesDialogPost && (
              <p className="text-sm text-muted-foreground mt-2">
                "{repliesDialogPost.title}" by {repliesDialogPost.author.name}
              </p>
            )}
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Reply Input */}
            <div className="flex gap-2 mb-4 pb-4 border-b">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyContent.trim() && repliesDialogPost) {
                    replyMutation.mutate({ postId: repliesDialogPost.id, content: replyContent });
                    setReplyContent('');
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (replyContent.trim() && repliesDialogPost) {
                    replyMutation.mutate({ postId: repliesDialogPost.id, content: replyContent });
                    setReplyContent('');
                    queryClient.invalidateQueries({ queryKey: ['community-dialog-replies', repliesDialogPost.id] });
                    queryClient.invalidateQueries({ queryKey: ['community-posts'] });
                  }
                }}
                disabled={!replyContent.trim() || replyMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Replies List */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-4 pr-4 pb-4">
                {dialogRepliesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading replies...</p>
                  </div>
                ) : dialogReplies.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
                  </div>
                ) : (
                  dialogReplies.map((reply: Reply) => (
                    <div key={reply.id} className="flex gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={reply.author.profilePic} />
                        <AvatarFallback className="text-sm font-medium">
                          {reply.author.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{reply.author.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{reply.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => likeReplyMutation.mutate(reply.id)}
                            className={`h-6 px-2 text-xs ${reply.isLiked ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            <Heart className={`h-3 w-3 mr-1 ${reply.isLiked ? 'fill-current' : ''}`} />
                            {reply.likes || 0}
                          </Button>
                          {profile && reply.author.id === profile.userId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this reply?')) {
                                  deleteReplyMutation.mutate(reply.id);
                                  queryClient.invalidateQueries({ queryKey: ['community-dialog-replies'] });
                                }
                              }}
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-primary" transition-all duration-300
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
