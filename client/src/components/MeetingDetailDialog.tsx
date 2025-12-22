import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video,
  Loader2,
  Edit,
  XCircle,
  PlayCircle
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface MeetingDetailDialogProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  role: "teacher" | "student";
  onEdit?: (meetingId: string) => void;
}

export function MeetingDetailDialog({ 
  meeting, 
  isOpen, 
  onClose, 
  role,
  onEdit 
}: MeetingDetailDialogProps) {
  const [, navigate] = useLocation();

  const startMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/meetings/${id}/join`, {
        method: 'POST',
      });
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      if (data.meeting) {
        navigate(`/meeting-room/${id}`);
        onClose();
      }
    },
    onError: () => {
    },
  });

  const joinMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/meetings/${id}/join`, {
        method: 'POST',
      });
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      if (data.meeting) {
        navigate(`/meeting-room/${id}`);
        onClose();
      }
    },
    onError: () => {
    },
  });

  const cancelMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/meetings/${id}/cancel`, {
        method: 'POST',
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      onClose();
    },
  });

  if (!meeting) return null;

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

  const canJoinMeeting = (scheduledTime: string, status: string) => {
    if (status === 'live') return true;
    const meetingTime = new Date(scheduledTime);
    const now = new Date();
    const fifteenMinBefore = new Date(meetingTime.getTime() - 15 * 60000);
    return now >= fifteenMinBefore;
  };

  const isJoinable = canJoinMeeting(meeting.scheduledTime, meeting.status);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <DialogTitle className="text-2xl" data-testid="dialog-meeting-title">
              {meeting.title}
            </DialogTitle>
            <Badge className={getStatusColor(meeting.status)} data-testid="dialog-meeting-status">
              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
            </Badge>
          </div>
          <DialogDescription data-testid="dialog-meeting-description">
            {meeting.lessonDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            {role === 'teacher' && (
              <>
                {meeting.status === 'live' && (
                  <Button 
                    size="lg"
                    onClick={() => {
                      navigate(`/meeting-room/${meeting.id}`);
                      onClose();
                    }}
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
                      onClick={() => {
                        onEdit?.(meeting.id);
                        onClose();
                      }}
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
              </>
            )}

            {role === 'student' && (meeting.status === 'scheduled' || meeting.status === 'live') && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        size="lg"
                        onClick={() => joinMeetingMutation.mutate(meeting.id)}
                        disabled={!isJoinable || joinMeetingMutation.isPending}
                        data-testid="button-join-meeting"
                        className="w-full sm:w-auto"
                      >
                        {joinMeetingMutation.isPending ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Video className="mr-2 h-5 w-5" />
                        )}
                        {meeting.status === 'live' ? 'Join Live Meeting' : 'Join Meeting'}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!isJoinable && (
                    <TooltipContent>
                      <p>You can join 15 minutes before the scheduled time</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
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
                    <p className="font-medium" data-testid="dialog-meeting-date">
                      {format(new Date(meeting.scheduledTime), 'PPP')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium" data-testid="dialog-meeting-time">
                      {format(new Date(meeting.scheduledTime), 'p')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium" data-testid="dialog-meeting-duration">
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
                    <p className="font-medium" data-testid="dialog-meeting-mode">
                      {meeting.mode === 'interactive' ? 'Interactive' : 'Broadcast'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participants</p>
                    <p className="font-medium" data-testid="dialog-meeting-participants">
                      {meeting.participantCount || 0} / {meeting.maxParticipants}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Target Grades</p>
                  <div className="flex flex-wrap gap-2">
                    {meeting.targetGrades.map((grade) => (
                      <Badge key={grade} variant="outline" data-testid={`dialog-grade-badge-${grade}`}>
                        Grade {grade}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
