import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { 
  BookOpen, 
  Search, 
  User, 
  Clock, 
  PlayCircle,
  CheckCircle2,
  Calendar,
  Filter,
  DollarSign,
  Star,
  Users,
  CreditCard,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  LogIn,
  Lock,
  Award,
  Download,
  Share2,
  ExternalLink,
  Trophy,
  CreditCard as CreditCardIcon
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadCoursesListing, type CourseListing } from "@/lib/catalog-loader";
const studentsImage = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/fbe5290f-2b8e-4c4a-8cb9-483a71bf8a25.png";

// Generate fake enrollment count starting from 4200
const getFakeEnrollmentCount = (courseId: string): number => {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const randomOffset = Math.abs(hash) % 10800; // Random number between 0-10800
  return 4200 + randomOffset;
};

interface CourseBrowseProps {
  onNavigate: (page: string) => void;
  hideFooter?: boolean;
}

// Extended interface with additional runtime fields
interface Course extends CourseListing {
  price?: number;
  pricingPlan?: {
    id: string;
    name: string;
    displayName: string;
    description: string;
  };
  avgRating?: number;
  totalReviews?: number;
  totalEnrollments?: number;
  authorName?: string;
  authorRole?: string;
}

interface EnrolledCourse {
  courseId: string;
  title: string;
  description: string;
  categoryId: string;
  thumbnailUrl?: string;
  enrolledAt: string;
  progress: number;
  authorName?: string;
  authorRole?: string;
}

interface Certificate {
  id: string;
  courseTitle: string;
  courseDescription: string | null;
  studentName: string;
  completionDate: string;
  issueDate: string;
  verificationCode: string;
  certificateUrl: string | null;
  finalScore: number | null;
  instructorName: string | null;
}

interface CompletedCourseWithCertificate extends EnrolledCourse {
  certificate?: Certificate | null;
  hasCertificate: boolean;
}

