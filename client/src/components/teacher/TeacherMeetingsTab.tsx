import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MeetingScheduler from "@/pages/MeetingScheduler";
import { MeetingDetailDialog } from "@/components/MeetingDetailDialog";

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

interface TeacherMeetingsTabProps {
  onNavigate?: (page: string) => void;
}

export function TeacherMeetingsTab({ onNavigate }: TeacherMeetingsTabProps) {
  const { user, profile } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("upcoming");
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: meetingsData, isLoading } = useQuery<{ meetings: Meeting[] }>({
    queryKey: ['/api/meetings'],
    enabled: !!user && profile?.role === 'teacher',
  });

  const meetings = meetingsData?.meetings || [];

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' || m.status === 'live');
  const pastMeetings = meetings.filter(m => m.status === 'completed' || m.status === 'cancelled');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500 text-white';
      case 'scheduled':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      case 'cancelled':
        return 'bg-primary text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const scheduledDate = new Date(meeting.scheduledTime);
    const isLive = meeting.status === 'live';

    return (
      <Card className="hover:shadow-lg transition-shadow transition-all duration-300" data-testid={`meeting-card-${meeting.id}`}>
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
                  onClick={() => {
                    setSelectedMeeting(meeting);
                    setIsDialogOpen(true);
                  }}
                  data-testid={`button-join-${meeting.id}`}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Join Live Meeting
                </Button>
              )}
              
              <Button 
                variant={isLive ? "outline" : "default"}
                className={isLive ? "" : "flex-1"}
                onClick={() => {
                  setSelectedMeeting(meeting);
                  setIsDialogOpen(true);
                }}
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

  if (showScheduler) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost"
          onClick={() => setShowScheduler(false)}
          className="mb-4"
          data-testid="button-back-to-meetings"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Meetings
        </Button>
        <MeetingScheduler />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold mb-2 text-[21px]" data-testid="page-title">My Meetings</h2>
          <p className="text-muted-foreground">Manage your scheduled video meetings</p>
        </div>
        <Button 
          size="lg"
          className="bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white"
          onClick={() => setShowScheduler(true)}
          data-testid="button-create-meeting"
        >
          <Plus className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">Schedule New Meeting</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <MeetingDetailDialog
        meeting={selectedMeeting}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedMeeting(null);
        }}
        role="teacher"
        onEdit={(meetingId) => {
          setShowScheduler(true);
        }}
      />
    </div>
  );
}
