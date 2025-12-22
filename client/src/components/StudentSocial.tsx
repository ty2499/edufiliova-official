import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  UserPlus, 
  Users, 
  Check, 
  X, 
  Crown,
  MapPin,
  GraduationCap,
  Clock,
  Dot,
  Heart,
  MessageCircle,
  Ban,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Student {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  grade: number;
  country: string;
  avatarUrl?: string;
  subscriptionTier: string;
  lastSeen?: string;
  isOnline: boolean;
}

interface FriendRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterDisplayName?: string;
  requesterAvatarUrl?: string;
  requesterGrade: number;
  requesterCountry: string;
  createdAt: string;
}

interface Friend {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  grade: number;
  country: string;
  lastSeen?: string;
  isOnline: boolean;
  friendshipDate: string;
}

const StudentSocial = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const presenceIntervalRef = useRef<NodeJS.Timeout>();

  // Check if user has premium access (paid subscription)
  const isPremium = profile?.subscriptionTier === 'elementary' || profile?.subscriptionTier === 'high_school' || profile?.subscriptionTier === 'college_university';

  // Search students
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['/api/students/search', searchQuery],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      
      const response = await apiRequest(`/api/students/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return response.data;
    },
    enabled: !!user && activeTab === 'search'
  });

  // Get friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/students/friend-requests'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/students/friend-requests', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return response.data;
    },
    enabled: !!user && activeTab === 'requests'
  });

  // Get friends list (only for premium users)
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['/api/students/friends'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/students/friends', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return response.data;
    },
    enabled: !!user && activeTab === 'friends' && isPremium
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/students/friend-request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify({ receiverId })
      });
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['/api/students/search'] });
    },
    onError: (error: any) => {
      if (error.isPremiumRequired) {} else {}
    }
  });

  // Accept friend request mutation
  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/students/friend-request/accept', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify({ friendshipId })
      });
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['/api/students/friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/friends'] });
    },
    onError: (error: any) => {}
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async ({ friendshipId, userId }: { friendshipId?: string; userId?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/students/friend-request/block', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify({ friendshipId, userId })
      });
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['/api/students/friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/search'] });
    },
    onError: (error: any) => {}
  });

  // Update presence periodically
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        await apiRequest('/api/students/presence', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionId}` }
        });
      } catch (error) {
        console.error('Failed to update presence:', error);
      }
    };

    // Update presence immediately
    updatePresence();

    // Update presence every 2 minutes
    presenceIntervalRef.current = setInterval(updatePresence, 2 * 60 * 1000);

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
    };
  }, [user]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 5) return 'Online';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const StudentCard = ({ student, showFriendButton = false }: { student: Student; showFriendButton?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatarUrl} />
              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            {student.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm truncate">
                {student.displayName || student.name}
              </h3>
              {student.subscriptionTier === 'premium' && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <GraduationCap className="h-3 w-3" />
              <span>Grade {student.grade}</span>
              <Dot className="h-3 w-3" />
              <MapPin className="h-3 w-3" />
              <span className="truncate">{student.country}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{formatLastSeen(student.lastSeen)}</span>
            </div>
          </div>

          {showFriendButton && (
            <div className="flex space-x-2">
              {!isPremium ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled
                  className="text-xs"
                  data-testid={`button-upgrade-required-${student.userId}`}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => sendFriendRequestMutation.mutate(student.id)}
                  disabled={sendFriendRequestMutation.isPending}
                  data-testid={`button-send-friend-request-${student.userId}`}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const FriendRequestCard = ({ request }: { request: FriendRequest }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.requesterAvatarUrl} />
            <AvatarFallback>{getInitials(request.requesterName)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">
              {request.requesterDisplayName || request.requesterName}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <GraduationCap className="h-3 w-3" />
              <span>Grade {request.requesterGrade}</span>
              <Dot className="h-3 w-3" />
              <MapPin className="h-3 w-3" />
              <span className="truncate">{request.requesterCountry}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(request.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={() => acceptFriendRequestMutation.mutate(request.id)}
              disabled={acceptFriendRequestMutation.isPending}
              data-testid={`button-accept-friend-request-${request.id}`}
            >
              <Check className="h-3 w-3 mr-1" />
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => blockUserMutation.mutate({ friendshipId: request.id })}
              disabled={blockUserMutation.isPending}
              data-testid={`button-block-friend-request-${request.id}`}
            >
              <X className="h-3 w-3 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FriendCard = ({ friend }: { friend: Friend }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={friend.avatarUrl} />
              <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
            </Avatar>
            {friend.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">
              {friend.displayName || friend.name}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <GraduationCap className="h-3 w-3" />
              <span>Grade {friend.grade}</span>
              <Dot className="h-3 w-3" />
              <MapPin className="h-3 w-3" />
              <span className="truncate">{friend.country}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{formatLastSeen(friend.lastSeen)}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              data-testid={`button-message-friend-${friend.userId}`}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to access social features.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Connect with Students</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" data-testid="tab-search">
              Search Students
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">
              Requests ({friendRequests.length})
            </TabsTrigger>
            <TabsTrigger value="friends" data-testid="tab-friends">
              Friends ({friends.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <div className="relative">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search students by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    disabled={!isPremium}
                    data-testid="input-search-students"
                  />
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {searchLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground mt-2">Searching students...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'No students found matching your search.' : 'Search for students to connect with!'}
                        </p>
                      </div>
                    ) : (
                      searchResults.map((student: Student) => (
                        <StudentCard 
                          key={student.id} 
                          student={student} 
                          showFriendButton={true}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Premium Upgrade Overlay */}
              {!isPremium && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Card className="bg-white dark:bg-gray-900 shadow-xl max-w-sm mx-4">
                    <CardContent className="pt-6 text-center">
                      <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">Upgrade to Find Friends</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Premium members can search and connect with students in their grade or higher. Connect with friends and expand your network!
                      </p>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {requestsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading friend requests...</p>
                  </div>
                ) : friendRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No pending friend requests.</p>
                  </div>
                ) : (
                  friendRequests.map((request: FriendRequest) => (
                    <FriendRequestCard key={request.id} request={request} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="friends" className="mt-4">
            <div className="relative">
              <ScrollArea className="h-96">
                <div className={`grid grid-cols-2 gap-3 ${!isPremium ? 'opacity-30 pointer-events-none' : ''}`}>
                  {friendsLoading ? (
                    <div className="col-span-2 text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading friends...</p>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No friends yet. Start by searching for students to connect with!
                      </p>
                    </div>
                  ) : (
                    friends.map((friend: Friend) => (
                      <FriendCard key={friend.id} friend={friend} />
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Premium Upgrade Overlay for Friends */}
              {!isPremium && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Card className="bg-white dark:bg-gray-900 shadow-xl max-w-sm mx-4">
                    <CardContent className="pt-6 text-center">
                      <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">Upgrade to View Friends</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Premium members can see and connect with their friends. Expand your network with other students!
                      </p>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StudentSocial;
