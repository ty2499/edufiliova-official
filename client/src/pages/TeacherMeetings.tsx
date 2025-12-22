import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Plus,
  Loader2,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TeacherLayout, { NavIcons, type NavItem } from "@/components/teacher/TeacherLayout";

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

export default function TeacherMeetings() {
  const { user, profile } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>("upcoming");

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

  const { data: meetingsData, isLoading } = useQuery<{ meetings: Meeting[] }>({
    queryKey: ['/api/meetings'],
    enabled: !!user && profile?.role === 'teacher',
  });

  const meetings = meetingsData?.meetings || [];

  // Filter meetings by status
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' || m.status === 'live');
  const pastMeetings = meetings.filter(m => m.status === 'completed' || m.status === 'cancelled');

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

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const scheduledDate = new Date(meeting.scheduledTime);
    const isLive = meeting.status === 'live';

    return (
      <Card className="hover:shadow-lg transition-shadow" data-testid={`meeting-card-${meeting.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl" data-testid={`meeting-title-${meeting.id}`}>{meeting.title}</CardTitle>
                <Badge className={getStatusColor(meeting.status)} data-testid={`meeting-status-${meeting.id}`}>
                  {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2" data-testid={`meeting-description-${meeting.id}`}>
                {meeting.lessonDescription}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span data-testid={`meeting-date-${meeting.id}`}>{format(scheduledDate, 'PPP')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span data-testid={`meeting-time-${meeting.id}`}>{format(scheduledDate, 'p')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span data-testid={`meeting-participants-${meeting.id}`}>
                  {meeting.participantCount || 0} participants
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>{meeting.mode === 'interactive' ? 'Interactive' : 'Broadcast'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Target Grades:</span>
              {meeting.targetGrades.map((grade) => (
                <Badge key={grade} variant="outline" data-testid={`meeting-grade-${meeting.id}-${grade}`}>
                  Grade {grade}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              {isLive && (
                <Button 
                  className="flex-1"
                  onClick={() => navigate(`/teacher-meeting-detail/${meeting.id}`)}
                  data-testid={`button-join-${meeting.id}`}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Join Live Meeting
                </Button>
              )}
              
              <Button 
                variant={isLive ? "outline" : "default"}
                className={isLive ? "" : "flex-1"}
                onClick={() => navigate(`/teacher-meeting-detail/${meeting.id}`)}
                data-testid={`button-view-${meeting.id}`}
              >
                View Details
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <TeacherLayout
      navItems={navItems}
      activeNavId="meetings"
      onExploreWebsite={() => navigate('/')}
      showHeader={false}
    >
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2" data-testid="page-title">My Meetings</h1>
              <p className="text-muted-foreground">Manage your scheduled video meetings</p>
            </div>
            <Button 
              size="lg"
              onClick={() => navigate('/teacher-meetings/schedule')}
              data-testid="button-create-meeting"
            >
              <Plus className="mr-2 h-5 w-5" />
              Schedule New Meeting
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-3xl font-bold" data-testid="stat-upcoming">{upcomingMeetings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-900 dark:text-gray-100" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Live Now</p>
                  <p className="text-3xl font-bold" data-testid="stat-live">
                    {meetings.filter(m => m.status === 'live').length}
                  </p>
                </div>
                <Video className="h-8 w-8 text-gray-900 dark:text-gray-100" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold" data-testid="stat-completed">
                    {meetings.filter(m => m.status === 'completed').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-gray-900 dark:text-gray-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({pastMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No upcoming meetings scheduled. Click "Schedule New Meeting" to create one.
                </AlertDescription>
              </Alert>
            ) : (
              upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : pastMeetings.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No past meetings found.
                </AlertDescription>
              </Alert>
            ) : (
              pastMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
