import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLessonAccess, useSubjectProgress } from "@/hooks/useLessonAccess";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  BookOpen, 
  Users, 
  MessageCircle, 
  Star, 
  Clock, 
  Play,
  CheckCircle2,
  Calendar,
  Trophy,
  Target,
  Book,
  Bookmark,
  Settings,
  Bell,
  Home,
  User,
  GraduationCap,
  PenTool,
  Lock,
  Crown,
  AlertCircle,
  LogOut,
  MoreHorizontal,
  X,
  ChevronUp,
  XCircle,
  ChevronDown,
  ChevronLeft,
  Mail,
  MapPin,
  Flame,
  FileText,
  Upload,
  Megaphone,
  ShoppingCart,
  ShoppingBag,
  Download,
  Wallet,
  CreditCard,
  Globe,
  Menu,
  Package,
  Receipt,
  Loader2,
  Briefcase,
  LayoutGrid,
  Video,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Gift
} from "lucide-react";
import { MessagingInterface } from "@/components/MessagingInterface";
import { getGradeFeatureRestrictions, GRADE_SUBSCRIPTION_PLANS, getSubscriptionTierFromGrade } from "@shared/schema";
import { StudentSettings } from "@/components/StudentSettings";
import StudentSocial from "@/components/StudentSocial";
import StudyNotes from "@/components/StudyNotes";
import { WalletPage } from "@/components/wallet/WalletPage";
import AnnouncementFeed from "@/components/AnnouncementFeed";
import { CommunityChat } from "@/components/CommunityChat";
import { NotificationBadge } from "@/components/NotificationBadge";
import { SchedulingInterface } from "@/components/SchedulingInterface";
import { formatCurrency } from "@shared/currency";
import type { ShopPurchase } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { filterSubjects } from "@/lib/catalog-loader";
import Logo from "@/components/Logo";
import { BannerAdDisplay } from "@/components/BannerAdDisplay";
import { SponsoredListingDisplay } from "@/components/SponsoredListingDisplay";
import BillingPage from "@/components/BillingPage";
import MyAdsPage from "./MyAdsPage";
import MyAds from "@/components/MyAds";
import PaymentModalWrapper from '@/components/PaymentModalWrapper';
import SubscriptionPaymentModal from '@/components/SubscriptionPaymentModal';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe';
import { CourseComments } from '@/components/CourseComments';
import LessonBlockRenderer from "@/components/LessonBlockRenderer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CourseDetail from "./CourseDetail";
import CoursePlayer from "./CoursePlayer";
import { FindTalent } from "./FindTalent";
import FreelancerProfile from "./FreelancerProfile";
import { PortfolioGallery } from "./PortfolioGallery";
import { MeetingDetailDialog } from "@/components/MeetingDetailDialog";
import ReceiptsSection from "@/components/ReceiptsSection";
import BuyVoucherSection from "@/components/BuyVoucherSection";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Subject {
  id: string;
  name: string;
  displayName: string;
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  color: string;
  nextLesson?: string;
  estimatedTime?: number;
  difficulty?: string;
}

// Helper function to format grade display for university/college students
const formatGradeDisplay = (grade: number | null | undefined, educationLevel?: string | null): string => {
  if (!grade) return "N/A";
  
  // For university/college/other (grade 14, 15), show education level instead of grade number
  if (grade === 14) {
    return "College";
  }
  if (grade === 15) {
    // Grade 15 can be University or Other
    if (educationLevel === 'tertiary' || educationLevel === 'university') {
      return "University";
    }
    return "Other";
  }
  
  // For regular grades (1-13), show "Grade X"
  return `Grade ${grade}`;
};

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  progress: number;
  status: "pending" | "in_progress" | "completed";
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

interface LessonViewerProps {
  lesson: any;
  exercises: any[];
  onBack: () => void;
  userId: string;
}

