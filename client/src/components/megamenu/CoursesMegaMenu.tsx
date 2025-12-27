import { MegaMenu, MegaMenuItem, MegaMenuSection, MegaMenuHighlight } from "./MegaMenu";
import { Search, Library, Award, ShieldCheck, FileCheck, FilePlus, Layers, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface CoursesMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const CoursesMegaMenu = ({ isOpen, onNavigate, onClose }: CoursesMegaMenuProps) => {
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
    enabled: !!user?.id,
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
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
    {
      icon: <Library className="h-5 w-5" />,
      title: "My Subjects",
      description: "Access your enrolled courses",
      page: "student-dashboard",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
  ];

  const certificates = [
    {
      icon: <Award className="h-5 w-5" />,
      title: "My Certificates",
      description: "View your earned certificates",
      page: "my-certificates",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      title: "Claim Certificate",
      description: "Get your course completion certificate",
      page: "claim-certificate",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
  ];

  const createLearning = [
    {
      icon: <FilePlus className="h-5 w-5" />,
      title: "Create Course",
      description: "Build and publish your own course",
      page: "course-creator",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: "Subject Creator",
      description: "Design custom subjects",
      page: "subject-creator",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
  ];

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <MegaMenuSection title="Explore Learning" icon={<BookOpen className="h-4 w-4 text-[#a0fab2]" />}>
          {exploreLearning.filter((item: any) => {
            // "My Subjects" only visible to students
            if (item.title === 'My Subjects' && user?.role !== 'student') {
              return false;
            }
            return true;
          }).map((item: any, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              bgColor={item.bgColor}
              iconBg={item.iconBg}
              iconColor={item.iconColor}
              testId={`megamenu-explore-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Certificates" icon={<Award className="h-4 w-4 text-[#a0fab2]" />}>
          {certificates.filter((item: any) => {
            if (item.page === 'claim-certificate' && claimableCertificatesCount === 0) {
              return false;
            }
            return true;
          }).map((item: any, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              bgColor={item.bgColor}
              iconBg={item.iconBg}
              iconColor={item.iconColor}
              testId={`megamenu-certificate-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Create Learning" icon={<FilePlus className="h-4 w-4 text-[#a0fab2]" />}>
          {createLearning.map((item: any, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              bgColor={item.bgColor}
              iconBg={item.iconBg}
              iconColor={item.iconColor}
              testId={`megamenu-create-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
