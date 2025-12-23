import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import { 
  BookOpen, 
  User, 
  Clock, 
  PlayCircle,
  Calendar,
  Star,
  StarHalf,
  FileText,
  Video,
  Link as LinkIcon,
  Globe,
  DollarSign,
  Users,
  Edit,
  ArrowLeft,
  CreditCard,
  Shield,
  Award,
  Sparkles,
  Home,
  CheckCircle2
} from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import NewPaymentModal from '@/components/NewPaymentModal';
import { getStripePromise } from '@/lib/stripe';

import { CourseComments } from '@/components/CourseComments';
import { useCourseAccess } from '@/hooks/useCourseAccess';

// Generate fake enrollment count starting from 4200
const getFakeEnrollmentCount = (courseId: string): number => {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const randomOffset = Math.abs(hash) % 10800; // Random number between 0-10800
  return 4200 + randomOffset;
};

interface CourseDetailProps {
  courseId: string;
  onNavigate: (page: string) => void;
  onBack?: () => void;
  hideFooter?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  createdAt: string;
  createdBy: string;
  authorName?: string;
  publisherName?: string;
  publisherBio?: string;
  publisherAvatar?: string;
  price: number;
  pricingType?: 'free' | 'fixed_price' | 'subscription';
  pricingPlanId?: string;
  pricingPlan?: {
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    priceYearly: number;
    features?: string[];
  };
  difficulty: string;
  duration: number;
  prerequisites?: string[];
  learningObjectives?: string[];
  resourceUrls?: string[];
  pdfUrls?: string[];
  videoUrls?: string[];
  tags?: string[];
  language: string;
  avgRating: number;
  totalReviews: number;
  totalEnrollments: number;
  previewLessons?: string[];
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerified: boolean;
  createdAt: string;
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
}