const LessonViewer = ({ lesson, exercises, onBack, userId }: LessonViewerProps) => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStartTime] = useState(Date.now());

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleQuizSubmit = async () => {
    // Calculate score
    let correctCount = 0;
    exercises.forEach((exercise, index) => {
      if (selectedAnswers[index] === exercise.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / exercises.length) * 100);
    setQuizScore(finalScore);
    setShowResults(true);

    // Save progress to backend
    try {
      const timeSpent = Math.round((Date.now() - quizStartTime) / 1000 / 60); // minutes
      await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          status: finalScore >= 70 ? 'completed' : 'in_progress',
          score: finalScore,
          correctAnswers: correctCount,
          totalQuestions: exercises.length,
          timeSpent
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowReview(false);
    setQuizScore(0);
    setShowQuiz(false);
  };

  if (showQuiz) {
    return (
      <div className="space-y-6">
        {/* Quiz Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowQuiz(false)}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Back to Lesson
          </Button>
          <Badge variant="outline" className="text-xs">
            Quiz Progress: {Object.keys(selectedAnswers).length}/{exercises.length}
          </Badge>
        </div>

        {!showResults ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quiz: {lesson.title}</span>
                  <Badge variant="secondary">
                    {currentQuizIndex + 1} of {exercises.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {exercises[currentQuizIndex] && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {exercises[currentQuizIndex].question}
                    </h3>
                    <div className="space-y-3">
                      {exercises[currentQuizIndex].options?.map((option: string, optionIndex: number) => (
                        <Button
                          key={optionIndex}
                          variant={selectedAnswers[currentQuizIndex] === option ? "default" : "outline"}
                          className="w-full text-left justify-start h-auto p-4"
                          onClick={() => handleAnswerSelect(currentQuizIndex, option)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5">
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <span>{option}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between pt-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuizIndex(Math.max(0, currentQuizIndex - 1))}
                    disabled={currentQuizIndex === 0}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                    size="sm"
                  >
                    Previous
                  </Button>
                  
                  {currentQuizIndex < exercises.length - 1 ? (
                    <Button
                      onClick={() => setCurrentQuizIndex(currentQuizIndex + 1)}
                      disabled={!selectedAnswers[currentQuizIndex]}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                      size="sm"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(selectedAnswers).length !== exercises.length}
                      className="hover:bg-green-700 bg-[#f44e3c] text-[#ffffff] w-full sm:w-auto text-xs sm:text-sm"
                      size="sm"
                    >
                      Submit Quiz
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {quizScore >= 70 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
                Quiz Results
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-3xl font-bold text-primary">{quizScore}%</div>
              <p className="text-muted-foreground">
                You scored {Object.values(selectedAnswers).filter((answer, index) => 
                  answer === exercises[index]?.correctAnswer
                ).length} out of {exercises.length} questions correctly.
              </p>
              
              {quizScore >= 70 ? (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-green-700 dark:text-green-300">
                    🎉 Congratulations! You passed the quiz and completed this lesson.
                  </p>
                </div>
              ) : (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p className="text-orange-700 dark:text-orange-300">
                    📚 You need 70% to pass. Review the lesson content and try again.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center w-full px-6 md:px-10">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReview(true)}
                  className="w-full sm:w-auto min-w-[120px] text-xs sm:text-sm"
                  size="sm"
                >
                  Review Answers
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetQuiz}
                  className="w-full sm:w-auto min-w-[120px] text-xs sm:text-sm"
                  size="sm"
                >
                  Retake Quiz
                </Button>
                <Button 
                  onClick={onBack}
                  className="w-full sm:w-auto min-w-[120px] text-xs sm:text-sm"
                  size="sm"
                >
                  Back to Lessons
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz Review Section */}
        {showReview && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Answer Review
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowReview(false)}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Back to Results
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {exercises.map((exercise, index) => {
                const userAnswer = selectedAnswers[index];
                const correctAnswerIndex = parseInt(exercise.correctAnswer);
                const isCorrect = userAnswer === exercise.options[correctAnswerIndex];
                
                return (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant={isCorrect ? "default" : "destructive"} className="mt-1">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-3">
                          {exercise.question}
                        </h4>
                        
                        <div className="space-y-3">
                          {/* User's Answer */}
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                              Your answer:
                            </span>
                            <span className={`font-medium ${
                              isCorrect 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {userAnswer || "Not answered"}
                              {isCorrect ? " ✓" : " ✗"}
                            </span>
                          </div>
                          
                          {/* Correct Answer */}
                          {!isCorrect && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                                Correct answer:
                              </span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {exercise.options[correctAnswerIndex]} ✓
                              </span>
                            </div>
                          )}
                          
                          {/* Explanation */}
                          {exercise.explanation && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-3">
                              <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 min-w-[80px]">
                                  Explanation:
                                </span>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  {exercise.explanation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={() => setShowReview(false)}>
                  Back to Results
                </Button>
                <Button variant="outline" onClick={resetQuiz}>
                  Retake Quiz
                </Button>
                <Button onClick={onBack}>
                  Back to Lessons
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
          data-testid="back-to-subjects"
        >
          <BookOpen className="w-4 h-4" />
          Back to Subjects
        </Button>
        {lesson.durationMinutes && (
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {lesson.durationMinutes} min
          </Badge>
        )}
      </div>
      {/* Lesson Content */}
      <div className="space-y-6">
        {/* Lesson Title */}
        <div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted-foreground mt-2">{lesson.description}</p>
          )}
        </div>
          {/* Lesson Images - Support both cloudinaryImages array and single mediaUrl */}
          {((lesson.cloudinaryImages && lesson.cloudinaryImages.length > 0) || lesson.mediaUrl) && (
            <div className="space-y-4">
              {/* Cloudinary Images Array */}
              {lesson.cloudinaryImages && lesson.cloudinaryImages.length > 0 && 
                lesson.cloudinaryImages.map((imageUrl: string, index: number) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${lesson.title} - Image ${index + 1}`}
                    className="w-full h-auto max-w-full rounded-lg shadow-md object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ))
              }
              {/* Single Media URL - Only show if no cloudinaryImages */}
              {lesson.mediaUrl && (!lesson.cloudinaryImages || lesson.cloudinaryImages.length === 0) && (
                <img
                  src={lesson.mediaUrl}
                  alt={lesson.title}
                  className="w-full h-auto max-w-full rounded-lg shadow-md object-contain"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>
          )}

        {/* Lesson Notes */}
        {lesson.notes && (
          <div className="w-full">
            <div 
              className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ 
                __html: lesson.notes
                  // Clean up asterisks used for bold
                  .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
                  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                  // Format topic headers (ALL CAPS lines or lines with colons)
                  .replace(/^(TOPIC|UNIT|CHAPTER|TERM|MODULE|SECTION)\s*(\d+[\.\:]?\d*)?:?\s*(.+)$/gim, 
                    '<h2 class="text-lg sm:text-xl lg:text-2xl font-bold text-primary mt-6 mb-3 pb-2 border-b border-primary/20">$1 $2: $3</h2>')
                  // Format main section headers (Title Case with colon)
                  .replace(/^([A-Z][a-zA-Z\s&,]+):\s*$/gm, 
                    '<h3 class="text-base sm:text-lg lg:text-xl font-semibold text-primary/90 mt-4 mb-2">$1</h3>')
                  // Format inline headers (words before colon in content)
                  .replace(/([A-Z][a-zA-Z\s&]+):\s+/g, 
                    '<span class="font-semibold">$1:</span> ')
                  // Format numbered lists - simple styling without circles
                  .replace(/^(\d+)\.\s+(.+)$/gm, 
                    '<div class="mb-2 pl-2"><span class="font-medium mr-2">$1.</span>$2</div>')
                  // Format lettered lists (a., b., etc.)
                  .replace(/^([a-z])\)\s+(.+)$/gm, 
                    '<div class="mb-2 pl-4"><span class="font-medium mr-2">$1)</span>$2</div>')
                  // Convert bullet points with simple styling
                  .replace(/^[\•\-\–]\s*(.+)$/gm, 
                    '<div class="mb-2 pl-2 flex gap-2"><span class="text-primary">•</span><span>$1</span></div>')
                  .replace(/\s+[\•\-\–]\s+/g, 
                    '</p><div class="mb-2 pl-2 flex gap-2"><span class="text-primary">•</span><span>')
                  // Format key terms and definitions
                  .replace(/Definition:\s*([^\n]+)/gi, 
                    '<div class="bg-primary/5 border-l-4 border-primary p-3 my-3 rounded-r-lg text-sm sm:text-base"><span class="font-semibold text-primary">Definition:</span> $1</div>')
                  .replace(/Example:\s*([^\n]+)/gi, 
                    '<div class="bg-blue-500/5 border-l-4 border-blue-500 p-3 my-3 rounded-r-lg text-sm sm:text-base"><span class="font-semibold text-blue-600 dark:text-blue-400">Example:</span> $1</div>')
                  .replace(/Note:\s*([^\n]+)/gi, 
                    '<div class="bg-amber-500/5 border-l-4 border-amber-500 p-3 my-3 rounded-r-lg text-sm sm:text-base"><span class="font-semibold text-amber-600 dark:text-amber-400">Note:</span> $1</div>')
                  .replace(/Important:\s*([^\n]+)/gi, 
                    '<div class="bg-red-500/5 border-l-4 border-red-500 p-3 my-3 rounded-r-lg text-sm sm:text-base"><span class="font-semibold text-red-600 dark:text-red-400">Important:</span> $1</div>')
                  // Clean up paragraph breaks
                  .replace(/\n\n+/g, '</p><p class="mb-3 text-sm sm:text-base">')
                  .replace(/\n/g, '<br/>')
                  .replace(/(<br\/>){3,}/g, '</p><p class="mb-3 text-sm sm:text-base">')
                  // Wrap in paragraph
                  .replace(/^/, '<p class="mb-3 text-sm sm:text-base">')
                  .replace(/$/, '</p>')
                  .trim()
              }} 
            />
          </div>
        )}

        {/* Examples */}
        {lesson.examples && lesson.examples.length > 0 && (
          <div className="w-full mt-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3">Examples</h3>
            <div className="space-y-3">
              {lesson.examples.map((example: string, index: number) => (
                <div 
                  key={index} 
                  className="border-l-4 border-blue-500/50 pl-3 sm:pl-4 py-2 bg-blue-50/30 dark:bg-blue-900/10 rounded-r"
                >
                  <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    Example {index + 1}
                  </span>
                  <div 
                    className="text-sm sm:text-base break-words"
                    dangerouslySetInnerHTML={{ __html: example }} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Take Quiz Button */}
        {exercises.length > 0 && (
          <div className="flex justify-center pt-6">
            <Button
              onClick={() => setShowQuiz(true)}
              size="lg"
              className="hover:bg-primary/90 bg-[#f44e3c] text-[#ffffff]"
              data-testid="take-quiz-button"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Take Quiz ({exercises.length} Questions)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface StudentDashboardProps {
  onNavigate?: (page: string) => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  createdAt: string;
  authorName?: string;
  price?: number;
  avgRating?: number;
  totalReviews?: number;
  totalEnrollments?: number;
  difficulty?: string;
  duration?: number;
}

interface CoursesSectionProps {
  profile: any;
  onNavigate?: (page: string) => void;
}

export const CoursesSection = ({ profile, onNavigate }: CoursesSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<'browse' | 'enrolled'>('browse');
  // Get public courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/course-creator/public-courses'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/course-creator/public-courses');
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        return data.courses || [];
      } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
      }
    }
  });

  // Get enrolled courses
  const { data: enrolledCourses, isLoading: enrolledLoading } = useQuery({
    queryKey: ['/api/course-creator/my-courses'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/course-creator/my-courses');
        return result.courses || [];
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        return [];
      }
    }
  });

  // Enroll in course mutation (for free courses only)
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest(`/api/course-creator/enroll/${courseId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/my-courses'] });
    },
    onError: (error: any) => {
      console.error('Enrollment error:', error);
    }
  });

  // Unsubscribe from all courses mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/course-creator/unsubscribe-all', {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/my-courses'] });
    },
    onError: (error: any) => {
      console.error('Unsubscribe error:', error);
    }
  });

  const handleEnroll = (courseId: string, coursePrice: number) => {
    if (coursePrice === 0) {
      // Free course - enroll directly
      enrollMutation.mutate(courseId);
    } else {
      // Paid course - navigate to course detail for purchase
      onNavigate(`course-detail-${courseId}`);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrolledCourses?.some((course: any) => course.courseId === courseId);
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'programming', label: 'Programming' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'photography', label: 'Photography' },
    { value: 'music', label: 'Music' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'language', label: 'Language' },
    { value: 'other', label: 'Other' }
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      programming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
      business: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      marketing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
      photography: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
      music: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
      health: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      language: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200'
    };
    return colors[category] || colors.other;
  };

  const filteredCourses = courses?.filter((course: Course) => {
    const matchesSearch = (course.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (course.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (course.category || "other").toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400 group-hover:fill-white group-hover:text-white" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-3 h-3 fill-yellow-400/50 text-yellow-400 group-hover:fill-white/50 group-hover:text-white" />);
      } else {
        stars.push(<Star key={i} className="w-3 h-3 text-gray-300 group-hover:text-white" />);
      }
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 
          className="text-3xl font-bold text-foreground"
          style={{ fontFamily: "'StackSans Headline', sans-serif" }}
        >
          Courses
        </h1>
        <p className="text-muted-foreground mt-1">Discover and enroll in amazing courses</p>
      </div>

      {/* Sponsored Courses Section */}
      <SponsoredListingDisplay 
        itemType="course" 
        limit={4} 
        className="mb-8"
      />

      {/* Tabs */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex space-x-1 p-1 bg-muted rounded-lg w-fit">
          <Button
            variant={activeTab === 'browse' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('browse')}
            data-testid="tab-browse-courses"
          >
            <Search className="h-4 w-4 mr-2" />
            Browse Courses
          </Button>
          <Button
            variant={activeTab === 'enrolled' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('enrolled')}
            data-testid="tab-my-courses"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            My Courses
          </Button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-courses"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                data-testid="select-category-filter"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Courses Grid */}
          {coursesLoading ? (
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full md:w-[48%] lg:w-[31%] 2xl:w-[23%] aspect-[16/9] bg-muted rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredCourses && filteredCourses.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {filteredCourses.map((course: Course) => (
                <div 
                  key={course.id} 
                  className="w-full md:w-[48%] lg:w-[31%] 2xl:w-[23%]"
                >
                  {/* Course Card */}
                  <div 
                    className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 aspect-[16/9]" 
                    data-testid={`card-course-${course.id}`}
                    onClick={() => {
                      onNavigate(`course-detail-${course.id}`);
                    }}
                  >
                    {/* Cover Image - title and author are designed into the image itself */}
                    {course.thumbnailUrl ? (
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                        data-testid={`text-title-${course.id}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center">
                        <BookOpen className="h-20 w-20 text-gray-900/20" />
                      </div>
                    )}
                  </div>
                  
                  {/* Start Learning Button - Below card */}
                  <div className="mt-3">
                    <Button
                      onClick={() => {
                        onNavigate(`course-detail-${course.id}`);
                      }}
                      className="bg-white hover:bg-gray-50 text-gray-900 rounded-full px-5 py-2 flex items-center gap-2 font-medium shadow-sm w-full justify-center"
                      data-testid={`button-view-${course.id}`}
                    >
                      Start Learning
                      <div className="bg-gray-900 rounded-full p-1.5">
                        <Play className="h-3.5 w-3.5 text-white fill-white" />
                      </div>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No courses found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* My Enrolled Courses */}
          {enrolledLoading ? (
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full md:w-[48%] lg:w-[31%] 2xl:w-[23%] aspect-[16/9] bg-muted rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : enrolledCourses && enrolledCourses.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {enrolledCourses.map((course: any) => {
                const isCompleted = Number(course.progress) >= 100;
                return (
                  <div 
                    key={course.courseId} 
                    className="w-full md:w-[48%] lg:w-[31%] 2xl:w-[23%]"
                  >
                    {/* Course Card */}
                    <div 
                      className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 aspect-[16/9]"
                      onClick={() => {
                        window.history.pushState({}, '', `?page=course-player&courseId=${course.courseId}`);
                        onNavigate('course-player');
                      }}
                    >
                      {/* Cover Image - title and author are designed into the image itself */}
                      {course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center">
                          <BookOpen className="h-20 w-20 text-gray-900/20" />
                        </div>
                      )}
                    </div>
                    
                    {/* Continue Learning Button - Below card */}
                    <div className="mt-3">
                      <Button
                        onClick={() => {
                          window.history.pushState({}, '', `?page=course-player&courseId=${course.courseId}`);
                          onNavigate('course-player');
                        }}
                        className="bg-white hover:bg-gray-50 text-gray-900 rounded-full px-5 py-2 flex items-center gap-2 font-medium shadow-sm w-full justify-center"
                        data-testid={`button-continue-${course.courseId}`}
                      >
                        {isCompleted ? 'Review Course' : 'Continue Learning'}
                        <div className="bg-gray-900 rounded-full p-1.5">
                          <Play className="h-3.5 w-3.5 text-white fill-white" />
                        </div>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No enrolled courses</h3>
              <p className="text-sm mb-4">You haven't enrolled in any courses yet</p>
              <Button onClick={() => setActiveTab('browse')} data-testid="button-browse-from-my-courses">
                Browse Courses
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Order Slip Viewer Modal
function OrderSlipViewer({ 
  orderId, 
  isOpen, 
  onClose 
}: { 
  orderId: string; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: orderDetails, isLoading, error } = useQuery<{
    order: any;
    items: any[];
  }>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: isOpen && !!orderId,
  });

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-[#C4F03B] text-gray-900';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" data-testid="dialog-order-slip">
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>
            View detailed invoice for your order
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        ) : orderDetails ? (
          <div className="bg-white dark:bg-gray-800" data-testid="order-slip-details">
            {/* Invoice Header */}
            <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 px-8 py-6">
              <div className="flex justify-between items-start">
                <div className="max-w-md">
                  <img 
                    alt="EduFiliova" 
                    className="h-24 w-auto mb-2"
                  />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Edufiliova — Creativity, Learning, and Growth in One Place.</p>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">INVOICE</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Order Receipt</p>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Invoice Details</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Invoice Number</p>
                      <p className="font-semibold text-gray-900 dark:text-white" data-testid="text-order-id">
                        #{orderId.substring(0, 12).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date Issued</p>
                      <p className="font-medium text-gray-900 dark:text-white" data-testid="text-order-date">
                        {formatDate(orderDetails.order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <Badge className={`${getStatusColor(orderDetails.order.status)} font-medium`} data-testid="badge-order-status">
                        {orderDetails.order.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize" data-testid="text-payment-method">
                        {orderDetails.order.paymentMethod || 'Stripe'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Currency</p>
                      <p className="font-medium text-gray-900 dark:text-white">USD ($)</p>
                    </div>
                  </div>
                </div>
              </div>

              {orderDetails.order.shippingAddress && (
                <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Shipping Address</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-shipping-address">
                    {orderDetails.order.shippingAddress}
                  </p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Order Items</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {orderDetails.items.map((item: any, index: number) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors" data-testid={`order-item-${index}`}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{item.product?.name || 'Unknown Item'}</p>
                            {item.product?.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.product.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700 dark:text-gray-300">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">
                            ${parseFloat(item.price).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-white">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ${parseFloat(orderDetails.order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax (0%)</span>
                      <span className="text-gray-900 dark:text-white font-medium">$0.00</span>
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-900 dark:border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-bold text-[#ff5734]" data-testid="text-total-amount">
                        ${parseFloat(orderDetails.order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Invoice not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Purchases Page
function PurchasesPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  
  const { data: purchases, isLoading } = useQuery<ShopPurchase[]>({
    queryKey: ['/api/shop/purchases'],
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (optimized from 0)
  });

  const availableMonths = purchases ? Array.from(
    new Set(
      purchases
        .filter(p => parseFloat(p.price) > 0)
        .map(p => {
          const date = new Date(p.createdAt);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
    )
  ).sort((a, b) => b.localeCompare(a)) : [];

  const filteredPurchases = purchases?.filter(purchase => {
    if (parseFloat(purchase.price) === 0) return false;
    
    if (selectedMonth === 'all') return true;
    const date = new Date(purchase.createdAt);
    const purchaseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return purchaseMonth === selectedMonth;
  }) || [];

  const handleDownloadSlip = async (orderId: string) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch(`/api/orders/${orderId}/slip`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to download slip');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-slip-${orderId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download order slip:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase History</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Loading purchases...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase History</h2>
        
        {purchases && purchases.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="month-filter" className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Filter by:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-filter" className="w-full sm:w-[200px]" data-testid="select-month-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!purchases || purchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No purchases yet</p>
          </CardContent>
        </Card>
      ) : filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No purchases found for {formatMonthDisplay(selectedMonth)}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSelectedMonth('all')}
              data-testid="button-clear-filter"
            >
              View All Purchases
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {(showAllPurchases ? filteredPurchases : filteredPurchases.slice(0, 3)).map((purchase) => (
              <Card key={purchase.id} data-testid={`card-purchase-${purchase.id}`}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{purchase.itemName}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Order #{purchase.orderId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">${purchase.price}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedOrderId(purchase.orderId)}
                      className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-full px-4 py-1 h-8 text-xs"
                      data-testid={`button-view-slip-${purchase.id}`}
                    >
                      <Receipt className="h-3 w-3 mr-1.5" />
                      View Slip
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => purchase.orderId && handleDownloadSlip(purchase.orderId)}
                      className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-full px-4 py-1 h-8 text-xs"
                      data-testid={`button-download-${purchase.id}`}
                    >
                      <Download className="h-3 w-3 mr-1.5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredPurchases.length > 3 && (
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={() => setShowAllPurchases(!showAllPurchases)}
                className="w-full"
                data-testid="button-view-all-purchases"
              >
                {showAllPurchases ? 'Show Less' : `View All (${filteredPurchases.length})`}
              </Button>
            </div>
          )}
        </>
      )}

      <OrderSlipViewer
        orderId={selectedOrderId || ''}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

// Downloads Page
function DownloadsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: digitalDownloads, isLoading } = useQuery<any[]>({
    queryKey: ['/api/digital-downloads'],
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (optimized from 0)
  });

  const availableMonths = digitalDownloads ? Array.from(
    new Set(
      digitalDownloads.map(d => {
        const date = new Date(d.orderDate);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a)) : [];

  const filteredDownloads = digitalDownloads?.filter(download => {
    if (selectedMonth !== 'all') {
      const date = new Date(download.orderDate);
      const downloadMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (downloadMonth !== selectedMonth) return false;
    }
    
    if (selectedStatus === 'active' && download.isExpired) return false;
    if (selectedStatus === 'expired' && !download.isExpired) return false;
    
    return true;
  }) || [];

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const handleDownload = async (downloadToken: string, productName: string) => {
    try {
      window.location.href = `/download/${downloadToken}`;
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Downloads</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Loading downloads...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-[18px]">Digital Downloads</h2>
        
        {digitalDownloads && digitalDownloads.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="status-filter" className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Filter by:</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status-filter" className="w-full sm:w-[150px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            
            {availableMonths.length > 0 && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-filter" className="w-full sm:w-[200px]" data-testid="select-month-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {formatMonthDisplay(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
      {!digitalDownloads || digitalDownloads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No digital downloads yet</p>
          </CardContent>
        </Card>
      ) : filteredDownloads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No downloads found with the selected filters</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSelectedMonth('all');
                setSelectedStatus('all');
              }}
              data-testid="button-clear-filter"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDownloads.map((download) => (
            <Card key={download.id} data-testid={`card-download-${download.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{download.productName}</h3>
                    {download.productDescription && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{download.productDescription}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Order #{download.orderId.substring(0, 8).toUpperCase()}
                      </p>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(download.orderDate).toLocaleDateString()}
                      </p>
                      {download.downloadedAt && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Downloaded {new Date(download.downloadedAt).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(download.downloadToken, download.productName)}
                      disabled={download.isExpired}
                      className={download.isExpired ? 'bg-gray-400' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
                      data-testid={`button-download-${download.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {download.isExpired ? 'Link Expired' : 'Download'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const StudentDashboard = ({ onNavigate }: StudentDashboardProps) => {
  const { user, profile, logout } = useAuth();
  const [, navigate] = useLocation();
  
  // Permission check: Block teachers, admins, and freelancers from accessing student dashboard
  if (profile && (profile.role === 'teacher' || profile.role === 'admin' || profile.role === 'freelancer')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You do not have permission to access the student dashboard.
            </p>
            <Button 
              onClick={() => {
                if (profile.role === 'teacher') {
                  onNavigate?.('teacher-dashboard');
                } else if (profile.role === 'admin') {
                  onNavigate?.('admin-dashboard');
                } else if (profile.role === 'freelancer') {
                  onNavigate?.('freelancer-dashboard');
                }
              }}
              className="w-full"
            >
              Go to Your Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Helper function to determine if student is eligible for courses
  const isCourseEligible = (profile: any): boolean => {
    if (!profile) return false;
    
    // Primary check: If grade is 12 or above, student is eligible regardless of educationLevel
    const grade = Number(profile.grade);
    if (!isNaN(grade) && grade >= 12) {
      return true;
    }
    
    // Additional check: College/University/Other students always see courses (even if grade is not set)
    if (profile.educationLevel && ['college', 'university', 'other'].includes(profile.educationLevel.toLowerCase())) {
      return true;
    }
    
    return false;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [viewingLesson, setViewingLesson] = useState(false);
  const [subjectViewLevel, setSubjectViewLevel] = useState<'subjects' | 'chapters' | 'lessons'>('subjects');
  const [showStudyNotes, setShowStudyNotes] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDailyQuestions, setShowDailyQuestions] = useState(false);
  
  // Collapsible nav section states
  const [moneyOpen, setMoneyOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(true);
  const [marketplaceOpen, setMarketplaceOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [upgradeBillingCycle, setUpgradeBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // Subscription payment mutations (similar to course purchase)
  const purchaseMutation = useMutation({
    mutationFn: async (couponCode?: string) => {
      if (!selectedPlan) throw new Error('No plan selected');
      // Create payment intent for subscription
      return await apiRequest('/api/create-subscription', {
        method: 'POST',
        body: JSON.stringify({ 
          planType: selectedPlan.tier,
          billingCycle: selectedPlan.interval,
          couponCode: couponCode || ''
        })
      });
    }
  });

  // Confirm subscription mutation
  const confirmPurchaseMutation = useMutation({
    mutationFn: async ({ paymentIntentId, amount }: { paymentIntentId: string; amount: number }) => {
      if (!selectedPlan) throw new Error('No plan selected');
      return await apiRequest('/api/confirm-subscription', {
        method: 'POST',
        body: JSON.stringify({
          paymentIntentId,
          planType: selectedPlan.tier,
          amount
        })
      });
    },
    onSuccess: () => {
      // Invalidate profile queries to refresh subscription status
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-unlocked-access'] });
      
      // Force refresh auth to update profile data
      window.location.reload();
      
      setShowSubscriptionModal(false);
      setSelectedPlan(null);
    }
  });
  
  // Grade-based feature restrictions for child safety
  const featureRestrictions = getGradeFeatureRestrictions(profile?.grade);
  
  // Course detail and player states
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Freelancer profile state
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, {isCorrect: boolean, explanation: string}>>({});
  
  // Meeting-related state
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);

  // Lazy load user's study notes with optimized caching
  const { data: notesResponse, isLoading: notesLoading } = useQuery({
    queryKey: ['/api/notes', user?.id],
    queryFn: async () => {
      if (!user?.id) return { success: false, data: [] };
      try {
        const response = await fetch(`/api/notes/${user.id}`);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Dashboard: Failed to fetch notes:', error);
        return { success: false, data: [] };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount < 2) return true;
      console.error('Dashboard: Notes query failed after retries:', error);
      return false;
    }
  });
  
  const userNotes: any[] = notesResponse?.success ? notesResponse.data : [];
  
  // Fetch meetings data
  const { data: meetingsData, isLoading: meetingsLoading } = useQuery<{ meetings: any[] }>({
    queryKey: ['/api/meetings'],
    enabled: !!user && profile?.role === 'student',
    staleTime: 2 * 60 * 1000,
  });
  
  const meetings = meetingsData?.meetings || [];
  const upcomingMeetings = meetings.filter((m: any) => m.status === 'scheduled' || m.status === 'live');

  // Lazy load unread announcements count with background refresh
  const { data: unreadAnnouncementsData } = useQuery({
    queryKey: ['/api/announcements', user?.id, 'unread-count'],
    queryFn: async () => {
      if (!user?.id) return { success: false, unreadCount: 0 };
      try {
        const response = await fetch(`/api/announcements/${user.id}/unread-count`);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Dashboard: Failed to fetch announcements count:', error);
        return { success: false, unreadCount: 0 };
      }
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Reduced polling to 5 minutes to lower database egress
    staleTime: 4 * 60 * 1000, // Cache for 4 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
    refetchOnWindowFocus: false,
    retry: false // Don't retry on failure to avoid spam
  });

  // Lazy load unread messages count with background refresh
  const { data: unreadMessagesData } = useQuery({
    queryKey: ['/api/messages', user?.userId, 'unread-count'],
    queryFn: async () => {
      if (!user?.userId) return { success: false, unreadCount: 0 };
      try {
        const response = await fetch(`/api/messages/${user.userId}/unread-count`);
        if (!response.ok) return { success: false, unreadCount: 0 };
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Dashboard: Failed to fetch messages count:', error);
        return { success: false, unreadCount: 0 };
      }
    },
    enabled: !!user?.userId,
    refetchInterval: 5 * 60 * 1000, // Reduced polling to 5 minutes to lower database egress
    staleTime: 4 * 60 * 1000, // Cache for 4 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
    refetchOnWindowFocus: false,
    retry: false // Don't retry on failure to avoid spam
  });

  // Fetch in-progress lessons for continue reading cards
  const { data: inProgressLessonsData } = useQuery({
    queryKey: ['/api/users', user?.id, 'in-progress-lessons'],
    queryFn: async () => {
      if (!user?.id) return { success: false, data: [] };
      try {
        const response = await fetch(`/api/users/${user.id}/in-progress-lessons`);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Dashboard: Failed to fetch in-progress lessons:', error);
        return { success: false, data: [] };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
    refetchOnWindowFocus: false,
    retry: false
  });

  const unreadAnnouncementsCount = unreadAnnouncementsData?.success ? unreadAnnouncementsData.unreadCount : 0;
  const unreadMessagesCount = unreadMessagesData?.success ? unreadMessagesData.unreadCount : 0;
  const inProgressLessons = inProgressLessonsData?.success ? inProgressLessonsData.data : [];

  // Fetch today's daily questions
  const { data: dailyQuestionsData } = useQuery({
    queryKey: ['/api/daily-questions', 'today', user?.id],
    queryFn: async () => {
      if (!user?.id) return { success: false, data: null };
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch(`/api/daily-questions/today/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionId}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to fetch daily questions:', error);
        return { success: false, data: null };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    retry: 1
  });

  // Fetch daily progress statistics
  const { data: dailyProgressData } = useQuery({
    queryKey: ['/api/daily-questions', 'progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return { success: false, data: null };
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch(`/api/daily-questions/progress/${user.id}?limit=10`, {
          headers: {
            'Authorization': `Bearer ${sessionId}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to fetch daily progress:', error);
        return { success: false, data: null };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const dailyQuestions = dailyQuestionsData?.success ? dailyQuestionsData.data : null;
  const dailyProgress = dailyProgressData?.success ? dailyProgressData.data : null;

  // Fetch comprehensive profile statistics
  const { data: profileStatsData } = useQuery({
    queryKey: ['/api/users', user?.id, 'profile-stats'],
    queryFn: async () => {
      if (!user?.id) return { success: false, data: null };
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch(`/api/users/${user.id}/profile-stats`, {
          headers: {
            'Authorization': `Bearer ${sessionId}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
        return { success: false, data: null };
      }
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 10 minutes
    retry: 1
  });

  const profileStats = profileStatsData?.success ? profileStatsData.data : null;

  // Handle daily question answer submission
  const handleAnswerSubmission = async (questionId: string, selectedAnswer: string) => {
    if (!user?.id) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/daily-questions/answer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          questionId,
          selectedAnswer,
          timeSpent: 30, // Basic time tracking
          dayNumber: dailyQuestions?.dayNumber || Math.floor(Date.now() / (1000 * 60 * 60 * 24))
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Mark answer as submitted
        setSubmittedAnswers(prev => ({ ...prev, [questionId]: true }));
        
        // Store feedback
        const question = dailyQuestions?.questions?.find((q: any) => q.id === questionId);
        if (question) {
          const isCorrect = selectedAnswer === question.correctAnswer;
          setQuestionFeedback(prev => ({
            ...prev,
            [questionId]: {
              isCorrect,
              explanation: question.explanation || (isCorrect ? 'Correct!' : 'Incorrect answer.')
            }
          }));
        }
        
        // Refresh daily questions data
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  // Fetch subjects from database API based on student's grade and system
  const { data: subjectsResponse, isLoading: subjectsLoading, error: subjectsError } = useQuery({
    queryKey: ['/api/subjects', profile?.grade, profile?.gradeSystem],
    queryFn: async () => {
      if (!profile?.grade) {
        console.log('No grade level set, cannot fetch subjects');
        return { success: false, data: [], error: 'No grade level set' };
      }
      try {
        const params = new URLSearchParams();
        params.append('gradeLevel', String(profile.grade));
        if (profile.gradeSystem) {
          params.append('gradeSystem', profile.gradeSystem);
        }
        const response = await fetch(`/api/subjects?${params.toString()}`);
        const result = await response.json();
        console.log('Subjects from API:', result);
        return result;
      } catch (error) {
        console.error('Failed to load subjects from API:', error);
        return { success: false, data: [], error: String(error) };
      }
    },
    enabled: !!profile?.grade,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Fetch chapters for selected subject
  const { data: chaptersResponse, isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/subjects', selectedSubject, 'chapters'],
    queryFn: async () => {
      if (!selectedSubject) return { success: false, data: [] };
      try {
        const response = await fetch(`/api/subjects/${selectedSubject}/chapters`);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to fetch chapters:', error);
        return { success: false, data: [] };
      }
    },
    enabled: !!selectedSubject,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Fetch lessons for selected chapter
  const { data: lessonsResponse, isLoading: lessonsLoading } = useQuery({
    queryKey: ['/api/chapters', selectedChapter, 'lessons'],
    queryFn: async () => {
      if (!selectedChapter) return { success: false, data: [] };
      try {
        const response = await fetch(`/api/chapters/${selectedChapter}/lessons`);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
        return { success: false, data: [] };
      }
    },
    enabled: !!selectedChapter,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Fetch specific lesson content
  const { data: lessonResponse, isLoading: lessonLoading } = useQuery({
    queryKey: ['/api/lessons', selectedLesson],
    queryFn: async () => {
      if (!selectedLesson) return { success: false, data: null };
      try {
        const response = await fetch(`/api/lessons/${selectedLesson}`);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to fetch lesson:', error);
        return { success: false, data: null };
      }
    },
    enabled: !!selectedLesson,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Fetch quiz exercises for selected lesson
  const { data: exercisesResponse, isLoading: exercisesLoading } = useQuery({
    queryKey: ['/api/lessons', selectedLesson, 'exercises'],
    queryFn: async () => {
      if (!selectedLesson) return { success: false, data: [] };
      try {
        const response = await fetch(`/api/lessons/${selectedLesson}/exercises`);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
        return { success: false, data: [] };
      }
    },
    enabled: !!selectedLesson,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Fetch unlocked subject for free users
  const { 
    data: unlockedAccessResponse, 
    isLoading: isLoadingUnlockedAccess,
    isError: isUnlockedAccessError 
  } = useQuery({
    queryKey: ['/api/user-unlocked-access', user?.id],
    enabled: !!user?.id && !['elementary', 'high_school', 'college_university'].includes(profile?.subscriptionTier || ''),
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    retry: 1, // Only retry once on failure
  });

  const subjects = subjectsResponse?.success ? subjectsResponse.data : [];
  const chapters = chaptersResponse?.success ? chaptersResponse.data : [];
  const lessons = lessonsResponse?.success ? lessonsResponse.data : [];
  const currentLesson = lessonResponse?.success ? lessonResponse.data : null;
  const exercises = exercisesResponse?.success ? exercisesResponse.data : [];
  
  const unlockedSubjectId = (unlockedAccessResponse as any)?.unlockedSubjectId;
  const isPremiumUser = profile && ['elementary', 'high_school', 'college_university'].includes(profile?.subscriptionTier || '');

  // Subjects functionality removed
  
  // Subjects functionality removed

  // Real assignments and achievements will be loaded from database when implemented

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy": return "hsl(var(--success))";
      case "medium": return "hsl(var(--accent))"; 
      case "hard": return "hsl(142, 71%, 45%)";
      default: return "hsl(var(--muted-foreground))";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "hsl(var(--destructive))";
      case "medium": return "hsl(var(--accent))";
      case "low": return "hsl(var(--success))";
      default: return "hsl(var(--muted-foreground))";
    }
  };

  // SubjectCard component removed

  // Custom navigation handler for embedded course views and marketplace
  const handleCourseNavigation = (page: string) => {
    // Handle course-related navigation internally
    if (page.startsWith('course-detail-')) {
      const courseId = page.replace('course-detail-', '');
      setSelectedCourseId(courseId);
      setActiveTab('course-detail');
    } else if (page.startsWith('course-player-')) {
      const courseId = page.replace('course-player-', '');
      setSelectedCourseId(courseId);
      setActiveTab('course-player');
    } else if (page.startsWith('course/')) {
      const courseId = page.replace('course/', '');
      setSelectedCourseId(courseId);
      setActiveTab('course-player');
    } else if (page === 'freelancer-profile') {
      // Handle freelancer profile navigation internally
      const freelancerId = sessionStorage.getItem('selectedFreelancerId');
      if (freelancerId) {
        setSelectedFreelancerId(freelancerId);
        setActiveTab('freelancer-profile');
      }
    } else if (page === 'marketplace') {
      // Navigate back to marketplace from profile
      setSelectedFreelancerId(null);
      setActiveTab('marketplace');
    } else {
      // Pass other navigation to parent
      if (onNavigate) {
        onNavigate(page);
      }
    }
  };

  // Handle back navigation from course views
  const handleBackFromCourse = () => {
    setSelectedCourseId(null);
    setActiveTab('courses');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar - Mobile */}
      <nav className="bg-[#2d5ddc] border-b border-white/10 fixed top-0 left-0 right-0 z-40 md:hidden pt-safe">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-white hover:text-gray-200"
                data-testid="button-mobile-menu"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Logo size="md" variant="white" type="student" />
            </div>
            <div className="flex items-center space-x-2">
              {unreadMessagesCount > 0 && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Left Sidebar - Slide-in on mobile, fixed on desktop - Hidden when viewing portfolio gallery */}
      <div className={`${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } ${activeTab === 'portfolio-gallery' ? 'md:-translate-x-full' : 'md:translate-x-0'} fixed left-0 top-0 md:top-0 h-full w-64 border-r border-white/10 z-50 bg-[#2d5ddc] transition-transform duration-300`}>
        <div className="flex flex-col h-full py-4">
          
          {/* Logo */}
          <div className="mb-4 px-4" data-testid="sidebar-logo">
            <Logo size="md" variant="white" type="student" />
          </div>
          
          {/* Navigation Icons */}
          <nav className="flex-1 flex flex-col space-y-1 px-3 overflow-y-auto">
            {/* Learning Section */}
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                activeTab === "overview" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              onClick={() => { setActiveTab("overview"); setShowMobileMenu(false); }}
              data-testid="nav-overview"
            >
              <Home className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Overview</span>
            </Button>
            {/* Subjects Navigation - K-12 students only (NOT for college/university/other) */}
            {profile && profile.grade && profile.grade >= 1 && profile.grade <= 12 && (!profile.educationLevel || !['college', 'university', 'other'].includes(profile.educationLevel.toLowerCase())) && (
              <Button
                variant="ghost"
                className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                  activeTab === "subjects" 
                    ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                    : "text-white hover:bg-[#c4ee3d] hover:text-black"
                }`}
                onClick={() => { setActiveTab("subjects"); setShowMobileMenu(false); }}
                data-testid="nav-subjects"
              >
                <BookOpen className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Subjects</span>
              </Button>
            )}
            {/* Courses Navigation - Grade 8+ only */}
            {featureRestrictions.canAccessCourses && (
              <Button
                variant="ghost"
                className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                  activeTab === "courses" 
                    ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                    : "text-white hover:bg-[#c4ee3d] hover:text-black"
                }`}
                onClick={() => { setActiveTab("courses"); setShowMobileMenu(false); }}
                data-testid="nav-courses"
              >
                <GraduationCap className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Courses</span>
              </Button>
            )}
            {/* Classes/Meetings Navigation */}
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                activeTab === "classes" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              onClick={() => { setActiveTab("classes"); setShowMobileMenu(false); }}
              data-testid="nav-classes"
            >
              <Video className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Classes</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                activeTab === "assignments" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              onClick={() => { setActiveTab("assignments"); setShowMobileMenu(false); }}
              data-testid="nav-assignments"
            >
              <PenTool className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Assignments</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                activeTab === "book-teacher" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              onClick={() => { setActiveTab("book-teacher"); setShowMobileMenu(false); }}
              data-testid="nav-book-teacher"
            >
              <Calendar className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Book Teacher</span>
            </Button>
            
            {/* Communication Section */}
            <div className="pt-3 pb-1">
              <p className="text-xs text-white/50 uppercase tracking-wider px-3">Communication</p>
            </div>
            
            {/* Messages - Show for all grades, but restrict content for under grade 7 */}
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors px-3 py-2 relative ${
                activeTab === "messages" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              onClick={() => { setActiveTab("messages"); setShowMobileMenu(false); }}
              data-testid="nav-messages"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Messages</span>
              {unreadMessagesCount > 0 && (
                <Badge className="ml-auto bg-red-500 text-white hover:bg-red-600">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                activeTab === "notes" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              onClick={() => { setActiveTab("notes"); setShowMobileMenu(false); }}
              data-testid="nav-notes"
            >
              <Bookmark className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Notes</span>
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors px-3 py-2 relative ${
                activeTab === "announcements" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              onClick={() => { setActiveTab("announcements"); setShowMobileMenu(false); }}
              data-testid="nav-announcements"
            >
              <Bell className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Announcements</span>
              {unreadAnnouncementsCount > 0 && (
                <Badge className="ml-auto bg-red-500 text-white hover:bg-red-600">
                  {unreadAnnouncementsCount > 9 ? '9+' : unreadAnnouncementsCount}
                </Badge>
              )}
            </Button>
            {/* Community - Only show for grade 12+ */}
            {featureRestrictions.canAccessCommunity && (
              <Button
                variant="ghost"
                className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                  activeTab === "community" 
                    ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                    : "text-white hover:bg-[#c4ee3d] hover:text-black"
                }`}
                onClick={() => { setActiveTab("community"); setShowMobileMenu(false); }}
                data-testid="nav-community"
              >
                <Users className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Community</span>
              </Button>
            )}
            
            {/* MONEY Section - Collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setMoneyOpen(!moneyOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
                data-testid="nav-money-toggle"
              >
                <span>Money</span>
                {moneyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {moneyOpen && (
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                    activeTab === "wallet" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                      : "text-white hover:bg-[#c4ee3d] hover:text-black"
                  }`}
                  onClick={() => { setActiveTab("wallet"); setShowMobileMenu(false); }}
                  data-testid="nav-wallet"
                >
                  <Wallet className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Wallet</span>
                </Button>
                {featureRestrictions.canAccessBilling && (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                      activeTab === "billing" 
                        ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                        : "text-white hover:bg-[#c4ee3d] hover:text-black"
                    }`}
                    onClick={() => { setActiveTab("billing"); setShowMobileMenu(false); }}
                    data-testid="nav-billing"
                  >
                    <CreditCard className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">Billing</span>
                  </Button>
                )}
                {featureRestrictions.canAccessBilling && (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                      activeTab === "receipts" 
                        ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                        : "text-white hover:bg-[#c4ee3d] hover:text-black"
                    }`}
                    onClick={() => { setActiveTab("receipts"); setShowMobileMenu(false); }}
                    data-testid="nav-receipts"
                  >
                    <Receipt className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">Receipts</span>
                  </Button>
                )}
              </div>
            )}
            
            {/* STORE Section - Collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setStoreOpen(!storeOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
                data-testid="nav-store-toggle"
              >
                <span>Store</span>
                {storeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {storeOpen && (
              <div className="space-y-1">
                {featureRestrictions.canAccessPurchases && (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                      activeTab === "purchases" 
                        ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                        : "text-white hover:bg-[#c4ee3d] hover:text-black"
                    }`}
                    onClick={() => { setActiveTab("purchases"); setShowMobileMenu(false); }}
                    data-testid="nav-purchases"
                  >
                    <ShoppingBag className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">Purchases</span>
                  </Button>
                )}
                {featureRestrictions.canAccessDownloads && (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                      activeTab === "downloads" 
                        ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                        : "text-white hover:bg-[#c4ee3d] hover:text-black"
                    }`}
                    onClick={() => { setActiveTab("downloads"); setShowMobileMenu(false); }}
                    data-testid="nav-downloads"
                  >
                    <Download className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">Downloads</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                    activeTab === "buy-voucher" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                      : "text-white hover:bg-[#c4ee3d] hover:text-black"
                  }`}
                  onClick={() => { setActiveTab("buy-voucher"); setShowMobileMenu(false); }}
                  data-testid="nav-buy-voucher"
                >
                  <Gift className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Buy Voucher</span>
                </Button>
              </div>
            )}
            
            {/* MARKETPLACE Section - Collapsible - Grade 8+ only */}
            {featureRestrictions.canAccessFreelancers && (
              <>
                <div className="pt-3">
                  <button
                    onClick={() => setMarketplaceOpen(!marketplaceOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
                    data-testid="nav-marketplace-toggle"
                  >
                    <span>Marketplace</span>
                    {marketplaceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                {marketplaceOpen && (
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                        activeTab === "portfolio-gallery" 
                          ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      onClick={() => { setActiveTab("portfolio-gallery"); setShowMobileMenu(false); }}
                      data-testid="nav-portfolio-gallery"
                    >
                      <LayoutGrid className="w-5 h-5 mr-3" />
                      <span className="text-sm font-medium">Freelancer Works</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                        activeTab === "marketplace" 
                          ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      onClick={() => { setActiveTab("marketplace"); setShowMobileMenu(false); }}
                      data-testid="nav-marketplace"
                    >
                      <Users className="w-5 h-5 mr-3" />
                      <span className="text-sm font-medium">Find Freelancers</span>
                    </Button>
                    {featureRestrictions.canAccessCreateAd && (
                      <Button
                        variant="ghost"
                        className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                          activeTab === "create-ad" 
                            ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                            : "text-white hover:bg-[#c4ee3d] hover:text-black"
                        }`}
                        onClick={() => { setActiveTab("create-ad"); setShowMobileMenu(false); }}
                        data-testid="nav-create-ad"
                      >
                        <Megaphone className="w-5 h-5 mr-3" />
                        <span className="text-sm font-medium">Create Ad</span>
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>
          
          {/* Bottom section */}
          <div className="border-t border-white/20 pt-3 px-3 space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors px-3 py-2 ${
                activeTab === "settings" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              onClick={() => { setActiveTab("settings"); setShowMobileMenu(false); }}
              data-testid="nav-settings"
            >
              <Settings className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Settings</span>
            </Button>
          </div>
          
          <div className="p-3 border-t border-white/20 space-y-2 flex-shrink-0">
            <Button
              size="sm"
              className="w-full bg-[#c4ee3d] hover:bg-[#c4ee3d]/90 text-black font-medium"
              onClick={() => { window.open('https://edufiliova.com', '_blank', 'noopener,noreferrer'); setShowMobileMenu(false); }}
              data-testid="nav-explore-website"
            >
              <Globe className="h-4 w-4 mr-2" />
              Explore Website
            </Button>
            <Button
              size="sm"
              className="w-full bg-[#fe5831] hover:bg-[#e64d2e] text-white font-medium"
              onClick={() => { 
                setIsLoggingOut(true);
                setShowMobileMenu(false);
                setTimeout(async () => {
                  await logout();
                }, 3000);
              }}
              disabled={isLoggingOut}
              data-testid="nav-logout"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className={`${activeTab === 'portfolio-gallery' ? 'md:ml-0' : 'md:ml-64'} min-h-screen overflow-y-auto transition-all duration-300 bg-white`}>
        {/* Top Header - Hidden when chat is active */}
        {activeTab !== "messages" && (
          <header className={`bg-card/50 backdrop-blur-sm border-b border-border px-4 md:px-6 py-4 fixed top-0 right-0 z-30 left-0 ${activeTab === 'portfolio-gallery' ? 'md:left-0' : 'md:left-64'}`}>
            <div className="flex items-center justify-between">
              {/* Left side - Profile Icon and User Info (Desktop only) */}
              <div className="hidden md:flex items-center space-x-3">
                <Avatar className="w-10 h-10" data-testid="profile-avatar">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : "S"}
                  </AvatarFallback>
                </Avatar>
                
                {/* User Name and Grade */}
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-foreground leading-tight" data-testid="profile-name">
                    {profile?.name || "Student"}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="profile-grade">
                    {formatGradeDisplay(profile?.grade, profile?.educationLevel)}
                  </p>
                </div>
              </div>
              
              {/* Right side - Profile (Mobile) and Search Bar */}
              <div className="flex items-center space-x-4 flex-1 justify-end">
                {/* Search Bar - Hidden on mobile */}
                <div className="relative max-w-md hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="search"
                    placeholder="Search lessons, subjects, assignments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50 border-muted focus:border-primary rounded-2xl"
                    data-testid="search-input"
                  />
                </div>
                
                {/* Profile Icon and User Info (Mobile - Right side) */}
                <div className="flex md:hidden items-center space-x-2">
                  <div className="flex flex-col items-end">
                    <p className="text-xs font-medium text-foreground leading-tight" data-testid="profile-name-mobile">
                      {profile?.name || "Student"}
                    </p>
                    <p className="text-[10px] text-muted-foreground" data-testid="profile-grade-mobile">
                      {formatGradeDisplay(profile?.grade, profile?.educationLevel)}
                    </p>
                  </div>
                  <Avatar className="w-8 h-8" data-testid="profile-avatar-mobile">
                    <AvatarImage src={profile?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : "S"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Dashboard Content */}
        <main className={activeTab === "messages" ? "p-0 h-screen bg-white" : "py-8 px-6 md:px-10 md:pb-8 max-w-full overflow-x-hidden pt-24 md:pt-28 bg-white"}>
          {showStudyNotes ? (
            <div className="space-y-4">
              {/* Back button */}
              <Button 
                onClick={() => setShowStudyNotes(false)}
                variant="outline"
                className="mb-4"
                data-testid="back-to-dashboard"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              {/* Study Notes Component */}
              <StudyNotes />
            </div>
          ) : (
            <>
          {activeTab === "overview" && (
            <div className="space-y-10">
              {/* Banner Advertisement - Top of Dashboard */}
              <BannerAdDisplay placement="student_dashboard" className="mb-8" />
              
              {/* Welcome Section */}
              <div className="mb-10">
                {profile?.role === "teacher" ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h1 className="text-lg text-foreground mb-2" data-testid="welcome-heading">
                      Teacher View - <span className="font-bold">{profile?.name?.split(' ')[0] || "Teacher"}</span> 👨‍🏫
                    </h1>
                    <p className="text-muted-foreground mb-4">
                      Welcome to the student dashboard with teacher privileges. You can see all student activities and subscription statuses.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Teacher Access
                      </Badge>
                      <span className="text-muted-foreground">
                        View student premium/free status and learning progress
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-lg text-foreground mb-2" data-testid="welcome-heading">
                      Welcome back, <span className="font-bold">{profile?.name?.split(' ')[0] || "Student"}</span>! 👋
                    </h1>
                    <p className="text-muted-foreground">
                      Ready to continue your learning journey? Let's pick up where you left off.
                    </p>
                  </div>
                )}
              </div>

              {/* Upgrade to Premium Card - Grade-Based Subscription */}
              {/* Only show upgrade card if user has no premium tier OR their plan has expired */}
              {profile && (!['elementary', 'high_school', 'college_university'].includes(profile?.subscriptionTier || '') || 
                (profile?.planExpiry && new Date(profile.planExpiry) < new Date())) && (
                <Card className="border-2 border-[#3b82f6] bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/10 dark:to-blue-900/10" data-testid="upgrade-card">
                  <CardHeader>
                    <div>
                      <CardTitle className="text-xl font-bold">Upgrade to Premium</CardTitle>
                      <CardDescription className="mt-1">
                        {profile.grade ? (
                          <>Get unlimited access to all {GRADE_SUBSCRIPTION_PLANS[getSubscriptionTierFromGrade(profile.grade)].name} content</>
                        ) : (
                          <>Complete your profile to see personalized pricing</>
                        )}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.grade ? (
                      <>
                        {(() => {
                          const detectedTier = getSubscriptionTierFromGrade(profile.grade);
                          const tierPlan = GRADE_SUBSCRIPTION_PLANS[detectedTier];
                          const currentPrice = upgradeBillingCycle === 'monthly' ? tierPlan.pricing.monthly : tierPlan.pricing.yearly;
                          
                          return (
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Plan Details */}
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold text-lg mb-2">{tierPlan.name}</h3>
                                  <p className="text-sm text-muted-foreground">{tierPlan.gradeRange}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{tierPlan.description}</p>
                                </div>
                                
                                {/* Billing Cycle Toggle */}
                                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                                  <Button
                                    variant={upgradeBillingCycle === 'monthly' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setUpgradeBillingCycle('monthly')}
                                    className="flex-1"
                                    data-testid="billing-monthly"
                                  >
                                    Monthly
                                  </Button>
                                  <Button
                                    variant={upgradeBillingCycle === 'yearly' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setUpgradeBillingCycle('yearly')}
                                    className="flex-1"
                                    data-testid="billing-yearly"
                                  >
                                    Yearly
                                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                      Save ${((tierPlan.pricing.monthly * 12) - tierPlan.pricing.yearly).toFixed(0)}
                                    </Badge>
                                  </Button>
                                </div>
                                
                                {/* Price Display */}
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-[#3b82f6]">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-800 dark:text-gray-200">${currentPrice}</span>
                                    <span className="text-gray-700 dark:text-gray-400">/{upgradeBillingCycle === 'monthly' ? 'month' : 'year'}</span>
                                  </div>
                                  {upgradeBillingCycle === 'yearly' && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      ${(tierPlan.pricing.yearly / 12).toFixed(2)}/month when billed annually
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Features List */}
                              <div className="space-y-4">
                                <h4 className="font-semibold">
                                  What's Included
                                </h4>
                                <ul className="space-y-2">
                                  {tierPlan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                      <Check className="w-4 h-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                                
                                {/* Upgrade Button */}
                                <Button
                                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-[#faf2f2] font-bold"
                                  size="lg"
                                  onClick={() => {
                                    setSelectedPlan({
                                      tier: detectedTier,
                                      name: tierPlan.name,
                                      price: currentPrice,
                                      interval: upgradeBillingCycle,
                                      description: tierPlan.description,
                                      features: tierPlan.features
                                    });
                                    setShowSubscriptionModal(true);
                                  }}
                                  data-testid="upgrade-now-button"
                                >
                                  Upgrade Now
                                  <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Complete Your Profile</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Please update your grade level to see personalized pricing plans
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('settings')}
                          data-testid="complete-profile-button"
                        >
                          Update Profile
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Vertical Stack Layout - Full Width Sections */}
              <div className="space-y-6">
                {/* Course Progress Cards - For Grade 12 and above (Secondary, College, University) */}
                {isCourseEligible(profile) && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Your Courses</h2>
                    <CoursesSection profile={profile} onNavigate={handleCourseNavigation} />
                  </div>
                )}

                {/* Continue Reading & Quick Actions - Full Width */}
                <div className="space-y-6">
                  {/* Continue Reading Cards */}
                  {inProgressLessons.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-foreground mb-4">Continue Reading</h2>
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {inProgressLessons.map((lesson: any, index: number) => {
                          const colors = ['#2d5ddd', '#c5f13c', '#151314', '#ff5834', '#a28ff9', '#a4f5a6'];
                          const bgColor = colors[index % colors.length];
                          const isLight = ['#c5f13c', '#a4f5a6'].includes(bgColor);
                          const textColor = isLight ? '#000000' : '#ffffff';
                          const progressPercent = lesson.progressPercent || 0;
                          
                          return (
                            <div 
                              key={lesson.lessonId} 
                              className="rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg flex-shrink-0 w-64 h-64 flex flex-col justify-between"
                                style={{ backgroundColor: bgColor }}
                                onClick={() => {
                                  setSelectedSubject(lesson.subjectId);
                                  setSelectedChapter(lesson.chapterId);
                                  setSelectedLesson(lesson.lessonId);
                                  setActiveTab("subjects");
                                  setViewingLesson(true);
                                }}
                                data-testid={`continue-reading-${lesson.lessonId}`}
                              >
                                <div className="mb-3">
                                  <span 
                                    className="text-xs font-medium px-2 py-1 rounded-full"
                                    style={{ 
                                      backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                                      color: textColor 
                                    }}
                                  >
                                    {lesson.subjectName}
                                  </span>
                                </div>
                                <h3 
                                  className="font-bold text-lg mb-2 line-clamp-2"
                                  style={{ color: textColor }}
                                >
                                  {lesson.lessonTitle}
                                </h3>
                                <p 
                                  className="text-sm mb-4 opacity-90 line-clamp-2"
                                  style={{ color: textColor }}
                                >
                                  {lesson.chapterTitle}
                                </p>
                                
                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span 
                                      className="text-xs opacity-75"
                                      style={{ color: textColor }}
                                    >
                                      Progress
                                    </span>
                                    <span 
                                      className="text-xs font-medium"
                                      style={{ color: textColor }}
                                    >
                                      {progressPercent}%
                                    </span>
                                  </div>
                                  <div 
                                    className="h-2 rounded-full overflow-hidden"
                                    style={{ 
                                      backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'
                                    }}
                                  >
                                    <div 
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${progressPercent}%`,
                                        backgroundColor: isLight ? '#000000' : '#ffffff'
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                <div 
                                  className="text-xs opacity-75"
                                  style={{ color: textColor }}
                                >
                                  {new Date(lesson.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  {/* Daily Questions Challenge */}
                  {dailyQuestions && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-foreground">
                          Daily Questions Challenge
                        </h2>
                        <div className="text-sm text-muted-foreground">
                          Day {dailyQuestions.dayNumber} of {dailyQuestions.totalDays || 200}
                        </div>
                      </div>
                      
                      {/* Daily Progress Bar */}
                      <div className="bg-card rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">
                            Today's Progress
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {dailyQuestions.answeredQuestions}/{dailyQuestions.totalQuestions} Questions
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all duration-300"
                            style={{
                              width: `${dailyQuestions.totalQuestions > 0 ? (dailyQuestions.answeredQuestions / dailyQuestions.totalQuestions) * 100 : 0}%`,
                              background: 'linear-gradient(90deg, #42fa76 0%, #34d662 100%)'
                            }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {dailyQuestions.totalQuestions - dailyQuestions.answeredQuestions} questions remaining today
                        </div>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {/* Today's Progress Card */}
                        <div 
                          className="rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg flex-shrink-0 w-64 h-64 flex flex-col justify-between"
                          style={{ backgroundColor: '#2d5ddd' }}
                          data-testid="daily-questions-today"
                          onClick={() => setShowDailyQuestions(true)}
                        >
                            <div className="mb-3">
                              <span 
                                className="text-xs font-medium px-2 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  color: '#ffffff' 
                                }}
                              >
                                Today's Challenge
                              </span>
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-white">
                              7 Questions Today
                            </h3>
                            <p className="text-sm mb-4 opacity-90 text-white">
                              Complete all questions to maintain your streak!
                            </p>
                            
                            {/* Progress */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs opacity-75 text-white">
                                  Progress
                                </span>
                                <span className="text-xs font-medium text-white">
                                  {dailyQuestions.answeredQuestions}/{dailyQuestions.totalQuestions}
                                </span>
                              </div>
                              <div 
                                className="h-2 rounded-full overflow-hidden"
                                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                              >
                                <div 
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${(dailyQuestions.answeredQuestions / dailyQuestions.totalQuestions) * 100}%`,
                                    backgroundColor: '#ffffff'
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div className="text-xs opacity-75 text-white">
                              {dailyQuestions.correctAnswers} correct answers
                            </div>
                          </div>

                        {/* Recent Progress Cards */}
                        {dailyProgress?.recentProgress?.slice(0, 5).map((day: any, index: number) => {
                          const colors = ['#c5f13c', '#ff5834', '#a28ff9', '#a4f5a6', '#151314'];
                          const bgColor = colors[index % colors.length];
                          const isLight = ['#c5f13c', '#a4f5a6'].includes(bgColor);
                          const textColor = isLight ? '#000000' : '#ffffff';
                          
                          return (
                            <div 
                              key={day.dayNumber}
                              className="rounded-2xl p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg flex-shrink-0 w-64 h-64 flex flex-col justify-between"
                                style={{ backgroundColor: bgColor }}
                                data-testid={`daily-progress-${day.dayNumber}`}
                              >
                                <div className="mb-2">
                                  <span 
                                    className="text-xs font-medium px-2 py-1 rounded-full"
                                    style={{ 
                                      backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                                      color: textColor 
                                    }}
                                  >
                                    Day {day.dayNumber}
                                  </span>
                                </div>
                                <h3 
                                  className="font-bold text-lg mb-2"
                                  style={{ color: textColor }}
                                >
                                  {day.isCompleted ? '✅ Complete!' : '⏳ Partial'}
                                </h3>
                                <p 
                                  className="text-sm mb-3 opacity-90"
                                  style={{ color: textColor }}
                                >
                                  {day.correctAnswers}/{day.totalQuestions} correct ({day.accuracy}%)
                                </p>
                                
                                <div 
                                  className="text-xs opacity-75"
                                  style={{ color: textColor }}
                                >
                                  {day.isCompleted ? (
                                    new Date(day.completedAt).toLocaleDateString()
                                  ) : 'In Progress'}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  {/* My Notes Section */}
                  {userNotes.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground">My Notes</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStudyNotes(true)}
                          data-testid="view-all-notes"
                        >
                          View All ({userNotes.length})
                        </Button>
                      </div>
                      
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {userNotes.slice(0, 6).map((note: any, index: number) => {
                          const colors = ['#2d5ddd', '#c5f13c', '#151314', '#ff5834', '#a28ff9', '#a4f5a6'];
                          const bgColor = colors[index % colors.length];
                          const isLight = ['#c5f13c', '#a4f5a6'].includes(bgColor);
                          const textColor = isLight ? '#000000' : '#ffffff';
                          
                          return (
                            <div 
                              key={note.id} 
                              className="rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg flex-shrink-0 w-64 h-64 flex flex-col justify-between"
                              style={{ backgroundColor: bgColor }}
                              onClick={() => setShowStudyNotes(true)}
                            >
                              <div className="mb-3">
                                <span 
                                  className="text-xs font-medium px-2 py-1 rounded-full"
                                  style={{ 
                                    backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                                    color: textColor 
                                  }}
                                >
                                  {note.subject}
                                </span>
                              </div>
                              <h3 
                                className="font-bold text-lg mb-2 line-clamp-1"
                                style={{ color: textColor }}
                              >
                                {note.title}
                              </h3>
                              <p 
                                className="text-sm line-clamp-3 mb-4 opacity-90"
                                style={{ color: textColor }}
                              >
                                {note.content}
                              </p>
                              <div 
                                className="text-xs opacity-75"
                                style={{ color: textColor }}
                              >
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Actions & Stats - 2 Column Layout on Desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <Card className="border-dashed border-2 border-muted hover:border-primary/50 transition-colors" data-testid="quick-actions-card">
                      <CardContent className="p-6 text-center">
                        <div className="space-y-3">
                          <Target className="w-8 h-8 text-muted-foreground mx-auto" />
                          <h3 className="font-semibold text-foreground">Quick Actions</h3>
                          <div className="space-y-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full rounded-full" 
                              data-testid="create-study-note"
                              onClick={() => setShowStudyNotes(true)}
                            >
                              <Bookmark className="w-4 h-4 mr-2" />
                              Create Study Note
                            </Button>
                            
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md focus-visible:ring-success h-9 px-3 sm:px-4 py-2 text-xs w-full rounded-full hover:bg-primary/90 bg-[#ff5834] text-[#ffffff]" 
                              data-testid="request-help"
                              onClick={() => setActiveTab("messages")}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Request Help from Teacher
                            </Button>
                            
                            <Button 
                              size="sm" 
                              className="w-full rounded-full bg-[#151314] text-white hover:bg-[#2a2629]" 
                              data-testid="support-button"
                              onClick={() => setActiveTab("messages")}
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Support
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card className="border-dashed border-2 border-muted hover:border-primary/50 transition-colors" data-testid="stats-card">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <Trophy className="w-8 h-8 text-muted-foreground mx-auto" />
                          <h3 className="font-semibold text-foreground text-center">Your Stats</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <span className="text-sm text-muted-foreground">In Progress</span>
                              </div>
                              <span className="font-semibold text-foreground">{inProgressLessons.length}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Bookmark className="w-4 h-4 text-primary" />
                                <span className="text-sm text-muted-foreground">Notes</span>
                              </div>
                              <span className="font-semibold text-foreground">{userNotes.length}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-primary" />
                                <span className="text-sm text-muted-foreground">Streak</span>
                              </div>
                              <span className="font-semibold text-foreground">{dailyQuestions?.dayNumber || 0} days</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Manage Subscription Card - For Existing Subscribers */}
                {profile && ['elementary', 'high_school', 'college_university'].includes(profile?.subscriptionTier || '') && (
                  <Card className="border-2 border-[#3b82f6] bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/10 dark:to-blue-900/10" data-testid="manage-subscription-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold">Premium Active</CardTitle>
                          <CardDescription className="mt-1">
                            You have full access to all premium features
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('billing')}
                          className="flex-1"
                          data-testid="manage-subscription-button"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage Subscription
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('subjects')}
                          className="flex-1"
                          data-testid="explore-content-button"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Explore Content
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          
          {activeTab === "assignments" && (
            <AssignmentsView />
          )}

          {/* Subjects Tab - Hierarchical Navigation */}
          {activeTab === "subjects" && !viewingLesson && (
            <div className="space-y-6">
              {/* Header with breadcrumb navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subjectViewLevel !== 'subjects' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (subjectViewLevel === 'lessons') {
                          setSubjectViewLevel('chapters');
                          setSelectedChapter("");
                          setSelectedLesson("");
                        } else {
                          setSubjectViewLevel('subjects');
                          setSelectedSubject("");
                          setSelectedChapter("");
                        }
                      }}
                      className="flex items-center gap-1"
                      data-testid="back-button"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {subjectViewLevel === 'subjects' && 'Subjects'}
                      {subjectViewLevel === 'chapters' && subjects.find((s: any) => s.id === selectedSubject)?.name}
                      {subjectViewLevel === 'lessons' && chapters.find((c: any) => c.id === selectedChapter)?.title}
                    </h1>
                    {subjectViewLevel !== 'subjects' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {subjectViewLevel === 'chapters' && `${chapters.length} chapter${chapters.length !== 1 ? 's' : ''}`}
                        {subjectViewLevel === 'lessons' && `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}`}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {formatGradeDisplay(profile?.grade, profile?.educationLevel)} • {profile?.gradeSystem || "N/A"}
                </Badge>
              </div>
              
              {/* Error message */}
              {subjectsError && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error loading subjects: {String(subjectsError)}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* LEVEL 1: Subjects Grid - Product Card Style */}
              {subjectViewLevel === 'subjects' && (
                <>
                  {subjectsLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
                      <p>Loading subjects...</p>
                    </div>
                  ) : subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {isLoadingUnlockedAccess && !isPremiumUser ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                          <p className="text-sm">Loading access info...</p>
                        </div>
                      ) : (
                        subjects.map((subject: any) => {
                          const isLocked = !isPremiumUser && (
                            isUnlockedAccessError || 
                            (unlockedSubjectId && unlockedSubjectId !== subject.id)
                          );
                          const canAccess = isPremiumUser || (
                            !isUnlockedAccessError && 
                            (!unlockedSubjectId || unlockedSubjectId === subject.id)
                          );
                          
                          const subjectColors = [
                            'from-blue-500 to-blue-600',
                            'from-purple-500 to-purple-600',
                            'from-green-500 to-green-600',
                            'from-orange-500 to-orange-600',
                            'from-pink-500 to-pink-600',
                            'from-cyan-500 to-cyan-600',
                            'from-indigo-500 to-indigo-600',
                            'from-teal-500 to-teal-600',
                          ];
                          const colorIndex = subject.name.length % subjectColors.length;
                          const gradientColor = subjectColors[colorIndex];
                          
                          return (
                            <div
                              key={subject.id}
                              className={`relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 group ${
                                isLocked 
                                  ? 'opacity-70 cursor-not-allowed' 
                                  : 'cursor-pointer hover:-translate-y-1'
                              }`}
                              onClick={() => {
                                if (canAccess && !isLoadingUnlockedAccess) {
                                  setSelectedSubject(subject.id);
                                  setSubjectViewLevel('chapters');
                                } else if (isLocked) {
                                  setShowSubscriptionModal(true);
                                }
                              }}
                              data-testid={`subject-card-${subject.id}`}
                            >
                              {/* Subject Image/Icon Area */}
                              <div className={`relative h-40 w-full overflow-hidden bg-gradient-to-br ${isLocked ? 'from-gray-400 to-gray-500' : gradientColor}`}>
                                {subject.iconUrl && !subject.iconUrl.startsWith('🈶') ? (
                                  <>
                                    <img 
                                      src={subject.iconUrl} 
                                      alt={subject.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                      <BookOpen className="w-10 h-10 text-white" />
                                    </div>
                                  </div>
                                )}
                                
                                {/* Lock Overlay */}
                                {isLocked && (
                                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                      <Lock className="w-7 h-7 text-white" />
                                    </div>
                                  </div>
                                )}
                                
                                {/* Hover Arrow */}
                                {!isLocked && (
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 shadow-lg">
                                      <ArrowRight className="w-6 h-6 text-gray-800" />
                                    </div>
                                  </div>
                                )}
                                
                                {/* Grade Badge */}
                                <div className="absolute top-3 left-3">
                                  <Badge className="bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 border-0 shadow-sm text-xs font-medium">
                                    {formatGradeDisplay(subject.gradeLevel, profile?.educationLevel)}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Content */}
                              <div className="p-4">
                                <h3 
                                  className={`font-bold text-lg mb-1 line-clamp-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}
                                  style={{ fontFamily: "'StackSans Headline', sans-serif" }}
                                >
                                  {subject.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                  {subject.gradeSystem} Curriculum
                                </p>
                                
                                {/* Action/Status Area */}
                                {isLocked ? (
                                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex-1">
                                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                        <Crown className="w-3.5 h-3.5" />
                                        Upgrade to unlock
                                      </span>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-full border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400">
                                      Upgrade
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Available</span>
                                    </div>
                                    <Button size="sm" className="h-8 text-xs rounded-full bg-primary hover:bg-primary/90 text-white">
                                      <Play className="w-3.5 h-3.5 mr-1" />
                                      Start
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-muted rounded-2xl">
                      <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No Subjects Available</h3>
                        <p className="text-muted-foreground mb-2">
                          {formatGradeDisplay(profile?.grade, profile?.educationLevel)} • {profile?.gradeSystem || "N/A"} System
                        </p>
                        {!profile?.grade && (
                          <p className="text-sm mt-3 text-amber-600 dark:text-amber-400">
                            Please set your grade level in Settings to see subjects
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* LEVEL 2: Chapters List - Subject Detail Page */}
              {subjectViewLevel === 'chapters' && (
                <>
                  {chapters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {chapters.map((chapter: any, index: number) => {
                        const chapterColors = [
                          'from-violet-500 to-violet-600',
                          'from-blue-500 to-blue-600',
                          'from-emerald-500 to-emerald-600',
                          'from-amber-500 to-amber-600',
                          'from-rose-500 to-rose-600',
                          'from-cyan-500 to-cyan-600',
                        ];
                        const colorIndex = (chapter.order || index) % chapterColors.length;
                        const gradientColor = chapterColors[colorIndex];
                        
                        return (
                          <div
                            key={chapter.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
                            onClick={() => {
                              setSelectedChapter(chapter.id);
                              setSubjectViewLevel('lessons');
                            }}
                            data-testid={`chapter-card-${chapter.id}`}
                          >
                            {/* Chapter Header with Number */}
                            <div className={`relative h-24 bg-gradient-to-br ${gradientColor} flex items-center px-5`}>
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                  <span className="text-2xl font-bold text-white">{chapter.order || index + 1}</span>
                                </div>
                                <div>
                                  <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Chapter {chapter.order || index + 1}</p>
                                  <h3 
                                    className="text-white font-bold text-lg line-clamp-1 mt-0.5"
                                    style={{ fontFamily: "'StackSans Headline', sans-serif" }}
                                  >
                                    {chapter.title}
                                  </h3>
                                </div>
                              </div>
                              
                              {/* Hover Arrow */}
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                  <ArrowRight className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Chapter Content */}
                            <div className="p-4">
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px]">
                                {chapter.description || 'Explore the lessons in this chapter'}
                              </p>
                              
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <BookOpen className="w-4 h-4" />
                                  <span>View Lessons</span>
                                </div>
                                <Button size="sm" className="h-8 text-xs rounded-full bg-primary hover:bg-primary/90 text-white">
                                  <Play className="w-3.5 h-3.5 mr-1" />
                                  Start
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-muted rounded-2xl">
                      <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <Book className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No Chapters Yet</h3>
                        <p className="text-muted-foreground">
                          Chapters for this subject are being prepared
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* LEVEL 3: Lessons List - Chapter Detail Page */}
              {subjectViewLevel === 'lessons' && (
                <>
                  {lessons.length > 0 ? (
                    <div className="space-y-4">
                      {lessons.map((lesson: any, index: number) => {
                        const lessonColors = [
                          'from-emerald-500 to-emerald-600',
                          'from-teal-500 to-teal-600',
                          'from-green-500 to-green-600',
                          'from-lime-500 to-lime-600',
                        ];
                        const colorIndex = (lesson.order || index) % lessonColors.length;
                        const gradientColor = lessonColors[colorIndex];
                        
                        return (
                          <div
                            key={lesson.id}
                            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer hover:border-primary/30 group"
                            onClick={() => {
                              setSelectedLesson(lesson.id);
                              setViewingLesson(true);
                            }}
                            data-testid={`lesson-card-${lesson.id}`}
                          >
                            <div className="flex items-stretch">
                              {/* Lesson Number Badge */}
                              <div className={`w-20 sm:w-24 bg-gradient-to-br ${gradientColor} flex flex-col items-center justify-center shrink-0 py-4`}>
                                <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Lesson</span>
                                <span className="text-3xl font-bold text-white mt-1">{lesson.order || index + 1}</span>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 
                                    className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors text-base sm:text-lg line-clamp-1"
                                    style={{ fontFamily: "'StackSans Headline', sans-serif" }}
                                  >
                                    {lesson.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-3 mt-2">
                                    {lesson.durationMinutes && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                        <Clock className="w-3.5 h-3.5" />
                                        {lesson.durationMinutes} min
                                      </span>
                                    )}
                                    {lesson.type && (
                                      <Badge variant="secondary" className="text-xs rounded-full">
                                        {lesson.type}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5" />
                                      Reading & Quiz
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Action Button */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <Button 
                                    size="sm" 
                                    className="h-10 px-4 text-sm rounded-full bg-primary hover:bg-primary/90 text-white shadow-sm group-hover:shadow-md transition-all"
                                  >
                                    <Play className="w-4 h-4 mr-1.5" />
                                    Start Lesson
                                  </Button>
                                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-muted rounded-2xl">
                      <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <Play className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No Lessons Yet</h3>
                        <p className="text-muted-foreground">
                          Lessons for this chapter are being prepared
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Lesson Viewer - For Selected Lesson */}
          {activeTab === "subjects" && viewingLesson && currentLesson && (
            <LessonViewer
              lesson={currentLesson}
              exercises={exercises}
              onBack={() => {
                setViewingLesson(false);
                setSelectedLesson("");
              }}
              userId={user?.id || ""}
            />
          )}

          {/* Courses Tab - For College/University Students */}
          {activeTab === "courses" && (
            <CoursesSection profile={profile} onNavigate={handleCourseNavigation} />
          )}
          
          {/* Classes Tab - Meetings */}
          {activeTab === "classes" && (
            <div className="space-y-6">
              <div className="mb-8">
                <h1 className="font-bold mb-2 text-[19px]" data-testid="page-title">My Class Meetings</h1>
                <p className="text-sm text-muted-foreground">View and join upcoming video meetings for your grade</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Upcoming Meetings</p>
                        <p className="text-lg font-bold" data-testid="stat-upcoming">
                          {meetings.filter((m: any) => m.status === 'scheduled').length}
                        </p>
                      </div>
                      <Calendar className="h-5 w-5 text-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Live Now</p>
                        <p className="text-lg font-bold" data-testid="stat-live">
                          {meetings.filter((m: any) => m.status === 'live').length}
                        </p>
                      </div>
                      <Video className="h-5 w-5 text-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Meetings List */}
              <div className="space-y-4">
                {meetingsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : upcomingMeetings.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No upcoming meetings for your grade. Your teacher will schedule meetings and notify you.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {meetings.filter((m: any) => m.status === 'live').length > 0 && (
                      <div>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                          Live Now
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          {meetings
                            .filter((m: any) => m.status === 'live')
                            .map((meeting: any) => {
                              const scheduledDate = new Date(meeting.scheduledTime);
                              return (
                                <Card 
                                  key={meeting.id}
                                  className="shadow-none"
                                  data-testid={`meeting-card-${meeting.id}`}
                                >
                                  <CardHeader>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <CardTitle className="text-base" data-testid={`meeting-title-${meeting.id}`}>
                                            {meeting.title}
                                          </CardTitle>
                                          <Badge className="text-black" style={{ backgroundColor: '#c5f13c' }} data-testid={`meeting-live-${meeting.id}`}>
                                            LIVE NOW
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
                                            {meeting.participantCount || 0} / {meeting.maxParticipants} participants
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Video className="h-4 w-4" />
                                          <span>{meeting.mode === 'interactive' ? 'Interactive' : 'Broadcast'}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Duration:</span>
                                        <Badge variant="outline">{meeting.duration} minutes</Badge>
                                      </div>

                                      <Button 
                                        className="w-full"
                                        onClick={() => {
                                          setSelectedMeeting(meeting);
                                          setIsMeetingDialogOpen(true);
                                        }}
                                        data-testid={`button-view-${meeting.id}`}
                                      >
                                        <Video className="mr-2 h-4 w-4" />
                                        Join Live Meeting
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {meetings.filter((m: any) => m.status === 'scheduled').length > 0 && (
                      <div>
                        <h2 className="text-lg font-bold mb-4">Upcoming Meetings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {meetings
                            .filter((m: any) => m.status === 'scheduled')
                            .map((meeting: any) => {
                              const scheduledDate = new Date(meeting.scheduledTime);
                              return (
                                <Card 
                                  key={meeting.id}
                                  className="shadow-none"
                                  data-testid={`meeting-card-${meeting.id}`}
                                >
                                  <CardHeader>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <CardTitle className="text-base mb-2" data-testid={`meeting-title-${meeting.id}`}>
                                          {meeting.title}
                                        </CardTitle>
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
                                            {meeting.participantCount || 0} / {meeting.maxParticipants} participants
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Video className="h-4 w-4" />
                                          <span>{meeting.mode === 'interactive' ? 'Interactive' : 'Broadcast'}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Duration:</span>
                                        <Badge variant="outline">{meeting.duration} minutes</Badge>
                                      </div>

                                      <Button 
                                        className="w-full"
                                        onClick={() => {
                                          setSelectedMeeting(meeting);
                                          setIsMeetingDialogOpen(true);
                                        }}
                                        data-testid={`button-view-${meeting.id}`}
                                      >
                                        <Video className="mr-2 h-4 w-4" />
                                        View Meeting Details
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Course Detail View - Embedded */}
          {activeTab === "course-detail" && selectedCourseId && (
            <CourseDetail 
              courseId={selectedCourseId}
              onNavigate={handleCourseNavigation}
              onBack={handleBackFromCourse}
              hideFooter={true}
            />
          )}
          
          {/* Course Player View - Embedded */}
          {activeTab === "course-player" && selectedCourseId && (
            <CoursePlayer 
              courseId={selectedCourseId}
              onNavigate={handleCourseNavigation}
            />
          )}
          
          {/* Freelancer Marketplace - Embedded */}
          {activeTab === "marketplace" && (
            <FindTalent onNavigate={handleCourseNavigation} context="dashboard" />
          )}
          
          {/* Freelancer Profile - Embedded */}
          {activeTab === "freelancer-profile" && selectedFreelancerId && (
            <FreelancerProfile 
              profileId={selectedFreelancerId}
              onNavigate={handleCourseNavigation}
              onClose={() => {
                setSelectedFreelancerId(null);
                setActiveTab("marketplace");
              }}
            />
          )}
          
          {/* Portfolio Gallery - Browse Freelancer Works */}
          {activeTab === "portfolio-gallery" && (
            <PortfolioGallery onNavigate={handleCourseNavigation} context="dashboard" />
          )}
          
          {activeTab === "messages" && (
            <div className="h-full">
              <MessagingInterface 
                userRole="student" 
                onChatModeChange={(isInChat) => {
                  if (!isInChat) {
                    setActiveTab("overview");
                  }
                }}
              />
            </div>
          )}
          
          {activeTab === "community" && (
            <div className="h-full">
              <CommunityChat />
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-foreground text-[20px]">Announcements</h1>
                <Badge variant="outline" className="text-xs">
                  <Bell className="w-3 h-3 mr-1" />
                  School Updates
                </Badge>
              </div>
              <AnnouncementFeed userId={user?.id || ""} />
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">Study Notes</h1>
                <Badge variant="outline" className="text-xs">
                  <Bookmark className="w-3 h-3 mr-1" />
                  {userNotes.length} Notes
                </Badge>
              </div>
              <StudyNotes />
            </div>
          )}

          {activeTab === "book-teacher" && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book a Teacher</h1>
                <p className="text-gray-600 dark:text-gray-400">Schedule lessons with available teachers</p>
              </div>
              <SchedulingInterface />
            </div>
          )}

          {activeTab === "wallet" && (
            <WalletPage userRole="student" />
          )}

          {activeTab === "billing" && (
            <BillingPage />
          )}

          {activeTab === "receipts" && (
            <ReceiptsSection showTitle={true} />
          )}

          {activeTab === "purchases" && (
            <PurchasesPage />
          )}

          {activeTab === "downloads" && (
            <DownloadsPage />
          )}

          {activeTab === "create-ad" && (
            <div className="space-y-6">
              <MyAdsPage onNavigate={onNavigate} userRole="student" />
            </div>
          )}

          {activeTab === "buy-voucher" && (
            <BuyVoucherSection onBack={() => setActiveTab("overview")} />
          )}

          {activeTab === "settings" && (
            <StudentSettings />
          )}
            </>
          )}
        </main>
      </div>
      {/* Daily Questions Modal */}
      {showDailyQuestions && dailyQuestions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Daily Questions - Day {dailyQuestions.dayNumber}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDailyQuestions(false)}
                  data-testid="close-daily-questions"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {dailyQuestions.questions?.map((question: any, index: number) => {
                  const isAnswered = submittedAnswers[question.id] || question.isAnswered;
                  const feedback = questionFeedback[question.id];
                  const selectedAnswer = selectedAnswers[question.id];
                  
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-2">{question.question}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Subject: {question.subjectName} • Difficulty: {question.difficulty}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 ml-11">
                        {question.options?.map((option: string, optionIndex: number) => {
                          const isSelected = selectedAnswer === option || question.selectedAnswer === option;
                          const isCorrect = question.correctAnswer === option;
                          const showResult = isAnswered && (isSelected || isCorrect);
                          
                          return (
                            <button
                              key={optionIndex}
                              className={`w-full text-left p-3 rounded-lg border transition-all ${
                                showResult
                                  ? isCorrect
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : isSelected && !isCorrect
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 bg-gray-50'
                                  : isSelected
                                  ? 'border-primary bg-primary/10'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              disabled={isAnswered}
                              onClick={() => {
                                if (!isAnswered) {
                                  setSelectedAnswers(prev => ({ ...prev, [question.id]: option }));
                                }
                              }}
                              data-testid={`question-option-${index}-${optionIndex}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span>{option}</span>
                                {showResult && isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                                )}
                                {showResult && isSelected && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {selectedAnswer && !isAnswered && (
                        <div className="ml-11 mt-4">
                          <Button
                            onClick={() => handleAnswerSubmission(question.id, selectedAnswer)}
                            size="sm"
                            data-testid={`submit-answer-${index}`}
                          >
                            Submit Answer
                          </Button>
                        </div>
                      )}
                      
                      {(feedback || question.explanation) && isAnswered && (
                        <div className="ml-11 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Explanation:</strong> {feedback?.explanation || question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress Today:</span>
                  <span className="font-medium">
                    {dailyQuestions.answeredQuestions}/{dailyQuestions.totalQuestions} answered
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(dailyQuestions.answeredQuestions / dailyQuestions.totalQuestions) * 100}%`,
                      background: 'linear-gradient(90deg, #42fa76 0%, #34d662 100%)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Meeting Detail Dialog */}
      <MeetingDetailDialog
        meeting={selectedMeeting}
        isOpen={isMeetingDialogOpen}
        onClose={() => {
          setIsMeetingDialogOpen(false);
          setSelectedMeeting(null);
        }}
        role="student"
      />

      {/* Subscription Payment Modal */}
      {showSubscriptionModal && selectedPlan && (
        <Elements stripe={getStripePromise()}>
          <SubscriptionPaymentModal
            plan={{
              tier: selectedPlan.tier,
              name: selectedPlan.name,
              price: selectedPlan.price,
              interval: upgradeBillingCycle,
              description: selectedPlan.description,
              features: selectedPlan.features || []
            }}
            onClose={() => {
              setShowSubscriptionModal(false);
              setSelectedPlan(null);
            }}
            onSuccess={() => {
              setShowSubscriptionModal(false);
              setSelectedPlan(null);
              queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
            }}
          />
        </Elements>
      )}
    </div>
  );
};

// Assignment Detail Dialog Component
const AssignmentDetailDialog = ({ assignment, isOpen, onClose, onSubmissionUpdate }: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [manualAnswers, setManualAnswers] = useState<Record<string, string>>({});
  const [viewingAttachment, setViewingAttachment] = useState<any>(null);
  const [submissionMessage, setSubmissionMessage] = useState<{type: 'success' | 'error' | null, text: string}>({type: null, text: ''});

  // Use questions from assignment.questions field (created by teacher)
  const questions = assignment?.questions || [];

  // Initialize answers from existing submission when dialog opens
  React.useEffect(() => {
    if (assignment && assignment.submissionId && isOpen) {
      // TODO: Load submitted answers from assignment data
      // For now, we'll show placeholder text that answers were submitted
      setQuestionAnswers({});
      setManualAnswers({});
      setSubmissionText('');
      setSelectedFiles([]);
      setSubmissionMessage({type: null, text: ''});
    } else if (!assignment?.submissionId && isOpen) {
      // Clear form for new submissions
      setQuestionAnswers({});
      setManualAnswers({});
      setSubmissionText('');
      setSelectedFiles([]);
      setSubmissionMessage({type: null, text: ''});
    }
  }, [assignment, isOpen]);

  const handleMultipleChoiceAnswer = (questionId: string, answer: string) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleManualAnswer = (questionId: string, answer: string) => {
    setManualAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleSubmission = async () => {
    // Check if there are questions that need to be answered
    const hasQuestions = questions.length > 0;
    
    const questionsAnswered = hasQuestions && questions.every((q: any) => {
      const answer = q.type === 'multiple_choice' ? questionAnswers[q.id] : manualAnswers[q.id];
      return answer && answer.trim() !== '';
    });

    if (hasQuestions && !questionsAnswered) {
      setSubmissionMessage({type: 'error', text: 'Please answer all questions before submitting.'});
      return;
    }

    if (!hasQuestions && !submissionText.trim() && selectedFiles.length === 0) {
      setSubmissionMessage({type: 'error', text: 'Please provide either text content or upload files for your submission.'});
      return;
    }

    setSubmissionMessage({type: null, text: ''});

    setIsSubmitting(true);
    try {
      let fileUrls: string[] = [];

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await apiRequest('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (uploadResponse?.fileUrl) {
            fileUrls.push(uploadResponse.fileUrl);
          }
        }
      }

      // Prepare submission data
      const submissionData: any = {
        textContent: submissionText.trim() || null,
        fileUrls: fileUrls.length > 0 ? fileUrls : null
      };

      // Add question answers if there are questions - ensure proper data structure
      if (questions.length > 0) {
        const allAnswers = {
          ...questionAnswers,
          ...manualAnswers
        };
        
        // Only include non-empty answers
        const filteredAnswers: Record<string, string> = {};
        Object.keys(allAnswers).forEach(key => {
          if (allAnswers[key] && allAnswers[key].trim() !== '') {
            filteredAnswers[key] = allAnswers[key];
          }
        });

        submissionData.questionAnswers = filteredAnswers;
      }

      // Submit assignment
      await apiRequest(`/api/student/assignments/${assignment.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      setSubmissionMessage({type: 'success', text: 'Assignment submitted successfully!'});
      setTimeout(() => {
        onSubmissionUpdate();
        onClose();
      }, 1500);
    } catch (error: any) {
      setSubmissionMessage({type: 'error', text: `Failed to submit assignment: ${error.message}`});
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment || !isOpen) return null;

  return (
    <div className="fixed w-screen h-screen bg-white z-[9999] flex flex-col overflow-hidden" style={{margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0, position: 'fixed'}}>
      {/* Header Bar */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b bg-[#2d5ddd] text-[#ffffff] flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-[#ffffff] hover:bg-white/10 p-1 sm:p-2 flex-shrink-0"
            data-testid="button-close-assignment"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold truncate">{assignment.title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm opacity-80">
              <span className="flex items-center">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="truncate">{assignment.subject}</span>
              </span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="truncate">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              </span>
              <span className="hidden sm:flex items-center">
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="truncate">{assignment.teacherName}</span>
              </span>
            </div>
          </div>
        </div>
        
        {assignment.submissionId && (
          <Badge variant="secondary" className="bg-white/20 text-[#ffffff] border-white/30 flex-shrink-0 ml-2">
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Submitted</span>
            <span className="sm:hidden">✓</span>
          </Badge>
        )}
      </div>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-3 sm:p-6 space-y-4 sm:space-y-6">

          {/* Assignment Details */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{assignment.description}</p>
            </div>

            {/* Instructions */}
            {assignment.instructions && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Instructions</h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{assignment.instructions}</p>
              </div>
            )}

            {/* Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Attachments</h3>
                <div className="space-y-2">
                  {assignment.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 p-3 bg-muted rounded">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingAttachment(attachment)}
                        className="w-full sm:w-auto text-xs sm:text-sm"
                      >
                        View {attachment.name}
                      </Button>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions Section */}
            {questions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b rounded-t-xl">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#42fa76]" />
                    Questions ({questions.length})
                  </h3>
                </div>
                <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
                  {questions.map((question: any, index: number) => (
                    <div key={question.id} className="p-3 sm:p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 leading-relaxed">
                        {index + 1}. {question.question}
                      </h4>
                      
                      {question.type === 'multiple_choice' ? (
                        <div className="space-y-2 sm:space-y-3">
                          {question.options && Array.isArray(question.options) ? (
                            question.options.map((option: string, optionIndex: number) => {
                              const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
                              return (
                                <button
                                  key={optionIndex}
                                  onClick={() => !assignment.submissionId && handleMultipleChoiceAnswer(question.id, optionLetter)}
                                  disabled={!!assignment.submissionId}
                                  className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                                    questionAnswers[question.id] === optionLetter
                                      ? 'bg-[#2d5ddd] border-[#2d5ddd] text-white font-medium shadow-md'
                                      : 'bg-white border-gray-300'
                                  } ${assignment.submissionId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                  data-testid={`button-option-${question.id}-${optionLetter}`}
                                >
                                  <span className="font-bold text-sm sm:text-lg mr-2 sm:mr-3 inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-current flex-shrink-0">
                                    {optionLetter}
                                  </span>
                                  <span className="text-sm sm:text-base break-words">{option}</span>
                                </button>
                              );
                            })
                          ) : (
                            ['A', 'B', 'C', 'D'].map((optionLetter) => (
                              question.options?.[optionLetter] && (
                                <button
                                  key={optionLetter}
                                  onClick={() => !assignment.submissionId && handleMultipleChoiceAnswer(question.id, optionLetter)}
                                  disabled={!!assignment.submissionId}
                                  className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                                    questionAnswers[question.id] === optionLetter
                                      ? 'bg-[#2d5ddd] border-[#2d5ddd] text-white font-medium shadow-md'
                                      : 'bg-white border-gray-300'
                                  } ${assignment.submissionId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                  data-testid={`button-option-${question.id}-${optionLetter}`}
                                >
                                  <span className="font-bold text-lg mr-3 inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-current">
                                    {optionLetter}
                                  </span>
                                  <span className="text-base">{question.options[optionLetter]}</span>
                                </button>
                              )
                            ))
                          )}
                        </div>
                      ) : (
                        <div>
                          <textarea
                            value={manualAnswers[question.id] || ''}
                            onChange={(e) => !assignment.submissionId && handleManualAnswer(question.id, e.target.value)}
                            placeholder={assignment.submissionId ? "No answer provided" : "Enter your answer here..."}
                            disabled={!!assignment.submissionId}
                            className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg bg-white text-gray-900 resize-vertical min-h-[100px] sm:min-h-[120px] focus:border-[#42fa76] focus:outline-none text-sm sm:text-base"
                            data-testid={`textarea-answer-${question.id}`}
                          />
                          {assignment.submissionId && manualAnswers[question.id] && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <span className="font-medium text-green-800">Your Answer: </span>
                              <span className="text-green-700">{manualAnswers[question.id]}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Show student answer and correct answer if assignment is graded */}
                      {assignment.submissionId && assignment.submissionStatus === 'graded' && question.type === 'multiple_choice' && (
                        <div className="mt-4 space-y-3">
                          {/* Student's Answer */}
                          {questionAnswers[question.id] && (
                            <div className={`p-3 rounded-lg border-2 ${
                              questionAnswers[question.id] === question.correctAnswer 
                                ? 'bg-green-50 border-green-300'
                                : 'bg-red-50 border-red-300'
                            }`}>
                              <div className="flex items-center gap-2">
                                {questionAnswers[question.id] === question.correctAnswer ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-semibold text-sm">Your Answer:</span>
                                <span className={`font-bold ${
                                  questionAnswers[question.id] === question.correctAnswer 
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }`}>
                                  {questionAnswers[question.id]}
                                </span>
                                {questionAnswers[question.id] === question.correctAnswer ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs ml-auto">Correct</Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 text-xs ml-auto">Incorrect</Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Correct Answer */}
                          {question.correctAnswer && questionAnswers[question.id] !== question.correctAnswer && (
                            <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-300">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-sm">Correct Answer:</span>
                                <span className="font-bold text-blue-700">{question.correctAnswer}</span>
                                <Badge className="bg-blue-100 text-blue-800 text-xs ml-auto hover:bg-blue-100 hover:text-blue-800">Answer Key</Badge>
                              </div>
                            </div>
                          )}

                          {/* Show explanation if available */}
                          {question.explanation && (
                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-gray-600 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-sm text-gray-800">Explanation:</span>
                                  <p className="text-sm text-gray-700 mt-1">{question.explanation}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* For non-graded or non-multiple choice, show simple answer display */}
                      {assignment.submissionId && (assignment.submissionStatus !== 'graded' || question.type !== 'multiple_choice') && questionAnswers[question.id] && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <span className="font-medium text-green-800">Your Answer: </span>
                          <span className="text-green-700">{questionAnswers[question.id]}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Section */}
            {!assignment.submissionId ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b rounded-t-xl">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-[#42fa76]" />
                    Submit Your Work
                  </h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Text Response */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Text Response {questions.length === 0 && "(Required)"}
                    </label>
                    <textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Enter your response or explanation here..."
                      className="w-full p-4 border-2 border-gray-300 rounded-lg bg-white text-gray-900 resize-vertical min-h-[140px] focus:border-[#42fa76] focus:outline-none text-base"
                      data-testid="textarea-submission-text"
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Upload Files (Optional)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-1 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOC, Images, etc. (MAX. 10MB each)</p>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                          data-testid="input-file-upload"
                        />
                      </label>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submission Message */}
                  {submissionMessage.type && (
                    <div className={`p-4 rounded-lg mb-4 ${
                      submissionMessage.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center">
                        {submissionMessage.type === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                        ) : (
                          <X className="h-5 w-5 mr-2" />
                        )}
                        <span className="font-medium">{submissionMessage.text}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      onClick={handleSubmission}
                      disabled={isSubmitting}
                      className="w-full bg-[#2d5ddd] text-white font-semibold py-3 text-lg hover:bg-[#2d5ddd] active:bg-[#2d5ddd]"
                      data-testid="button-submit-assignment"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                          Submitting Assignment...
                        </div>
                      ) : (
                        "Submit Assignment"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-foreground mb-4">Your Submission</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Submitted</span>
                    <span className="text-sm text-muted-foreground">
                      on {new Date(assignment.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {assignment.receivedGrade && (
                    <div className="mt-2">
                      <span className="font-medium">Grade: </span>
                      <span className="text-green-600 font-bold">
                        {assignment.receivedGrade}/{assignment.maxGrade}
                      </span>
                    </div>
                  )}

                  {assignment.feedback && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Teacher Feedback:</h4>
                      <p className="text-sm bg-background p-3 rounded border">
                        {assignment.feedback}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{viewingAttachment.name}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewingAttachment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {viewingAttachment.type?.startsWith('image/') ? (
                <img 
                  src={viewingAttachment.url} 
                  alt={viewingAttachment.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : viewingAttachment.type?.includes('pdf') ? (
                <iframe 
                  src={viewingAttachment.url} 
                  className="w-full h-[70vh] border-0"
                  title={viewingAttachment.name}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Preview not available for this file type.</p>
                  <Button 
                    onClick={() => window.open(viewingAttachment.url, '_blank')}
                    className="bg-[#42fa76] hover:bg-[#42fa76]/90 text-black"
                  >
                    Download {viewingAttachment.name}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Assignments View Component  
const AssignmentsView = () => {
  const { profile } = useAuth();
  const [timeFilter, setTimeFilter] = useState<'current' | 'past'>('current');
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Fetch assignments for the current student
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError, refetch } = useQuery({
    queryKey: ['/api/student/assignments', selectedStatus, selectedSubject],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedSubject && selectedSubject !== 'all') params.append('subject', selectedSubject);
      
      const url = `/api/student/assignments${params.toString() ? '?' + params.toString() : ''}`;
      return apiRequest(url);
    },
    enabled: !!profile?.role && profile.role === 'student'
  });

  const handleViewAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsDetailDialogOpen(true);
  };

  const handleSubmissionUpdate = () => {
    refetch(); // Refresh the assignments list after submission
  };


  // Ensure assignments is an array and get unique subjects
  const assignmentsArray = Array.isArray(assignments) ? assignments : [];
  const subjects = Array.from(new Set(assignmentsArray.map((a: any) => a.subject)));

  // Filter assignments based on time (current vs past)
  const filteredByTimeAssignments = assignmentsArray.filter((assignment: any) => {
    const dueDate = new Date(assignment.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    if (timeFilter === 'current') {
      return dueDate >= today;
    } else {
      return dueDate < today;
    }
  });

  const getStatusIcon = (assignment: any) => {
    if (assignment.submissionStatus === 'graded') {
      return <CheckCircle2 className="w-4 h-4 text-primary" />;
    } else if (assignment.submissionStatus === 'submitted') {
      return <Clock className="w-4 h-4 text-primary" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusText = (assignment: any) => {
    if (assignment.submissionStatus === 'graded') {
      const grade = assignment.receivedGrade || assignment.grade;
      if (grade === 'A' || grade === 'B') {
        return '✓ PASS';
      } else if (grade === 'C') {
        return '~ AVERAGE';
      } else if (grade === 'D') {
        return '✗ FAILED';
      }
      return 'Graded';
    } else if (assignment.submissionStatus === 'submitted') {
      return 'Submitted';
    } else {
      return 'Pending';
    }
  };

  const getStatusColor = (assignment: any) => {
    if (assignment.submissionStatus === 'graded') {
      const grade = assignment.receivedGrade || assignment.grade;
      if (grade === 'A' || grade === 'B') {
        return 'bg-green-600 dark:bg-green-500 text-white font-bold';
      } else if (grade === 'C') {
        return 'bg-yellow-600 dark:bg-yellow-500 text-white font-bold';
      } else if (grade === 'D') {
        return 'bg-red-600 dark:bg-red-500 text-white font-bold';
      }
      return 'bg-primary text-primary-foreground';
    } else if (assignment.submissionStatus === 'submitted') {
      return 'bg-blue-600 dark:bg-blue-500 text-white';
    } else {
      return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="sm:text-3xl font-bold text-foreground text-[20px]">Assignments</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Complete your assignments and track your progress</p>
        </div>
        <Badge variant="outline" className="text-xs w-fit">
          <PenTool className="w-3 h-3 mr-1" />
          {formatGradeDisplay(profile?.grade, profile?.educationLevel)}
        </Badge>
      </div>

      {/* Time Filter Tabs */}
      <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'current' | 'past')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="current" data-testid="filter-current-assignments">
            Current ({assignmentsArray.filter((a: any) => new Date(a.dueDate) >= new Date()).length})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="filter-past-assignments">
            Past ({assignmentsArray.filter((a: any) => new Date(a.dueDate) < new Date()).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-foreground">Status:</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-foreground">Subject:</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Subjects</option>
            {subjects.map((subject: string) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Assignments List */}
      {filteredByTimeAssignments.length > 0 ? (
        <div className="grid gap-4">
          {filteredByTimeAssignments.map((assignment: any) => (
            <Card key={assignment.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2">{assignment.title}</h3>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs w-fit">
                          {assignment.subject}
                        </Badge>
                        <Badge className={`text-xs w-fit ${getStatusColor(assignment)}`}>
                          {getStatusText(assignment)}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {assignment.description}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      
                      {assignment.maxGrade && (
                        <div className="flex items-center space-x-1">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate">Max: {assignment.maxGrade}pts</span>
                        </div>
                      )}
                      
                      {assignment.receivedGrade && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                          <span className="font-medium truncate">Score: {assignment.receivedGrade}/{assignment.maxGrade}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">{assignment.teacherName}</span>
                      </div>
                    </div>

                    {assignment.feedback && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Teacher feedback: </span>
                          {assignment.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-center justify-end sm:justify-center gap-3 sm:gap-2">
                    <div className="hidden sm:block">{getStatusIcon(assignment)}</div>
                    
                    <Button 
                      size="sm" 
                      className="text-xs sm:text-sm whitespace-nowrap"
                      onClick={() => handleViewAssignment(assignment)}
                    >
                      {assignment.submissionId ? "View Details" : "View & Submit"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <PenTool className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Assignments Found</h2>
          <p className="text-muted-foreground">
            {selectedStatus !== "all" || selectedSubject !== "all" 
              ? "Try adjusting your filters to see more assignments."
              : "No assignments have been created for your grade level yet."
            }
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatGradeDisplay(profile?.grade, profile?.educationLevel)} • Showing assignments targeted to your grade
          </p>
        </div>
      )}
      {/* Assignment Detail Dialog */}
      <AssignmentDetailDialog
        assignment={selectedAssignment}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedAssignment(null);
        }}
        onSubmissionUpdate={handleSubmissionUpdate}
      />
    </div>
  );
};

export default StudentDashboard;
