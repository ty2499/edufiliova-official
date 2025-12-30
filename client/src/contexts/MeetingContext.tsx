import { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type ILocalVideoTrack,
  type IRemoteVideoTrack,
  type IRemoteAudioTrack
} from "agora-rtc-sdk-ng";
import { apiRequest } from '@/lib/queryClient';

interface ParticipantMetadata {
  uid: string;
  name: string;
  role: string;
  isTeacher: boolean;
}

interface ParticipantMediaState {
  uid: string;
  name: string;
  role: string;
  isTeacher: boolean;
  cameraTrack: IRemoteVideoTrack | null;
  screenTrack: IRemoteVideoTrack | null;
  audioTrack: IRemoteAudioTrack | null;
  isScreenSharing: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
}

interface MeetingState {
  isMinimized: boolean;
  meetingId: string | null;
  meetingTitle: string | null;
  participantCount: number;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isScreenSharing: boolean;
  isViewOnly: boolean;
  joined: boolean;
  joinState: "idle" | "connecting" | "ready" | "error";
  joinError: string | null;
  localUid: string | null;
  mainVideoUser: string | null;
  participants: Map<string, ParticipantMediaState>;
  activeScreenShareUid: string | null;
  activeSpeaker: string | null;
}

export interface JoinMeetingData {
  agoraAppId: string;
  channelName: string;
  agoraToken: string;
  uid: string;
  isViewOnly: boolean;
  meetingId: string;
  meetingTitle: string;
}

interface MeetingContextType extends MeetingState {
  // Meeting lifecycle methods
  joinMeeting: (data: JoinMeetingData, onError: (message: string) => void) => Promise<void>;
  leaveMeeting: (meetingId: string | null) => Promise<void>;
  endMeeting: (meetingId: string | null) => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  
  // Navigation methods
  minimize: (navigate: (path: string) => void, dashboardPath: string) => void;
  expand: (navigate: (path: string) => void) => void;
  
  // State update methods
  updateMeetingInfo: (meetingId: string, title: string) => void;
  setParticipantCount: (count: number) => void;
  setMainVideoUser: (uid: string | null) => void;
  resetMeeting: () => void;
  
  // Refs (stable, don't trigger re-renders)
  getClient: () => IAgoraRTCClient | null;
  getLocalVideoTrack: () => ICameraVideoTrack | null;
  getLocalAudioTrack: () => IMicrophoneAudioTrack | null;
  getLocalScreenTrack: () => ILocalVideoTrack | null;
  minimizedVideoRef: React.RefObject<HTMLDivElement>;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MeetingState>({
    isMinimized: false,
    meetingId: null,
    meetingTitle: null,
    participantCount: 0,
    videoEnabled: true,
    audioEnabled: true,
    isScreenSharing: false,
    isViewOnly: false,
    joined: false,
    joinState: "idle",
    joinError: null,
    localUid: null,
    mainVideoUser: null,
    participants: new Map(),
    activeScreenShareUid: null,
    activeSpeaker: null,
  });
  
  // Use refs for Agora objects to avoid re-renders
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localScreenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const minimizedVideoRef = useRef<HTMLDivElement>(null);
  
  // Store participant metadata to ensure real names are shown
  const participantMetadataRef = useRef<Map<string, ParticipantMetadata>>(new Map());

  // Helper: Determine main video user based on priority
  // Priority: local screen > remote screen > remote camera (active speaker) > local camera
  const determineMainVideoUser = useCallback((
    localUid: string | null,
    isLocalScreenSharing: boolean,
    activeScreenShareUid: string | null,
    activeSpeaker: string | null,
    isViewOnly: boolean
  ): string | null => {
    if (isLocalScreenSharing) {
      return 'local-screen';
    }
    if (activeScreenShareUid) {
      return activeScreenShareUid;
    }
    if (isViewOnly || !localUid) {
      return activeSpeaker;
    }
    if (activeSpeaker && activeSpeaker !== localUid) {
      return activeSpeaker;
    }
    return 'local';
  }, []);

