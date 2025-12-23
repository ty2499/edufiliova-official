import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { openExternalUrl } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Loader2,
  AlertCircle,
  Bell,
  ArrowLeft,
  Home,
  BookOpen,
  GraduationCap,
  PenTool,
  MessageCircle,
  Bookmark,
  Wallet,
  CreditCard,
  ShoppingBag,
  Download,
  Megaphone,
  Settings,
  Globe,
  LogOut,
  Menu,
  X,
  LayoutGrid
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MeetingDetailDialog } from "@/components/MeetingDetailDialog";
import Logo from "@/components/Logo";
import { getGradeFeatureRestrictions } from "@shared/schema";

interface Meeting {
  id: string;
  title: string;
  lessonDescription: string;
  scheduledTime: string;
  duration: number;
  targetGrades: string[];
  mode: "interactive" | "broadcast";
  maxParticipants: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  participantCount: number;
}

export default function StudentMeetings() {
  const { user, profile, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const featureRestrictions = profile?.grade ? getGradeFeatureRestrictions(profile.grade) : {
    canAccessCourses: false,
    canAccessFreelancers: false,
    canAccessCommunity: false,
    canAccessBilling: false,
    canAccessPurchases: false,
    canAccessDownloads: false,
    canAccessCreateAd: false
  };

  const { data: meetingsData, isLoading } = useQuery<{ meetings: Meeting[] }>({
    queryKey: ['/api/meetings'],
    enabled: !!user && profile?.role === 'student',
  });

  const meetings = meetingsData?.meetings || [];

  // Filter upcoming and live meetings
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' || m.status === 'live');

  if (!user || profile?.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only students can access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const canJoin = (scheduledTime: string) => {
    const meetingTime = new Date(scheduledTime);
    const now = new Date();
    const fifteenMinBefore = new Date(meetingTime.getTime() - 15 * 60000);
    return now >= fifteenMinBefore;
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const scheduledDate = new Date(meeting.scheduledTime);
    const isLive = meeting.status === 'live';
    const joinable = canJoin(meeting.scheduledTime);

    return (
      <Card 
        className="shadow-none"
        data-testid={`meeting-card-${meeting.id}`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-base" data-testid={`meeting-title-${meeting.id}`}>
                  {meeting.title}
                </CardTitle>
                {isLive && (
                  <Badge className="text-black" style={{ backgroundColor: '#c5f13c' }} data-testid={`meeting-live-${meeting.id}`}>
                    LIVE NOW
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2" data-testid={`meeting-description-${meeting.id}`}>
                {meeting.lessonDescription}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span data-testid={`meeting-date-${meeting.id}`}>{format(scheduledDate, 'PPP')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span data-testid={`meeting-time-${meeting.id}`}>{format(scheduledDate, 'p')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span data-testid={`meeting-participants-${meeting.id}`}>
                  {meeting.participantCount || 0} / {meeting.maxParticipants} participants
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>{meeting.mode === 'interactive' ? 'Interactive' : 'Broadcast'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Duration:</span>
              <Badge variant="outline">{meeting.duration} minutes</Badge>
            </div>

            <Button 
              className="w-full"
              onClick={() => {
                setSelectedMeeting(meeting);
                setIsDialogOpen(true);
              }}
              data-testid={`button-view-${meeting.id}`}
            >
              <Video className="mr-2 h-4 w-4" />
              {isLive ? 'Join Live Meeting' : 'View Meeting Details'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar - Mobile */}
      <nav className="bg-[#0C332C] border-b border-white/10 fixed top-0 left-0 right-0 z-40 md:hidden pt-safe">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-white hover:text-gray-200"
                data-testid="button-mobile-menu"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Logo size="md" variant="white" type="student" />
            </div>
          </div>
        </div>
      </nav>

      {/* Left Sidebar - Slide-in on mobile, fixed on desktop */}
      <div className={`${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed left-0 top-0 md:top-0 h-full w-64 border-r border-white/10 z-50 bg-[#0C332C] transition-transform duration-300`}>
        <div className="flex flex-col h-full py-4">
          
          {/* Logo */}
          <div className="mb-4 px-4 hidden md:block" data-testid="sidebar-logo">
            <Logo size="md" variant="white" type="student" />
          </div>
          
          {/* Navigation Icons */}
          <nav className="flex-1 flex flex-col space-y-2 px-3 overflow-y-auto">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-overview"
            >
              <Home className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Overview</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-subjects"
            >
              <BookOpen className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Subjects</span>
            </Button>
            
            {featureRestrictions.canAccessCourses && (
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-courses"
              >
                <GraduationCap className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Courses</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90 hover:text-black"
              onClick={() => setShowMobileMenu(false)}
              data-testid="nav-classes"
            >
              <Video className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Classes</span>
            </Button>
            
            {featureRestrictions.canAccessFreelancers && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
                  onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
                  data-testid="nav-portfolio-gallery"
                >
                  <LayoutGrid className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Freelancer Works</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
                  onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
                  data-testid="nav-marketplace"
                >
                  <Users className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Find Freelancers</span>
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-assignments"
            >
              <PenTool className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Assignments</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-book-teacher"
            >
              <Calendar className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Book Teacher</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-messages"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Messages</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-notes"
            >
              <Bookmark className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Notes</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-announcements"
            >
              <Bell className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Announcements</span>
            </Button>
            
            {featureRestrictions.canAccessCommunity && (
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-community"
              >
                <Users className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Community</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-wallet"
            >
              <Wallet className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Wallet</span>
            </Button>
            
            {featureRestrictions.canAccessBilling && (
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-billing"
              >
                <CreditCard className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Billing</span>
              </Button>
            )}
            
            {featureRestrictions.canAccessPurchases && (
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-purchases"
              >
                <ShoppingBag className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Purchases</span>
              </Button>
            )}
            
            {featureRestrictions.canAccessDownloads && (
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-downloads"
              >
                <Download className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Downloads</span>
              </Button>
            )}
            
            {featureRestrictions.canAccessCreateAd && (
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-create-ad"
              >
                <Megaphone className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Create Ad</span>
              </Button>
            )}
          </nav>
          
          {/* Bottom section */}
          <div className="border-t border-white/20 pt-3 px-3 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg transition-colors px-3 py-2 text-white hover:bg-[#c4ee3d] hover:text-black"
              onClick={() => { navigate('/student-dashboard'); setShowMobileMenu(false); }}
              data-testid="nav-settings"
            >
              <Settings className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Settings</span>
            </Button>
          </div>
          
          <div className="p-3 border-t border-white/20 space-y-2 flex-shrink-0">
            <Button
              size="sm"
              className="w-full bg-[#c4ee3d] hover:bg-[#c4ee3d]/90 text-black font-medium"
              onClick={() => { openExternalUrl('https://edufiliova.com'); setShowMobileMenu(false); }}
              data-testid="nav-explore-website"
            >
              <Globe className="h-4 w-4 mr-2" />
              Explore Website
            </Button>
            <Button
              size="sm"
              className="w-full bg-[#fe5831] hover:bg-[#e64d2e] text-white font-medium"
              onClick={async () => { 
                setIsLoggingOut(true);
                setShowMobileMenu(false);
                await logout();
              }}
              disabled={isLoggingOut}
              data-testid="nav-logout"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 md:pt-0 md:ml-64 min-h-screen">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-bold mb-2 text-[19px]" data-testid="page-title">My Class Meetings</h1>
            <p className="text-sm text-muted-foreground">View and join upcoming video meetings for your grade</p>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Meetings</p>
                  <p className="text-lg font-bold" data-testid="stat-upcoming">
                    {meetings.filter(m => m.status === 'scheduled').length}
                  </p>
                </div>
                <Calendar className="h-5 w-5 text-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Live Now</p>
                  <p className="text-lg font-bold" data-testid="stat-live">
                    {meetings.filter(m => m.status === 'live').length}
                  </p>
                </div>
                <Video className="h-5 w-5 text-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Meetings List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No upcoming meetings for your grade. Your teacher will schedule meetings and notify you.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {meetings.filter(m => m.status === 'live').length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      Live Now
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {meetings
                        .filter(m => m.status === 'live')
                        .map((meeting) => (
                          <MeetingCard key={meeting.id} meeting={meeting} />
                        ))}
                    </div>
                  </div>
                )}

                {meetings.filter(m => m.status === 'scheduled').length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold mb-4">Upcoming Meetings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {meetings
                        .filter(m => m.status === 'scheduled')
                        .map((meeting) => (
                          <MeetingCard key={meeting.id} meeting={meeting} />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <MeetingDetailDialog
        meeting={selectedMeeting}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedMeeting(null);
        }}
        role="student"
      />
    </div>
  );
}
