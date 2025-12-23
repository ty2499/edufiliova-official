import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { Gauge, Video, Users, Settings } from "lucide-react";

interface StudentsMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const StudentsMegaMenu = ({ isOpen, onNavigate, onClose }: StudentsMegaMenuProps) => {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const tools = [
    { icon: <Gauge className="h-5 w-5" />, title: "Student Dashboard", description: "Track your progress and grades", page: "student-dashboard", bg: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10", bgIcon: "bg-[#a0fab2]", colorIcon: "#a0fab2" },
    { icon: <Video className="h-5 w-5" />, title: "Student Meetings", description: "Join virtual classrooms", page: "meetings", bg: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10", bgIcon: "bg-[#a0fab2]", colorIcon: "#a0fab2" },
  ];

  const community = [
    { icon: <Settings className="h-5 w-5" />, title: "Study Settings", description: "Customize your learning experience", page: "settings", bg: "bg-primary/10" },
  ];

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <MegaMenuSection title="Tools" icon={<Gauge className="h-4 w-4 text-[#a0fab2]" />}>
          {tools.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              iconBg={item.bgIcon}
              testId={`megamenu-students-tools-${index}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Community" icon={<Users className="h-4 w-4 text-[#a0fab2]" />}>
          {community.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              iconBg={item.bgIcon}
              testId={`megamenu-students-community-${index}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
