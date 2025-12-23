import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { BannerAdDisplay } from "@/components/BannerAdDisplay";
import { HomeHeroSection } from "@/components/HeroSectionDisplay";
import AnimatedGlobeHero from "@/components/AnimatedGlobeHero";
import Testimonials from "@/components/ui/testimonials";
import FAQ from "@/components/ui/faq";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import mathLessonImage from "@/assets/math-lesson.jpg";
import scienceLessonImage from "@/assets/science-lesson.jpg";
import codingLessonImage from "@/assets/coding-lesson.jpg";
import geographyLessonImage from "@/assets/geography-lesson.jpg";
import literatureLessonImage from "@/assets/literature-lesson.jpg";
import artLessonImage from "@/assets/art-lesson.jpg";
import musicLessonImage from "@/assets/music-lesson.jpg";
import webdevLessonImage from "@/assets/webdev-lesson.jpg";
import { 
  BookOpen, 
  Users, 
  Award, 
  Star, 
  ArrowRight, 
  Code, 
  Calculator, 
  Globe, 
  Palette,
  Music,
  Beaker,
  Crown,
  MessageCircle,
  Play,
  Sparkles,
  DollarSign,
  GraduationCap,
  CreditCard,
  ShoppingBag,
  Video,
  TrendingUp,
  Target,
  Shield,
  Clock,
  Briefcase,
  FileText,
  UserCheck,
  Zap,
  BarChart,
  Wallet,
  Receipt,
  Upload,
  Heart,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { SiStripe, SiPaypal } from "react-icons/si";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  price: string;
  difficulty: string | null;
  authorName?: string;
  isFeatured: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  images: string[] | null;
  category: string;
  type: string;
  featured: boolean;
}

