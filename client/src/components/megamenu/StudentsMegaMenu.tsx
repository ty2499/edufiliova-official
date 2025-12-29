import { MegaMenu, MegaMenuCategory, MegaMenuGrid } from "./MegaMenu";
import { 
  Gauge, Video, Users, Settings, BookOpen, ClipboardCheck, 
  Award, Calendar, MessageSquare, GraduationCap
} from "lucide-react";
import promoImage from "@assets/generated_images/students_studying_together.png";

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

  const dashboardItems = [
    {
      icon: <Gauge className="h-5 w-5" />,
      title: "Student Dashboard",
      description: "Track your progress, grades, and learning journey",
      page: "student-dashboard",
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "My Subjects",
      description: "Access your enrolled courses and lessons",
      page: "student-dashboard",
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: "Assignments",
      description: "View and submit your assignments",
      page: "student-dashboard",
    },
  ];

  const learningItems = [
    {
      icon: <Video className="h-5 w-5" />,
      title: "Live Classes",
      description: "Join virtual classrooms and live sessions",
      page: "student-meetings",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Schedule",
      description: "View your upcoming classes and events",
      page: "student-meetings",
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Certificates",
      description: "View and claim your earned certificates",
      page: "my-certificates",
    },
  ];

  const communityItems = [
    {
      icon: <Users className="h-5 w-5" />,
      title: "Student Network",
      description: "Connect with fellow students and study groups",
      page: "student-networking",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Community",
      description: "Join discussions and share knowledge",
      page: "community",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Study Settings",
      description: "Customize your learning experience",
      page: "study-settings",
    },
  ];

  return (
    <MegaMenu 
      isOpen={isOpen}
      title="Student Portal"
      subtitle="Access your courses, track progress, and connect with fellow learners in our student community."
      promoImage={promoImage}
      promoTitle="Learn Together"
      promoSubtitle="Join a community of dedicated learners"
      ctaText="Go to Dashboard"
      ctaOnClick={() => handleNavigate("student-dashboard")}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#0C332C]" /> Dashboard
          </h3>
          <MegaMenuGrid columns={3}>
            {dashboardItems.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Open"
                testId={`megamenu-students-dashboard-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#0C332C]" /> Learning
          </h3>
          <MegaMenuGrid columns={3}>
            {learningItems.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="View"
                testId={`megamenu-students-learning-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0C332C]" /> Community
          </h3>
          <MegaMenuGrid columns={3}>
            {communityItems.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Explore"
                testId={`megamenu-students-community-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>
      </div>
    </MegaMenu>
  );
};
