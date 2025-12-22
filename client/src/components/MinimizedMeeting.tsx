import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMeeting } from "@/contexts/MeetingContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, Monitor } from "lucide-react";

export function MinimizedMeeting() {
  const [, navigate] = useLocation();
  const {
    isMinimized,
    meetingId,
    meetingTitle,
    participantCount,
    videoEnabled,
    audioEnabled,
    isViewOnly,
    mainVideoUser,
    participants,
    minimizedVideoRef,
    getLocalVideoTrack,
    getLocalScreenTrack,
    isScreenSharing,
    expand,
  } = useMeeting();

  const localVideoTrack = getLocalVideoTrack();
  const localScreenTrack = getLocalScreenTrack();
  const mainUser = (participants && mainVideoUser && mainVideoUser !== 'local' && mainVideoUser !== 'local-screen') 
    ? participants.get(mainVideoUser) 
    : null;

  // Play video in minimized view
  useEffect(() => {
    if (!isMinimized || !minimizedVideoRef.current || !participants) return;

    // Clear previous video
    minimizedVideoRef.current.innerHTML = '';

    // Priority: Screen share > Main video user > Local video
    if (localScreenTrack) {
      localScreenTrack.play(minimizedVideoRef.current);
    } else if (mainVideoUser === null || mainVideoUser === 'local') {
      // Show local video if available
      if (localVideoTrack) {
        localVideoTrack.play(minimizedVideoRef.current);
      }
    } else {
      // Show remote user video
      const participant = participants.get(mainVideoUser);
      if (participant?.cameraTrack) {
        participant.cameraTrack.play(minimizedVideoRef.current);
      } else if (participant?.screenTrack) {
        participant.screenTrack.play(minimizedVideoRef.current);
      }
    }
  }, [isMinimized, mainVideoUser, localVideoTrack, localScreenTrack, participants, minimizedVideoRef]);

  if (!isMinimized || !meetingId) {
    return null;
  }

  const handleExpand = () => {
    expand(navigate);
  };

  return (
    <div 
      className="fixed max-sm:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-3 sm:right-6 z-50 cursor-pointer group"
      onClick={handleExpand}
      data-testid="minimized-meeting-window"
    >
      <div className="relative bg-gray-900 rounded-md sm:rounded-lg overflow-hidden shadow-2xl border sm:border-2 border-white dark:border-gray-700 w-28 h-20 sm:w-80 sm:h-52 transition-transform hover:scale-105">
        {/* Video Container */}
        <div 
          ref={minimizedVideoRef} 
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        
        {/* Overlay when video is off */}
        {!isScreenSharing && ((mainVideoUser === null && !videoEnabled) || (mainUser && !mainUser.hasVideo)) && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <VideoOff className="h-6 w-6 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-0.5 sm:mb-2" />
              <p className="text-gray-400 text-[10px] sm:text-sm hidden sm:block">Camera is off</p>
            </div>
          </div>
        )}
        
        {/* Meeting Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-between p-1 sm:p-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-primary text-white text-[8px] sm:text-xs px-1 py-0 sm:px-2 sm:py-1 h-4 sm:h-auto">Live</Badge>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand();
                }}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-white font-semibold text-[10px] sm:text-sm mb-0.5 sm:mb-1 line-clamp-1 hidden sm:block">
              {meetingTitle || 'Meeting Room'}
            </p>
            <div className="flex items-center gap-0.5 sm:gap-2">
              {!isViewOnly && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <div className={`h-4 w-4 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ${videoEnabled ? 'bg-gray-700/80' : 'bg-primary'}`}>
                    {videoEnabled ? <Video className="h-2 w-2 sm:h-3 sm:w-3 text-white" /> : <VideoOff className="h-2 w-2 sm:h-3 sm:w-3 text-white" />}
                  </div>
                  <div className={`h-4 w-4 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ${audioEnabled ? 'bg-gray-700/80' : 'bg-primary'}`}>
                    {audioEnabled ? <Mic className="h-2 w-2 sm:h-3 sm:w-3 text-white" /> : <MicOff className="h-2 w-2 sm:h-3 sm:w-3 text-white" />}
                  </div>
                </div>
              )}
              <p className="text-white/80 text-[8px] sm:text-xs hidden sm:block">
                {participantCount} participant{participantCount !== 1 ? 's' : ''}
              </p>
              <p className="text-white/60 text-[8px] sm:text-xs ml-auto hidden sm:block">Click to expand</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