const LandingPage = ({ onNavigate }: LandingPageProps) => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [stats] = useState({
    totalUsers: { formatted: '25K+' },
    totalTeachers: { formatted: '250+' },
    totalCountries: { formatted: '70+' }
  });
  const sectionsRef = useRef<HTMLElement[]>([]);

  // Fetch featured courses from API
  const { data: featuredCoursesData, isLoading: isFeaturedLoading, error: featuredError } = useQuery<{ success: boolean; data: Course[] }>({
    queryKey: ['/api/courses/featured'],
    queryFn: async () => {
      const response = await fetch('/api/courses/featured');
      if (!response.ok) {
        throw new Error('Failed to fetch featured courses');
      }
      return response.json();
    }
  });

  const featuredCourses = featuredCoursesData?.data || [];

  // Fetch featured products
  const { data: featuredProductsData, isLoading: isProductsLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/products/featured'],
  });

  const featuredProducts = featuredProductsData?.products || [];
  
  console.log('🛍️ Featured Products Data:', featuredProductsData);
  console.log('🛍️ Featured Products Array:', featuredProducts);

  const handleGetStarted = () => {
    if (user) {
      onNavigate("dashboard");
    } else {
      onNavigate("auth");
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: GraduationCap,
      title: "Student Subscriptions",
      description: "Access all grade levels (1-12+) with flexible plans starting at $5.99/month. Live tutoring, interactive games, and personalized learning paths included.",
      shortDescription: "Flexible plans for all grades"
    },
    {
      icon: BookOpen,
      title: "Premium Courses",
      description: "Browse 1,800+ courses across all subjects. Pay once for lifetime access or subscribe for unlimited learning. Free courses available to get started.",
      shortDescription: "1,800+ courses across all subjects"
    },
    {
      icon: Briefcase,
      title: "Freelancer Marketplace",
      description: "Create and sell courses, offer tutoring sessions, or build your teaching business. Earn from multiple revenue streams with our comprehensive tools.",
      shortDescription: "Create courses and earn income"
    },
    {
      icon: ShoppingBag,
      title: "Digital Shop",
      description: "Download templates, PSDs, worksheets, study guides, and educational resources. Free and paid products from talented creators worldwide.",
      shortDescription: "Download educational resources"
    }
  ];

  const subjects = [
    { 
      icon: Calculator, 
      name: "Mathematics", 
      lessons: 300, 
      color: "bg-blue-500", 
      free: true, 
      image: mathLessonImage,
      description: "Master algebra, calculus, geometry with interactive lessons"
    },
    { 
      icon: Beaker, 
      name: "Science", 
      lessons: 280, 
      color: "bg-purple-500", 
      free: true, 
      image: scienceLessonImage,
      description: "Explore physics, chemistry, biology through experiments"
    },
    { 
      icon: Globe, 
      name: "Geography", 
      lessons: 220, 
      color: "bg-purple-500", 
      free: true, 
      image: geographyLessonImage,
      description: "Discover world cultures, climates, and continents"
    },
    { 
      icon: BookOpen, 
      name: "Literature", 
      lessons: 250, 
      color: "bg-primary", 
      free: true, 
      image: literatureLessonImage,
      description: "Analyze classic and modern texts, improve writing"
    },
    { 
      icon: Palette, 
      name: "Art", 
      lessons: 180, 
      color: "bg-pink-500", 
      free: true, 
      image: artLessonImage,
      description: "Create digital art and learn design principles"
    },
    { 
      icon: Music, 
      name: "Music", 
      lessons: 160, 
      color: "bg-indigo-500", 
      free: true, 
      image: musicLessonImage,
      description: "Learn theory, composition, and instruments"
    },
    { 
      icon: Code, 
      name: "Programming", 
      lessons: 350, 
      color: "bg-yellow-500", 
      free: false, 
      image: codingLessonImage,
      description: "Master Python, JavaScript, and modern coding"
    },
    { 
      icon: Code, 
      name: "Web Development", 
      lessons: 320, 
      color: "bg-primary", 
      free: false, 
      image: webdevLessonImage,
      description: "Build websites with HTML, CSS, React, and more"
    }
  ];

  const teachers = [
    {
      name: "Dr. Sarah Johnson",
      subject: "Mathematics",
      bio: "PhD in Mathematics with 15 years of teaching experience",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1559583985-c80d8ad9b29f?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Prof. Michael Chen",
      subject: "Computer Science", 
      bio: "Former Google engineer, now dedicated to education",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Dr. Amara Okafor",
      subject: "Science",
      bio: "Published researcher with passion for making science accessible",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face"
    }
  ];

  const reviews = [
    {
      name: "Lily Thompson",
      rating: 5,
      comment: "Math is so much easier now! I love how my teacher explains everything with fun examples and pictures.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Tyler Chen", 
      rating: 5,
      comment: "I built my first game in scratch! The coding lessons are super cool and easy to follow.",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Maya Singh",
      rating: 5,
      comment: "Science experiments are awesome! I learned why volcanoes erupt and did a fun volcano project.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const subscriptionPlans = [
    {
      tier: "Elementary",
      gradeRange: "Grades 1-7",
      monthlyPrice: "5.99",
      yearlyPrice: "54.99",
      bgColor: "bg-[#0C332C]",
      borderColor: "border-[#0C332C]",
      textColor: "text-white",
      features: [
        "Ideal for young learners and foundational education",
        "All elementary courses (Grades 1-7)",
        "Interactive learning games and activities",
        "Basic progress tracking and parent reports"
      ]
    },
    {
      tier: "High School",
      gradeRange: "Grades 8-12",
      monthlyPrice: "9.99",
      yearlyPrice: "99.90",
      bgColor: "bg-[#0C332C]",
      borderColor: "border-[#0C332C]",
      textColor: "text-white",
      popular: true,
      features: [
        "All in Elementary plan",
        "Advanced courses for increased productivity",
        "SAT/ACT prep and college preparation",
        "Live teacher sessions and priority support"
      ]
    },
    {
      tier: "College & University",
      gradeRange: "Higher Education",
      monthlyPrice: "99.00",
      yearlyPrice: "799.00",
      bgColor: "bg-[#151314]",
      borderColor: "border-[#151314]",
      textColor: "text-white",
      features: [
        "Tailored solutions for higher education",
        "Advanced features for career development",
        "Specialized degree program support",
        "Professional networking and career counseling"
      ]
    }
  ];

  const freelancerFeatures = [
    {
      icon: BookOpen,
      title: "Create & Sell Courses",
      description: "Build comprehensive courses with video lessons, quizzes, and assignments. Set your own pricing.",
      color: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-gray-900"
    },
    {
      icon: Video,
      title: "Offer Live Tutoring",
      description: "Conduct one-on-one or group tutoring sessions. Set your hourly rates and availability.",
      color: "bg-purple-50 dark:bg-purple-950",
      iconColor: "text-gray-900"
    },
    {
      icon: ShoppingBag,
      title: "Digital Products",
      description: "Sell templates, worksheets, study guides, and educational resources in our marketplace.",
      color: "bg-emerald-50 dark:bg-emerald-950",
      iconColor: "text-gray-900"
    },
    {
      icon: Briefcase,
      title: "Build Portfolio",
      description: "Showcase your work, skills, and achievements. Get featured and attract more clients.",
      color: "bg-primary/10 dark:bg-primary/80",
      iconColor: "text-gray-900"
    },
    {
      icon: UserCheck,
      title: "Client Reviews",
      description: "Build credibility with client ratings and reviews. Get verification badges for quality work.",
      color: "bg-pink-50 dark:bg-pink-950",
      iconColor: "text-gray-900"
    },
    {
      icon: BarChart,
      title: "Track Earnings",
      description: "Real-time analytics dashboard to monitor sales, views, and revenue. Transaction history included.",
      color: "bg-indigo-50 dark:bg-indigo-950",
      iconColor: "text-gray-900"
    },
    {
      icon: MessageCircle,
      title: "Direct Messaging",
      description: "Chat directly with clients and students. Real-time communication for better collaboration.",
      color: "bg-cyan-50 dark:bg-cyan-950",
      iconColor: "text-gray-900"
    },
    {
      icon: Wallet,
      title: "Flexible Payouts",
      description: "Get paid via bank transfer or secure payment methods. Weekly payouts with transparent commission rates.",
      color: "bg-amber-50 dark:bg-amber-950",
      iconColor: "text-gray-900"
    }
  ];

  const platformStats = [
    { value: "25K+", label: "Active Students", icon: Users },
    { value: "250+", label: "Expert Teachers", icon: GraduationCap },
    { value: "70+", label: "Countries", icon: Globe },
    { value: "1,800+", label: "Courses Available", icon: BookOpen },
    { value: "95%", label: "Success Rate", icon: TrendingUp },
    { value: "24/7", label: "Support", icon: MessageCircle }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Create Account",
      description: "Sign up as a student, teacher, or freelancer. Complete your profile with your skills and interests.",
      icon: UserCheck
    },
    {
      step: "2",
      title: "Build Your Presence",
      description: "Students: Browse courses. Freelancers: Create courses, upload content, or set tutoring hours.",
      icon: Upload
    },
    {
      step: "3",
      title: "Connect & Engage",
      description: "Students learn and grow. Freelancers connect with clients, deliver quality content and services.",
      icon: Users
    },
    {
      step: "4",
      title: "Earn & Achieve",
      description: "Students earn certificates. Freelancers earn revenue. Track progress and celebrate success together.",
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="home" />
      <main className="flex-1">
        {/* Animated Globe Hero Section */}
        <AnimatedGlobeHero onNavigate={onNavigate} />

        {/* Trending Courses Section */}
        <section className="py-6 md:py-8 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="section-padding">
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-[22px] font-bold mb-4 text-foreground">
                Trending <span className="relative inline-block px-4 py-1 text-white bg-primary rounded-lg transform -rotate-1 shadow-md">Courses</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Explore our most popular courses handpicked by our team of educators
              </p>
            </div>

            {isFeaturedLoading ? (
              <div className="hidden md:grid md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : featuredCourses && featuredCourses.length > 0 ? (
              <>
                {/* Mobile: Horizontal Scroll (fixed 300px cards) */}
                <div className="md:hidden mb-8">
                  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {featuredCourses.slice(0, 8).map((course) => (
                      <Card 
                        key={course.id} 
                        className="cursor-pointer transition-all duration-300 border border-gray-200 overflow-hidden group flex-shrink-0 snap-center bg-white"
                        style={{ width: '300px', minWidth: '300px' }}
                        onClick={() => {
                          onNavigate(`course-detail-${course.id}`);
                        }}
                        data-testid={`card-course-${course.id}`}
                      >
                        <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                          {course.thumbnailUrl ? (
                            <img 
                              src={course.thumbnailUrl} 
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900 min-h-[48px]">
                            {course.title}
                          </h3>
                          {course.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {course.difficulty}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Desktop: Horizontal Carousel with Nav Arrows (shows 3.5 cards) */}
                <div className="hidden md:block mb-8 relative">
                  <button
                    onClick={() => {
                      const container = document.getElementById('courses-carousel');
                      if (container) {
                        container.scrollBy({ left: -320, behavior: 'smooth' });
                      }
                    }}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                    data-testid="button-courses-prev"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => {
                      const container = document.getElementById('courses-carousel');
                      if (container) {
                        container.scrollBy({ left: 320, behavior: 'smooth' });
                      }
                    }}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                    data-testid="button-courses-next"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                  <div 
                    id="courses-carousel"
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {featuredCourses.slice(0, 8).map((course) => (
                      <Card 
                        key={course.id} 
                        className="cursor-pointer transition-all duration-300 border border-gray-200 overflow-hidden group flex-shrink-0 snap-start hover:scale-105 bg-white"
                        style={{ width: '300px', minWidth: '300px' }}
                        onClick={() => {
                          onNavigate(`course-detail-${course.id}`);
                        }}
                        data-testid={`card-course-${course.id}`}
                      >
                        <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                          {course.thumbnailUrl ? (
                            <img 
                              src={course.thumbnailUrl} 
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900 min-h-[48px]">
                            {course.title}
                          </h3>
                          {course.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {course.difficulty}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="text-center scroll-animate">
                  <Button 
                    size="lg" 
                    onClick={() => onNavigate('course-browse')}
                    className="group"
                    data-testid="button-explore-courses"
                  >
                    Explore More Courses
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No trending courses available at the moment</p>
              </div>
            )}
          </div>
        </section>

        {/* Modern Features Section */}
        <section className="py-6 sm:py-8 lg:py-10 bg-white from-background via-muted/20 to-background">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 scroll-animate">
              <h2 className="text-[22px] font-bold mb-6 text-foreground">
                Everything You Need in 
                <span style={{ color: "#0C332C" }}> One Platform</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Learn, teach, create, and earn - all in one comprehensive educational marketplace
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="bg-white transition-all duration-500 hover-lift border scroll-animate"
                  style={{ animationDelay: `${index * 200}ms` }}
                  data-testid={`card-feature-${index}`}
                >
                  <CardHeader className="text-center pb-3 pt-4">
                    <div className="w-12 h-12 bg-[#0C332C] rounded-2xl flex items-center justify-center mx-auto mb-3 scale-in">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-[14px] font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <CardDescription className="text-center text-muted-foreground text-sm leading-relaxed lg:hidden">
                      {feature.shortDescription}
                    </CardDescription>
                    <CardDescription className="text-center text-muted-foreground text-sm leading-relaxed hidden lg:block">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Products Section */}
        <section className="py-6 md:py-8 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="section-padding">
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-[22px] font-bold mb-4 text-foreground">
                Trending <span className="relative inline-block px-4 py-1 text-white bg-primary rounded-lg transform -rotate-1 shadow-md">Products</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Discover what's hot right now from our community of talented creators
              </p>
            </div>

            {isProductsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`space-y-3 ${i >= 4 ? 'hidden md:block' : ''}`}>
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {featuredProducts.slice(0, 8).map((product, index) => (
                    <Card 
                      key={product.id} 
                      className={`cursor-pointer transition-all duration-300 border-0 overflow-hidden group ${index >= 4 ? 'hidden md:block' : ''}`}
                      onClick={() => onNavigate(`product/${product.id}`)}
                      data-testid={`card-product-${product.id}`}
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <ShoppingBag className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-foreground transition-colors">
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                <div className="text-center scroll-animate">
                  <Button 
                    size="lg" 
                    onClick={() => onNavigate('products')}
                    className="group"
                    data-testid="button-explore-products"
                  >
                    Explore More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No trending products available at the moment</p>
              </div>
            )}
          </div>
        </section>

        {/* Subscription Plans Section - Slideshow */}
        <PricingSlideshow onNavigate={onNavigate} />

        {/* Comprehensive Freelancer Section */}
        <section className="py-6 md:py-8 bg-gradient-to-br from-primary/5 via-emerald-50 to-green-50">
          <div className="section-padding">
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-[22px] font-bold mb-4 text-foreground">
                Turn Your <span className="text-blue-600">Skills</span> Into Income
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Join our thriving marketplace of educators, creators, and professionals. Share knowledge, build your brand, and earn from multiple revenue streams.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {freelancerFeatures.map((feature, index) => (
                <Card 
                  key={index}
                  className={`${feature.color} border-0 transition-all duration-300 hover:scale-105 scroll-animate`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`card-freelancer-feature-${index}`}
                >
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3`}>
                      <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-6 md:py-8 bg-white">
          <div className="section-padding">
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-[22px] font-bold mb-4 text-foreground">
                How It <span className="text-foreground">Works</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Get started in just four simple steps. Whether you're here to learn or earn, we've made it easy.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <div 
                  key={index} 
                  className="relative scroll-animate"
                  style={{ animationDelay: `${index * 150}ms` }}
                  data-testid={`card-how-it-works-${index}`}
                >
                  <div className="text-center">
                    <div className="relative inline-flex mb-6">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-[#2F5A4E]" style={{ backgroundColor: '#0C332C' }}>
                        <item.icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#A0FAB2', color: '#1a1a1a' }}>
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Vision Section */}
        <section className="py-6 md:py-8 bg-gray-50">
          <div className="w-full px-6 md:px-10 lg:px-14">
            <div className="w-full">
              <div className="text-center mb-12">
                <h2 className="text-[22px] font-bold mb-4 text-foreground">
                  Our <span className="text-foreground">Platform</span> Vision
                </h2>
                <p className="text-base md:text-lg text-[#575757]">
                  We are committed to upholding the highest standards of educational excellence while ensuring each student feels valued and heard.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: '#0C332C' }} data-testid="card-vision-001">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-white/80">001</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">For Students</h3>
                  <p className="text-sm text-white/90">
                    Empowering learners from grades 1-12 and university level with quality education, personalized support, and flexible learning options
                  </p>
                </div>

                <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: '#0C332C' }} data-testid="card-vision-002">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-white/80">002</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">For Teachers</h3>
                  <p className="text-sm text-white/90">
                    Supporting professional educators with comprehensive teaching tools, curriculum resources, and opportunities to reach students globally
                  </p>
                </div>

                <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: '#0C332C' }} data-testid="card-vision-003">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-white/80">003</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">For Freelancers</h3>
                  <p className="text-sm text-white/90">
                    Enabling independent tutors and educators to build their business, create courses, and earn sustainable income on our platform
                  </p>
                </div>

                <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: '#0C332C' }} data-testid="card-vision-004">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-white/80">004</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">For Customers</h3>
                  <p className="text-sm text-white/90">
                    Providing access to premium educational content, study materials, and digital resources from verified creators worldwide
                  </p>
                </div>

                <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: '#0C332C' }} data-testid="card-vision-005">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-white/80">005</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">For Parents</h3>
                  <p className="text-sm text-white/90">
                    Helping families support their children's education with trusted tutors, progress tracking, and safe learning environments
                  </p>
                </div>

                <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: '#0C332C' }} data-testid="card-vision-006">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-white/80">006</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">For Institutions</h3>
                  <p className="text-sm text-white/90">
                    Partnering with schools and educational organizations to deliver scalable, quality learning solutions for their communities
                  </p>
                </div>

                <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: '#0C332C' }} data-testid="card-vision-007">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-white/80">007</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">For Creators</h3>
                  <p className="text-sm text-white/90">
                    Supporting content creators in developing, publishing, and monetizing educational materials that benefit learners everywhere
                  </p>
                </div>

                <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: '#0C332C' }} data-testid="card-vision-008">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-white/80">008</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Global Community</h3>
                  <p className="text-sm text-white/90">
                    Connecting learners, educators, and families across borders to create a worldwide network of educational excellence and opportunity
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Admin-Manageable Hero Section */}
        <HomeHeroSection className="min-h-[600px]" />
      </main>
      <FAQ />
      <Testimonials />
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

const PricingSlideshow = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const pricingSlides = [
    {
      id: 'students',
      badge: 'Student Plans',
      title: 'Student Subscriptions',
      description: 'Choose from flexible plans designed for every grade level. Get access to thousands of courses, live tutoring, and personalized learning paths.',
      backgroundImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=800&fit=crop',
      gradient: 'from-purple-900/70 via-blue-900/60 to-indigo-900/70',
      pricing: [
        { label: 'Grades 1-7', price: '$5.99', period: '/mo', subtitle: 'Elementary' },
        { label: 'Grades 8-12', price: '$9.99', period: '/mo', subtitle: 'High School' },
        { label: 'College & University', price: '$99', period: '/mo', subtitle: 'Advanced' }
      ],
      features: [
        '500-2,000+ courses by grade level',
        'Video lessons & interactive quizzes',
        'SAT/ACT & AP test prep (HS+)',
        'Live tutoring & mentorship',
        'Career services & certifications'
      ],
      ctaText: 'View Student Plans',
      ctaPage: 'education-pricing'
    },
    {
      id: 'freelancers',
      badge: 'Freelancer Plans',
      title: 'Freelancer Subscriptions',
      description: 'Grow your freelance business with our comprehensive plans. Get access to the marketplace, client management tools, and earn from your expertise.',
      backgroundImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop',
      gradient: 'from-emerald-900/70 via-teal-900/60 to-cyan-900/70',
      pricing: [
        { label: 'Starter', price: '$14.99', period: '/mo', subtitle: 'Get Started' },
        { label: 'Pro', price: '$119', period: '/mo', subtitle: 'Most Popular' },
        { label: 'Elite', price: 'Custom', period: '', subtitle: 'Lifetime Access' }
      ],
      features: [
        'Verified Blue Badge on profile',
        'Top search results placement',
        'Access to freelance projects',
        'Profile analytics & insights',
        'Priority chat support'
      ],
      ctaText: 'View Freelancer Plans',
      ctaPage: 'creator-pricing'
    },
    {
      id: 'courses',
      badge: 'Course Marketplace',
      title: 'Individual Courses',
      description: 'Browse thousands of courses across all subjects. Pay once and get lifetime access to course materials, videos, and resources.',
      backgroundImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&h=800&fit=crop',
      gradient: 'from-orange-900/70 via-red-900/60 to-pink-900/70',
      pricing: [
        { label: 'Free Courses', price: '$0', period: '', subtitle: 'Try Before You Buy' },
        { label: 'Premium Courses', price: 'From $49.99', period: '', subtitle: 'One-time Payment' },
        { label: 'Subscribe', price: '$99', period: '/mo', subtitle: '5 Premium Courses' }
      ],
      features: [
        'Pay once, access forever',
        'Downloadable resources',
        'Certificate of completion',
        'Expert instructors',
        '30-day money-back guarantee'
      ],
      ctaText: 'Browse Courses',
      ctaPage: 'course-browse'
    },
    {
      id: 'customers',
      badge: 'Shop Memberships',
      title: 'Customer Memberships',
      description: 'Access our digital marketplace with download limits, ads, and exclusive content. Perfect for creators and businesses.',
      backgroundImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=800&fit=crop',
      gradient: 'from-blue-900/70 via-indigo-900/60 to-violet-900/70',
      pricing: [
        { label: 'Creator', price: '$14.99', period: '/mo', subtitle: '25 Paid Downloads/mo' },
        { label: 'Pro', price: '$24.99', period: '/mo', subtitle: '50 Paid Downloads/mo' },
        { label: 'Business', price: '$89.99', period: '/mo', subtitle: 'Unlimited Downloads' }
      ],
      features: [
        'Unlimited free downloads',
        'Daily paid download limits',
        'Annual ad credits available',
        'Priority customer support',
        'Advanced features per tier'
      ],
      ctaText: 'View Shop Plans',
      ctaPage: 'customer-pricing'
    }
  ];

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % pricingSlides.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isPaused, pricingSlides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const slide = pricingSlides[currentSlide];

  return (
    <section className="py-6 md:py-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full px-6 md:px-10">
        <div className="w-full">
          <div className="w-full">
            <div 
              className="relative rounded-3xl overflow-hidden min-h-[700px] md:min-h-[600px] lg:min-h-[700px] scroll-animate group cursor-pointer"
              onClick={() => onNavigate(slide.ctaPage)}
              data-testid="card-pricing-slideshow"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {pricingSlides.map((slideData, index) => (
                <div
                  key={slideData.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url("${slideData.backgroundImage}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${slideData.gradient}`} />
                  </div>
                  
                  <div className="absolute inset-0 backdrop-blur-[2px] bg-white/5" />
                  
                  <div className="relative h-full flex flex-col justify-between p-5 md:p-10 pb-16 md:pb-24">
                    <div className="space-y-3 md:space-y-4">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md text-[10px] md:text-xs">
                        {slideData.badge}
                      </Badge>
                      <h2 className="text-[22px] font-bold text-white leading-tight">
                        {slideData.title}
                      </h2>
                      <p className="text-xs md:text-lg text-white/90 leading-relaxed">
                        {slideData.description}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {slideData.pricing.map((price, idx) => (
                          <div 
                            key={idx}
                            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-2 md:p-2.5 hover:bg-white/15 transition-all"
                          >
                            <div className="text-[9px] md:text-[10px] text-white/80 mb-0.5">{price.label}</div>
                            <div className="text-base md:text-lg lg:text-xl font-bold text-white mb-0.5">
                              {price.price}
                              <span className="text-[9px] md:text-[10px] font-normal">{price.period}</span>
                            </div>
                            <div className="text-[8px] md:text-[9px] text-white/70">{price.subtitle}</div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:gap-5">
                        {slideData.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3 md:gap-4 text-white">
                            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                              <CheckmarkIcon size="sm" className="text-white" />
                            </div>
                            <span className="text-base md:text-lg font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 md:mt-8">
                      <Button 
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(slideData.ctaPage);
                        }}
                        className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 px-5 py-3 md:px-6 md:py-5 text-sm md:text-base font-semibold rounded-full group-hover:scale-105 transition-all duration-300 w-fit"
                        data-testid={`button-view-${slideData.id}-pricing`}
                      >
                        {slideData.ctaText}
                        <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 hidden md:flex gap-2 z-10">
                {pricingSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(index);
                    }}
                    className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white' 
                        : 'bg-white/30 hover:bg-white/50'
                    } before:absolute before:inset-[-8px] before:content-['']`}
                    data-testid={`button-slide-${index}`}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === currentSlide ? 'true' : 'false'}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
