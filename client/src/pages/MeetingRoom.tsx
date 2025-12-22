import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useMeeting } from "@/contexts/MeetingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users,
  Loader2,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle2,
  Monitor,
  Minimize2,
  MonitorUp,
  MonitorStop,
  Smile,
  Maximize2,
  Minimize
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface MeetingRoomProps {
  meetingId: string | null;
}

interface JoinMeetingResponse {
  success: boolean;
  agoraToken: string;
  agoraAppId: string;
  channelName: string;
  uid: string;
  role: string;
  isViewOnly: boolean;
  meeting: {
    id: string;
    title: string;
    status: string;
    mode: string;
  };
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

interface ParticipantInfo {
  uid: string;
  name: string;
  isLocal: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  isSpeaking?: boolean;
}

export default function MeetingRoom({ meetingId }: MeetingRoomProps) {
  console.log('🎥 MeetingRoom component rendering with meetingId:', meetingId);
  
  const { user, profile } = useAuth();
  console.log('🎥 Auth context:', { hasUser: !!user, hasProfile: !!profile });
  
  const [, navigate] = useLocation();
  const meeting = useMeeting();
  
  console.log('🎥 Meeting context obtained:', { hasMeeting: !!meeting });

  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileChatExpanded, setIsMobileChatExpanded] = useState(false);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Fetch meeting details
  const { data: meetingData } = useQuery<{ meeting: { id: string; title: string; status: string; mode: string; } }>({
    queryKey: meetingId ? [`/api/meetings/${meetingId}`] : ['disabled'],
    enabled: !!user && !!meetingId,
  });

