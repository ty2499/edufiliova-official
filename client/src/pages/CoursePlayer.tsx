import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Clock, 
  PlayCircle,
  ArrowLeft,
  Menu,
  ChevronRight,
  Play,
  Award,
  FileText,
  Video,
  Download,
  AlertCircle,
  Trophy,
  Target,
  Lock,
  BadgeCheck,
  Check,
  Home
} from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { apiRequest } from "@/lib/queryClient";
import LessonBlockRenderer from "@/components/LessonBlockRenderer";
import { useAuth } from "@/hooks/useAuth";

interface CoursePlayerProps {
  courseId: string;
  onNavigate: (page: string) => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  authorName?: string;
  publisherName?: string;
  price: number;
  difficulty: string;
  duration: number;
  avgRating: number;
  totalReviews: number;
  totalEnrollments: number;
  certificationType?: string;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  orderNum: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  content?: string;
  videoUrl?: string;
  orderNum: number;
  durationMinutes: number;
  freePreviewFlag: boolean;
  images?: string[];
}

interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number;
}

interface QuizQuestion {
  id: string;
  text?: string;
  question?: string;
  options: string[];
  correctAnswer?: number;
  correctIndex?: number;
  explanation?: string;
}

interface LessonProgress {
  lessonId: number;
  completed: boolean;
  quizPassed?: boolean;
  score?: number;
}

