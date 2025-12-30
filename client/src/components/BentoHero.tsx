import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, BookOpen, Briefcase, Palette, GraduationCap, Award, TrendingUp } from 'lucide-react';
import studentsHeroImage from '@/assets/generated_images/students_studying_in_library.png';
import teachersHeroImage from '@/assets/generated_images/teacher_presenting_in_classroom.png';
import freelancersHeroImage from '@/assets/generated_images/freelancer_working_at_home.png';
import creatorsHeroImage from '@/assets/generated_images/creator_in_design_studio.png';
import headshot1 from '@/assets/generated_images/young_woman_professional_headshot.png';
import headshot2 from '@/assets/generated_images/man_professional_headshot_portrait.png';
import headshot3 from '@/assets/generated_images/asian_woman_headshot_portrait.png';

// Fallback images for production if generated images are missing
const DEFAULT_STUDENTS = "/assets/generated_images/students_studying_in_library.png";
const DEFAULT_TEACHERS = "/assets/generated_images/teacher_presenting_in_classroom.png";
const DEFAULT_FREELANCERS = "/assets/generated_images/freelancer_working_at_home.png";
const DEFAULT_CREATORS = "/assets/generated_images/creator_in_design_studio.png";

interface BentoHeroProps {
  onNavigate: (page: string) => void;
}

const heroImages: Record<string, string> = {
  Students: studentsHeroImage || DEFAULT_STUDENTS,
  Teachers: teachersHeroImage || DEFAULT_TEACHERS,
  Freelancers: freelancersHeroImage || DEFAULT_FREELANCERS,
  Creators: creatorsHeroImage || DEFAULT_CREATORS
};

const heroContent = [
  {
    type: 'Students',
    headline: 'Master any subject',
    headlineLine2: 'at your own pace',
    description: 'EduFiliova helps students of all ages access personalized courses, expert tutors, and earn certificates that advance their education.',
    cta: 'Start Learning Free',
    ctaAction: 'auth',
    secondaryCta: 'Browse Courses',
    secondaryAction: 'course-browse',
    statCard: {
      title: 'Active learning',
      subtitle: 'community',
      description: 'Join thousands of students achieving their academic goals together.',
      stat: '25K+',
      statLabel: 'Students'
    },
    dashboardCard: {
      title: 'Course Progress',
      value: '78%',
      label: 'Completed Today',
      progress: 78
    },
    photoAlt: 'Enroll Today - Start Your Learning Journey'
  },
  {
    type: 'Teachers',
    headline: 'Share knowledge',
    headlineLine2: 'inspire generations',
    description: 'EduFiliova empowers teachers to create courses, reach global audiences, and build sustainable income from their expertise.',
    cta: 'Start Teaching',
    ctaAction: 'teacher-application',
    secondaryCta: 'View Guide',
    secondaryAction: 'help',
    statCard: {
      title: 'Teaching',
      subtitle: 'community',
      description: 'Connect with educators worldwide and share best practices.',
      stat: '500+',
      statLabel: 'Teachers'
    },
    dashboardCard: {
      title: 'Student Enrollments',
      value: '1,240',
      label: 'This Month',
      progress: 85
    },
    photoAlt: 'Start Your Teaching Journey Today'
  },
  {
    type: 'Freelancers',
    headline: 'Build your brand',
    headlineLine2: 'grow your income',
    description: 'EduFiliova connects freelancers with clients seeking quality services, from tutoring to course creation and consulting.',
    cta: 'Join as Freelancer',
    ctaAction: 'freelancer-signup-basic',
    secondaryCta: 'Explore Services',
    secondaryAction: '/marketplace/services',
    isRoute: true,
    statCard: {
      title: 'Freelancer',
      subtitle: 'marketplace',
      description: 'Offer your skills and services to a global audience of clients.',
      stat: '2.5K+',
      statLabel: 'Projects'
    },
    dashboardCard: {
      title: 'Monthly Earnings',
      value: '$4,850',
      label: 'Average Income',
      progress: 72
    },
    photoAlt: 'Hire a Freelancer - Get Projects Done'
  },
  {
    type: 'Creators',
    headline: 'Create once',
    headlineLine2: 'earn forever',
    description: 'EduFiliova enables creators to sell digital products, templates, and educational resources to a worldwide audience.',
    cta: 'Start Selling',
    ctaAction: 'auth',
    secondaryCta: 'Browse Shop',
    secondaryAction: 'product-shop',
    statCard: {
      title: 'Creator',
      subtitle: 'economy',
      description: 'Monetize your creativity with digital products and resources.',
      stat: '10K+',
      statLabel: 'Products'
    },
    dashboardCard: {
      title: 'Total Sales',
      value: '8,420',
      label: 'Products Sold',
      progress: 91
    },
    photoAlt: 'Sell Your Creations - Earn Passive Income'
  }
];