  // Fetch chat messages
  const { data: chatData } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: meetingId ? [`/api/meetings/${meetingId}/chat`] : ['disabled'],
    enabled: !!user && !!meetingId && meeting.joinState === "ready",
    refetchInterval: 10000, // Poll every 10 seconds for real-time chat experience
    staleTime: 5000, // Cache for 5 seconds
  });

  // Update chat messages when data changes
  useEffect(() => {
    if (chatData?.messages) {
      setChatMessages(chatData.messages);
    }
  }, [chatData]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Send chat message mutation with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest(`/api/meetings/${meetingId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    onMutate: async (message) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/meetings/${meetingId}/chat`] });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData([`/api/meetings/${meetingId}/chat`]);
      
      // Optimistically update - add message immediately to UI
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        senderId: user!.id,
        senderName: profile?.displayName || profile?.name || 'You',
        message: message,
        createdAt: new Date().toISOString(),
      };
      
      setChatMessages(prev => [...prev, optimisticMessage]);
      
      // Clear input immediately for instant feedback
      setNewMessage("");
      
      // Return context for rollback
      return { previousMessages };
    },
    onError: (error, message, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData([`/api/meetings/${meetingId}/chat`], context.previousMessages);
      }
      setInlineMessage({ type: 'error', text: 'Failed to send message' });
      setTimeout(() => setInlineMessage(null), 3000);
    },
    onSuccess: () => {
      // Refetch to get the real message with proper ID
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/chat`] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && meetingId && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage.trim());
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  // Join meeting mutation
  const joinMeetingMutation = useMutation<JoinMeetingResponse, Error, string>({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/meetings/${id}/join`, {
        method: 'POST',
      });
      return response as JoinMeetingResponse;
    },
    onSuccess: async (data) => {
      await meeting.joinMeeting({
        agoraAppId: data.agoraAppId,
        channelName: data.channelName,
        agoraToken: data.agoraToken,
        uid: data.uid,
        isViewOnly: data.isViewOnly,
        meetingId: data.meeting.id,
        meetingTitle: data.meeting.title,
      }, (errorMessage) => {
        setInlineMessage({ type: 'error', text: errorMessage });
        setTimeout(() => setInlineMessage(null), 5000);
      });
    },
    onError: (error) => {
      setInlineMessage({ type: 'error', text: error.message || 'Failed to join meeting' });
      setTimeout(() => setInlineMessage(null), 5000);
    },
  });

  // Auto-follow active speaker when not pinned
  useEffect(() => {
    if (isPinned || !meeting.participants) return;
    
    if (meeting.isViewOnly || !meeting.getLocalVideoTrack()) {
      if (meeting.activeSpeaker && meeting.participants.has(meeting.activeSpeaker)) {
        meeting.setMainVideoUser(meeting.activeSpeaker);
      } else if (meeting.participants.size > 0) {
        const firstRemoteUid = Array.from(meeting.participants.keys())[0];
        meeting.setMainVideoUser(firstRemoteUid);
      }
    } else {
      if (meeting.activeSpeaker && meeting.participants.has(meeting.activeSpeaker)) {
        meeting.setMainVideoUser(meeting.activeSpeaker);
      }
    }
  }, [meeting.activeSpeaker, meeting.participants, meeting.isViewOnly, isPinned]);

  // Play main video
  useEffect(() => {
    if (!mainVideoRef.current || !meeting.participants) return;

    mainVideoRef.current.innerHTML = '';

    const localVideoTrack = meeting.getLocalVideoTrack();
    const localScreenTrack = meeting.getLocalScreenTrack();

    // Priority: local screen > remote screen > remote camera > local camera
    if (meeting.mainVideoUser === 'local-screen' && localScreenTrack) {
      localScreenTrack.play(mainVideoRef.current);
    } else if (meeting.mainVideoUser === 'local' && localVideoTrack && meeting.videoEnabled) {
      localVideoTrack.play(mainVideoRef.current);
    } else if (meeting.mainVideoUser && meeting.mainVideoUser !== 'local' && meeting.mainVideoUser !== 'local-screen') {
      const participant = meeting.participants.get(meeting.mainVideoUser);
      if (participant) {
        if (participant.screenTrack) {
          participant.screenTrack.play(mainVideoRef.current);
        } else if (participant.cameraTrack) {
          participant.cameraTrack.play(mainVideoRef.current);
        }
      }
    } else if (!meeting.isViewOnly && localVideoTrack && meeting.videoEnabled) {
      // Fallback: play local video when mainVideoUser is null
      localVideoTrack.play(mainVideoRef.current);
    }
  }, [meeting.mainVideoUser, meeting.participants, meeting.isScreenSharing, meeting.videoEnabled, meeting.isViewOnly]);

  // Play local video in sidebar
  useEffect(() => {
    if (!localVideoRef.current) return;
    
    localVideoRef.current.innerHTML = '';
    
    const localVideoTrack = meeting.getLocalVideoTrack();
    if (localVideoTrack && meeting.videoEnabled && !meeting.isScreenSharing) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [meeting.getLocalVideoTrack(), meeting.isScreenSharing, meeting.videoEnabled]);

  // Play remote videos in sidebar
  useEffect(() => {
    if (!meeting.participants) return;
    
    meeting.participants.forEach((participant, uid) => {
      if (uid === meeting.localUid) return;
      
      const container = remoteVideoRefs.current.get(uid);
      if (container) {
        if (participant.cameraTrack) {
          participant.cameraTrack.play(container);
        }
      }
    });
  }, [meeting.participants, meeting.localUid]);

  // Play video in minimized view
  useEffect(() => {
    if (!meeting.isMinimized || !meeting.minimizedVideoRef.current || !meeting.participants) return;

    meeting.minimizedVideoRef.current.innerHTML = '';

    const localVideoTrack = meeting.getLocalVideoTrack();
    const localScreenTrack = meeting.getLocalScreenTrack();

    if (meeting.mainVideoUser === 'local-screen' && localScreenTrack) {
      localScreenTrack.play(meeting.minimizedVideoRef.current);
    } else if (meeting.mainVideoUser === 'local' && localVideoTrack) {
      localVideoTrack.play(meeting.minimizedVideoRef.current);
    } else if (meeting.mainVideoUser && meeting.mainVideoUser !== 'local' && meeting.mainVideoUser !== 'local-screen') {
      const participant = meeting.participants.get(meeting.mainVideoUser);
      if (participant) {
        if (participant.screenTrack) {
          participant.screenTrack.play(meeting.minimizedVideoRef.current);
        } else if (participant.cameraTrack) {
          participant.cameraTrack.play(meeting.minimizedVideoRef.current);
        }
      }
    }
  }, [meeting.isMinimized, meeting.mainVideoUser, meeting.participants, meeting.isScreenSharing]);

  // Leave meeting
  const handleLeaveMeeting = async () => {
    try {
      await meeting.leaveMeeting(meetingId);
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });

      if (profile?.role === 'teacher') {
        navigate('/teacher-meetings');
      } else {
        navigate('/student-dashboard');
      }
    } catch (error) {
      console.error("Error leaving meeting:", error);
      setInlineMessage({ type: 'error', text: 'Error leaving meeting' });
      setTimeout(() => setInlineMessage(null), 5000);
    }
  };

  // End meeting (teachers only)
  const handleEndMeeting = async () => {
    try {
      setShowEndConfirmation(false);
      await meeting.endMeeting(meetingId);
      
      // Wait for queries to invalidate and refetch before navigating
      // Use refetchType: 'all' to ensure inactive queries are also refetched
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/meetings/${meetingId}`],
        refetchType: 'all'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/meetings'],
        refetchType: 'all'
      });
      
      navigate('/teacher-meetings');
    } catch (error) {
      console.error("Error ending meeting:", error);
      setInlineMessage({ type: 'error', text: 'Error ending meeting' });
      setTimeout(() => setInlineMessage(null), 5000);
    }
  };

  // Enter fullscreen mode
  const enterFullscreen = () => {
    if (fullscreenContainerRef.current) {
      if (fullscreenContainerRef.current.requestFullscreen) {
        fullscreenContainerRef.current.requestFullscreen();
      }
    }
  };

  // Exit fullscreen mode
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Reset mobile chat expanded state on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileChatExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Join meeting on mount
  useEffect(() => {
    if (meetingId && meeting.joinState === "idle") {
      joinMeetingMutation.mutate(meetingId);
    }
  }, [meetingId]);

  // Switch main video to specific user
  const switchMainVideo = (uid: string | null) => {
    meeting.setMainVideoUser(uid);
    setIsPinned(true);
  };

  // Get participant info for display
  const getParticipants = (): ParticipantInfo[] => {
    const participants: ParticipantInfo[] = [];
    
    if (!meeting.isViewOnly && meeting.localUid) {
      participants.push({
        uid: 'local',
        name: `${profile?.displayName || profile?.name || 'You'} ${profile?.role === 'teacher' ? '(Teacher)' : ''}`,
        isLocal: true,
        hasVideo: meeting.videoEnabled,
        hasAudio: meeting.audioEnabled,
        isSpeaking: false,
      });
    }

    if (meeting.participants) {
      meeting.participants.forEach((participant, uid) => {
        if (uid !== meeting.localUid) {
          participants.push({
            uid,
            name: participant.name,
            isLocal: false,
            hasVideo: participant.hasVideo,
            hasAudio: participant.hasAudio,
            isSpeaking: meeting.activeSpeaker === uid,
          });
        }
      });
    }

    return participants;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to join the meeting.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meetingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No meeting ID provided.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const participants = getParticipants();
  const mainUser = meeting.participants && meeting.mainVideoUser && meeting.mainVideoUser !== 'local' && meeting.mainVideoUser !== 'local-screen' 
    ? meeting.participants.get(meeting.mainVideoUser) 
    : null;

  return (
    <div className="min-h-screen h-screen bg-gray-100 dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Inline Message */}
      {inlineMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
          inlineMessage.type === 'error' 
            ? 'bg-primary/90 text-white' 
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
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="meeting-room-title">
              {joinMeetingMutation.data?.meeting.title || meetingData?.meeting.title || 'Meeting Room'}
            </h1>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              {(joinMeetingMutation.data?.meeting.status === 'live' || meetingData?.meeting.status === 'live') && (
                <Badge className="bg-primary text-white text-xs">Live</Badge>
              )}
              <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => meeting.minimize(navigate, profile?.role === 'teacher' ? '/teacher-meetings' : '/student-dashboard')}
                  data-testid="button-minimize-meeting"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Minimize to floating window</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {profile?.role === 'teacher' && meeting.joinState === "ready" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndConfirmation(true)}
              className="text-primary-600 dark:text-primary-400 border-red-300 dark:border-red-800 hover:bg-primary/50 dark:hover:bg-primary/900/20"
              data-testid="button-end-meeting"
            >
              End Meeting
            </Button>
          )}
        </div>
      </div>

      {/* Idle or Connecting state - Show loading spinner */}
      {(meeting.joinState === "idle" || meeting.joinState === "connecting") && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-foreground" />
            <p className="text-gray-600 dark:text-gray-400">Joining meeting...</p>
          </div>
        </div>
      )}

      {/* Error state - Show error message with retry */}
      {meeting.joinState === "error" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <AlertCircle className="h-5 w-5" />
                Failed to Join Meeting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {meeting.joinError || 'An error occurred while trying to join the meeting.'}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (meetingId) {
                      joinMeetingMutation.mutate(meetingId);
                    }
                  }}
                  disabled={joinMeetingMutation.isPending}
                  className="flex-1"
                  data-testid="button-retry-join"
                >
                  {joinMeetingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Retry'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (profile?.role === 'teacher') {
                      navigate('/teacher-meetings');
                    } else {
                      navigate('/student-dashboard');
                    }
                  }}
                  className="flex-1"
                  data-testid="button-go-back"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ready state - Show meeting room UI */}
      {meeting.joinState === "ready" && !meeting.isMinimized && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-4 p-4">
          {/* Left Section - Main Video + Participants (hidden on mobile when chat expanded) */}
          <div className={`flex-1 flex flex-col gap-3 min-w-0 ${isMobileChatExpanded ? 'hidden lg:flex' : 'flex'}`}>
            {/* Main Video Area */}
            <div 
              ref={fullscreenContainerRef}
              className="relative bg-gray-900 rounded-lg overflow-hidden flex-1" 
              style={{ minHeight: '400px', maxHeight: 'calc(100vh - 320px)' }}
            >
              <div 
                ref={mainVideoRef} 
                className="w-full h-full"
                style={{ display: 'block' }}
                data-testid="main-video"
              />
              
              {/* Overlay when video is off */}
              {!meeting.isScreenSharing && ((meeting.mainVideoUser === null && !meeting.videoEnabled) || (mainUser && !mainUser.hasVideo)) && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff className="h-16 w-16 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">Camera is off</p>
                  </div>
                </div>
              )}

              {/* Fullscreen/Maximize Button */}
              <div className="absolute top-4 right-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm border-none h-10 w-10"
                        onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                        data-testid="button-toggle-fullscreen"
                      >
                        {isFullscreen ? (
                          <Minimize className="h-4 w-4 text-white" />
                        ) : (
                          <Maximize2 className="h-4 w-4 text-white" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Screen sharing indicator */}
              {(meeting.isScreenSharing || (mainUser && mainUser.isScreenSharing)) && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center gap-2">
                  <MonitorUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {meeting.isScreenSharing ? 'You are sharing screen' : `${mainUser?.name} is sharing screen`}
                  </span>
                </div>
              )}

              {/* Name badge */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-white font-medium">
                  {meeting.mainVideoUser === 'local-screen' 
                    ? `${profile?.displayName || profile?.name || 'You'} (Screen)`
                    : meeting.mainVideoUser === 'local' 
                      ? `${profile?.displayName || profile?.name || 'You'} ${profile?.role === 'teacher' ? '(Teacher)' : ''}` 
                      : mainUser 
                        ? `${mainUser.name}${mainUser.isScreenSharing ? ' (Screen)' : ''}${mainUser.isTeacher ? ' (Teacher)' : ''}`
                        : `${profile?.displayName || profile?.name || 'You'} ${profile?.role === 'teacher' ? '(Teacher)' : ''}`}
                </p>
              </div>

              {/* Control Bar */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
                  <TooltipProvider>
                    {!meeting.isViewOnly && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant={meeting.videoEnabled ? "secondary" : "destructive"}
                              className="rounded-full h-12 w-12"
                              onClick={() => meeting.toggleVideo()}
                              disabled={meeting.isScreenSharing}
                              data-testid="button-toggle-video"
                            >
                              {meeting.videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{meeting.videoEnabled ? 'Turn off camera' : 'Turn on camera'}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant={meeting.audioEnabled ? "secondary" : "destructive"}
                              className="rounded-full h-12 w-12"
                              onClick={() => meeting.toggleAudio()}
                              data-testid="button-toggle-audio"
                            >
                              {meeting.audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{meeting.audioEnabled ? 'Mute' : 'Unmute'}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant={meeting.isScreenSharing ? "default" : "secondary"}
                              className="rounded-full h-12 w-12"
                              onClick={() => meeting.isScreenSharing ? meeting.stopScreenShare() : meeting.startScreenShare()}
                              data-testid="button-toggle-screen-share"
                            >
                              {meeting.isScreenSharing ? <MonitorStop className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{meeting.isScreenSharing ? 'Stop sharing' : 'Share screen'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="rounded-full h-12 w-12"
                          onClick={handleLeaveMeeting}
                          data-testid="button-leave-meeting"
                        >
                          <PhoneOff className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Leave meeting</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Participants Section - Horizontal Carousel */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-xs whitespace-nowrap">
                  <Users className="h-3.5 w-3.5" />
                  Participants ({participants.length})
                </h3>
                
                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-2 min-w-min">
                    {participants.map((participant) => (
                      <div
                        key={participant.uid}
                        onClick={() => switchMainVideo(participant.isLocal ? null : participant.uid)}
                        className={`flex-shrink-0 relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                          (meeting.mainVideoUser === null && participant.isLocal) || meeting.mainVideoUser === participant.uid
                            ? 'ring-2 ring-primary'
                            : 'hover:ring-2 hover:ring-gray-400'
                        }`}
                        style={{ width: '120px', height: '80px' }}
                        data-testid={`participant-${participant.uid}`}
                      >
                        {/* Video Preview */}
                        <div className="absolute inset-0 bg-gray-900">
                          {participant.isLocal && !meeting.isViewOnly && !meeting.isScreenSharing ? (
                            <div 
                              ref={localVideoRef}
                              className="w-full h-full"
                            />
                          ) : !participant.isLocal ? (
                            <div
                              ref={(el) => {
                                if (el) {
                                  remoteVideoRefs.current.set(participant.uid, el);
                                }
                              }}
                              className="w-full h-full"
                            />
                          ) : null}
                          
                          {!participant.hasVideo && (
                            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                              <VideoOff className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          
                          {participant.isSpeaking && (
                            <div className="absolute inset-0 ring-2 ring-green-500 animate-pulse" />
                          )}
                        </div>

                        {/* Participant Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                          <p className="text-[10px] font-medium text-white truncate mb-0.5">
                            {participant.name}
                          </p>
                          <div className="flex items-center gap-1">
                            {participant.hasAudio ? (
                              <Mic className="h-2.5 w-2.5 text-green-400" />
                            ) : (
                              <MicOff className="h-2.5 w-2.5 text-gray-300" />
                            )}
                            {participant.hasVideo ? (
                              <Video className="h-2.5 w-2.5 text-green-400" />
                            ) : (
                              <VideoOff className="h-2.5 w-2.5 text-gray-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Chat Panel */}
          <div className={`w-full lg:w-[min(420px,40%)] flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden ${isMobileChatExpanded ? 'fixed inset-4 z-40 lg:relative lg:inset-auto' : 'relative'}`}>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Live Chat
              </h3>
              {/* Mobile toggle button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileChatExpanded(!isMobileChatExpanded)}
                data-testid="button-toggle-mobile-chat"
              >
                {isMobileChatExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 px-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${
                      msg.senderId === user.id 
                        ? 'bg-lime-200 dark:bg-lime-400 text-gray-900' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    } rounded-lg px-4 py-2.5`}>
                      <p className="text-sm font-medium mb-1 opacity-70">
                        {msg.senderName}
                      </p>
                      <p className="text-base leading-relaxed break-words">{msg.message}</p>
                      <p className="text-xs mt-1.5 opacity-60">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="relative">
                {showEmojiPicker && (
                  <div className="absolute bottom-16 right-0 z-50">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    data-testid="button-emoji-picker"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 text-base"
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-chat-message"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {meeting.isViewOnly && meeting.joinState === "ready" && !meeting.isMinimized && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 p-3">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
            You are in view-only mode. The meeting is at full capacity.
          </p>
        </div>
      )}

      {/* Minimized Floating Window */}
      {meeting.joinState === "ready" && meeting.isMinimized && (
        <div 
          className="fixed bottom-6 right-6 z-50 cursor-pointer group"
          onClick={() => meeting.expand(navigate)}
          data-testid="minimized-meeting-window"
        >
          <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-white dark:border-gray-700 w-80 h-52 transition-transform hover:scale-105">
            <div 
              ref={meeting.minimizedVideoRef} 
              className="w-full h-full"
              style={{ display: 'block' }}
            />
            
            {!meeting.isScreenSharing && ((meeting.mainVideoUser === null && !meeting.videoEnabled) || (mainUser && !mainUser.hasVideo)) && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Camera is off</p>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-between p-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-primary text-white text-xs">Live</Badge>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      meeting.expand(navigate);
                    }}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-white font-semibold text-sm mb-1 line-clamp-1">
                  {joinMeetingMutation.data?.meeting.title || meetingData?.meeting.title || 'Meeting Room'}
                </p>
                <div className="flex items-center gap-2">
                  {!meeting.isViewOnly && (
                    <div className="flex items-center gap-1">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${meeting.videoEnabled ? 'bg-gray-700/80' : 'bg-primary'}`}>
                        {meeting.videoEnabled ? <Video className="h-3 w-3 text-white" /> : <VideoOff className="h-3 w-3 text-white" />}
                      </div>
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${meeting.audioEnabled ? 'bg-gray-700/80' : 'bg-primary'}`}>
                        {meeting.audioEnabled ? <Mic className="h-3 w-3 text-white" /> : <MicOff className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                  )}
                  <p className="text-white/80 text-xs">
                    {participants.length} participant{participants.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-white/60 text-xs ml-auto">Click to expand</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Meeting Confirmation Dialog */}
      <AlertDialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>End Meeting for Everyone?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              This will end the meeting for all participants. Everyone will be disconnected
              and the meeting will be marked as completed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndMeeting}
              className="bg-primary hover:bg-primary/700 text-white"
              data-testid="confirm-end-meeting"
            >
              End Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
