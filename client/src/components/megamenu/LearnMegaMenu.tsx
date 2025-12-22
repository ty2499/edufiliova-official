import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { Search, Library, Award, FileCheck, GraduationCap, UserPlus, Sparkles, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface LearnMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
  isAuthenticated?: boolean;
}

export const LearnMegaMenu = ({ isOpen, onNavigate, onClose, isAuthenticated = false }: LearnMegaMenuProps) => {
  const { user } = useAuth();
  
  // Fetch claimable certificates count
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

  const exploreLearning = [
    {
      icon: <Search className="h-5 w-5" />,
      title: "Browse Courses",
      description: "Explore our complete course catalog",
      page: "course-browse",
      iconBg: "bg-blue-50",
    },
  ];

  const getStarted = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "Create an Account",
      description: "Sign up and start learning today",
      page: "student-signup",
      iconBg: "bg-green-50",
      requiresAuth: false,
      showWhenNotAuth: true,
    },
  ];

  const myLearning = [
    {
      icon: <Library className="h-5 w-5" />,
      title: "My Subjects",
      description: "Access your enrolled courses",
      page: "student-dashboard",
      iconBg: "bg-purple-50",
      requiresAuth: true,
    },
  ];

  const certificates = [
    {
      icon: <Award className="h-5 w-5" />,
      title: "My Certificates",
      description: "View earned certificates",
      page: "my-certificates",
      iconBg: "bg-yellow-50",
      requiresAuth: true,
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      title: "Claim Certificate",
      description: "Claim your earned certificates",
      page: "claim-certificate",
      iconBg: "bg-teal-50",
      requiresAuth: true,
    },
  ];

  const filteredGetStarted = getStarted.filter(item => !isAuthenticated && item.showWhenNotAuth);
  const filteredMyLearning = myLearning.filter(item => !item.requiresAuth || isAuthenticated);
  const filteredCertificates = certificates.filter(item => {
    // Hide "Claim Certificate" if user has no claimable certificates
    if (item.page === 'claim-certificate' && claimableCertificatesCount === 0) {
      return false;
    }
    return !item.requiresAuth || isAuthenticated;
  });

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <MegaMenuSection title="Explore Learning" icon={<Search className="h-4 w-4 text-[#ff5833]" />}>
          {exploreLearning.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              iconBg={item.iconBg}
              testId={`megamenu-learn-explore-${index}`}
            />
          ))}
        </MegaMenuSection>

        {filteredGetStarted.length > 0 && (
          <MegaMenuSection title="Get Started" icon={<UserPlus className="h-4 w-4 text-[#ff5833]" />}>
            {filteredGetStarted.map((item, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                iconBg={item.iconBg}
                testId={`megamenu-learn-start-${index}`}
              />
            ))}
          </MegaMenuSection>
        )}

        {filteredMyLearning.length > 0 && (
          <MegaMenuSection title="My Learning" icon={<Library className="h-4 w-4 text-[#ff5833]" />}>
            {filteredMyLearning.map((item, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                iconBg={item.iconBg}
                testId={`megamenu-learn-my-${index}`}
              />
            ))}
          </MegaMenuSection>
        )}

        <MegaMenuSection title="Certificates" icon={<Award className="h-4 w-4 text-[#ff5833]" />}>
          {filteredCertificates.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              iconBg={item.iconBg}
              testId={`megamenu-learn-cert-${index}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
