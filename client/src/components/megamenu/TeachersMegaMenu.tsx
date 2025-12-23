import { useAuth } from "@/hooks/useAuth";
import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { UserPlus, LogIn, ClipboardCheck, Video, Wallet, FilePlus, Layers } from "lucide-react";

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

  const joinAsTeacher = [
    { icon: <UserPlus className="h-5 w-5" />, title: "Join as Teacher", description: "Start your teaching journey", page: "teacher-application", bg: "bg-blue-50" },
    { icon: <Wallet className="h-5 w-5" />, title: "Why Teach With Us", description: "Discover benefits and opportunities", page: "teacher-pricing", bg: "bg-green-50" },
  ];

  const createCourses = [
    { icon: <FilePlus className="h-5 w-5" />, title: "Create Course", description: "Design and publish new courses", page: "course-creator", bg: "bg-indigo-50", requiresAuth: true, requiresApproved: true },
    { icon: <Layers className="h-5 w-5" />, title: "Subject Creator", description: "Build course subjects and lessons", page: "subject-creator", bg: "bg-pink-50", requiresAuth: true, requiresApproved: true },
  ];

  const management = [
    { icon: <ClipboardCheck className="h-5 w-5" />, title: "Application Status", description: "Check your application progress", page: "teacher-status", bg: "bg-green-50", requiresAuth: true, requiresApproved: false },
    { icon: <Video className="h-5 w-5" />, title: "Teacher Meetings", description: "Schedule and host classes", page: "teacher-meetings", bg: "bg-primary/10", requiresAuth: true, requiresApproved: true },
    { icon: <Wallet className="h-5 w-5" />, title: "Earnings Dashboard", description: "Track your income and payments", page: "earnings", bg: "bg-teal-50", requiresAuth: true, requiresApproved: true },
  ];

  // Logic for showing sections based on authentication and approval status
  const showJoinAsTeacher = !isAuthenticated; // Show only to non-authenticated users
  const showApplicationStatus = isAuthenticated && isTeacher; // Show only to authenticated teachers
  const showApprovedManagement = isAuthenticated && isApproved; // Show only to approved teachers
  
  const applicationStatusItems = management.filter(item => item.requiresApproved === false); // Application Status
  const approvedManagementItems = management.filter(item => item.requiresApproved === true); // For approved teachers
  const filteredCreateCourses = createCourses.filter(item => !item.requiresAuth || (item.requiresAuth && isAuthenticated && (!item.requiresApproved || isApproved)));

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {showJoinAsTeacher && (
          <MegaMenuSection title="Join as Teacher" icon={<UserPlus className="h-4 w-4 text-[#0C332C]" />}>
            {joinAsTeacher.map((item, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                iconBg={item.bg}
                testId={`megamenu-teachers-join-${index}`}
              />
            ))}
          </MegaMenuSection>
        )}

        {/* Application Status - For Unapproved Teachers */}
        {showApplicationStatus && applicationStatusItems.length > 0 && (
          <MegaMenuSection title="Status" icon={<ClipboardCheck className="h-4 w-4 text-[#0C332C]" />}>
            {applicationStatusItems.map((item, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                iconBg={item.bg}
                testId={`megamenu-teachers-status-${index}`}
              />
            ))}
          </MegaMenuSection>
        )}

        {/* Create Courses - For Approved Teachers */}
        {showApprovedManagement && filteredCreateCourses.length > 0 && (
          <MegaMenuSection title="Create Courses" icon={<FilePlus className="h-4 w-4 text-[#0C332C]" />}>
            {filteredCreateCourses.map((item, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                iconBg={item.bg}
                testId={`megamenu-teachers-create-${index}`}
              />
            ))}
          </MegaMenuSection>
        )}

        {/* Management - For Approved Teachers */}
        {showApprovedManagement && approvedManagementItems.length > 0 && (
          <MegaMenuSection title="Dashboard" icon={<Video className="h-4 w-4 text-[#0C332C]" />}>
            {approvedManagementItems.map((item, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                iconBg={item.bg}
                testId={`megamenu-teachers-dashboard-${index}`}
              />
            ))}
          </MegaMenuSection>
        )}
      </div>
    </MegaMenu>
  );
};