export default function CourseDetail({ courseId, onNavigate, onBack, hideFooter = false }: CourseDetailProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'reviews'>('overview');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  
  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);
  
  // Use centralized course access hook
  const { course, isEnrolled, hasPurchased, isFree, canAccess, isLoading: accessLoading, error: courseError } = useCourseAccess(courseId);

  // Check if user can edit this course
  const canEditCourse = (course: Course) => {
    if (!user || !profile) return false;
    
    // Admin can edit all courses
    if (profile.role === 'admin') return true;
    
    // Teachers and freelancers can edit courses they created
    if ((profile.role === 'teacher' || profile.role === 'freelancer') && course.createdBy === user.id) {
      return true;
    }
    
    return false;
  };

  // Get course reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/reviews`],
    enabled: !!courseId && courseId.length >= 10
  });
  const reviews = (reviewsData as any)?.reviews || reviewsData || [];

  // Get course modules and lessons
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: [`/api/course-creator/courses/${courseId}/modules`],
    enabled: !!courseId && courseId.length >= 10
  });
  const modules = (modulesData as any)?.modules || modulesData || [];

  // Auto-redirect removed - users can view course details even when enrolled

  // Enroll in course mutation (for free courses only)
  const enrollMutation = useMutation({
    mutationFn: async () => {
      console.log('🎓 ENROLLMENT MUTATION STARTED');
      
      // Check if user is authenticated before attempting enrollment
      if (!user) {
        console.log('🎓 ENROLLMENT ERROR: No user found');
        throw new Error('Please sign in to enroll in courses');
      }
      
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        console.log('🎓 ENROLLMENT ERROR: No session ID found');
        throw new Error('Authentication session expired. Please sign in again.');
      }
      
      console.log('🎓 Enrolling user:', user.id, 'in course:', courseId);
      console.log('🎓 Using session:', !!sessionId);
      
      // Use manual fetch with explicit authentication to ensure it works
      const response = await fetch(`/api/course-creator/enroll/${courseId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
          'x-session-id': sessionId
        }
      });
      
      console.log('🎓 Enrollment response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log('🎓 Enrollment error:', errorData);
        throw new Error(errorData.error || 'Failed to enroll in course');
      }
      
      const result = await response.json();
      console.log('🎓 Enrollment success:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/course-creator/courses/${courseId}/enrollment`] });
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/my-courses'] });
    },
    onError: (error: Error) => {
      // If paid course error, show payment modal instead
      if (error.message.includes('paid') || error.message.includes('purchase')) {
        setShowPaymentModal(true);
      }
      // If already enrolled, refresh the enrollment status to show "Go to Course"
      if (error.message.includes('Already enrolled')) {
        queryClient.invalidateQueries({ queryKey: [`/api/course-creator/courses/${courseId}/enrollment`] });
        queryClient.invalidateQueries({ queryKey: ['/api/course-creator/my-courses'] });
      }
    }
  });

  // Create payment intent mutation (for paid courses)
  const purchaseMutation = useMutation({
    mutationFn: async (couponCode?: string) => {
      // Create payment intent for course purchase with optional coupon
      return await apiRequest(`/api/courses/${courseId}/create-payment-intent`, {
        method: 'POST',
        body: JSON.stringify({ couponCode: couponCode || '' })
      });
    }
  });

  // Confirm purchase mutation - records purchase after successful payment
  const confirmPurchaseMutation = useMutation({
    mutationFn: async ({ paymentIntentId, amount }: { paymentIntentId: string; amount: number }) => {
      return await apiRequest(`/api/courses/${courseId}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ 
          paymentIntentId,
          amount,
          currency: 'usd'
        })
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh enrollment and purchase status
      queryClient.invalidateQueries({ queryKey: [`/api/course-creator/courses/${courseId}/enrollment`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/purchase-status`] });
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/my-courses'] });
      // Don't close modal here - let the PaymentModal component handle success state and closing
    }
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleEnroll = () => {
    // Double-check user authentication before enrollment
    if (!user) {
      onNavigate('auth');
      return;
    }
    
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      onNavigate('auth');
      return;
    }
    
    console.log('🎓 Initiating enrollment for user:', user.email, 'in course:', courseId);
    enrollMutation.mutate();
  };

  // Determine course pricing type
  const getCourseType = (course: Course) => {
    // Use the pricingType field if available (new system)
    if (course.pricingType) {
      return course.pricingType;
    }
    
    // Fallback to old logic for courses without pricingType field
    // First, check for subscription course (has pricing plan ID or plan object)
    if (course.pricingPlanId || course.pricingPlan?.id) {
      return 'subscription';
    }
    
    // Parse price safely
    const price = Number.isFinite(course.price) ? course.price : null;
    
    // Fixed price course (has valid positive price)
    if (price && price > 0) {
      return 'fixed_price';
    }
    
    // Free course (zero price, null price, or no subscription plan)
    // Default to free if no valid pricing is specified
    return 'free';
  };

  const handlePurchase = async () => {
    if (!course) return;
    
    // Ensure user is authenticated
    if (!user) {
      onNavigate('auth');
      return;
    }
    
    const courseType = getCourseType(course);
    
    console.log('📊 handlePurchase - Course type detected:', courseType, 'Price:', course.price, 'isFree from hook:', isFree);
    
    // ALWAYS use the isFree flag from useCourseAccess hook (backend truth)
    // This prevents mismatches between frontend inference and backend reality
    if (isFree) {
      console.log('📊 Course is FREE (from backend), enrolling directly');
      handleEnroll();
      return;
    }
    
    switch (courseType) {
      case 'subscription':
        // Subscription course - check if user has premium access
        const hasPremiumAccess = profile?.stripeSubscriptionId || 
          (profile?.legacyPlan && profile.legacyPlan !== 'free' && profile.legacyPlan !== '');
        
        if (hasPremiumAccess) {
          // User has premium access, allow direct enrollment
          handleEnroll();
        } else {
          // Show payment modal for subscription
          setShowPaymentModal(true);
        }
        break;
        
      case 'fixed_price':
        // Paid course - check if already purchased
        // If user has already purchased, enroll them directly
        if (hasPurchased) {
          handleEnroll();
        } else {
          // Show payment modal for purchase
          setShowPaymentModal(true);
        }
        break;
        
      default:
        // Should not reach here, but handle gracefully
        break;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const safeRating = Number.isFinite(rating) ? rating : 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(safeRating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      programming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
      business: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      marketing: 'bg-primary/15 text-primary dark:bg-primary/80/50 dark:text-orange-200',
      photography: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
      music: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
      health: 'bg-primary/15 text-primary-800 dark:bg-red-900/50 dark:text-primary-200',
      language: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200'
    };
    return colors[category] || colors.other;
  };

  // Show loading state while fetching
  if (accessLoading || !courseId || courseId.length < 10) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
            <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-muted rounded mb-2 w-1/2"></div>
            <div className="h-4 bg-muted rounded mb-4 w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if course not found
  if (!course && !accessLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course not found</h1>
            <p className="text-muted-foreground mb-6">
              {courseError ? 'Unable to load course details. Please try again.' : 'This course may have been removed or is no longer available.'}
            </p>
            <Button onClick={onBack || (() => onNavigate('student-dashboard'))}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pt-16 md:pt-20">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Info */}
            <div className="mb-6 md:mb-8">
              {/* Course Image */}
              {course.thumbnailUrl && (
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden mb-4 md:mb-6">
                  <img 
                    src={course.thumbnailUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Publisher Info */}
              {course.publisherName && (
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-muted rounded-lg mb-4 md:mb-6">
                  {course.publisherAvatar ? (
                    <img 
                      src={course.publisherAvatar} 
                      alt={course.publisherName}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <User className="w-10 h-10 md:w-12 md:h-12 p-2 bg-background rounded-full flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm md:text-base" data-testid="publisher-name">{course.publisherName}</h3>
                    {course.publisherBio && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2" data-testid="publisher-bio">
                        {course.publisherBio}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-4 md:mb-6 p-1 bg-muted rounded-lg w-full md:w-fit overflow-x-auto">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('overview')}
                data-testid="tab-overview"
                className={`text-xs md:text-sm whitespace-nowrap flex-1 md:flex-none ${activeTab === 'overview' ? 'bg-[#2f5a4e] text-[#ffffff]' : 'hover:bg-[#a0fab2] hover:text-black text-foreground'}`}
              >
                Overview
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('content')}
                data-testid="tab-content"
                className={`text-xs md:text-sm whitespace-nowrap flex-1 md:flex-none ${activeTab === 'content' ? 'bg-[#2f5a4e] text-[#ffffff]' : 'hover:bg-[#a0fab2] hover:text-black text-foreground'}`}
              >
                Course Content
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('reviews')}
                data-testid="tab-reviews"
                className={`text-xs md:text-sm whitespace-nowrap flex-1 md:flex-none ${activeTab === 'reviews' ? 'bg-[#2f5a4e] text-[#ffffff]' : 'hover:bg-[#a0fab2] hover:text-black text-foreground'}`}
              >
                Reviews
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Course Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>About this course</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base leading-relaxed text-muted-foreground" data-testid="course-description">
                      {course.description}
                    </p>
                  </CardContent>
                </Card>

                {/* What You'll Learn */}
                {course.learningObjectives && course.learningObjectives.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>What You'll Learn</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {course.learningObjectives.map((objective: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              <CheckCircle2 className="h-6 w-6 text-white fill-[#0d3d6b] dark:fill-blue-500" />
                            </div>
                            <span className="text-sm md:text-base">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Prerequisites */}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Prerequisites</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {course.prerequisites.map((prerequisite: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{prerequisite}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Resources */}
                {((course.resourceUrls?.length ?? 0) > 0 || (course.pdfUrls?.length ?? 0) > 0 || (course.videoUrls?.length ?? 0) > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {course.resourceUrls && course.resourceUrls.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Additional Resources
                          </h4>
                          <ul className="space-y-1">
                            {course.resourceUrls.map((url: string, index: number) => (
                              <li key={index}>
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm" transition-all duration-300
                                >
                                  {url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {course.pdfUrls && course.pdfUrls.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            PDF Resources
                          </h4>
                          <ul className="space-y-1">
                            {course.pdfUrls.map((url: string, index: number) => (
                              <li key={index}>
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm" transition-all duration-300
                                >
                                  PDF Resource {index + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {course.videoUrls && course.videoUrls.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Video Resources
                          </h4>
                          <ul className="space-y-1">
                            {course.videoUrls.map((url: string, index: number) => (
                              <li key={index}>
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm" transition-all duration-300
                                >
                                  Video Resource {index + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {course.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4">
                {modulesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : modules && modules.length > 0 ? (
                  modules.map((module: Module) => (
                    <Card key={module.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Module {module.orderNum}: {module.title}
                        </CardTitle>
                        {module.description && (
                          <CardDescription>{module.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {module.lessons.map((lesson: Lesson) => (
                            <div 
                              key={lesson.id} 
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.freePreviewFlag ? (
                                  <PlayCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div>
                                  <p className="font-medium">{lesson.title}</p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {lesson.durationMinutes} min
                                    </span>
                                    {lesson.freePreviewFlag && (
                                      <Badge variant="outline" className="text-xs">
                                        Free Preview
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {lesson.freePreviewFlag && (
                                <Button variant="outline" size="sm">
                                  Preview
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No content available</h3>
                      <p className="text-muted-foreground">
                        Course content will be available after enrollment
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <CourseComments courseId={courseId} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Purchase Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold mb-2" data-testid="course-price">
                      {(() => {
                        const courseType = getCourseType(course);
                        switch (courseType) {
                          case 'free':
                            return <span className="text-[#0d3d6b] dark:text-blue-400">Free</span>;
                          case 'subscription':
                            return <span className="text-blue-600">Premium Course</span>;
                          case 'fixed_price':
                            return <span>${parseFloat(course.price?.toString() || '0').toFixed(2)}</span>;
                          default:
                            return <span>${parseFloat(course.price?.toString() || '0').toFixed(2)}</span>;
                        }
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const courseType = getCourseType(course);
                        switch (courseType) {
                          case 'free':
                            return 'Free course';
                          case 'subscription':
                            return 'Included with premium subscription';
                          case 'fixed_price':
                            return 'One-time purchase';
                          default:
                            return 'One-time purchase';
                        }
                      })()}
                    </p>
                  </div>

                  {isEnrolled ? (
                    <Button 
                      className="w-full mb-4 bg-[#0C332C] hover:bg-[#0C332C]/90 text-white" transition-all duration-300
                      onClick={() => onNavigate(`course-player-${courseId}`)}
                      data-testid="button-go-to-course"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Go to Course
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full mb-4 text-white ${
                        getCourseType(course) === 'free'
                          ? 'bg-[#A0FAB2] hover:bg-[#A0FAB2]/90 text-gray-900'
                          : getCourseType(course) === 'fixed_price'
                          ? 'bg-[#0C332C] hover:bg-[#0C332C]/90'
                          : 'bg-[#0d3d6b] hover:bg-[#0d3d6b]/90'
                      }`}
                      onClick={handlePurchase}
                      disabled={accessLoading || enrollMutation.isPending || purchaseMutation.isPending || Boolean(user && !profile)}
                      data-testid="button-purchase"
                    >
                      {accessLoading ? (
                        'Loading...'
                      ) : enrollMutation.isPending || purchaseMutation.isPending ? (
                        'Processing...'
                      ) : (user && !profile) ? (
                        'Loading profile...'
                      ) : (
                        (() => {
                          const courseType = getCourseType(course);
                          switch (courseType) {
                            case 'free':
                              return (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Enroll Free
                                </>
                              );
                            case 'subscription':
                              // Check if user already has premium access
                              const hasPremiumAccess = profile?.stripeSubscriptionId || 
                                (profile?.legacyPlan && profile.legacyPlan !== 'free' && profile.legacyPlan !== '');
                              
                              if (hasPremiumAccess) {
                                return (
                                  <>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Learn Now
                                  </>
                                );
                              } else {
                                return (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Subscribe to Access
                                  </>
                                );
                              }
                            case 'fixed_price':
                              // Check if user has already purchased this course
                              if (hasPurchased) {
                                return (
                                  <>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Enroll
                                  </>
                                );
                              }
                              return (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Purchase for ${parseFloat(course.price?.toString() || '0').toFixed(2)}
                                </>
                              );
                            default:
                              return (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Buy Course
                                </>
                              );
                          }
                        })()
                      )}
                    </Button>
                  )}
                  
                  {getCourseType(course) === 'fixed_price' && !isEnrolled && !hasPurchased && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>Secure payment with Stripe</span>
                    </div>
                  )}

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Students
                      </span>
                      <span data-testid="total-enrollments">{(getFakeEnrollmentCount(course.id) + (course.totalEnrollments || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Duration
                      </span>
                      <span data-testid="course-duration">{course.duration} weeks</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Difficulty
                      </span>
                      <span data-testid="course-difficulty" className="capitalize">{course.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Language
                      </span>
                      <span data-testid="course-language" className="capitalize">{course.language}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created
                      </span>
                      <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certificate Preview Section */}
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-[#0d3d6b] dark:text-blue-400" />
                    <CardTitle className="text-lg">Earn a {course.certificationType === 'diploma' ? 'Diploma' : 'Certificate'}</CardTitle>
                  </div>
                  <CardDescription className="text-foreground/80">
                    Upon successful completion of this course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Certificate Benefits */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0d3d6b] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Shareable certificate of achievement</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0d3d6b] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Add to your LinkedIn profile</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0d3d6b] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Verifiable with unique code</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0d3d6b] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Download as PDF</span>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Certification Requirements:</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0d3d6b] dark:bg-blue-400"></div>
                        <span>Complete all course modules and lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0d3d6b] dark:bg-blue-400"></div>
                        <span>Achieve minimum 70% on all assessments</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Author Info */}
              {course.authorName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <User className="w-10 h-10 p-2 bg-muted rounded-full" />
                      <div>
                        <p className="font-medium" data-testid="instructor-name">{course.authorName}</p>
                        <p className="text-sm text-muted-foreground">Course Instructor</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <Elements stripe={stripePromise}>
          <NewPaymentModal 
            courseId={courseId}
            course={course}
            onClose={() => setShowPaymentModal(false)}
            purchaseMutation={purchaseMutation}
            confirmPurchaseMutation={confirmPurchaseMutation}
          />
        </Elements>
      )}
      {!hideFooter && <Footer onNavigate={onNavigate} />}
    </div>
  );
}

// Payment Modal Component
