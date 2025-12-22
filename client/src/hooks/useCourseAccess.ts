import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface CourseAccessData {
  course: any | null;
  isEnrolled: boolean;
  hasPurchased: boolean;
  isFree: boolean;
  canAccess: boolean;
  isLoading: boolean;
  error: any;
}

/**
 * Centralized hook for course access logic
 * Fetches course data, enrollment status, and purchase status in one place
 * Returns consolidated access information to prevent race conditions
 */
export function useCourseAccess(courseId: string | undefined): CourseAccessData {
  const { user } = useAuth();

  // Fetch course details
  const { 
    data: courseData, 
    isLoading: courseLoading, 
    error: courseError 
  } = useQuery({
    queryKey: [`/api/course-creator/courses/${courseId}`],
    enabled: !!courseId && courseId.length >= 10,
    staleTime: 30000,
    gcTime: 60000,
    retry: 1
  });

  const course = (courseData as any)?.course || courseData;

  // Fetch enrollment status (only if user is logged in)
  const { 
    data: enrollmentData, 
    isLoading: enrollmentLoading 
  } = useQuery({
    queryKey: [`/api/course-creator/courses/${courseId}/enrollment`],
    queryFn: async () => {
      try {
        const data = await apiRequest(`/api/course-creator/courses/${courseId}/enrollment`);
        return data.enrolled || false;
      } catch (error) {
        return false;
      }
    },
    enabled: !!courseId && !!user,
    staleTime: 10000
  });

  // Fetch purchase status (only if user is logged in and course is not free)
  const { 
    data: purchaseData, 
    isLoading: purchaseLoading 
  } = useQuery({
    queryKey: [`/api/courses/${courseId}/purchase-status`],
    queryFn: async () => {
      if (!user) return { hasPurchased: false, isFree: false };
      try {
        const data = await apiRequest(`/api/courses/${courseId}/purchase-status`);
        return data;
      } catch (error) {
        return { hasPurchased: false, isFree: false };
      }
    },
    enabled: !!courseId && !!user,
    staleTime: 10000
  });

  // Calculate access permissions
  const isFree = course?.pricingType === 'free' || course?.price === 0 || purchaseData?.isFree;
  const isEnrolled = enrollmentData === true;
  const hasPurchased = purchaseData?.hasPurchased === true;
  
  // User can access if: enrolled in free course OR purchased paid course
  const canAccess = (isFree && isEnrolled) || hasPurchased;

  const isLoading = courseLoading || (user ? (enrollmentLoading || purchaseLoading) : false);

  return {
    course,
    isEnrolled,
    hasPurchased,
    isFree,
    canAccess,
    isLoading,
    error: courseError
  };
}
