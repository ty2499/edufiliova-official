import { MegaMenu, MegaMenuCategory, MegaMenuGrid } from "./MegaMenu";
import { Search, Library, Award, FileCheck, GraduationCap, UserPlus, BookOpen, Video, ClipboardCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import promoImage from "@assets/generated_images/students_studying_together.png";

interface LearnMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
  isAuthenticated?: boolean;
}

export const LearnMegaMenu = ({ isOpen, onNavigate, onClose, isAuthenticated = false }: LearnMegaMenuProps) => {
  const { user } = useAuth();
  
  const { data: claimableData } = useQuery({
    queryKey: ['/api/certificates/claimable-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0 };
      try {
        const response = await fetch(`/api/certificates/claimable-count`);
        return await response.json();
      } catch {
        return { count: 0 };
      }
    },
    enabled: !!user?.id && isAuthenticated,
  });

  const claimableCertificatesCount = claimableData?.count || 0;
  
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const exploreItems = [
    {
      icon: <Search className="h-5 w-5" />,
      title: "Browse Courses",
      description: "Explore our complete catalog of courses across all subjects",
      page: "course-browse",
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Study Materials",
      description: "Access notes, papers, and learning resources",
      page: "study-settings",
    },
    {
      icon: <Video className="h-5 w-5" />,
      title: "Live Classes",
      description: "Join live sessions with expert teachers",
      page: "student-meetings",
      requiresAuth: true,
    },
  ];

  const studentItems = [
    {
      icon: <Library className="h-5 w-5" />,
      title: "My Subjects",
      description: "Access your enrolled courses and continue learning",
      page: "student-dashboard",
      requiresAuth: true,
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: "Assignments",
      description: "View and submit your assignments",
      page: "student-dashboard",
      requiresAuth: true,
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Student Network",
      description: "Connect with fellow students and study groups",
      page: "student-networking",
      requiresAuth: true,
    },
  ];

  const certificateItems = [
    {
      icon: <Award className="h-5 w-5" />,
      title: "My Certificates",
      description: "View all your earned certificates and achievements",
      page: "my-certificates",
      requiresAuth: true,
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      title: "Claim Certificate",
      description: "Claim certificates for completed courses",
      page: "claim-certificate",
      requiresAuth: true,
      badge: claimableCertificatesCount > 0 ? `${claimableCertificatesCount} available` : undefined,
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Verify Certificate",
      description: "Verify the authenticity of any certificate",
      page: "verify-certificate",
    },
  ];

  const getStartedItems = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "Create Account",
      description: "Sign up and start your learning journey today",
      page: "auth",
      showWhenNotAuth: true,
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Education Plans",
      description: "View student subscription options and pricing",
      page: "education-pricing",
    },
  ];

  const filteredExplore = exploreItems.filter(item => !item.requiresAuth || isAuthenticated);
  const filteredStudent = studentItems.filter(item => !item.requiresAuth || isAuthenticated);
  const filteredCertificates = certificateItems.filter(item => {
    if (item.page === 'claim-certificate' && claimableCertificatesCount === 0) return false;
    return !item.requiresAuth || isAuthenticated;
  });
  const filteredGetStarted = getStartedItems.filter(item => !item.showWhenNotAuth || !isAuthenticated);

  return (
    <MegaMenu 
      isOpen={isOpen}
      title="Learn & Grow"
      subtitle="Discover courses, earn certificates, and advance your skills with our comprehensive learning platform."
      promoImage={promoImage}
      promoTitle="Enroll Today"
      promoSubtitle="Join 25,000+ students achieving their dreams"
      ctaText="Start Learning Free"
      ctaOnClick={() => handleNavigate("course-browse")}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-[#0C332C]" /> Explore Learning
          </h3>
          <MegaMenuGrid columns={3}>
            {filteredExplore.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Explore"
                testId={`megamenu-learn-explore-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        {filteredStudent.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Library className="h-4 w-4 text-[#0C332C]" /> My Learning
            </h3>
            <MegaMenuGrid columns={3}>
              {filteredStudent.map((item, index) => (
                <MegaMenuCategory
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleNavigate(item.page)}
                  linkText="Open"
                  testId={`megamenu-learn-student-${index}`}
                />
              ))}
            </MegaMenuGrid>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-[#0C332C]" /> Certificates
          </h3>
          <MegaMenuGrid columns={3}>
            {filteredCertificates.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="View"
                testId={`megamenu-learn-cert-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        {filteredGetStarted.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#0C332C]" /> Get Started
            </h3>
            <MegaMenuGrid columns={3}>
              {filteredGetStarted.map((item, index) => (
                <MegaMenuCategory
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleNavigate(item.page)}
                  linkText="Start"
                  testId={`megamenu-learn-start-${index}`}
                />
              ))}
            </MegaMenuGrid>
          </div>
        )}
      </div>
    </MegaMenu>
  );
};
