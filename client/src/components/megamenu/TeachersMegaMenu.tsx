import { useAuth } from "@/hooks/useAuth";
import { MegaMenu, MegaMenuCategory, MegaMenuGrid } from "./MegaMenu";
import { 
  UserPlus, ClipboardCheck, Video, Wallet, FilePlus, Layers, 
  GraduationCap, Users, Calendar, BarChart3, BookOpen, Settings, CreditCard
} from "lucide-react";
import promoImage from "@assets/generated_images/teacher_presenting_in_classroom.png";

interface TeachersMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
  isAuthenticated?: boolean;
  isApproved?: boolean;
}

export const TeachersMegaMenu = ({ isOpen, onNavigate, onClose, isAuthenticated = false, isApproved = false }: TeachersMegaMenuProps) => {
  const { user, profile } = useAuth();
  const isTeacher = user && (profile?.role === 'teacher' || profile?.role === 'educator');
  
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const getStartedItems = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "Become a Teacher",
      description: "Apply to join our teaching community and share your expertise",
      page: "teacher-application",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Teacher Pricing",
      description: "View pricing plans and commission rates for teachers",
      page: "teacher-pricing",
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: "Application Status",
      description: "Check the status of your teacher application",
      page: "teacher-status",
      requiresAuth: true,
    },
  ];

  const teachingTools = [
    {
      icon: <FilePlus className="h-5 w-5" />,
      title: "Create Course",
      description: "Design and publish comprehensive courses for students",
      page: "course-creator",
      requiresApproval: true,
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: "Subject Creator",
      description: "Build course subjects with lessons and materials",
      page: "subject-creator",
      requiresApproval: true,
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Assignments",
      description: "Create and manage student assignments",
      page: "teacher-dashboard",
      requiresApproval: true,
    },
  ];

  const managementItems = [
    {
      icon: <Users className="h-5 w-5" />,
      title: "My Students",
      description: "View and manage your enrolled students",
      page: "teacher-dashboard",
      requiresApproval: true,
    },
    {
      icon: <Video className="h-5 w-5" />,
      title: "Live Sessions",
      description: "Schedule and host live teaching sessions",
      page: "teacher-meetings",
      requiresApproval: true,
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Schedule",
      description: "Manage your teaching calendar and availability",
      page: "meeting-scheduler",
      requiresApproval: true,
    },
  ];

  const analyticsItems = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Dashboard",
      description: "View your teaching analytics and performance",
      page: "teacher-dashboard",
      requiresApproval: true,
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "Earnings",
      description: "Track your revenue and payouts",
      page: "creator-earnings",
      requiresApproval: true,
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Settings",
      description: "Manage your teacher profile and preferences",
      page: "teacher-dashboard",
      requiresApproval: true,
    },
  ];

  const filteredGetStarted = getStartedItems.filter(item => !item.requiresAuth || isAuthenticated);
  const filteredTeaching = teachingTools.filter(item => !item.requiresApproval || isApproved);
  const filteredManagement = managementItems.filter(item => !item.requiresApproval || isApproved);
  const filteredAnalytics = analyticsItems.filter(item => !item.requiresApproval || isApproved);

  return (
    <MegaMenu 
      isOpen={isOpen}
      title="For Teachers"
      subtitle="Share your knowledge, inspire students, and build your teaching career with our comprehensive tools."
      promoImage={promoImage}
      promoTitle="Teach & Inspire"
      promoSubtitle="Empower the next generation of learners"
      ctaText="Start Teaching Today"
      ctaOnClick={() => handleNavigate("teacher-application")}
    >
      <div className="space-y-6">
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
                linkText="Learn More"
                testId={`megamenu-teachers-start-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        {filteredTeaching.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#0C332C]" /> Teaching Tools
            </h3>
            <MegaMenuGrid columns={3}>
              {filteredTeaching.map((item, index) => (
                <MegaMenuCategory
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleNavigate(item.page)}
                  linkText="Open"
                  testId={`megamenu-teachers-tools-${index}`}
                />
              ))}
            </MegaMenuGrid>
          </div>
        )}

        {filteredManagement.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0C332C]" /> Manage
            </h3>
            <MegaMenuGrid columns={3}>
              {filteredManagement.map((item, index) => (
                <MegaMenuCategory
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleNavigate(item.page)}
                  linkText="Manage"
                  testId={`megamenu-teachers-manage-${index}`}
                />
              ))}
            </MegaMenuGrid>
          </div>
        )}

        {filteredAnalytics.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#0C332C]" /> Analytics & Earnings
            </h3>
            <MegaMenuGrid columns={3}>
              {filteredAnalytics.map((item, index) => (
                <MegaMenuCategory
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleNavigate(item.page)}
                  linkText="View"
                  testId={`megamenu-teachers-analytics-${index}`}
                />
              ))}
            </MegaMenuGrid>
          </div>
        )}
      </div>
    </MegaMenu>
  );
};