export default function CoursePlayer({ courseId, onNavigate }: CoursePlayerProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Get course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/course-creator/courses/${courseId}`],
    queryFn: async () => {
      try {
        const data = await apiRequest(`/api/course-creator/courses/${courseId}`);
        return data.course;
      } catch (error) {
        throw new Error('Failed to fetch course');
      }
    }
  });

  // Get course modules and lessons
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: [`/api/course-creator/courses/${courseId}/modules`],
    queryFn: async () => {
      try {
        const data = await apiRequest(`/api/course-creator/courses/${courseId}/modules`);
        console.log('📚 Modules data received:', data.modules);
        return data.modules || [];
      } catch (error) {
        console.error('❌ Error fetching modules:', error);
        return [];
      }
    },
    staleTime: 0,
    gcTime: 0
  });

  // Ensure modules is always an array
  const modules = Array.isArray(modulesData) ? modulesData : [];

  // Check enrollment status
  const { data: isEnrolled } = useQuery({
    queryKey: [`/api/course-creator/courses/${courseId}/enrollment`],
    queryFn: async () => {
      try {
        const data = await apiRequest(`/api/course-creator/courses/${courseId}/enrollment`);
        return data.enrolled;
      } catch (error) {
        return false;
      }
    }
  });

  // Get course progress
  const { data: courseProgress, refetch: refetchProgress } = useQuery<{
    completedLessons: number;
    totalLessons: number;
    progressPercentage: number;
    lessonProgress: LessonProgress[];
    averageScore?: number;
    lastAccessedLessonId?: number | null;
  }>({
    queryKey: [`/api/courses/${courseId}/progress`],
    queryFn: async () => {
      try {
        const data = await apiRequest(`/api/courses/${courseId}/progress`);
        return data;
      } catch (error) {
        return { completedLessons: 0, totalLessons: 0, progressPercentage: 0, lessonProgress: [], lastAccessedLessonId: null };
      }
    },
    enabled: isEnrolled
  });

  // Check if certificate exists for this course
  const { data: certificate } = useQuery<any>({
    queryKey: [`/api/certificates/course/${courseId}`],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/certificates/course/${courseId}`);
        const cert = response?.certificate || response;
        return cert && cert.id ? cert : null;
      } catch (error) {
        return null;
      }
    },
    enabled: isEnrolled
  });

  // Track lesson access - call when user views a lesson
  const trackLessonAccessMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return await apiRequest(`/api/lessons/${lessonId}/access`, {
        method: 'POST'
      });
    },
    onMutate: async (lessonId) => {
      // Optimistically update the cache with the new lastAccessedLessonId
      queryClient.setQueryData(
        [`/api/courses/${courseId}/progress`],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            lastAccessedLessonId: lessonId
          };
        }
      );
    },
    onSuccess: async () => {
      // Invalidate to ensure data consistency
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/courses/${courseId}/progress`] 
      });
    }
  });

  // Get quiz for current lesson
  const { data: quiz } = useQuery<Quiz | null>({
    queryKey: [`/api/quizzes/lesson/${selectedLesson}`],
    queryFn: async () => {
      if (!selectedLesson) return null;
      try {
        const data = await apiRequest(`/api/quizzes/lesson/${selectedLesson}`);
        // Convert letter answers (A, B, C, D) to indices (0, 1, 2, 3)
        if (data && data.questions) {
          data.questions = data.questions.map((q: any, idx: number) => {
            const questionId = `quiz-${data.id}-q-${idx}`;
            // Parse options if it's a comma-separated string
            let options = q.options;
            if (typeof options === 'string') {
              options = options.split(',').map((opt: string) => opt.trim());
            }
            return {
              ...q,
              id: questionId,
              options: options || [],
              correctAnswer: typeof q.correctAnswer === 'string' 
                ? q.correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0)
                : q.correctAnswer
            };
          });
          console.log('📝 Quiz questions with IDs:', data.questions.map((q: any) => ({ id: q.id, question: q.question })));
        }
        return data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!selectedLesson
  });

  // Get content blocks for current lesson (Shaw Academy/Alison style)
  const { data: contentBlocks = [] } = useQuery({
    queryKey: [`/api/lessons/${selectedLesson}/content-blocks`],
    queryFn: async () => {
      if (!selectedLesson) return [];
      try {
        const data = await apiRequest(`/api/lessons/${selectedLesson}/content-blocks`);
        console.log('📦 Raw content blocks from API:', data.blocks);
        // Transform backend data to frontend format
        const blocks = (data.blocks || []).map((block: any) => {
          const blockType = block.blockType;
          let content: any = {};
          
          switch (blockType) {
            case 'text':
              content = { text: block.content || '' };
              break;
            case 'accordion':
              content = { 
                title: block.title || 'Section', 
                content: block.content || '' 
              };
              break;
            case 'image':
              // Image URL can be in mediaUrl or content field (fallback for seeded courses)
              const imageUrl = block.mediaUrl || block.content || '';
              content = { 
                url: imageUrl, 
                alt: block.title || 'Lesson image',
                caption: block.mediaUrl && block.content ? block.content : undefined
              };
              break;
            case 'video':
              content = { 
                url: block.mediaUrl || '', 
                caption: block.content || undefined
              };
              break;
            case 'file':
              content = { 
                url: block.mediaUrl || '', 
                title: block.title || 'Download File',
                caption: block.content || undefined
              };
              break;
            default:
              content = { text: block.content || '' };
          }
          
          return {
            id: block.id.toString(),
            type: blockType,
            content,
            orderNum: block.displayOrder
          };
        });
        console.log('📦 Transformed content blocks:', blocks);
        return blocks;
      } catch (error) {
        console.error('❌ Error fetching content blocks:', error);
        return [];
      }
    },
    enabled: !!selectedLesson
  });

  // Mark lesson as completed
  const markCompletedMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return await apiRequest(`/api/course-creator/lessons/${lessonId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ completed: true })
      });
    },
    onSuccess: async (data, lessonId) => {
      // Optimistically update the cache immediately
      queryClient.setQueryData(
        [`/api/courses/${courseId}/progress`],
        (old: any) => {
          if (!old) return old;
          
          const existingProgress = old.lessonProgress || [];
          const lessonProgressExists = existingProgress.some((lp: any) => lp.lessonId === lessonId);
          
          return {
            ...old,
            lessonProgress: lessonProgressExists
              ? existingProgress.map((lp: any) => 
                  lp.lessonId === lessonId 
                    ? { ...lp, completed: true } 
                    : lp
                )
              : [...existingProgress, { lessonId, completed: true }],
            completedLessons: lessonProgressExists
              ? old.completedLessons
              : (old.completedLessons || 0) + 1,
            progressPercentage: old.totalLessons > 0
              ? Math.round(((lessonProgressExists ? old.completedLessons : (old.completedLessons || 0) + 1) / old.totalLessons) * 100)
              : 0
          };
        }
      );
      
      // Then invalidate to ensure data consistency
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/courses/${courseId}/progress`] 
      });
    },
    onError: (error) => {
      // Silent error handling - AJAX only
    }
  });

  // Submit quiz
  const submitQuizMutation = useMutation({
    mutationFn: async ({ lessonId, answers, score }: { lessonId: number; answers: any; score: number }) => {
      return await apiRequest('/api/quizzes/submit', {
        method: 'POST',
        body: JSON.stringify({ lessonId, answers, score })
      });
    },
    onSuccess: async (data, variables) => {
      // Invalidate and refetch progress to update the progress bar
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/courses/${courseId}/progress`] 
      });
      
      if (data.passed) {
        // Automatically mark lesson as complete when quiz is passed
        try {
          await apiRequest(`/api/course-creator/lessons/${variables.lessonId}/complete`, {
            method: 'POST',
            body: JSON.stringify({ completed: true })
          });
          
          // Update progress in cache
          queryClient.setQueryData(
            [`/api/courses/${courseId}/progress`],
            (old: any) => {
              if (!old) return old;
              
              const existingProgress = old.lessonProgress || [];
              const lessonProgressExists = existingProgress.some((lp: any) => lp.lessonId === variables.lessonId);
              
              return {
                ...old,
                lessonProgress: lessonProgressExists
                  ? existingProgress.map((lp: any) => 
                      lp.lessonId === variables.lessonId 
                        ? { ...lp, completed: true } 
                        : lp
                    )
                  : [...existingProgress, { lessonId: variables.lessonId, completed: true }],
                completedLessons: lessonProgressExists
                  ? old.completedLessons
                  : (old.completedLessons || 0) + 1,
                progressPercentage: old.totalLessons > 0
                  ? Math.round(((lessonProgressExists ? old.completedLessons : (old.completedLessons || 0) + 1) / old.totalLessons) * 100)
                  : 0
              };
            }
          );
          
          // Invalidate to ensure consistency
          await queryClient.invalidateQueries({ 
            queryKey: [`/api/courses/${courseId}/progress`] 
          });
        } catch (error) {
          console.error('Failed to mark lesson complete:', error);
        }
      }
    }
  });

  // Auto-expand first module with accessible lessons on load and resume from last lesson
  useEffect(() => {
    console.log('🔍 Auto-expand effect:', { 
      hasModules: !!modules, 
      modulesCount: modules?.length,
      selectedModule,
      selectedLesson,
      isEnrolled,
      lastAccessedLessonId: courseProgress?.lastAccessedLessonId,
      modulesData: modules 
    });
    
    if (modules && modules.length > 0 && selectedModule === null && isEnrolled !== undefined) {
      console.log('🎯 Looking for module to auto-select...');
      
      // If user has a last accessed lesson, resume from there
      if (isEnrolled && courseProgress?.lastAccessedLessonId) {
        const lastLessonId = courseProgress.lastAccessedLessonId;
        console.log('🔄 Resuming from last accessed lesson:', lastLessonId);
        
        // Find which module contains this lesson
        for (const module of modules) {
          const lesson = module.lessons.find((l: Lesson) => l.id === lastLessonId);
          if (lesson && (isEnrolled || lesson.freePreviewFlag)) {
            console.log('✅ Auto-selecting module and lesson:', module.id, lastLessonId);
            setSelectedModule(module.id);
            setSelectedLesson(lastLessonId);
            return;
          }
        }
      }
      
      // Otherwise, auto-expand first module with accessible lessons AND select first lesson
      for (const module of modules) {
        const accessibleLessons = isEnrolled 
          ? module.lessons 
          : module.lessons.filter((l: Lesson) => l.freePreviewFlag);
        
        console.log(`📖 Module "${module.title}": ${accessibleLessons.length} accessible lessons`, accessibleLessons);
        
        if (accessibleLessons.length > 0) {
          console.log('✅ Auto-expanding first module and selecting first lesson:', module.id, accessibleLessons[0].id);
          setSelectedModule(module.id);
          setSelectedLesson(accessibleLessons[0].id);
          break;
        }
      }
    }
  }, [modules, selectedModule, selectedLesson, isEnrolled, courseProgress?.lastAccessedLessonId]);

  // Track lesson access when lesson changes
  useEffect(() => {
    if (selectedLesson && isEnrolled) {
      trackLessonAccessMutation.mutate(selectedLesson);
    }
  }, [selectedLesson, isEnrolled]);

  // Reset quiz state when lesson changes
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  }, [selectedLesson]);

  // Redirect to login if user is not authenticated and has no access to course
  useEffect(() => {
    if (!user && isEnrolled === false && modules && modules.length > 0) {
      // Check if there are any free preview lessons
      const hasAnyFreePreview = modules.some((m: Module) => 
        m.lessons && m.lessons.some((l: Lesson) => l.freePreviewFlag)
      );
      
      // If no free preview lessons, redirect to login
      if (!hasAnyFreePreview) {
        onNavigate('auth');
      }
    }
  }, [user, isEnrolled, modules, onNavigate]);

  // Preview mode for non-enrolled users
  const isPreviewMode = !isEnrolled;
  
  // Filter lessons based on enrollment status
  const getAccessibleLessons = (module: Module) => {
    if (isEnrolled) return module.lessons;
    // For preview mode, only show lessons with freePreviewFlag
    return module.lessons.filter(lesson => lesson.freePreviewFlag);
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4 w-64"></div>
          <div className="h-4 bg-muted rounded mb-2 w-48"></div>
        </div>
      </div>
    );
  }

  const currentModule = modules?.find((m: Module) => m.id === selectedModule);
  const accessibleLessons = currentModule ? getAccessibleLessons(currentModule) : [];
  const currentLesson = accessibleLessons?.find((l: Lesson) => l.id === selectedLesson);
  
  // Check if there are any accessible lessons in the course
  const hasAccessibleLessons = modules?.some((m: Module) => getAccessibleLessons(m).length > 0) || false;
  
  const isLessonCompleted = (lessonId: number) => {
    return courseProgress?.lessonProgress?.some(lp => lp.lessonId === lessonId && lp.completed) || false;
  };
  
  const isLessonAccessible = (lesson: Lesson) => {
    return isEnrolled || lesson.freePreviewFlag;
  };

  const handleMarkComplete = () => {
    if (isPreviewMode) {
      return;
    }
    if (selectedLesson) {
      markCompletedMutation.mutate(selectedLesson);
    }
  };

  const handleQuizSubmit = () => {
    if (!quiz) return;
    
    let correct = 0;
    quiz.questions.forEach((q) => {
      const correctAnswerIndex = q.correctIndex ?? q.correctAnswer ?? 0;
      if (quizAnswers[q.id] === correctAnswerIndex) {
        correct++;
      }
    });
    
    const score = Math.round((correct / quiz.questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    
    if (isPreviewMode) {
      return;
    }
    
    if (selectedLesson) {
      submitQuizMutation.mutate({
        lessonId: selectedLesson,
        answers: quizAnswers,
        score
      });
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };


  // Check if current lesson is the last lesson in the course
  const isLastLesson = () => {
    if (!modules || modules.length === 0 || !selectedLesson) return false;
    
    // Get all accessible lessons
    const allAccessible = modules.flatMap((m: Module) => getAccessibleLessons(m));
    if (allAccessible.length === 0) return false;
    
    // Check if current lesson is the last one
    const lastLesson = allAccessible[allAccessible.length - 1];
    return lastLesson.id === selectedLesson;
  };

  // Check if student qualifies for certificate (100% completion + 70% overall average score)
  const qualifiesForCertificate = () => {
    if (!isEnrolled || !courseProgress) return false;
    const progressComplete = courseProgress.progressPercentage >= 100;
    const avgScore = courseProgress.averageScore;
    
    // If course has no quizzes (avgScore is null/undefined), qualify on 100% completion alone
    if (avgScore === null || avgScore === undefined) {
      return progressComplete;
    }
    
    // If course has quizzes, require >= 70% average score
    return progressComplete && avgScore >= 70;
  };

  // Check if student should retake course (100% completion but < 70% overall average score)
  const shouldRetakeCourse = () => {
    if (!isEnrolled || !courseProgress) return false;
    const progressComplete = courseProgress.progressPercentage >= 100;
    const avgScore = courseProgress.averageScore;
    
    // Only show retake if course HAS quizzes AND score is < 70%
    return progressComplete && avgScore !== null && avgScore !== undefined && avgScore < 70;
  };

  // Determine certificate type based on certificationType field
  const getCertificateType = () => {
    // Check course certificationType from course data
    if (course?.certificationType === 'diploma') return 'diploma';
    return 'certificate';
  };

  const navigateToNextLesson = () => {
    if (!currentModule || !currentLesson) return;
    
    const accessibleLessons = getAccessibleLessons(currentModule);
    const currentLessonIndex = accessibleLessons.findIndex((l: Lesson) => l.id === selectedLesson);
    
    if (currentLessonIndex < accessibleLessons.length - 1) {
      // Move to next lesson in current module
      setSelectedLesson(accessibleLessons[currentLessonIndex + 1].id);
    } else {
      // Find next module with accessible lessons
      const currentModuleIndex = modules.findIndex((m: Module) => m.id === selectedModule);
      
      for (let i = currentModuleIndex + 1; i < modules.length; i++) {
        const nextModule = modules[i];
        const nextAccessibleLessons = getAccessibleLessons(nextModule);
        
        if (nextAccessibleLessons.length > 0) {
          setSelectedModule(nextModule.id);
          setSelectedLesson(nextAccessibleLessons[0].id);
          return;
        }
      }
    }
  };

  const navigateToPreviousLesson = () => {
    if (!currentModule || !currentLesson) return;
    
    const accessibleLessons = getAccessibleLessons(currentModule);
    const currentLessonIndex = accessibleLessons.findIndex((l: Lesson) => l.id === selectedLesson);
    
    if (currentLessonIndex > 0) {
      // Move to previous lesson in current module
      setSelectedLesson(accessibleLessons[currentLessonIndex - 1].id);
    } else {
      // Find previous module with accessible lessons
      const currentModuleIndex = modules.findIndex((m: Module) => m.id === selectedModule);
      
      for (let i = currentModuleIndex - 1; i >= 0; i--) {
        const prevModule = modules[i];
        const prevAccessibleLessons = getAccessibleLessons(prevModule);
        
        if (prevAccessibleLessons.length > 0) {
          setSelectedModule(prevModule.id);
          // Go to the last lesson of the previous module
          setSelectedLesson(prevAccessibleLessons[prevAccessibleLessons.length - 1].id);
          return;
        }
      }
    }
  };

  const handleLessonClick = (lessonId: number) => {
    console.log('🎯 Lesson clicked:', lessonId);
    
    // Always reset quiz state when clicking a lesson (even if it's the same lesson)
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    
    // Set the selected lesson
    setSelectedLesson(lessonId);
    
    // Auto-close sidebar on mobile when lesson is selected
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
    
    // Scroll to top of content area on lesson change
    const contentArea = document.querySelector('.lesson-content-area');
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Blue Header */}
      <div className="bg-[#2d5ddd] text-white sticky top-0 z-10">
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate(`course-detail-${courseId}`)}
              data-testid="button-back-to-course"
              className="text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base md:text-lg font-bold" data-testid="course-title">{course?.title}</h1>
            </div>
          </div>
        </div>
      </div>
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-blue-500/10 border-b border-blue-500/20">
          <div className="px-2 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Free Preview Mode
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-200">
                    You're viewing free preview lessons. Enroll to unlock all content, track progress, and earn certificates.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onNavigate(`course-detail-${courseId}`)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                data-testid="button-enroll-now"
              >
                Enroll Now
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex relative">
        {/* Mobile Overlay */}
        {showSidebar && (
          <div 
            className="lg:hidden fixed top-[45px] left-0 right-0 bottom-0 bg-black/50 z-10"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 border-r bg-white h-[calc(100vh-45px)] overflow-y-auto lg:relative fixed left-0 top-[45px] z-20 lg:z-auto">
            <div className="p-2">
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Course Content</h2>
                <p className="text-sm text-muted-foreground">
                  {courseProgress?.completedLessons || 0} of {courseProgress?.totalLessons || 0} lessons completed
                </p>
              </div>
              
              {modules?.map((module: Module) => {
                const accessibleLessonsInModule = getAccessibleLessons(module);
                const isExpanded = selectedModule === module.id;
                
                return (
                  <div key={module.id} className="mb-3">
                    <button
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isExpanded ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => {
                        // Toggle module expansion
                        if (isExpanded) {
                          setSelectedModule(null);
                        } else {
                          setSelectedModule(module.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 pt-0.5">
                          <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${
                            isExpanded ? 'text-white' : 'text-muted-foreground'
                          } ${isExpanded ? 'rotate-90' : ''}`} />
                          <BookOpen className={`h-4 w-4 flex-shrink-0 ${
                            isExpanded ? 'text-white' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className={`font-semibold text-sm leading-tight ${
                            isExpanded ? 'text-white' : 'text-foreground'
                          }`}>
                            {module.title}
                          </h3>
                          {module.description && (
                            <p className={`text-xs leading-snug line-clamp-2 ${
                              isExpanded ? 'text-white/90' : 'text-muted-foreground'
                            }`}>
                              {module.description}
                            </p>
                          )}
                          <p className={`text-xs ${
                            isExpanded ? 'text-white/80' : 'text-muted-foreground'
                          }`}>
                            {accessibleLessonsInModule.length} {accessibleLessonsInModule.length === 1 ? 'lesson' : 'lessons'}
                          </p>
                        </div>
                      </div>
                    </button>
                    {isExpanded && accessibleLessonsInModule.length > 0 && (
                      <div className="mt-2 ml-6 space-y-1 border-l-2 border-muted pl-3">
                        {accessibleLessonsInModule.map((lesson: Lesson) => {
                          const completed = isLessonCompleted(lesson.id);
                          const accessible = isLessonAccessible(lesson);
                          return (
                            <button
                              key={lesson.id}
                              className={`w-full text-left p-2.5 rounded-md transition-all ${
                                selectedLesson === lesson.id 
                                  ? 'bg-[#2d5ddd] text-white shadow-md' 
                                  : accessible 
                                    ? 'hover:bg-accent/50' 
                                    : 'opacity-60 cursor-not-allowed'
                              }`}
                              onClick={() => {
                                if (accessible) {
                                  handleLessonClick(lesson.id);
                                }
                              }}
                              disabled={!accessible}
                              data-testid={`lesson-${lesson.id}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex-shrink-0">
                                  {!accessible ? (
                                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : completed ? (
                                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                      selectedLesson === lesson.id ? 'bg-white/20' : ''
                                    }`} style={{ backgroundColor: selectedLesson === lesson.id ? undefined : '#2d5ddd' }}>
                                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <Play className={`h-3.5 w-3.5 ${selectedLesson === lesson.id ? 'text-white' : 'text-muted-foreground'}`} />
                                  )}
                                </div>
                                <span className={`flex-1 text-xs font-medium line-clamp-2 leading-tight min-w-0 ${
                                  selectedLesson === lesson.id ? 'text-white' : 'text-foreground'
                                }`}>
                                  {lesson.title}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-xs ${selectedLesson === lesson.id ? 'text-white/90' : 'text-muted-foreground'}`}>
                                    {lesson.durationMinutes}m
                                  </span>
                                  {!accessible && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                      Locked
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {isExpanded && accessibleLessonsInModule.length === 0 && (
                      <div className="ml-10 text-xs text-muted-foreground py-2">
                        No accessible lessons in this module
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 h-[calc(100vh-45px)] overflow-y-auto relative lesson-content-area">
          {/* Mobile Menu Button - Floating */}
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden fixed bottom-6 right-6 z-30 bg-[#2d5ddd] text-white p-4 rounded-full shadow-lg hover:bg-[#1e3a8a] transition-colors"
              data-testid="button-show-menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          
          {currentLesson ? (
            <div key={`lesson-${selectedLesson}`}>
              {/* Lesson Header */}
              <div className="bg-white border-b py-4 px-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-bold" data-testid="lesson-title">{currentLesson.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {currentModule?.title}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {currentLesson.durationMinutes} min
                  </Badge>
                </div>
              </div>

              {/* Video Player */}
              {currentLesson.videoUrl && (
                <div className="aspect-video bg-black">
                  <video
                    key={currentLesson.videoUrl}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                  >
                    <source src={currentLesson.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Lesson Images */}
              {currentLesson.images && currentLesson.images.length > 0 && (
                <div className="px-4 py-4 space-y-4">
                  {currentLesson.images.map((imageUrl: string, index: number) => (
                    <div key={index} className="rounded-lg overflow-hidden shadow-md">
                      <img 
                        src={imageUrl} 
                        alt={`${currentLesson.title} - Image ${index + 1}`}
                        className="w-full h-auto max-w-2xl mx-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Lesson Content - Always show lesson content first, then content blocks */}
              {currentLesson.content ? (
                // Check if content contains HTML tags
                /<[a-z][\s\S]*>/i.test(currentLesson.content) ? (
                  <div 
                    className="prose prose-sm sm:prose max-w-none dark:prose-invert px-4 py-6
                      prose-headings:mt-4 prose-headings:mb-3 prose-headings:font-bold
                      prose-h2:text-xl prose-h3:text-lg prose-h4:text-base
                      prose-p:mb-4 prose-p:leading-relaxed
                      prose-ul:my-3 prose-ol:my-3 prose-li:my-1
                      prose-div:mb-4"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />
                ) : (
                  <div className="px-4 py-6 space-y-4">
                    {currentLesson.content.split('\n\n').map((paragraph: string, index: number) => {
                      const trimmedPara = paragraph.trim();
                      if (!trimmedPara) return null;
                      
                      if (trimmedPara.startsWith('##')) {
                        return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-foreground">{trimmedPara.replace(/^##\s*/, '')}</h2>;
                      } else if (trimmedPara.startsWith('#')) {
                        return <h3 key={index} className="text-lg font-semibold mt-5 mb-2 text-foreground">{trimmedPara.replace(/^#\s*/, '')}</h3>;
                      } else if (trimmedPara.startsWith('- ') || trimmedPara.startsWith('* ')) {
                        const items = paragraph.split('\n').filter(line => line.trim());
                        return (
                          <ul key={index} className="list-disc pl-6 my-3 space-y-2 text-muted-foreground">
                            {items.map((item, i) => (
                              <li key={i} className="leading-relaxed">{item.replace(/^[-*]\s*/, '')}</li>
                            ))}
                          </ul>
                        );
                      } else if (/^\d+\.\s/.test(trimmedPara)) {
                        const items = paragraph.split('\n').filter(line => line.trim());
                        return (
                          <ol key={index} className="list-decimal pl-6 my-3 space-y-2 text-muted-foreground">
                            {items.map((item, i) => (
                              <li key={i} className="leading-relaxed">{item.replace(/^\d+\.\s*/, '')}</li>
                            ))}
                          </ol>
                        );
                      } else {
                        return <p key={index} className="text-muted-foreground leading-relaxed">{trimmedPara}</p>;
                      }
                    })}
                  </div>
                )
              ) : contentBlocks && contentBlocks.length > 0 ? (
                <LessonBlockRenderer blocks={contentBlocks} />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No written content for this lesson.</p>
                  <p className="text-sm text-muted-foreground mt-2">Watch the video above to learn.</p>
                </div>
              )}
              
              {/* Additional Content Blocks (images, videos, files) - shown after main content */}
              {currentLesson.content && contentBlocks && contentBlocks.length > 0 && (
                <div className="border-t mt-4">
                  <LessonBlockRenderer blocks={contentBlocks} />
                </div>
              )}

              {/* Quiz Section */}
              {quiz && quiz.questions && quiz.questions.length > 0 && (
                <div className="bg-white border-y">
                  <div className="px-2 py-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {quiz.title || "Lesson Quiz"}
                        </div>
                        {quiz.description && (
                          <p className="text-xs text-muted-foreground mt-1">{quiz.description}</p>
                        )}
                      </div>
                      {quizSubmitted && quizScore !== null && (
                        <Badge variant={quizScore >= (quiz.passingScore || 70) ? "default" : "destructive"} className="text-sm px-3 py-1">
                          {quizScore}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Passing: {quiz.passingScore || 70}% • {quiz.questions.length} questions
                    </p>
                  </div>
                  <div className="px-2 py-2 space-y-4">
                    {quiz.questions.map((question, qIndex) => {
                      const questionKey = question.id;
                      return (
                      <div key={qIndex} className="p-2 border rounded bg-background">
                        <div className="flex items-start gap-2 mb-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                            {qIndex + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-3">{question.text || question.question}</p>
                            <RadioGroup
                              value={quizAnswers[questionKey]?.toString()}
                              onValueChange={(value) => {
                                console.log(`✏️ Answer selected for question ${questionKey}:`, value);
                                setQuizAnswers(prev => {
                                  const updated = { ...prev, [questionKey]: parseInt(value) };
                                  console.log('📋 Updated quiz answers:', updated);
                                  return updated;
                                });
                              }}
                              disabled={quizSubmitted}
                              name={questionKey}
                            >
                              {question.options.map((option, optIndex) => {
                                const isSelected = quizAnswers[questionKey] === optIndex;
                                const correctAnswerIndex = question.correctIndex ?? question.correctAnswer ?? 0;
                                const isCorrect = optIndex === correctAnswerIndex;
                                const showResult = quizSubmitted;
                                
                                let borderClass = 'border-transparent';
                                let bgClass = '';
                                
                                if (showResult) {
                                  if (isCorrect) {
                                    // Always show correct answer in green after submission
                                    borderClass = 'border-green-500';
                                    bgClass = 'bg-green-50 dark:bg-green-950';
                                  } else if (isSelected) {
                                    // Show wrong selected answer in red
                                    borderClass = 'border-red-500';
                                    bgClass = 'bg-red-50 dark:bg-red-950';
                                  }
                                } else if (isSelected) {
                                  // Before submission, show selected in blue
                                  borderClass = 'border-primary';
                                  bgClass = 'bg-primary/5';
                                }
                                
                                return (
                                  <div
                                    key={optIndex}
                                    className={`flex items-center space-x-2 p-2 rounded border-2 transition-colors ${borderClass} ${bgClass} ${!showResult && !isSelected ? 'hover:bg-muted' : ''}`}
                                  >
                                    <RadioGroupItem value={optIndex.toString()} id={`${question.id}-${optIndex}`} />
                                    <Label
                                      htmlFor={`${question.id}-${optIndex}`}
                                      className={`flex-1 cursor-pointer text-sm ${showResult && isCorrect ? 'font-semibold text-green-700 dark:text-green-400' : ''}`}
                                    >
                                      {option}
                                    </Label>
                                    {showResult && isCorrect && (
                                      <div className="flex items-center gap-1">
                                        <Check className="h-4 w-4 text-green-600 font-bold" />
                                        <span className="text-xs font-semibold text-green-600">Correct</span>
                                      </div>
                                    )}
                                    {showResult && isSelected && !isCorrect && (
                                      <AlertCircle className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                );
                              })}
                            </RadioGroup>
                            {quizSubmitted && question.explanation && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                                <p className="text-xs"><strong>Explanation:</strong> {question.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })}

                    <div className="flex justify-center gap-2 pt-2">
                      {!quizSubmitted ? (
                        <Button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length !== quiz.questions.length || submitQuizMutation.isPending}
                          size="sm"
                        >
                          {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
                        </Button>
                      ) : (
                        <>
                          {quizScore !== null && quizScore < (quiz.passingScore || 70) ? (
                            <Button onClick={handleRetakeQuiz} variant="outline" size="sm" data-testid="button-retake-quiz">
                              Retake Quiz
                            </Button>
                          ) : (
                            <Button onClick={navigateToNextLesson} size="sm" data-testid="button-continue-next">
                              Continue to Next Lesson
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Actions */}
              <div className="bg-white border-y">
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      onClick={navigateToPreviousLesson}
                      variant="outline"
                      size="sm"
                      data-testid="button-previous-lesson"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous Lesson
                    </Button>
                    
                    {certificate ? (
                      <Button 
                        onClick={() => onNavigate('claim-certificate-' + courseId)}
                        size="sm"
                        className="text-white hover:opacity-90"
                        style={{ backgroundColor: '#2d5ddd' }}
                        data-testid="button-view-certificate"
                      >
                        <BadgeCheck className="h-4 w-4 mr-2" />
                        View Your {getCertificateType() === 'diploma' ? 'Diploma' : 'Certificate'}
                      </Button>
                    ) : qualifiesForCertificate() ? (
                      <Button 
                        onClick={() => onNavigate('claim-certificate-' + courseId)}
                        size="sm"
                        className="text-white hover:opacity-90"
                        style={{ backgroundColor: '#ff5834' }}
                        data-testid="button-claim-certificate"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Claim {getCertificateType() === 'diploma' ? 'Diploma' : 'Certificate'}
                      </Button>
                    ) : shouldRetakeCourse() ? (
                      <Button 
                        onClick={() => {
                          // Navigate to first lesson to help user start retaking quizzes
                          if (modules && modules.length > 0) {
                            const firstModule = modules[0];
                            const firstLesson = getAccessibleLessons(firstModule)[0];
                            if (firstLesson) {
                              setSelectedModule(firstModule.id);
                              setSelectedLesson(firstLesson.id);
                            }
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        data-testid="button-retake-course"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Retake Course
                      </Button>
                    ) : (
                      <Button onClick={navigateToNextLesson} variant="outline" size="sm">
                        Next Lesson
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                {isPreviewMode && !hasAccessibleLessons ? (
                  <div className="max-w-md mx-auto bg-card border rounded-lg">
                    <div className="p-8">
                      <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Preview Lessons Available</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This course doesn't have free preview lessons. Enroll now to access all course content and earn your certificate!
                      </p>
                      <Button onClick={() => onNavigate(`course-detail-${courseId}`)} className="w-full">
                        View Course Details & Enroll
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select a Lesson</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a lesson from the sidebar to start learning
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
