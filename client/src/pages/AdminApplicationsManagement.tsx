import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHelpChat } from "@/contexts/HelpChatContext";
import { Check, XCircle, Clock, Eye, FileText, ExternalLink, Download, Menu, X, Home, Users, BookOpen, DollarSign, CreditCard, Settings, FileCheck, MessageSquare, Mail, LogOut, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import Logo from "@/components/Logo";

type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected";

interface TeacherApplication {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  country: string;
  teachingCategories: string[];
  gradeLevels: string[];
  yearsOfExperience: string;
  experienceSummary: string;
  highestQualification: string;
  passportPhotoUrl?: string;
  qualificationCertificates?: string[];
  idPassportDocument: string;
  cvResume?: string;
  proofOfTeaching?: string[];
  sampleMaterials?: string[];
  introductionVideo?: string;
  status: ApplicationStatus;
  adminNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

interface FreelancerApplication {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  country: string;
  primaryCategory: string;
  tagline: string;
  about: string;
  skills?: string[];
  servicesOffered?: string[];
  behanceUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  portfolioSamples?: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    fileUrls: string[];
  }>;
}

interface AdminApplicationsManagementProps {
  onNavigate?: (page: string, transition?: string) => void;
}

export default function AdminApplicationsManagement({ onNavigate }: AdminApplicationsManagementProps = {}) {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const { isChatOpen } = useHelpChat();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTeacherApp, setSelectedTeacherApp] = useState<TeacherApplication | null>(null);
  const [selectedFreelancerApp, setSelectedFreelancerApp] = useState<FreelancerApplication | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'teacher-detail' | 'freelancer-detail'>('list');
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [ajaxStatus, setAjaxStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const handleViewTeacherApp = (app: TeacherApplication) => {
    setSelectedTeacherApp(app);
    setViewMode('teacher-detail');
  };

  const handleViewFreelancerApp = (app: FreelancerApplication) => {
    setSelectedFreelancerApp(app);
    setViewMode('freelancer-detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTeacherApp(null);
    setSelectedFreelancerApp(null);
    setReviewAction(null);
    setAdminNotes("");
    setRejectionReason("");
  };

  const { data: teacherApplications = [], isLoading: teacherLoading } = useQuery<TeacherApplication[]>({
    queryKey: ["/api/teacher-applications", statusFilter !== "all" ? statusFilter : ""],
  });

  const { data: freelancerApplications = [], isLoading: freelancerLoading } = useQuery<FreelancerApplication[]>({
    queryKey: ["/api/freelancer/applications", statusFilter !== "all" ? statusFilter : ""],
  });

  const updateTeacherStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      setAjaxStatus({ type: 'loading', message: 'Updating teacher application...' });
      return apiRequest(`/api/teacher-applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
    },
    onSuccess: () => {
      setAjaxStatus({ type: 'success', message: 'Teacher application updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-applications"] });
      setTimeout(() => {
        setAjaxStatus({ type: 'idle', message: '' });
        handleBackToList();
      }, 1500);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to update teacher application' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const updateFreelancerStatus = useMutation({
    mutationFn: async ({ id, status, notes, reason }: { id: string; status: string; notes: string; reason?: string }) => {
      setAjaxStatus({ type: 'loading', message: 'Updating freelancer application...' });
      return apiRequest(`/api/freelancer/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes, rejectionReason: reason }),
      });
    },
    onSuccess: () => {
      setAjaxStatus({ type: 'success', message: 'Freelancer application updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ["/api/freelancer/applications"] });
      setTimeout(() => {
        setAjaxStatus({ type: 'idle', message: '' });
        handleBackToList();
      }, 1500);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to update freelancer application' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const handleReviewSubmit = () => {
    if (!reviewAction) return;

    const status = reviewAction === "approve" ? "approved" : "rejected";

    if (selectedTeacherApp) {
      updateTeacherStatus.mutate({
        id: selectedTeacherApp.id,
        status,
        notes: adminNotes,
      });
    } else if (selectedFreelancerApp) {
      updateFreelancerStatus.mutate({
        id: selectedFreelancerApp.id,
        status,
        notes: adminNotes,
        reason: rejectionReason,
      });
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      if (onNavigate) {
        onNavigate("auth");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "outline", icon: Clock, label: "Pending" },
      under_review: { variant: "secondary", icon: Eye, label: "Under Review" },
      approved: { variant: "default", icon: Check, label: "Approved" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const safeTeacherApps = teacherApplications || [];
  const safeFreelancerApps = freelancerApplications || [];

  const filteredTeacherApps = statusFilter === "all" 
    ? safeTeacherApps 
    : safeTeacherApps.filter(app => app.status === statusFilter);

  const filteredFreelancerApps = statusFilter === "all"
    ? safeFreelancerApps
    : safeFreelancerApps.filter(app => app.status === statusFilter);

  const statusCounts = {
    all: safeTeacherApps.length + safeFreelancerApps.length,
    pending: safeTeacherApps.filter(a => a.status === "pending").length + safeFreelancerApps.filter(a => a.status === "pending").length,
    under_review: safeTeacherApps.filter(a => a.status === "under_review").length,
    approved: safeTeacherApps.filter(a => a.status === "approved").length + safeFreelancerApps.filter(a => a.status === "approved").length,
    rejected: safeTeacherApps.filter(a => a.status === "rejected").length + safeFreelancerApps.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:block" data-testid="admin-applications-management">
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0C332C] flex items-center justify-between px-3 z-50 border-b border-white/10 pt-safe">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20" transition-all duration-300
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          data-testid="mobile-menu-button"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-white font-bold text-lg">Applications</h1>
        <div className="w-10" />
      </div>

      {/* Left Sidebar - Slide-in on mobile, fixed on desktop */}
      <div className={`${
        (isMobile && isChatOpen) ? "hidden" : ""
      } w-64 fixed left-0 top-0 h-full border-r border-sidebar-border bg-[#0C332C] z-50 overflow-y-auto transition-transform duration-300 ${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${
        isChatOpen ? "hidden" : "block"
      }`}>
        <div className="flex flex-col py-4 px-2 md:px-3 bg-[#0C332C] min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6" data-testid="sidebar-header">
            <h2 className="text-white font-bold text-xl">Admin</h2>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/20" transition-all duration-300
              onClick={() => setShowMobileMenu(false)}
              data-testid="close-mobile-menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <div className="flex flex-col flex-1">
            <nav className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                onClick={() => { 
                  if (onNavigate) onNavigate("admin-dashboard"); 
                  setShowMobileMenu(false); 
                }}
                data-testid="nav-dashboard"
              >
                <Home className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-black bg-[#c4ee3d] hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                data-testid="nav-applications"
              >
                <FileCheck className="w-5 h-5 mr-3" />
                <span>Applications</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                onClick={() => { 
                  if (onNavigate) onNavigate("admin-contact-messages"); 
                  setShowMobileMenu(false); 
                }}
                data-testid="nav-messages"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                <span>Messages</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                onClick={() => { 
                  if (onNavigate) onNavigate("admin-email-management"); 
                  setShowMobileMenu(false); 
                }}
                data-testid="nav-email"
              >
                <Mail className="w-5 h-5 mr-3" />
                <span>Email Management</span>
              </Button>
            </nav>

            {/* Logout Button at Bottom */}
            <div className="mt-auto pt-4 border-t border-white/20">
              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                onClick={handleLogout}
                disabled={isLoggingOut}
                data-testid="nav-logout"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 px-3 py-4 md:p-6 mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto">
          {viewMode === 'list' && (
            <>
              <div className="mb-6 px-1 md:px-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Applications Management</h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">Review and manage teacher and freelancer applications</p>
              </div>

          {/* Status Filter Tabs */}
          <div className="mb-6 px-1 md:px-0">
            <div className="flex flex-wrap gap-1 md:gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
                data-testid="filter-all"
              >
                All ({statusCounts.all})
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                size="sm"
                data-testid="filter-pending"
              >
                <Clock className="w-4 h-4 mr-1" />
                Pending ({statusCounts.pending})
              </Button>
              <Button
                variant={statusFilter === "under_review" ? "default" : "outline"}
                onClick={() => setStatusFilter("under_review")}
                size="sm"
                data-testid="filter-under-review"
              >
                <Eye className="w-4 h-4 mr-1" />
                Under Review ({statusCounts.under_review})
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                onClick={() => setStatusFilter("approved")}
                size="sm"
                data-testid="filter-approved"
              >
                <CheckmarkIcon size="sm" variant="success" className="mr-1" />
                Approved ({statusCounts.approved})
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                onClick={() => setStatusFilter("rejected")}
                size="sm"
                data-testid="filter-rejected"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejected ({statusCounts.rejected})
              </Button>
            </div>
          </div>

          <Tabs defaultValue="teachers" className="w-full px-1 md:px-0">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-auto">
              <TabsTrigger value="teachers" className="text-xs sm:text-sm">Teacher ({filteredTeacherApps.length})</TabsTrigger>
              <TabsTrigger value="freelancers" className="text-xs sm:text-sm">Freelancer ({filteredFreelancerApps.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="teachers">
              {teacherLoading ? (
                <div className="text-center py-12">Loading applications...</div>
              ) : filteredTeacherApps.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No teacher applications found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filteredTeacherApps.map((app) => (
                    <Card key={app.id} data-testid={`teacher-app-${app.id}`} className="flex flex-col">
                      <CardHeader className="pb-4 pt-4 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{app.fullName}</CardTitle>
                            <CardDescription className="text-xs truncate">{app.email}</CardDescription>
                          </div>
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(app.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-3 text-sm px-4 pb-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Country</p>
                          <p className="text-xs truncate">{app.country}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Experience</p>
                          <p className="text-xs truncate">{app.yearsOfExperience}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Submitted</p>
                          <p className="text-xs">{new Date(app.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <Button
                          onClick={() => handleViewTeacherApp(app)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-auto"
                          data-testid={`view-teacher-app-${app.id}`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="freelancers">
              {freelancerLoading ? (
                <div className="text-center py-12">Loading applications...</div>
              ) : filteredFreelancerApps.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No freelancer applications found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filteredFreelancerApps.map((app) => (
                    <Card key={app.id} data-testid={`freelancer-app-${app.id}`} className="flex flex-col">
                      <CardHeader className="pb-4 pt-4 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{app.fullName}</CardTitle>
                            <CardDescription className="text-xs truncate">{app.email}</CardDescription>
                          </div>
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(app.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-3 text-sm px-4 pb-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Country</p>
                          <p className="text-xs truncate">{app.country}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Category</p>
                          <p className="text-xs truncate">{app.primaryCategory}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Submitted</p>
                          <p className="text-xs">{new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Button
                          onClick={() => handleViewFreelancerApp(app)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-auto"
                          data-testid={`view-freelancer-app-${app.id}`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
            </>
          )}

          {/* Teacher Detail View - Full Page */}
          {viewMode === 'teacher-detail' && selectedTeacherApp && (
            <>
              <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 px-1 md:px-0">
                <Button
                  variant="outline"
                  onClick={handleBackToList}
                  data-testid="back-to-list"
                  size="sm"
                  className="w-full md:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Applications
                </Button>
                <div className="w-full">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Teacher Application Details</h1>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">{selectedTeacherApp.fullName}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <p className="text-sm mt-1">{selectedTeacherApp.fullName}</p>
                    </div>
                    <div>
                      <Label>Display Name</Label>
                      <p className="text-sm mt-1">{selectedTeacherApp.displayName}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm mt-1">{selectedTeacherApp.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm mt-1">{selectedTeacherApp.phoneNumber || <span className="text-gray-400 italic">Not provided</span>}</p>
                    </div>
                    <div>
                      <Label>Country</Label>
                      <p className="text-sm mt-1">{selectedTeacherApp.country || <span className="text-gray-400 italic">Not provided</span>}</p>
                    </div>
                    <div>
                      <Label>Years of Experience</Label>
                      <p className="text-sm mt-1">{selectedTeacherApp.yearsOfExperience || <span className="text-gray-400 italic">Not provided</span>}</p>
                    </div>
                    <div className="col-span-2">
                      <Label>Highest Qualification</Label>
                      <p className="text-sm mt-1">{selectedTeacherApp.highestQualification || <span className="text-gray-400 italic">Not provided</span>}</p>
                    </div>
                    <div className="col-span-2">
                      <Label>Teaching Categories</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTeacherApp.teachingCategories && selectedTeacherApp.teachingCategories.length > 0 ? (
                          selectedTeacherApp.teachingCategories.map((cat) => (
                            <Badge key={cat} variant="secondary">{cat}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-sm">Not provided - Application incomplete</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label>Grade Levels</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTeacherApp.gradeLevels && selectedTeacherApp.gradeLevels.length > 0 ? (
                          selectedTeacherApp.gradeLevels.map((grade) => (
                            <Badge key={grade} variant="outline">{grade}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-sm">Not provided - Application incomplete</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label>Experience Summary</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTeacherApp.experienceSummary || <span className="text-gray-400 italic">Not provided - Application incomplete</span>}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-semibold text-lg border-b pb-2">Attached Documents</h3>
                    
                    {selectedTeacherApp.passportPhotoUrl && (
                      <div className="space-y-2">
                        <Label className="text-base">Passport Photo</Label>
                        <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                          <img 
                            src={selectedTeacherApp.passportPhotoUrl} 
                            alt="Passport Photo" 
                            className="max-w-xs max-h-64 object-contain rounded mb-2"
                          />
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <p className="font-mono break-all">{selectedTeacherApp.passportPhotoUrl}</p>
                            <a
                              href={selectedTeacherApp.passportPhotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open in new tab
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTeacherApp.idPassportDocument && (
                      <div className="space-y-2">
                        <Label className="text-base">ID/Passport Document</Label>
                        <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                          {selectedTeacherApp.idPassportDocument.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img 
                              src={selectedTeacherApp.idPassportDocument} 
                              alt="ID/Passport Document" 
                              className="max-w-full max-h-96 object-contain rounded mb-2"
                            />
                          ) : selectedTeacherApp.idPassportDocument.match(/\.pdf$/i) ? (
                            <iframe 
                              src={selectedTeacherApp.idPassportDocument}
                              className="w-full h-96 rounded mb-2"
                              title="ID/Passport Document"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded">
                              <FileText className="w-8 h-8 text-gray-400" />
                              <span className="text-sm">Document file</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <p className="font-mono break-all">{selectedTeacherApp.idPassportDocument}</p>
                            <div className="flex gap-3">
                              <a
                                href={selectedTeacherApp.idPassportDocument}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open in new tab
                              </a>
                              <a
                                href={selectedTeacherApp.idPassportDocument}
                                download
                                className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTeacherApp.cvResume && (
                      <div className="space-y-2">
                        <Label className="text-base">CV/Resume</Label>
                        <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                          {selectedTeacherApp.cvResume.match(/\.pdf$/i) ? (
                            <iframe 
                              src={selectedTeacherApp.cvResume}
                              className="w-full h-96 rounded mb-2"
                              title="CV/Resume"
                            />
                          ) : selectedTeacherApp.cvResume.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img 
                              src={selectedTeacherApp.cvResume} 
                              alt="CV/Resume" 
                              className="max-w-full max-h-96 object-contain rounded mb-2"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded">
                              <FileText className="w-8 h-8 text-gray-400" />
                              <span className="text-sm">CV/Resume file</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <p className="font-mono break-all">{selectedTeacherApp.cvResume}</p>
                            <div className="flex gap-3">
                              <a
                                href={selectedTeacherApp.cvResume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open in new tab
                              </a>
                              <a
                                href={selectedTeacherApp.cvResume}
                                download
                                className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTeacherApp.qualificationCertificates && selectedTeacherApp.qualificationCertificates.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-base">Qualification Certificates ({selectedTeacherApp.qualificationCertificates.length})</Label>
                        <div className="space-y-3">
                          {selectedTeacherApp.qualificationCertificates.map((cert, idx) => (
                            <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                              <p className="text-sm font-medium mb-2">Certificate {idx + 1}</p>
                              {cert.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img 
                                  src={cert} 
                                  alt={`Certificate ${idx + 1}`} 
                                  className="max-w-full max-h-64 object-contain rounded mb-2"
                                />
                              ) : cert.match(/\.pdf$/i) ? (
                                <iframe 
                                  src={cert}
                                  className="w-full h-64 rounded mb-2"
                                  title={`Certificate ${idx + 1}`}
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded">
                                  <FileText className="w-8 h-8 text-gray-400" />
                                  <span className="text-sm">Certificate file</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <p className="font-mono break-all">{cert}</p>
                                <div className="flex gap-3">
                                  <a
                                    href={cert}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open in new tab
                                  </a>
                                  <a
                                    href={cert}
                                    download
                                    className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTeacherApp.proofOfTeaching && selectedTeacherApp.proofOfTeaching.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-base">Proof of Teaching ({selectedTeacherApp.proofOfTeaching.length})</Label>
                        <div className="space-y-3">
                          {selectedTeacherApp.proofOfTeaching.map((proof, idx) => (
                            <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                              <p className="text-sm font-medium mb-2">Proof {idx + 1}</p>
                              {proof.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img 
                                  src={proof} 
                                  alt={`Proof ${idx + 1}`} 
                                  className="max-w-full max-h-64 object-contain rounded mb-2"
                                />
                              ) : proof.match(/\.pdf$/i) ? (
                                <iframe 
                                  src={proof}
                                  className="w-full h-64 rounded mb-2"
                                  title={`Proof ${idx + 1}`}
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded">
                                  <FileText className="w-8 h-8 text-gray-400" />
                                  <span className="text-sm">Proof file</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <p className="font-mono break-all">{proof}</p>
                                <div className="flex gap-3">
                                  <a
                                    href={proof}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open in new tab
                                  </a>
                                  <a
                                    href={proof}
                                    download
                                    className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTeacherApp.sampleMaterials && selectedTeacherApp.sampleMaterials.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-base">Sample Materials ({selectedTeacherApp.sampleMaterials.length})</Label>
                        <div className="space-y-3">
                          {selectedTeacherApp.sampleMaterials.map((material, idx) => (
                            <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                              <p className="text-sm font-medium mb-2">Sample {idx + 1}</p>
                              {material.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img 
                                  src={material} 
                                  alt={`Sample ${idx + 1}`} 
                                  className="max-w-full max-h-64 object-contain rounded mb-2"
                                />
                              ) : material.match(/\.pdf$/i) ? (
                                <iframe 
                                  src={material}
                                  className="w-full h-64 rounded mb-2"
                                  title={`Sample ${idx + 1}`}
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded">
                                  <FileText className="w-8 h-8 text-gray-400" />
                                  <span className="text-sm">Sample file</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <p className="font-mono break-all">{material}</p>
                                <div className="flex gap-3">
                                  <a
                                    href={material}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open in new tab
                                  </a>
                                  <a
                                    href={material}
                                    download
                                    className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTeacherApp.introductionVideo && (
                      <div className="space-y-2">
                        <Label className="text-base">Introduction Video</Label>
                        <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                          <video 
                            src={selectedTeacherApp.introductionVideo}
                            controls
                            className="w-full max-h-96 rounded mb-2"
                          >
                            Your browser does not support the video tag.
                          </video>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <p className="font-mono break-all">{selectedTeacherApp.introductionVideo}</p>
                            <div className="flex gap-3">
                              <a
                                href={selectedTeacherApp.introductionVideo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open in new tab
                              </a>
                              <a
                                href={selectedTeacherApp.introductionVideo}
                                download
                                className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(selectedTeacherApp.status === "pending" || selectedTeacherApp.status === "under_review") && (
                    <div className="flex gap-2 pt-4 border-t flex-wrap">
                      {selectedTeacherApp.status === "pending" && (
                        <Button
                          onClick={() => {
                            updateTeacherStatus.mutate({
                              id: selectedTeacherApp.id,
                              status: "under_review",
                              notes: adminNotes,
                            });
                          }}
                          variant="outline"
                          className="flex-1 border-orange-500 text-primary hover:bg-primary/10" transition-all duration-300
                          disabled={updateTeacherStatus.isPending}
                          data-testid="btn-mark-under-review-teacher"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Mark Under Review
                        </Button>
                      )}
                      <Button
                        onClick={() => setReviewAction("approve")}
                        className="flex-1 bg-primary hover:bg-primary" transition-all duration-300
                        data-testid="btn-approve-teacher"
                      >
                        Approve Application
                      </Button>
                      <Button
                        onClick={() => setReviewAction("reject")}
                        variant="destructive"
                        className="flex-1"
                        data-testid="btn-reject-teacher"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  )}

                  {selectedTeacherApp.status === "rejected" && (
                    <div className="flex gap-2 pt-4 border-t flex-wrap">
                      <Button
                        onClick={() => setReviewAction("approve")}
                        className="flex-1 bg-primary hover:bg-primary"
                        data-testid="btn-reapprove-teacher"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Re-approve Application
                      </Button>
                    </div>
                  )}

                  {selectedTeacherApp.adminNotes && (
                    <div>
                      <Label>Admin Notes</Label>
                      <p className="text-sm mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded">{selectedTeacherApp.adminNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Freelancer Detail View - Full Page */}
          {viewMode === 'freelancer-detail' && selectedFreelancerApp && (
            <>
              <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 px-1 md:px-0">
                <Button
                  variant="outline"
                  onClick={handleBackToList}
                  data-testid="back-to-list-freelancer"
                  size="sm"
                  className="w-full md:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Applications
                </Button>
                <div className="w-full">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Freelancer Application Details</h1>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">{selectedFreelancerApp.fullName}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <p className="text-sm mt-1">{selectedFreelancerApp.fullName}</p>
                    </div>
                    <div>
                      <Label>Display Name</Label>
                      <p className="text-sm mt-1">{selectedFreelancerApp.displayName}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm mt-1">{selectedFreelancerApp.email}</p>
                    </div>
                    <div>
                      <Label>Country</Label>
                      <p className="text-sm mt-1">{selectedFreelancerApp.country}</p>
                    </div>
                    <div className="col-span-2">
                      <Label>Primary Category</Label>
                      <p className="text-sm mt-1">{selectedFreelancerApp.primaryCategory || <span className="text-gray-400 italic">Not provided - Application incomplete</span>}</p>
                    </div>
                    <div className="col-span-2">
                      <Label>Tagline</Label>
                      <p className="text-sm mt-1">{selectedFreelancerApp.tagline || <span className="text-gray-400 italic">Not provided - Application incomplete</span>}</p>
                    </div>
                    <div className="col-span-2">
                      <Label>About</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedFreelancerApp.about || <span className="text-gray-400 italic">Not provided - Application incomplete</span>}</p>
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFreelancerApp.skills && selectedFreelancerApp.skills.length > 0 ? (
                          selectedFreelancerApp.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-sm">Not provided - Application incomplete</span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label>Services Offered</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFreelancerApp.servicesOffered && selectedFreelancerApp.servicesOffered.length > 0 ? (
                          selectedFreelancerApp.servicesOffered.map((service) => (
                            <Badge key={service} variant="outline">{service}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-sm">Not provided - Application incomplete</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(selectedFreelancerApp.behanceUrl || selectedFreelancerApp.githubUrl || selectedFreelancerApp.websiteUrl) && (
                    <div className="space-y-2">
                      <Label>External Links</Label>
                      {selectedFreelancerApp.behanceUrl && (
                        <a href={selectedFreelancerApp.behanceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline" transition-all duration-300>
                          <ExternalLink className="w-4 h-4" />
                          Behance Portfolio
                        </a>
                      )}
                      {selectedFreelancerApp.githubUrl && (
                        <a href={selectedFreelancerApp.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline" transition-all duration-300>
                          <ExternalLink className="w-4 h-4" />
                          GitHub Profile
                        </a>
                      )}
                      {selectedFreelancerApp.websiteUrl && (
                        <a href={selectedFreelancerApp.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline" transition-all duration-300>
                          <ExternalLink className="w-4 h-4" />
                          Personal Website
                        </a>
                      )}
                    </div>
                  )}

                  {selectedFreelancerApp.portfolioSamples && selectedFreelancerApp.portfolioSamples.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Portfolio Samples ({selectedFreelancerApp.portfolioSamples.length})</h3>
                      <div className="grid gap-4">
                        {selectedFreelancerApp.portfolioSamples.map((sample) => (
                          <Card key={sample.id}>
                            <CardHeader>
                              <CardTitle className="text-base">{sample.title}</CardTitle>
                              <CardDescription>{sample.category}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm mb-4">{sample.description}</p>
                              <div className="space-y-4">
                                <Label className="text-base">Files ({sample.fileUrls.length})</Label>
                                {sample.fileUrls.map((url, idx) => (
                                  <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                    <p className="text-sm font-medium mb-2">File {idx + 1}</p>
                                    {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                      <img 
                                        src={url} 
                                        alt={`${sample.title} - File ${idx + 1}`} 
                                        className="max-w-full max-h-96 object-contain rounded mb-2"
                                      />
                                    ) : url.match(/\.pdf$/i) ? (
                                      <iframe 
                                        src={url}
                                        className="w-full h-96 rounded mb-2"
                                        title={`${sample.title} - File ${idx + 1}`}
                                      />
                                    ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                                      <video 
                                        src={url}
                                        controls
                                        className="w-full max-h-96 rounded mb-2"
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                    ) : (
                                      <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded">
                                        <FileText className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm">Portfolio file</span>
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                      <p className="font-mono break-all">{url}</p>
                                      <div className="flex gap-3">
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          Open in new tab
                                        </a>
                                        <a
                                          href={url}
                                          download
                                          className="flex items-center gap-2 text-blue-600 hover:underline" transition-all duration-300
                                        >
                                          <Download className="w-3 h-3" />
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFreelancerApp.status === "pending" && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => setReviewAction("approve")}
                        className="flex-1 bg-primary hover:bg-primary" transition-all duration-300
                        data-testid="btn-approve-freelancer"
                      >
                        Approve Application
                      </Button>
                      <Button
                        onClick={() => setReviewAction("reject")}
                        variant="destructive"
                        className="flex-1"
                        data-testid="btn-reject-freelancer"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  )}

                  {selectedFreelancerApp.status === "rejected" && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => setReviewAction("approve")}
                        className="flex-1 bg-primary hover:bg-primary"
                        data-testid="btn-reapprove-freelancer"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Re-approve Application
                      </Button>
                    </div>
                  )}

                  {selectedFreelancerApp.adminNotes && (
                    <div>
                      <Label>Admin Notes</Label>
                      <p className="text-sm mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded">{selectedFreelancerApp.adminNotes}</p>
                    </div>
                  )}

                  {selectedFreelancerApp.rejectionReason && (
                    <div>
                      <Label>Rejection Reason</Label>
                      <p className="text-sm mt-1 bg-primary/10 dark:bg-red-900/20 p-3 rounded text-primary-900 dark:text-primary-200">
                        {selectedFreelancerApp.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Review Action Dialog */}
      <Dialog open={!!reviewAction} onOpenChange={(open) => !open && setReviewAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve" 
                ? "This will approve the application and notify the applicant." 
                : "Please provide a reason for rejection."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === "reject" && (
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the application is being rejected..."
                  rows={4}
                  data-testid="rejection-reason-textarea"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any internal notes..."
                rows={3}
                data-testid="admin-notes-textarea"
              />
            </div>
          </div>

          {ajaxStatus.type !== 'idle' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              ajaxStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
              ajaxStatus.type === 'success' ? 'bg-green-50 text-green-700' :
              'bg-primary/10 text-primary-700'
            }`} data-testid="ajax-status-inline">
              {ajaxStatus.type === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              {ajaxStatus.type === 'success' && <CheckmarkIcon size="sm" variant="success" />}
              {ajaxStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">{ajaxStatus.message}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewAction(null)} data-testid="review-cancel-button" disabled={ajaxStatus.type === 'loading'}>
              Cancel
            </Button>
            <Button 
              onClick={handleReviewSubmit}
              disabled={(reviewAction === "reject" && !rejectionReason.trim()) || ajaxStatus.type === 'loading'}
              className={reviewAction === "approve" ? "bg-primary hover:bg-primary" : ""}
              variant={reviewAction === "reject" ? "destructive" : "default"}
              data-testid="review-submit-button"
            >
              {ajaxStatus.type === 'loading' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                reviewAction === "approve" ? "Approve" : "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
