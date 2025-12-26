import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, MessageSquare, Search, Crown, Shield, Clock, XCircle, Users2 } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface Student {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  grade: number;
  country: string;
  subscriptionTier: string;
  isOnline: boolean;
  friendshipStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
}

interface FriendRequest {
  id: string;
  requesterId: string;
  requesterUserId: string;
  requesterName: string;
  requesterAvatar?: string;
  requesterGrade: number;
  requesterCountry: string;
  message?: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  memberCount: number;
  maxMembers: number;
  tags: string[];
  createdAt: string;
  creatorName: string;
}

export default function StudentNetworking() {
  const { user, profile } = useAuth();
  
  // Check if user is premium
  const isPremium = profile?.subscriptionTier === 'elementary' || profile?.subscriptionTier === 'high_school' || profile?.subscriptionTier === 'college_university';
  
  const [students, setStudents] = useState<Student[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState('find-friends');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Loading states
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Dialog states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupTags, setNewGroupTags] = useState('');
  const [isPrivateGroup, setIsPrivateGroup] = useState(false);

  // Auth check
  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to access student networking features.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Community access for all user types - students, teachers, and admins can all see students
  // Removed role restriction to allow universal student discovery

  // Search for students
  const searchStudents = async () => {
    if (!searchQuery.trim() && !searchGrade && !searchCountry) {
      setStudents([]); // Clear results if no search criteria
      return;
    }
    
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery);
      if (searchGrade) params.append('grade', searchGrade);
      if (searchCountry) params.append('country', searchCountry);

      const response = await fetch(`/api/students/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Only show real students from database - no fake data
        setStudents(data.data || []);
      } else {setStudents([]);
      }
    } catch (error) {setStudents([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (receiverId: string, message: string = '') => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          receiverId,
          message
        }),
      });

      const data = await response.json();
      if (data.success) {// Remove from search results or mark as pending
        setStudents(prev => prev.filter(s => s.userId !== receiverId));
      } else {}
    } catch (error) {}
  };

  // Load friend requests
  const loadFriendRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch('/api/friends/requests', {
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFriendRequests(data.data);
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Respond to friend request
  const respondToRequest = async (friendshipId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          friendshipId,
          action
        }),
      });

      const data = await response.json();
      if (data.success) {// Remove from pending requests
        setFriendRequests(prev => prev.filter(req => req.id !== friendshipId));
        // Refresh friends list if accepted
        if (action === 'accept') {
          loadFriends();
        }
      } else {}
    } catch (error) {}
  };

  // Load friends
  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const response = await fetch('/api/students/friends', {
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFriends(data.data);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Load groups
  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Create group
  const createGroup = async () => {
    if (!newGroupName.trim()) {return;
    }

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
          isPrivate: isPrivateGroup,
          tags: newGroupTags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }),
      });

      const data = await response.json();
      if (data.success) {setShowCreateGroup(false);
        setNewGroupName('');
        setNewGroupDescription('');
        setNewGroupTags('');
        setIsPrivateGroup(false);
      } else {}
    } catch (error) {}
  };

  // Join group
  const joinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      const data = await response.json();
      if (data.success) {loadGroups(); // Refresh groups
      } else {}
    } catch (error) {}
  };

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'requests') {
      loadFriendRequests();
    } else if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'groups') {
      loadGroups();
    }
  }, [activeTab]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Student Community</h1>
        <p className="text-gray-600 dark:text-gray-300">Connect & Learn Together - Find students, make friends, and join study groups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="find-friends" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Friends
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Requests
            {friendRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {friendRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Friends
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="find-friends" className="mt-6">
          <div className="relative">
            <Card className={!isPremium ? 'opacity-30 pointer-events-none' : ''}>
              <CardHeader>
                <CardTitle>Find Students</CardTitle>
                <CardDescription>Search for other students to connect with</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
                />
                <Select value={searchGrade} onValueChange={setSearchGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_grades">All Grades</SelectItem>
                    {[10, 11, 12].map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={searchCountry} onValueChange={setSearchCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_countries">All Countries</SelectItem>
                    <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                    <SelectItem value="Albania">Albania</SelectItem>
                    <SelectItem value="Algeria">Algeria</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Austria">Austria</SelectItem>
                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                    <SelectItem value="Belgium">Belgium</SelectItem>
                    <SelectItem value="Brazil">Brazil</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Egypt">Egypt</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Indonesia">Indonesia</SelectItem>
                    <SelectItem value="Iran">Iran</SelectItem>
                    <SelectItem value="Iraq">Iraq</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="Malaysia">Malaysia</SelectItem>
                    <SelectItem value="Malta">Malta</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="Pakistan">Pakistan</SelectItem>
                    <SelectItem value="Philippines">Philippines</SelectItem>
                    <SelectItem value="Russia">Russia</SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="South Africa">South Africa</SelectItem>
                    <SelectItem value="South Korea">South Korea</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Thailand">Thailand</SelectItem>
                    <SelectItem value="Turkey">Turkey</SelectItem>
                    <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Vietnam">Vietnam</SelectItem>
                    <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={searchStudents} disabled={isSearching} className="mb-6">
                {isSearching ? 'Searching...' : 'Search Students'}
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <Card key={student.id} className="hover:shadow-md transition-shadow transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={student.avatarUrl} />
                            <AvatarFallback>{student.name[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{student.name}</h4>
                          <p className="text-sm text-gray-600">Grade {student.grade}</p>
                          <p className="text-sm text-gray-600">{student.country}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {student.subscriptionTier === 'premium' && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                            {student.isOnline && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                Online
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3">
                            {student.friendshipStatus === 'none' || student.friendshipStatus === 'rejected' || !student.friendshipStatus ? (
                              <Button
                                size="sm"
                                onClick={() => sendFriendRequest(student.userId)}
                                className="w-full"
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Friend
                              </Button>
                            ) : student.friendshipStatus === 'pending' ? (
                              <Badge variant="outline" className="text-xs w-full justify-center py-2">
                                Request Sent
                              </Badge>
                            ) : student.friendshipStatus === 'accepted' ? (
                              <Badge variant="default" className="text-xs w-full justify-center py-2 bg-green-600">
                                Friends
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => sendFriendRequest(student.userId)}
                                className="w-full"
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Friend
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

            {/* Premium Upgrade Overlay for Find Friends */}
            {!isPremium && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Card className="bg-white dark:bg-gray-900 shadow-xl max-w-sm mx-4">
                  <CardContent className="pt-6 text-center">
                    <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">Upgrade to Find Friends</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Premium members can search and connect with students worldwide. Expand your network today!
                    </p>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
              <CardDescription>Manage incoming friend requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : friendRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending friend requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={request.requesterAvatar} />
                        <AvatarFallback>{request.requesterName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{request.requesterName}</h4>
                        <p className="text-sm text-gray-600">
                          Grade {request.requesterGrade} • {request.requesterCountry}
                        </p>
                        {request.message && (
                          <p className="text-sm text-gray-700 mt-1 italic">"{request.message}"</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => respondToRequest(request.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700 transition-all duration-300"
                        >
                          <CheckmarkIcon size="sm" variant="success" className="mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondToRequest(request.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
              <CardDescription>Your connected student network</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFriends ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full mb-3" />
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No friends yet</p>
                  <p className="text-sm mt-2">Search for students and send friend requests to build your network!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => (
                    <Card key={friend.userId} className="hover:shadow-md transition-shadow transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={friend.avatarUrl} />
                              <AvatarFallback>{friend.name[0]}</AvatarFallback>
                            </Avatar>
                            {friend.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{friend.name}</h4>
                            <p className="text-sm text-gray-600">Grade {friend.grade}</p>
                            <p className="text-sm text-gray-600">{friend.country}</p>
                            {friend.isOnline && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 mt-2">
                                Online
                              </Badge>
                            )}
                            {profile?.subscriptionTier === 'premium' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-3 w-full"
                                onClick={() => {
                                  // Only premium users can send messages, verified server-side
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Study Groups</CardTitle>
                  <CardDescription>Join approved study groups or create your own</CardDescription>
                </div>
                <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                  <DialogTrigger asChild>
                    <Button>
                      <Users2 className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Study Group</DialogTitle>
                      <DialogDescription>
                        Create a new study group. All groups require admin approval before becoming active.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input
                        placeholder="Group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <Textarea
                        placeholder="Group description"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                      />
                      <Input
                        placeholder="Tags (comma-separated)"
                        value={newGroupTags}
                        onChange={(e) => setNewGroupTags(e.target.value)}
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="private"
                          checked={isPrivateGroup}
                          onChange={(e) => setIsPrivateGroup(e.target.checked)}
                        />
                        <label htmlFor="private" className="text-sm">Private group (invitation only)</label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createGroup}>
                          Create Group
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingGroups ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-full mb-3" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No approved groups available</p>
                    <p className="text-sm mt-2">Be the first to create a study group!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <Card key={group.id} className="hover:shadow-md transition-shadow transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{group.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                              <p className="text-xs text-gray-500 mt-2">Created by {group.creatorName}</p>
                            </div>
                            <Avatar className="ml-3">
                              <AvatarImage src={group.avatarUrl} />
                              <AvatarFallback>{group.name[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600">
                              {group.memberCount}/{group.maxMembers} members
                            </span>
                            <div className="flex gap-1">
                              {group.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <Button 
                            onClick={() => joinGroup(group.id)}
                            disabled={group.memberCount >= group.maxMembers}
                            className="w-full"
                          >
                            {group.memberCount >= group.maxMembers ? 'Group Full' : 'Join Group'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