export default function CourseBrowse({ onNavigate, hideFooter = false }: CourseBrowseProps) {
  const { user, profile } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'browse' | 'enrolled' | 'certificates'>('browse');
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  
  const isAuthenticated = !!user;

  // Get public courses from database API
  const { data: coursesData, isLoading: coursesLoading } = useQuery<{ success: boolean; courses: Course[] }>({
    queryKey: ['/api/course-creator/public-courses'],
    retry: false
  });

  const courses = coursesData?.courses || [];

  // Get enrolled courses
  const { data: enrolledCourses, isLoading: enrolledLoading } = useQuery({
    queryKey: ['/api/course-creator/my-courses'],
    enabled: isAuthenticated,
    select: (data: any) => data.courses,
    retry: false
  });

  // Get user certificates
  const { data: certificates, isLoading: certificatesLoading } = useQuery<Certificate[]>({
    queryKey: ['/api/certificates/my-certificates'],
    enabled: isAuthenticated,
    retry: false
  });

  // Get completed courses with their certificate status
  const completedCoursesWithCertificates: CompletedCourseWithCertificate[] = enrolledCourses
    ?.filter((course: EnrolledCourse) => course.progress === 100)
    .map((course: EnrolledCourse) => {
      const certificate = certificates?.find(cert => 
        cert.courseTitle === course.title || 
        cert.id.includes(course.courseId)
      );
      return {
        ...course,
        certificate: certificate || null,
        hasCertificate: !!certificate
      };
    }) || [];

  const handleClaimCertificate = (courseId: string) => {
    onNavigate(`claim-certificate-${courseId}`);
  };

  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      setEnrollingCourseId(courseId);
      const response = await apiRequest(`/api/course-creator/enroll/${courseId}`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/my-courses'] });
      setEnrollingCourseId(null);
      
      // Switch to "My Courses" tab to show enrolled course
      setActiveTab('enrolled');
    },
    onError: (error) => {
      setEnrollingCourseId(null);
      console.error('Enrollment failed:', error);
    }
  });

  const handleEnroll = (courseId: string, course: Course) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      onNavigate('auth');
      return;
    }
    
    const coursePrice = course.price !== null && course.price !== undefined ? parseFloat(course.price.toString()) : 0;
    const pricingType = course.pricingType;
    
    // Free courses can be enrolled directly
    if (coursePrice === 0 || pricingType === 'free') {
      enrollMutation.mutate(courseId);
    } else if (pricingType === 'fixed_price' || (!pricingType && coursePrice > 0)) {
      // Paid course (explicit fixed_price or legacy with price > 0) - must go through checkout
      onNavigate(`course-detail-${courseId}`);
    } else if (pricingType === 'subscription') {
      // Subscription courses - try to enroll (backend will check subscription status)
      enrollMutation.mutate(courseId);
    } else {
      // Default to course detail page
      onNavigate(`course-detail-${courseId}`);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrolledCourses?.some((course: EnrolledCourse) => course.courseId === courseId);
  };

  const getCreatorBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: ShieldCheck,
          label: 'Admin',
          color: 'bg-blue-500 text-white border-blue-600',
          hoverColor: 'group-hover:bg-primary'
        };
      case 'teacher':
        return {
          icon: GraduationCap,
          label: 'Teacher',
          color: 'bg-green-500 text-white border-green-600',
          hoverColor: 'group-hover:bg-green-600'
        };
      case 'freelancer':
        return {
          icon: Briefcase,
          label: 'Freelancer',
          color: 'bg-purple-500 text-white border-purple-600',
          hoverColor: 'group-hover:bg-primary'
        };
      default:
        return {
          icon: User,
          label: 'Creator',
          color: 'bg-gray-500 text-white border-gray-600',
          hoverColor: 'group-hover:bg-gray-600'
        };
    }
  };

  const filteredCourses = courses?.filter((course: Course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    // Handle null categoryId by treating it as 'other' category
    const courseCategory = course.categoryId || 'other';
    const matchesCategory = selectedCategory === 'all' || courseCategory === selectedCategory;
    
    // Fix price filter logic - paid should only match courses with price > 0
    const coursePrice = course.price !== null && course.price !== undefined ? parseFloat(course.price.toString()) : 0;
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'free' && coursePrice === 0) ||
                        (priceFilter === 'paid' && coursePrice > 0);
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

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
      marketing: 'bg-primary/15 text-primary dark:bg-primary/80/50 dark:text-orange-200',
      photography: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
      music: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
      health: 'bg-primary/15 text-primary-800 dark:bg-red-900/50 dark:text-primary-200',
      language: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Navigation */}
      <Header onNavigate={onNavigate} currentPage="course-browse" />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-purple-600 text-white pt-16 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${studentsImage})` }}
        />
        {/* Blue Overlay */}
        <div className="absolute inset-0 bg-[#0C332C]/80" />
        
        {/* Content */}
        <div className="px-4 md:px-8 py-12 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-hero-title">
              Explore Our Course Library
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Learn from top instructors, admins, teachers, and freelancers
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg bg-white text-gray-900 border-0"
                  data-testid="input-search-courses"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-3 text-lg border-0 rounded-md bg-white text-gray-900"
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
        </div>
      </div>

      <div className="px-4 md:px-8 py-8">
        {/* Tabs */}
        <div className="overflow-x-auto mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex space-x-1 p-1 bg-muted rounded-lg w-fit min-w-full md:min-w-0">
            <Button
              onClick={() => setActiveTab('browse')}
              data-testid="tab-browse"
              className={`whitespace-nowrap ${activeTab === 'browse' ? 'bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800'}`}
            >
              <Search className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
            <Button
              onClick={() => setActiveTab('enrolled')}
              data-testid="tab-enrolled"
              className={`whitespace-nowrap ${activeTab === 'enrolled' ? 'bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800'}`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              My Courses
            </Button>
            <Button
              onClick={() => setActiveTab('certificates')}
              data-testid="tab-certificates"
              className={`whitespace-nowrap ${activeTab === 'certificates' ? 'bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800'}`}
            >
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </Button>
          </div>
        </div>

        {activeTab === 'browse' ? (
          <>
            {/* Filter Section */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-4">
                {/* Price Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Price:</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setPriceFilter('all')}
                      className={`${priceFilter === 'all' ? 'bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800'}`}
                      data-testid="filter-price-all"
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPriceFilter('free')}
                      className={priceFilter === 'free' ? 'bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white border-[#2f5a4e]' : 'border-[#A0FAB2] text-gray-900 dark:text-gray-900 hover:bg-[#A0FAB2]/10'}
                      data-testid="filter-price-free"
                    >
                      Free
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPriceFilter('paid')}
                      className={priceFilter === 'paid' ? 'bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white border-[#2f5a4e]' : 'border-[#0C332C] text-gray-900 dark:text-gray-900 hover:bg-[#0C332C]/10'}
                      data-testid="filter-price-paid"
                    >
                      Paid
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses?.map((course: Course) => {
                  return (
                    <Card key={course.id} className="group transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden" transition-all duration-300 data-testid={`card-course-${course.id}`}>
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 flex items-center justify-center overflow-hidden relative">
                        {course.thumbnailUrl ? (
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" transition-all duration-300
                          />
                        ) : (
                          <BookOpen className="h-16 w-16 text-muted-foreground transition-all duration-300 group-hover:h-20 group-hover:w-20" transition-all duration-300 />
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white min-h-[48px]" data-testid={`text-title-${course.id}`}>{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                          {course.description}
                        </p>
                        
                        {/* Course Stats */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              <span data-testid={`text-enrollments-${course.id}`}>{(getFakeEnrollmentCount(course.id) + (course.totalEnrollments || 0)).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{course.duration || 'N/A'} weeks</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {course.difficulty || 'Beginner'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          {!isAuthenticated ? (
                            /* Not Logged In */
                            <Button
                              onClick={() => onNavigate('auth')}
                              className="flex-1 bg-[#A0FAB2] hover:bg-[#A0FAB2]/90 text-gray-900 border-0" transition-all duration-300
                              data-testid={`button-login-${course.id}`}
                            >
                              <LogIn className="h-4 w-4 mr-2" />
                              Login to Enroll
                            </Button>
                          ) : isEnrolled(course.id) ? (
                            /* Already Enrolled */
                            <Button
                              className="flex-1 bg-[#151314] hover:bg-[#151314]/90 text-white border-0" transition-all duration-300
                              disabled
                              data-testid={`button-enrolled-${course.id}`}
                            >
                              Enrolled
                            </Button>
                          ) : (
                            /* Can Enroll */
                            (() => {
                              const coursePrice = course.price ? parseFloat(course.price.toString()) : 0;
                              const isPaid = coursePrice > 0 && (course.pricingType === 'fixed_price' || !course.pricingType);
                              const isFree = coursePrice === 0 || course.pricingType === 'free';
                              
                              return (
                                <Button
                                  onClick={() => {
                                    onNavigate(`course-detail-${course.id}`);
                                  }}
                                  disabled={enrollingCourseId === course.id}
                                  className={`flex-1 ${
                                    isFree
                                      ? 'bg-[#A0FAB2] hover:bg-[#A0FAB2]/90 text-gray-900'
                                      : isPaid
                                      ? 'bg-[#0C332C] hover:bg-[#0C332C]/90 text-white'
                                      : 'bg-primary hover:bg-primary text-white'
                                  } border-0`}
                                  data-testid={`button-enroll-${course.id}`}
                                >
                                  {isFree ? (
                                    <>
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Enroll Free
                                    </>
                                  ) : isPaid ? (
                                    <>
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Buy Course
                                    </>
                                  ) : (
                                    <>
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Enroll
                                    </>
                                  )}
                                </Button>
                              );
                            })()
                          )}
                          <Button 
                            size="sm"
                            onClick={() => {
                              onNavigate(`course-detail-${course.id}`);
                            }}
                            data-testid={`button-view-${course.id}`}
                            className="bg-[#0C332C] hover:bg-[#0C332C]/90 text-white border-0" transition-all duration-300
                          >
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!coursesLoading && (!filteredCourses || filteredCourses.length === 0) && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== 'all' || priceFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No courses available at the moment'
                  }
                </p>
              </div>
            )}
          </>
        ) : activeTab === 'enrolled' ? (
          <div>
            {enrolledLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses?.map((course: EnrolledCourse) => {
                  const isCompleted = Number(course.progress) >= 100;
                  return (
                    <Card key={course.courseId} className="group transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" transition-all duration-300>
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 flex items-center justify-center overflow-hidden relative">
                        {course.thumbnailUrl ? (
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" transition-all duration-300
                          />
                        ) : (
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`text-xs font-medium ${getCategoryColor(course.categoryId || 'other')}`}>
                            {(course.categoryId || 'Other').charAt(0).toUpperCase() + (course.categoryId || 'Other').slice(1)}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {course.progress}% complete
                          </div>
                        </div>
                        
                        <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1 text-gray-700 dark:text-gray-300">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              window.history.pushState({}, '', `?page=course-player&courseId=${course.courseId}`);
                              onNavigate('course-player');
                            }}
                            className="flex-1 bg-primary hover:bg-primary/80 hover:shadow-xl hover:scale-105 text-white border-0" transition-all duration-300 
                            data-testid={`button-continue-${course.courseId}`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Completed
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Continue Learning
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!enrolledLoading && (!enrolledCourses || enrolledCourses.length === 0) && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No enrolled courses</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't enrolled in any courses yet.
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Courses
                </Button>
              </div>
            )}
          </div>
        ) : activeTab === 'certificates' ? (
          <div>
            {enrolledLoading || certificatesLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your certificates...</p>
                </div>
              </div>
            ) : !completedCoursesWithCertificates || completedCoursesWithCertificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete courses to earn certificates. Once you finish a course with 100% progress, you can claim your certificate here!
                </p>
                <Button onClick={() => setActiveTab('browse')} data-testid="button-browse-from-certificates">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCoursesWithCertificates.map((course: CompletedCourseWithCertificate) => (
                  <Card key={course.courseId} className="group transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700" transition-all duration-300 data-testid={`card-certificate-${course.courseId}`}>
                    {/* Certificate Preview */}
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center border-b-2 border-gray-200 dark:border-gray-700 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bS0yIDBoLTJ2Mmgydi0yaC0yem0tMiAwdi0yaC0ydjJoMnptMC0yaDJ2LTJoLTJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                      <Award className="h-16 w-16 text-blue-600 dark:text-blue-400 relative z-10" />
                      {course.hasCertificate && (
                        <Badge className="absolute top-2 right-2 text-white" style={{ backgroundColor: '#0C332C' }}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Claimed
                        </Badge>
                      )}
                      {!course.hasCertificate && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                          Unclaimed
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-gray-900 dark:text-white" data-testid={`text-cert-title-${course.courseId}`}>
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {course.hasCertificate ? `Awarded to ${course.certificate?.studentName}` : 'Ready to claim'}
                        </p>
                      </div>

                      {/* Certificate Details */}
                      <div className="space-y-2 mb-4 text-sm">
                        {course.hasCertificate && course.certificate ? (
                          <>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(course.certificate.completionDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            
                            {course.certificate.finalScore && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Award className="h-4 w-4" />
                                <span>Score: {course.certificate.finalScore}%</span>
                              </div>
                            )}

                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Code: <span className="font-mono">{course.certificate.verificationCode}</span>
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-foreground">
                            <Trophy className="h-4 w-4" />
                            <span className="font-medium">Course Completed - 100%</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        {course.hasCertificate && course.certificate ? (
                          <Button
                            onClick={() => handleClaimCertificate(course.courseId)}
                            className="w-full bg-primary hover:bg-primary text-white" transition-all duration-300
                            data-testid={`button-download-cert-${course.courseId}`}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleClaimCertificate(course.courseId)}
                            className="w-full bg-[#0C332C] hover:bg-[#0C332C]/90 text-white" transition-all duration-300
                            data-testid={`button-claim-cert-${course.courseId}`}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Claim Certificate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
      {!hideFooter && <Footer onNavigate={onNavigate} />}
    </div>
  );
}
