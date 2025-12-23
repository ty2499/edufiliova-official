import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { UserPlus, LogIn, ClipboardCheck, Video, Wallet, GraduationCap } from "lucide-react";

interface TeacherMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const TeacherMegaMenu = ({ isOpen, onNavigate, onClose }: TeacherMegaMenuProps) => {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const getStarted = [
    {
      icon: <UserPlus className="h-5 w-5 " />,
      title: "Become a Teacher",
      description: "Join our teaching community",
      page: "teacher-application",
    },
    {
      icon: <LogIn className="h-5 w-5 " />,
      title: "Teacher Sign Up",
      description: "Create your teacher account",
      page: "teacher-signup-basic",
    },
  ];

  const management = [
    {
      icon: <ClipboardCheck className="h-5 w-5 " />,
      title: "Application Status",
      description: "Track your teacher application",
      page: "teacher-application-status",
    },
    {
      icon: <Video className="h-5 w-5 " />,
      title: "Meetings",
      description: "Schedule and manage classes",
      page: "teacher-meetings",
    },
    {
      icon: <Wallet className="h-5 w-5 " />,
      title: "Earnings Dashboard",
      description: "View your income and payouts",
      page: "creator-earnings-dashboard",
    },
  ];

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <MegaMenuSection title="Get Started" icon={<GraduationCap className="h-4 w-4 text-[#a0fab2]" />}>
          {getStarted.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-teacher-start-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Management" icon={<ClipboardCheck className="h-4 w-4 text-[#a0fab2]" />}>
          {management.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-teacher-manage-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
