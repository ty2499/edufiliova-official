import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video,
  ArrowLeft,
  Loader2,
  Edit,
  XCircle,
  PlayCircle,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import TeacherLayout, { NavIcons, type NavItem } from "@/components/teacher/TeacherLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Meeting {
  id: string;
  title: string;
  lessonDescription: string;
  scheduledTime: string;
  duration: number;
  targetGrades: string[];
  mode: "interactive" | "broadcast";
  maxParticipants: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  participantCount: number;
  actualStartTime?: string;
  actualEndTime?: string;
}

interface TeacherMeetingDetailProps {
  meetingId: string | null;
}

export default function TeacherMeetingDetail({ meetingId }: TeacherMeetingDetailProps) {
  const { user, profile } = useAuth();
  const [, navigate] = useLocation();
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Navigation items for teacher sidebar
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: NavIcons.Home, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-overview' },
    { id: 'students', label: 'Students', icon: NavIcons.Users, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-students' },
    { id: 'classes', label: 'Classes', icon: NavIcons.BookOpen, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-classes' },
    { id: 'meetings', label: 'Meetings', icon: NavIcons.Video, onClick: () => navigate('/teacher-meetings'), testId: 'nav-meetings' },
    { id: 'courses', label: 'Courses', icon: NavIcons.GraduationCap, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-courses' },
    { id: 'messages', label: 'Messages', icon: NavIcons.MessageCircle, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-messages' },
    { id: 'assignments', label: 'Assignments', icon: NavIcons.ClipboardList, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-assignments' },
    { id: 'calendar', label: 'Calendar', icon: NavIcons.Calendar, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-calendar' },
    { id: 'earnings', label: 'Earnings', icon: NavIcons.DollarSign, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-earnings' },
    { id: 'wallet', label: 'Wallet', icon: NavIcons.Wallet, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-wallet' },
    { id: 'settings', label: 'Settings', icon: NavIcons.Settings, onClick: () => navigate('/teacher-dashboard'), testId: 'nav-settings' },
  ];

  const { data: meetingData, isLoading, error } = useQuery<{ meeting: Meeting }>({
    queryKey: meetingId ? [`/api/meetings/${meetingId}`] : ['disabled'],
    enabled: !!user && !!meetingId && profile?.role === 'teacher',
  });

  const startMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/meetings/${id}/join`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      if (data.meeting) {
        navigate(`/meeting-room/${meetingId}`);
      }
    },
    onError: () => {
      setInlineMessage({ type: 'error', text: 'Failed to start the meeting. Please try again.' });
      setTimeout(() => setInlineMessage(null), 5000);
    },
  });

  const cancelMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/meetings/${id}/cancel`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      navigate('/teacher-meetings');
    },
    onError: () => {
      setInlineMessage({ type: 'error', text: 'Failed to cancel the meeting. Please try again.' });
      setTimeout(() => setInlineMessage(null), 5000);
    },
  });

  if (!user || profile?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only teachers can access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!meetingId) {
    return (
      <TeacherLayout
        navItems={navItems}
        activeNavId="meetings"
        onExploreWebsite={() => navigate('/')}
        showHeader={false}
      >
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Not Found</CardTitle>
              <CardDescription>No meeting ID provided</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/teacher-meetings')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Meetings
              </Button>
            </CardContent>
          </Card>
        </div>
      </TeacherLayout>
    );
  }

  const meeting = meetingData?.meeting;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500 text-white';
      case 'scheduled':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <TeacherLayout
      navItems={navItems}
      activeNavId="meetings"
      onExploreWebsite={() => navigate('/')}
      showHeader={false}
    >
      <div className="container mx-auto py-8 px-4">
        {/* Inline Message */}
        {inlineMessage && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            inlineMessage.type === 'error' 
              ? 'bg-red-500/90 text-white' 
              : 'bg-green-500/90 text-white'
          }`}>
            {inlineMessage.type === 'error' ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{inlineMessage.text}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/teacher-meetings')}
            className="mb-4"
            data-testid="button-back-meetings"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Meetings
          </Button>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error || !meeting ? (
            <Card>
              <CardHeader>
                <CardTitle>Meeting Not Found</CardTitle>
                <CardDescription>This meeting does not exist or you don't have access to it</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/teacher-meetings')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Meetings
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Meeting Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold" data-testid="meeting-title">{meeting.title}</h1>
                      <Badge className={getStatusColor(meeting.status)} data-testid="meeting-status">
                        {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-lg" data-testid="meeting-description">
                      {meeting.lessonDescription}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  {meeting.status === 'live' && (
                    <Button 
                      size="lg"
                      onClick={() => navigate(`/meeting-room/${meeting.id}`)}
                      data-testid="button-join-live"
                    >
                      <Video className="mr-2 h-5 w-5" />
                      Join Live Meeting
                    </Button>
                  )}
                  
                  {meeting.status === 'scheduled' && (
                    <>
                      <Button 
                        size="lg"
                        onClick={() => startMeetingMutation.mutate(meeting.id)}
                        disabled={startMeetingMutation.isPending}
                        data-testid="button-start-now"
                      >
                        {startMeetingMutation.isPending ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <PlayCircle className="mr-2 h-5 w-5" />
                        )}
                        Start Meeting Now
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => navigate(`/teacher-meetings/schedule?edit=${meeting.id}`)}
                        data-testid="button-edit-meeting"
                      >
                        <Edit className="mr-2 h-5 w-5" />
                        Edit Meeting
                      </Button>
                      <Button 
                        size="lg"
                        variant="destructive"
                        onClick={() => cancelMeetingMutation.mutate(meeting.id)}
                        disabled={cancelMeetingMutation.isPending}
                        data-testid="button-cancel-meeting"
                      >
                        {cancelMeetingMutation.isPending ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-5 w-5" />
                        )}
                        Cancel Meeting
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Meeting Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium" data-testid="meeting-date">
                          {format(new Date(meeting.scheduledTime), 'PPP')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium" data-testid="meeting-time">
                          {format(new Date(meeting.scheduledTime), 'p')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium" data-testid="meeting-duration">
                          {meeting.duration} minutes
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meeting Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Mode</p>
                        <p className="font-medium" data-testid="meeting-mode">
                          {meeting.mode === 'interactive' ? 'Interactive' : 'Broadcast'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Participants</p>
                        <p className="font-medium" data-testid="meeting-participants">
                          {meeting.participantCount || 0} / {meeting.maxParticipants}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Target Grades</p>
                      <div className="flex flex-wrap gap-2">
                        {meeting.targetGrades.map((grade) => (
                          <Badge key={grade} variant="outline" data-testid={`grade-badge-${grade}`}>
                            Grade {grade}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
