import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Clock, Lock, Play, Pause, CheckCircle2 } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  mediaUrl?: string;
  duration: number;
  difficulty: string;
  chapterNumber: number;
  lessonNumber: number;
  contentType: string;
  learningObjectives?: string[];
  resources?: any;
}

interface LessonProgress {
  id: string;
  progressPercentage: number;
  timeSpent: number;
  completedAt?: string;
  lastAccessedAt: string;
}

interface LessonAccess {
  hasAccess: boolean;
  isPremium: boolean;
  limitType?: 'preview' | 'lesson_count';
  accessedCount?: number;
  maxLessons?: number;
  message: string;
}

interface LessonViewerProps {
  lessonId: string;
  subjectId?: string;
  courseId?: string;
  allLessons?: Lesson[];
  onBack: () => void;
  onNextLesson?: (nextLessonId: string) => void;
  onPreviousLesson?: (prevLessonId: string) => void;
}

const LessonViewer = ({ 
  lessonId, 
  subjectId, 
  courseId, 
  allLessons = [],
  onBack, 
  onNextLesson, 
  onPreviousLesson 
}: LessonViewerProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [currentProgress, setCurrentProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Progress recovery and sync guards
  const recoveryAttemptedRef = useRef(false);
  const recoveryInFlightRef = useRef(false);
  const hasUnsyncedProgressRef = useRef(false);
  const lastSyncedProgressRef = useRef(0);

  // Fetch lesson data with progress
  const { data: lessonData, isLoading: lessonLoading } = useQuery({
    queryKey: ['/api/lessons', lessonId, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      
      const response = await fetch(`/api/lessons/${lessonId}?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch lesson');
      }
      
      return result.data;
    },
    enabled: !!lessonId
  });

  // Check lesson access for free users
  const { data: accessData } = useQuery({
    queryKey: ['/api/users/lesson-access', user?.id, subjectId, courseId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      if (courseId) params.append('courseId', courseId);
      
      const response = await fetch(`/api/users/${user.id}/lesson-access?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check access');
      }
      
      return result as LessonAccess;
    },
    enabled: !!user?.id && (!!subjectId || !!courseId)
  });

  // Progress update mutation
  const progressMutation = useMutation({
    mutationFn: async (progressData: { progressPercentage?: number; timeSpent?: number; completed?: boolean }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify(progressData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update progress');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons', lessonId] });
    }
  });

  const lesson = lessonData?.lesson;
  const progress = lessonData?.progress;

  // Initialize progress from existing data and seed sync tracking
  useEffect(() => {
    if (progress) {
      setCurrentProgress(progress.progressPercentage || 0);
      setTimeSpent(progress.timeSpent || 0);
      lastSyncedProgressRef.current = progress.progressPercentage || 0;
      hasUnsyncedProgressRef.current = false;
    }
  }, [progress]);

  // Time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && startTime) {
      interval = setInterval(() => {
        const newTimeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60); // minutes
        setTimeSpent(prev => prev + newTimeSpent);
        setStartTime(new Date()); // Reset start time
      }, 60000); // Update every minute
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, startTime]);

  // Auto-save progress periodically with proper sync tracking
  useEffect(() => {
    if (!user?.id) return;
    
    const storageKey = `lessonProgress_${user.id}_${lessonId}`;
    
    const interval = setInterval(() => {
      if (currentProgress > 0 && !progressMutation.isPending && currentProgress !== lastSyncedProgressRef.current) {
        hasUnsyncedProgressRef.current = true;
        progressMutation.mutate(
          {
            progressPercentage: currentProgress,
            timeSpent: Math.floor(timeSpent)
          },
          {
            onSuccess: () => {
              hasUnsyncedProgressRef.current = false;
              lastSyncedProgressRef.current = currentProgress;
              localStorage.removeItem(storageKey);
            },
            onError: () => {
              hasUnsyncedProgressRef.current = true;
            }
          }
        );
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [currentProgress, timeSpent, user?.id, lessonId]);

  // Save progress to localStorage on page leave only if unsynced (user-scoped)
  useEffect(() => {
    if (!user?.id) return;

    const storageKey = `lessonProgress_${user.id}_${lessonId}`;
    
    const saveProgressToLocalStorage = () => {
      if (currentProgress > 0 && (hasUnsyncedProgressRef.current || progressMutation.isPending || currentProgress !== lastSyncedProgressRef.current)) {
        const unsavedProgress = {
          lessonId,
          userId: user.id,
          progressPercentage: currentProgress,
          timeSpent: Math.floor(timeSpent),
          savedAt: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(unsavedProgress));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgressToLocalStorage();
      }
    };

    window.addEventListener('beforeunload', saveProgressToLocalStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', saveProgressToLocalStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      saveProgressToLocalStorage();
    };
  }, [lessonId, currentProgress, timeSpent, user?.id]);

  // Recover and sync any unsaved progress from localStorage on mount (user-scoped, one-time)
  useEffect(() => {
    if (!user?.id || recoveryAttemptedRef.current || recoveryInFlightRef.current) return;

    const storageKey = `lessonProgress_${user.id}_${lessonId}`;
    
    const recoverProgress = async () => {
      recoveryInFlightRef.current = true;
      
      try {
        const savedProgressStr = localStorage.getItem(storageKey);
        if (savedProgressStr) {
          const savedProgress = JSON.parse(savedProgressStr);
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          
          if (
            savedProgress.userId === user.id &&
            savedProgress.savedAt > oneHourAgo && 
            savedProgress.progressPercentage > 0
          ) {
            await progressMutation.mutateAsync({
              progressPercentage: savedProgress.progressPercentage,
              timeSpent: savedProgress.timeSpent
            });
            localStorage.removeItem(storageKey);
            lastSyncedProgressRef.current = savedProgress.progressPercentage;
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      } catch (e) {
        // Leave data in storage for retry on next mount
      } finally {
        recoveryInFlightRef.current = false;
        recoveryAttemptedRef.current = true;
      }
    };
    
    recoverProgress();
  }, [lessonId, user?.id]);

  const handleStartLesson = () => {
    if (!accessData?.hasAccess && !accessData?.isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsPlaying(true);
    setStartTime(new Date());
    
    if (currentProgress === 0) {
      setCurrentProgress(5); // Mark as started
    }
  };

  const handleProgressUpdate = (newProgress: number) => {
    setCurrentProgress(newProgress);
    
    if (newProgress >= 100) {
      const storageKey = user?.id ? `lessonProgress_${user.id}_${lessonId}` : null;
      progressMutation.mutate(
        {
          progressPercentage: 100,
          timeSpent: Math.floor(timeSpent),
          completed: true
        },
        {
          onSuccess: () => {
            lastSyncedProgressRef.current = 100;
            hasUnsyncedProgressRef.current = false;
            if (storageKey) localStorage.removeItem(storageKey);
          }
        }
      );
    }
  };

  const handleCompleteLesson = () => {
    setCurrentProgress(100);
    setIsPlaying(false);
    const storageKey = user?.id ? `lessonProgress_${user.id}_${lessonId}` : null;
    progressMutation.mutate(
      {
        progressPercentage: 100,
        timeSpent: Math.floor(timeSpent),
        completed: true
      },
      {
        onSuccess: () => {
          lastSyncedProgressRef.current = 100;
          hasUnsyncedProgressRef.current = false;
          if (storageKey) localStorage.removeItem(storageKey);
        }
      }
    );
  };

  const handleNextLesson = () => {
    if (!allLessons.length) return;
    
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      if (onNextLesson) {
        onNextLesson(nextLesson.id);
      }
    }
  };

  const handlePreviousLesson = () => {
    if (!allLessons.length) return;
    
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      if (onPreviousLesson) {
        onPreviousLesson(prevLesson.id);
      }
    }
  };

  const getCurrentLessonIndex = () => {
    if (!allLessons.length) return null;
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    return currentIndex >= 0 ? currentIndex + 1 : null;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (lessonLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lesson Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The requested lesson could not be found.
              </p>
              <Button onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {getCurrentLessonIndex() && (
              <Badge variant="secondary">
                Lesson {getCurrentLessonIndex()} of {allLessons.length}
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(lesson.duration)}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        {currentProgress > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-sm font-medium">{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Lesson Content */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white mb-2">
                  {lesson.title}
                </CardTitle>
                {lesson.description && (
                  <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={lesson.difficulty === 'easy' ? 'secondary' : lesson.difficulty === 'medium' ? 'default' : 'destructive'}>
                  {lesson.difficulty}
                </Badge>
                {currentProgress >= 100 && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Access Control for Free Users */}
            {!accessData?.hasAccess && !accessData?.isPremium && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Premium Content</h3>
                </div>
                <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
                  {accessData?.message}
                </p>
                <Button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white" transition-all duration-300
                >
                  Upgrade to Premium
                </Button>
              </div>
            )}

            {/* Video/Media */}
            {lesson.videoUrl && (
              <div className="mb-6">
                <video 
                  controls 
                  className="w-full rounded-lg"
                  onPlay={handleStartLesson}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const progress = (video.currentTime / video.duration) * 100;
                    handleProgressUpdate(Math.max(currentProgress, progress));
                  }}
                >
                  <source src={lesson.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Media/Images */}
            {lesson.mediaUrl && !lesson.videoUrl && (
              <div className="mb-6">
                <img 
                  src={lesson.mediaUrl} 
                  alt={lesson.title}
                  className="w-full h-auto max-w-full rounded-lg shadow-sm object-contain"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Start/Continue Button */}
            {currentProgress === 0 && (
              <div className="text-center mb-6">
                <Button 
                  onClick={handleStartLesson}
                  size="lg" 
                  className="bg-[#A0FAB2] hover:bg-[#A0FAB2]/80 text-black" transition-all duration-300
                  disabled={!accessData?.hasAccess && !accessData?.isPremium}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Lesson
                </Button>
              </div>
            )}

            {/* Lesson Content */}
            <div className="prose dark:prose-invert max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>

            {/* Learning Objectives */}
            {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Learning Objectives</h3>
                <ul className="space-y-2">
                  {lesson.learningObjectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            {currentProgress > 0 && currentProgress < 100 && (accessData?.hasAccess || accessData?.isPremium) && (
              <div className="flex justify-center mb-6">
                <Button 
                  onClick={handleCompleteLesson}
                  className="bg-[#A0FAB2] hover:bg-[#A0FAB2]/80 text-black" transition-all duration-300
                >
                  Mark as Complete
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePreviousLesson}
            disabled={!allLessons.length || allLessons.findIndex(l => l.id === lessonId) === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous Lesson
          </Button>
          
          <Button 
            onClick={handleNextLesson}
            disabled={!allLessons.length || allLessons.findIndex(l => l.id === lessonId) === allLessons.length - 1}
            className="bg-[#A0FAB2] hover:bg-[#A0FAB2]/80 text-black" transition-all duration-300
          >
            Next Lesson
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              {accessData?.limitType === 'preview' 
                ? 'College and University courses require a premium subscription.'
                : `You've reached your free lesson limit (${accessData?.accessedCount}/${accessData?.maxLessons}). Upgrade to premium for unlimited access.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Premium Benefits</h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• Unlimited access to all lessons</li>
                <li>• Progress tracking and analytics</li>
                <li>• Downloadable resources</li>
                <li>• Priority support</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">
                Maybe Later
              </Button>
              <Button 
                className="flex-1 bg-[#A0FAB2] hover:bg-[#A0FAB2]/80 text-black" transition-all duration-300
                onClick={() => {
                  // TODO: Navigate to pricing page
                  setShowUpgradeModal(false);
                }}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonViewer;
