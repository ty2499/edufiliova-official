import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Plus,
  GraduationCap,
  Clock,
  MessageCircle,
  Megaphone,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { MessagingInterface } from './MessagingInterface';
import { CommunityChat } from './CommunityChat';
import { cn } from '@/lib/utils';

interface Student {
  studentId: string;
  name: string;
  pronouns?: string;
  avatarUrl?: string;
  grade: number;
  assignedAt: string;
  subjectId?: string;
  subjectName?: string;
  notes?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetAudience: string;
  targetGrade?: number;
  createdAt: string;
  readBy: string[];
}

export function TeacherMessagingDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedView, setSelectedView] = useState<'students' | 'announcements' | 'messages' | 'community'>('students');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [isInChat, setIsInChat] = useState(false);
  
  // Announcement form state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [targetAudience, setTargetAudience] = useState<'all_students' | 'specific_grade'>('all_students');
  const [targetGrade, setTargetGrade] = useState<number | undefined>();

  // Get assigned students
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher', 'students'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/teacher/students', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user
  });

  // Get teacher announcements
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ['teacher', 'announcements'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/announcements', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      priority: string;
      targetAudience: string;
      targetGrade?: number;
    }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/announcements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'announcements'] });
      setShowAnnouncementDialog(false);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementPriority('normal');
      setTargetAudience('all_students');
      setTargetGrade(undefined);
    }
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    createAnnouncementMutation.mutate({
      title: announcementTitle.trim(),
      content: announcementContent.trim(),
      priority: announcementPriority,
      targetAudience,
      targetGrade: targetAudience === 'specific_grade' ? targetGrade : undefined
    });
  };

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return 'No messages';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-primary dark:text-red-400';
      case 'high': return 'text-primary dark:text-orange-400';
      case 'normal': return 'text-blue-600 dark:text-blue-400';
      case 'low': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'high': return <Badge variant="default" className="text-xs bg-primary">High</Badge>;
      case 'normal': return <Badge variant="secondary" className="text-xs">Normal</Badge>;
      case 'low': return <Badge variant="outline" className="text-xs">Low</Badge>;
      default: return null;
    }
  };

  // If in chat mode, only show the messaging interface full-screen
  if (isInChat && selectedView === 'messages') {
    return (
      <div className="h-screen" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        <MessagingInterface 
          userRole="teacher" 
          onChatModeChange={(chatActive) => {
            setIsInChat(chatActive);
            if (!chatActive) {
              // Quick return to students view without page reload
              setSelectedView("students");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="teacher-messaging-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-announcement">
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Announcement title..."
                  required
                  data-testid="input-announcement-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Announcement content..."
                  rows={4}
                  required
                  data-testid="textarea-announcement-content"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={announcementPriority} onValueChange={(value) => setAnnouncementPriority(value as any)}>
                    <SelectTrigger data-testid="select-announcement-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Target</label>
                  <Select value={targetAudience} onValueChange={(value) => setTargetAudience(value as any)}>
                    <SelectTrigger data-testid="select-target-audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_students">All Students</SelectItem>
                      <SelectItem value="specific_grade">Specific Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {targetAudience === 'specific_grade' && (
                <div>
                  <label className="text-sm font-medium">Grade Level</label>
                  <Input
                    type="number"
                    value={targetGrade || ''}
                    onChange={(e) => setTargetGrade(parseInt(e.target.value))}
                    placeholder="Enter grade level..."
                    min="1"
                    max="12"
                    data-testid="input-target-grade"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAnnouncementDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAnnouncementMutation.isPending}
                  data-testid="button-submit-announcement"
                >
                  {createAnnouncementMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant={selectedView === 'students' ? 'default' : 'outline'}
          onClick={() => setSelectedView('students')}
          data-testid="nav-students"
        >
          <Users className="h-4 w-4 mr-2" />
          Students ({students.length})
        </Button>
        <Button
          variant={selectedView === 'announcements' ? 'default' : 'outline'}
          onClick={() => setSelectedView('announcements')}
          data-testid="nav-announcements"
        >
          <Megaphone className="h-4 w-4 mr-2" />
          Announcements ({announcements.length})
        </Button>
        <Button
          variant={selectedView === 'messages' ? 'default' : 'outline'}
          onClick={() => setSelectedView('messages')}
          data-testid="nav-messages"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Messages
        </Button>
        <Button
          variant={selectedView === 'community' ? 'default' : 'outline'}
          onClick={() => setSelectedView('community')}
          data-testid="nav-community"
        >
          <Users className="h-4 w-4 mr-2" />
          Community
        </Button>
      </div>

      {/* Content */}
      {selectedView === 'students' && (
        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Assigned Students</h2>
          </div>
          
          {studentsLoading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No Students Assigned</h3>
                  <p className="text-sm text-muted-foreground">
                    Contact an administrator to assign students to your classes.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {students.map((student: Student) => (
                <Card 
                  key={student.studentId} 
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    selectedStudent === student.studentId && "bg-accent"
                  )}
                  onClick={() => {
                    setSelectedStudent(student.studentId);
                    setSelectedView('messages');
                  }}
                  data-testid={`student-card-${student.studentId}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback>
                          {student.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{student.name}</h3>
                        {student.pronouns && student.pronouns.toLowerCase() !== 'prefer not to say' && student.pronouns.toLowerCase() !== 'prefer_not_to_say' && (
                          <p className="text-xs text-muted-foreground">{student.pronouns}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Grade {student.grade}</p>
                        {student.subjectName && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {student.subjectName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last Message:</span>
                        <span>{formatMessageTime(student.lastMessageTime)}</span>
                      </div>
                      {student.unreadCount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Unread:</span>
                          <Badge variant="default" className="h-5 w-5 text-xs">
                            {student.unreadCount}
                          </Badge>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student.studentId);
                          setSelectedView('messages');
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedView === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            <h2 className="text-xl font-semibold">My Announcements</h2>
          </div>
          
          {announcementsLoading ? (
            <div className="text-center py-8">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No Announcements</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first announcement to communicate with students.
                  </p>
                  <Button onClick={() => setShowAnnouncementDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Announcement
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement: Announcement) => (
                <Card key={announcement.id} data-testid={`announcement-${announcement.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(announcement.priority)}
                          <Badge variant="outline" className="text-xs">
                            {announcement.targetAudience === 'all_students' ? 'All Students' : `Grade ${announcement.targetGrade}`}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {announcement.readBy?.length || 0} students read
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(announcement.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedView === 'messages' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>
          <MessagingInterface 
            userRole="teacher" 
            onChatModeChange={(chatActive) => {
              setIsInChat(chatActive);
              if (!chatActive) {
                // Quick return to students view without page reload
                setSelectedView("students");
              }
            }}
          />
        </div>
      )}

      {selectedView === 'community' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Community</h2>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <CommunityChat />
          </div>
        </div>
      )}
    </div>
  );
}