  const minimize = useCallback((navigate: (path: string) => void, dashboardPath: string) => {
    setState(prev => ({ ...prev, isMinimized: true }));
    navigate(dashboardPath);
  }, []);

  const expand = useCallback((navigate: (path: string) => void) => {
    if (state.meetingId) {
      setState(prev => ({ ...prev, isMinimized: false }));
      navigate(`/meeting-room/${state.meetingId}`);
    }
  }, [state.meetingId]);

  const updateMeetingInfo = useCallback((meetingId: string, title: string) => {
    setState(prev => ({ ...prev, meetingId, meetingTitle: title }));
  }, []);

  const setParticipantCount = useCallback((count: number) => {
    setState(prev => ({ ...prev, participantCount: count }));
  }, []);

  const setMainVideoUser = useCallback((uid: string | null) => {
    setState(prev => ({ ...prev, mainVideoUser: uid }));
  }, []);

  // Internal event handlers for Agora
  const handleUserPublished = useCallback(async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
    const client = clientRef.current;
    if (!client) return;

    await client.subscribe(user, mediaType);

    const uid = String(user.uid);

    if (mediaType === "video") {
      const videoTrack = user.videoTrack;
      if (!videoTrack) return;

      const isScreenShare = (user as any).hasScreenVideoTrack || 
                           (videoTrack as any).trackMediaType === 'video_screen' ||
                           (videoTrack as any).getTrackLabel?.()?.toLowerCase().includes('screen');

      setState(prev => {
        const participants = new Map(prev.participants);
        const existingParticipant = participants.get(uid);

        if (isScreenShare) {
          participants.set(uid, {
            uid,
            name: existingParticipant?.name || `Participant ${uid.substring(0, 8)}`,
            role: existingParticipant?.role || 'student',
            isTeacher: existingParticipant?.isTeacher || false,
            cameraTrack: existingParticipant?.cameraTrack || null,
            screenTrack: videoTrack,
            audioTrack: existingParticipant?.audioTrack || null,
            isScreenSharing: true,
            hasVideo: true,
            hasAudio: existingParticipant?.hasAudio || false,
          });

          const newActiveScreenShareUid = uid;
          const newMainVideoUser = determineMainVideoUser(
            prev.localUid,
            prev.isScreenSharing,
            newActiveScreenShareUid,
            prev.activeSpeaker,
            prev.isViewOnly
          );

          return {
            ...prev,
            participants,
            activeScreenShareUid: newActiveScreenShareUid,
            mainVideoUser: newMainVideoUser,
          };
        } else {
          participants.set(uid, {
            uid,
            name: existingParticipant?.name || `Participant ${uid.substring(0, 8)}`,
            role: existingParticipant?.role || 'student',
            isTeacher: existingParticipant?.isTeacher || false,
            cameraTrack: videoTrack,
            screenTrack: existingParticipant?.screenTrack || null,
            audioTrack: existingParticipant?.audioTrack || null,
            isScreenSharing: existingParticipant?.isScreenSharing || false,
            hasVideo: true,
            hasAudio: existingParticipant?.hasAudio || false,
          });

          return { ...prev, participants };
        }
      });
    }

    if (mediaType === "audio") {
      user.audioTrack?.play();

      setState(prev => {
        const participants = new Map(prev.participants);
        const existingParticipant = participants.get(uid);

        if (existingParticipant) {
          participants.set(uid, {
            ...existingParticipant,
            audioTrack: user.audioTrack || null,
            hasAudio: true,
          });
        } else {
          participants.set(uid, {
            uid,
            name: `Participant ${uid.substring(0, 8)}`,
            role: 'student',
            isTeacher: false,
            cameraTrack: null,
            screenTrack: null,
            audioTrack: user.audioTrack || null,
            isScreenSharing: false,
            hasVideo: false,
            hasAudio: true,
          });
        }

        return { ...prev, participants };
      });
    }
  }, [determineMainVideoUser]);

  const handleUserUnpublished = useCallback((user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
    const uid = String(user.uid);

    if (mediaType === "video") {
      setState(prev => {
        const participants = new Map(prev.participants);
        const existingParticipant = participants.get(uid);

        if (!existingParticipant) return prev;

        const currentVideoTrack = user.videoTrack;
        const currentTrackId = currentVideoTrack?.getTrackId?.();
        
        const storedCameraTrackId = existingParticipant.cameraTrack?.getTrackId?.();
        const storedScreenTrackId = existingParticipant.screenTrack?.getTrackId?.();

        let wasScreenTrackUnpublished = false;
        let wasCameraTrackUnpublished = false;

        if (!currentVideoTrack || !currentTrackId) {
          if (existingParticipant.screenTrack) {
            wasScreenTrackUnpublished = true;
          } else if (existingParticipant.cameraTrack) {
            wasCameraTrackUnpublished = true;
          }
        } else {
          if (storedCameraTrackId && currentTrackId === storedCameraTrackId && existingParticipant.screenTrack) {
            wasScreenTrackUnpublished = true;
          } else if (storedScreenTrackId && currentTrackId === storedScreenTrackId && existingParticipant.cameraTrack) {
            wasCameraTrackUnpublished = true;
          } else if (!storedCameraTrackId && existingParticipant.screenTrack) {
            wasScreenTrackUnpublished = true;
          } else if (!storedScreenTrackId && existingParticipant.cameraTrack) {
            wasCameraTrackUnpublished = true;
          }
        }

        const nextCameraTrack = wasCameraTrackUnpublished ? null : existingParticipant.cameraTrack;
        const nextScreenTrack = wasScreenTrackUnpublished ? null : existingParticipant.screenTrack;
        const nextHasVideo = Boolean(nextCameraTrack || nextScreenTrack);

        participants.set(uid, {
          ...existingParticipant,
          cameraTrack: nextCameraTrack,
          screenTrack: nextScreenTrack,
          isScreenSharing: wasScreenTrackUnpublished ? false : existingParticipant.isScreenSharing,
          hasVideo: nextHasVideo,
        });

        const newActiveScreenShareUid = wasScreenTrackUnpublished && prev.activeScreenShareUid === uid 
          ? null 
          : prev.activeScreenShareUid;

        const newMainVideoUser = wasScreenTrackUnpublished 
          ? determineMainVideoUser(
              prev.localUid,
              prev.isScreenSharing,
              newActiveScreenShareUid,
              prev.activeSpeaker,
              prev.isViewOnly
            )
          : prev.mainVideoUser;

        return {
          ...prev,
          participants,
          activeScreenShareUid: newActiveScreenShareUid,
          mainVideoUser: newMainVideoUser,
        };
      });
    }

    if (mediaType === "audio") {
      setState(prev => {
        const participants = new Map(prev.participants);
        const existingParticipant = participants.get(uid);

        if (existingParticipant) {
          participants.set(uid, {
            ...existingParticipant,
            audioTrack: null,
            hasAudio: false,
          });
        }

        return { ...prev, participants };
      });
    }
  }, [determineMainVideoUser]);

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    const leftUid = String(user.uid);
    
    setState(prev => {
      const participants = new Map(prev.participants);
      participants.delete(leftUid);

      const newActiveScreenShareUid = prev.activeScreenShareUid === leftUid 
        ? null 
        : prev.activeScreenShareUid;

      const newMainVideoUser = prev.mainVideoUser === leftUid 
        ? determineMainVideoUser(
            prev.localUid,
            prev.isScreenSharing,
            newActiveScreenShareUid,
            prev.activeSpeaker,
            prev.isViewOnly
          )
        : prev.mainVideoUser;
      
      return {
        ...prev,
        participants,
        activeScreenShareUid: newActiveScreenShareUid,
        mainVideoUser: newMainVideoUser,
      };
    });
  }, [determineMainVideoUser]);

  const handleVolumeIndicator = useCallback((volumes: { uid: number | string; level: number }[]) => {
    let maxVolume = 0;
    let loudestUid: string | null = null;

    volumes.forEach(({ uid, level }) => {
      if (level > maxVolume && level > 10) {
        maxVolume = level;
        loudestUid = String(uid);
      }
    });

    if (loudestUid) {
      setState(prev => ({ ...prev, activeSpeaker: loudestUid }));
    }
  }, []);

  const joinMeeting = useCallback(async (data: JoinMeetingData, onError: (message: string) => void) => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Set connecting state
    setState(prev => ({ ...prev, joinState: "connecting", joinError: null }));
    
    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Set up event listeners with internal handlers
      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);
      client.on("user-left", handleUserLeft);
      client.on("volume-indicator", handleVolumeIndicator);

      // Connection state monitoring
      client.on("connection-state-change", (curState, prevState, reason) => {
        console.log(`Connection: ${prevState} -> ${curState} (${reason})`);
        
        if (curState === "DISCONNECTED") {
          onError('Connection lost. Please check your network and rejoin.');
        }
      });

      // Token renewal handlers
      client.on("token-privilege-will-expire", async () => {
        console.warn("Token expiring soon");
        onError('Session expiring. Please rejoin the meeting.');
      });

      client.on("token-privilege-did-expire", () => {
        console.error("Token expired");
        onError('Session expired. Please rejoin the meeting.');
        client.leave();
      });

      // Join with timeout
      const joinWithTimeout = new Promise<void>((resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout - please check your network and try again'));
        }, 15000);

        client.join(
          data.agoraAppId,
          data.channelName,
          data.agoraToken,
          data.uid
        ).then(() => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          resolve();
        }).catch(reject);
      });

      await joinWithTimeout;

      // Fetch participant metadata
      const participantsData = await apiRequest(`/api/meetings/${data.meetingId}/participants`) as { participants: any[] };
      const participantMetadataMap = new Map<string, ParticipantMetadata>();
      
      if (participantsData.participants) {
        participantsData.participants.forEach((p: any) => {
          participantMetadataMap.set(p.uid, {
            uid: p.uid,
            name: p.name,
            role: p.role,
            isTeacher: p.isTeacher,
          });
        });
      }

      // Update state with participant metadata
      setState(prev => ({
        ...prev,
        meetingId: data.meetingId,
        meetingTitle: data.meetingTitle,
        isViewOnly: data.isViewOnly,
        localUid: data.uid,
        joined: true,
        joinState: "ready",
        joinError: null,
        participants: new Map(Array.from(participantMetadataMap.entries()).map(([uid, meta]) => [
          uid,
          {
            uid,
            name: meta.name,
            role: meta.role,
            isTeacher: meta.isTeacher,
            cameraTrack: null,
            screenTrack: null,
            audioTrack: null,
            isScreenSharing: false,
            hasVideo: false,
            hasAudio: false,
          }
        ])),
      }));

      client.enableAudioVolumeIndicator();

      // Create and publish tracks if not view-only
      if (!data.isViewOnly) {
        try {
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          const videoTrack = await AgoraRTC.createCameraVideoTrack();

          localAudioTrackRef.current = audioTrack;
          localVideoTrackRef.current = videoTrack;

          await client.publish([audioTrack, videoTrack]);
          
          // Set main video to local after publishing
          setState(prev => ({
            ...prev,
            mainVideoUser: determineMainVideoUser(
              data.uid,
              false,
              null,
              null,
              data.isViewOnly
            )
          }));
        } catch (trackError) {
          console.error("Error creating/publishing tracks:", trackError);
          // Continue even if tracks fail - user can still view
          onError('Could not access camera/microphone. You can still view the meeting.');
        }
      }

    } catch (error) {
      console.error("Error joining meeting:", error);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to join the meeting. Please try again.';
      onError(errorMessage);
      
      // Set error state
      setState(prev => ({
        ...prev,
        joinState: "error",
        joinError: errorMessage,
        joined: false,
      }));
      
      // Clean up on error
      if (clientRef.current) {
        await clientRef.current.leave().catch(() => {});
        clientRef.current = null;
      }
      throw error;
    }
  }, [handleUserPublished, handleUserUnpublished, handleUserLeft, handleVolumeIndicator]);

  const leaveMeeting = useCallback(async (meetingId: string | null) => {
    try {
      // Stop screen share if active
      const screenTrack = localScreenTrackRef.current;
      if (screenTrack) {
        if (clientRef.current) {
          await clientRef.current.unpublish(screenTrack).catch(console.error);
        }
        screenTrack.stop();
        screenTrack.close();
        localScreenTrackRef.current = null;
      }

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      // Detach event listeners before leaving
      if (clientRef.current) {
        clientRef.current.off("user-published", handleUserPublished);
        clientRef.current.off("user-unpublished", handleUserUnpublished);
        clientRef.current.off("user-left", handleUserLeft);
        clientRef.current.off("volume-indicator", handleVolumeIndicator);
        
        await clientRef.current.leave();
        clientRef.current = null;
      }

      if (meetingId) {
        await fetch(`/api/meetings/${meetingId}/leave`, {
          method: 'POST',
          credentials: 'include',
        });
      }

      // Reset state
      resetMeeting();
    } catch (error) {
      console.error("Error leaving meeting:", error);
      throw error;
    }
  }, [handleUserPublished, handleUserUnpublished, handleUserLeft, handleVolumeIndicator]);

  const endMeeting = useCallback(async (meetingId: string | null) => {
    try {
      // Stop screen share if active
      const screenTrack = localScreenTrackRef.current;
      if (screenTrack) {
        if (clientRef.current) {
          await clientRef.current.unpublish(screenTrack).catch(console.error);
        }
        screenTrack.stop();
        screenTrack.close();
        localScreenTrackRef.current = null;
      }

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      // Detach event listeners before leaving
      if (clientRef.current) {
        clientRef.current.off("user-published", handleUserPublished);
        clientRef.current.off("user-unpublished", handleUserUnpublished);
        clientRef.current.off("user-left", handleUserLeft);
        clientRef.current.off("volume-indicator", handleVolumeIndicator);
        
        await clientRef.current.leave();
        clientRef.current = null;
      }

      if (meetingId) {
        await apiRequest(`/api/meetings/${meetingId}/end`, {
          method: 'POST',
        });
      }

      // Reset state
      resetMeeting();
    } catch (error) {
      console.error("Error ending meeting:", error);
      throw error;
    }
  }, [handleUserPublished, handleUserUnpublished, handleUserLeft, handleVolumeIndicator]);

  const toggleVideo = useCallback(async () => {
    setState(prev => {
      const newVideoEnabled = !prev.videoEnabled;
      const track = localVideoTrackRef.current;
      if (track && !prev.isScreenSharing) {
        track.setEnabled(newVideoEnabled).catch(console.error);
      }
      return { ...prev, videoEnabled: newVideoEnabled };
    });
  }, []);

  const toggleAudio = useCallback(async () => {
    setState(prev => {
      const newAudioEnabled = !prev.audioEnabled;
      const track = localAudioTrackRef.current;
      if (track) {
        track.setEnabled(newAudioEnabled).catch(console.error);
      }
      return { ...prev, audioEnabled: newAudioEnabled };
    });
  }, []);

  const startScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client || state.isScreenSharing || state.isViewOnly) return;

    try {
      // Unpublish camera track first
      const cameraTrack = localVideoTrackRef.current;
      if (cameraTrack) {
        await client.unpublish(cameraTrack);
      }

      // Create and publish screen track
      const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable");
      localScreenTrackRef.current = screenTrack;
      await client.publish(screenTrack);

      setState(prev => {
        const newMainVideoUser = determineMainVideoUser(
          prev.localUid,
          true,
          prev.activeScreenShareUid,
          prev.activeSpeaker,
          prev.isViewOnly
        );

        return {
          ...prev,
          isScreenSharing: true,
          mainVideoUser: newMainVideoUser,
        };
      });

      // Handle screen share stop event (when user clicks "Stop sharing" in browser)
      screenTrack.on("track-ended", async () => {
        try {
          const currentClient = clientRef.current;
          const currentScreenTrack = localScreenTrackRef.current;
          
          if (currentScreenTrack) {
            if (currentClient) {
              await currentClient.unpublish(currentScreenTrack).catch(console.error);
            }
            currentScreenTrack.stop();
            currentScreenTrack.close();
            localScreenTrackRef.current = null;

            // Check current state and republish camera if enabled
            setState(prev => {
              const cameraTrack = localVideoTrackRef.current;
              if (cameraTrack && prev.videoEnabled && currentClient) {
                currentClient.publish(cameraTrack).catch(console.error);
              }

              const newMainVideoUser = determineMainVideoUser(
                prev.localUid,
                false,
                prev.activeScreenShareUid,
                prev.activeSpeaker,
                prev.isViewOnly
              );

              return {
                ...prev,
                isScreenSharing: false,
                mainVideoUser: newMainVideoUser,
              };
            });
          }
        } catch (error) {
          console.error("Error in track-ended handler:", error);
        }
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
      
      // Re-publish camera if screen share failed
      const cameraTrack = localVideoTrackRef.current;
      if (cameraTrack && client) {
        await client.publish(cameraTrack).catch(console.error);
      }
      throw error;
    }
  }, [state.isScreenSharing, state.isViewOnly, state.localUid, state.activeScreenShareUid, state.activeSpeaker, determineMainVideoUser]);

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current;
    const screenTrack = localScreenTrackRef.current;
    
    if (!screenTrack) return;

    try {
      // Unpublish and close screen track
      if (client) {
        await client.unpublish(screenTrack);
      }
      screenTrack.stop();
      screenTrack.close();
      localScreenTrackRef.current = null;

      // Republish camera if it was enabled
      const cameraTrack = localVideoTrackRef.current;
      if (cameraTrack && state.videoEnabled && client) {
        await client.publish(cameraTrack);
      }

      setState(prev => {
        const newMainVideoUser = determineMainVideoUser(
          prev.localUid,
          false,
          prev.activeScreenShareUid,
          prev.activeSpeaker,
          prev.isViewOnly
        );

        return {
          ...prev,
          isScreenSharing: false,
          mainVideoUser: newMainVideoUser,
        };
      });
    } catch (error) {
      console.error("Error stopping screen share:", error);
      throw error;
    }
  }, [state.videoEnabled, state.localUid, state.activeScreenShareUid, state.activeSpeaker, state.isViewOnly, determineMainVideoUser]);

  const resetMeeting = useCallback(() => {
    setState({
      isMinimized: false,
      meetingId: null,
      meetingTitle: null,
      participantCount: 0,
      videoEnabled: true,
      audioEnabled: true,
      isScreenSharing: false,
      isViewOnly: false,
      joined: false,
      joinState: "idle",
      joinError: null,
      localUid: null,
      mainVideoUser: null,
      participants: new Map(),
      activeScreenShareUid: null,
      activeSpeaker: null,
    });
    
    // Clean up refs
    clientRef.current = null;
    localVideoTrackRef.current = null;
    localAudioTrackRef.current = null;
    localScreenTrackRef.current = null;
  }, []);

  const getClient = useCallback(() => clientRef.current, []);
  const getLocalVideoTrack = useCallback(() => localVideoTrackRef.current, []);
  const getLocalAudioTrack = useCallback(() => localAudioTrackRef.current, []);
  const getLocalScreenTrack = useCallback(() => localScreenTrackRef.current, []);

  return (
    <MeetingContext.Provider
      value={{
        ...state,
        joinMeeting,
        leaveMeeting,
        endMeeting,
        toggleVideo,
        toggleAudio,
        startScreenShare,
        stopScreenShare,
        minimize,
        expand,
        updateMeetingInfo,
        setParticipantCount,
        setMainVideoUser,
        resetMeeting,
        getClient,
        getLocalVideoTrack,
        getLocalAudioTrack,
        getLocalScreenTrack,
        minimizedVideoRef,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}
