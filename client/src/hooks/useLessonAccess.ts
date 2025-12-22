import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export interface LessonAccess {
  hasAccess: boolean;
  reason: 'premium' | 'free_tier' | 'limit_exceeded';
  remainingFree?: number;
  requiredPlan?: string;
  planPrice?: string;
  message?: string;
}

export const useLessonAccess = (subjectId: string, lessonId: string) => {
  const { user, profile } = useAuth();
  const [access, setAccess] = useState<LessonAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !profile) {
        setAccess({ hasAccess: false, reason: 'limit_exceeded' });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/check-lesson-access/${user.id}/${subjectId}/${lessonId}`);
        const result = await response.json();
        
        if (result.success) {
          setAccess({
            hasAccess: result.hasAccess,
            reason: result.reason,
            remainingFree: result.remainingFree,
            requiredPlan: result.requiredPlan,
            planPrice: result.planPrice,
            message: result.message
          });
        } else {
          setAccess({ hasAccess: false, reason: 'limit_exceeded' });
        }
      } catch (error) {
        console.error('Error checking lesson access:', error);
        setAccess({ hasAccess: false, reason: 'limit_exceeded' });
      }
      
      setLoading(false);
    };

    if (subjectId && lessonId) {
      checkAccess();
    }
  }, [user, profile, subjectId, lessonId]);

  return { access, loading };
};

export const useSubjectProgress = (subjectId: string) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<{ accessedLessons: number; freeRemaining: number }>({ 
    accessedLessons: 0, 
    freeRemaining: 2 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !subjectId) {
        setLoading(false);
        return;
      }

      try {
        // Check progress for the subject
        const response = await fetch(`/api/check-lesson-access/${user.id}/${subjectId}/check`);
        const result = await response.json();
        
        if (result.success) {
          setProgress({
            accessedLessons: result.accessedLessons || 0,
            freeRemaining: Math.max(0, 2 - (result.accessedLessons || 0))
          });
        }
      } catch (error) {
        console.error('Error fetching subject progress:', error);
      }
      
      setLoading(false);
    };

    fetchProgress();
  }, [user, subjectId]);

  return { progress, loading };
};
