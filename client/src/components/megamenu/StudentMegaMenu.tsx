import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { Gauge, Video, Users, Settings, UserRound } from "lucide-react";

interface StudentMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const StudentMegaMenu = ({ isOpen, onNavigate, onClose }: StudentMegaMenuProps) => {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const dashboard = [
    {
      icon: <Gauge className="h-5 w-5 " />,
      title: "Student Dashboard",
      description: "View your progress and courses",
      page: "student-dashboard",
    },
  ];

  const tools = [
    {
      icon: <Video className="h-5 w-5 " />,
      title: "Meetings",
      description: "Join or schedule study sessions",
      page: "student-meetings",
    },
    {
      icon: <Users className="h-5 w-5 " />,
      title: "Networking",
      description: "Connect with other students",
      page: "networking",
    },
    {
      icon: <Settings className="h-5 w-5 " />,
      title: "Study Settings",
      description: "Customize your learning experience",
      page: "settings",
    },
  ];

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <MegaMenuSection title="Dashboard" icon={<Gauge className="h-4 w-4" />}>
          {dashboard.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-student-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Tools" icon={<UserRound className="h-4 w-4" />}>
          {tools.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-student-tool-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