const typeIcons: Record<string, React.ReactNode> = {
  Students: <GraduationCap className="h-4 w-4" />,
  Teachers: <BookOpen className="h-4 w-4" />,
  Freelancers: <Briefcase className="h-4 w-4" />,
  Creators: <Palette className="h-4 w-4" />
};

export default function BentoHero({ onNavigate }: BentoHeroProps) {
  const [, navigate] = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSecondaryAction = (content: typeof heroContent[0]) => {
    if (content.isRoute) {
      navigate(content.secondaryAction);
    } else {
      onNavigate(content.secondaryAction);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % heroContent.length);
        setIsTransitioning(false);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (index: number) => {
    if (index === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const currentContent = heroContent[activeIndex];

  return (
    <section className="relative bg-[#f5f5f0] min-h-screen overflow-hidden" data-testid="hero-bento">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="flex flex-wrap gap-2 mb-8">
          {heroContent.map((content, index) => (
            <button
              key={content.type}
              onClick={() => handleTabClick(index)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeIndex === index
                  ? 'bg-[#0C332C] text-white shadow-lg'
                  : 'bg-white text-[#0C332C] hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {typeIcons[content.type]}
              {content.type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-700">Learn, Grow, Earn</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-10">
          <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a1a] leading-[1.1] mb-2">
              {currentContent.headline}
            </h1>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a1a]/60 leading-[1.1]">
              {currentContent.headlineLine2}
            </h1>
          </div>

          <div className={`flex flex-col justify-center transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <p className="text-lg text-gray-600 mb-6 max-w-lg">
              {currentContent.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => onNavigate(currentContent.ctaAction)}
                className="bg-[#0C332C] hover:bg-[#0C332C]/90 text-white px-6 py-3 h-auto text-base font-medium rounded-lg"
              >
                {currentContent.cta}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleSecondaryAction(currentContent)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-3 h-auto text-base font-medium rounded-lg"
              >
                {currentContent.secondaryCta}
              </Button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="bg-[#4a7c59] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-semibold mb-1">{currentContent.statCard.title}</h3>
              <p className="text-white/80 text-lg mb-3">{currentContent.statCard.subtitle}</p>
              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                {currentContent.statCard.description}
              </p>
              <div className="pt-4 border-t border-white/20">
                <p className="text-xs text-white/60 mb-2">Join the community with</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img src={headshot1} alt="Community member" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                    <img src={headshot2} alt="Community member" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                    <img src={headshot3} alt="Community member" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                  </div>
                  <div>
                    <span className="text-lg font-bold">{currentContent.statCard.stat}</span>
                    <span className="text-sm text-white/80 ml-1">{currentContent.statCard.statLabel}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
          </div>

          <div className="bg-[#f8f6f0] rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#0C332C]/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#0C332C]" />
              </div>
              <span className="text-sm font-medium text-gray-600">{currentContent.dashboardCard.title}</span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-[#1a1a1a]">{currentContent.dashboardCard.value}</span>
              <span className="text-sm text-gray-500 ml-2">{currentContent.dashboardCard.label}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{currentContent.dashboardCard.progress}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0C332C] rounded-full transition-all duration-500"
                  style={{ width: `${currentContent.dashboardCard.progress}%` }}
                />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1 items-end">
                {[28, 35, 22, 40, 32, 45, 38].map((height, i) => (
                  <div 
                    key={i} 
                    className="w-4 bg-gray-200 rounded-sm"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-2xl overflow-hidden relative group min-h-[280px]">
            <img 
              src={heroImages[currentContent.type]} 
              alt={currentContent.photoAlt}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (currentContent.type === 'Students') target.src = DEFAULT_STUDENTS;
                else if (currentContent.type === 'Teachers') target.src = DEFAULT_TEACHERS;
                else if (currentContent.type === 'Freelancers') target.src = DEFAULT_FREELANCERS;
                else if (currentContent.type === 'Creators') target.src = DEFAULT_CREATORS;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <p className="text-sm font-medium text-white mb-3">{currentContent.photoAlt}</p>
              <button 
                onClick={() => onNavigate(currentContent.ctaAction)}
                className="w-full bg-white/95 backdrop-blur-sm text-[#0C332C] font-medium py-3 px-4 rounded-lg hover:bg-white transition-colors text-sm flex items-center justify-center gap-2"
              >
                Get Started Today
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-500">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <img src={headshot1} alt="User" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
              <img src={headshot2} alt="User" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
              <img src={headshot3} alt="User" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
            </div>
            <span className="text-sm">Trusted Platform</span>
          </div>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#0C332C]" />
            <span className="text-sm">Verified Certificates</span>
          </div>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="text-sm">4.9 Average Rating</span>
          </div>
        </div>
      </div>
    </section>
  );
}
