import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail,
  MailOpen,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  User,
  Briefcase,
  Phone,
  DollarSign,
  Calendar,
  FileText,
  ExternalLink,
  Home,
  Users,
  BookOpen,
  CreditCard,
  Menu,
  X,
  Megaphone,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContactSubmission {
  id: string;
  formType: 'contact' | 'design-team';
  name: string;
  email: string;
  subject?: string;
  message: string;
  company?: string;
  phone?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  fileUrl?: string;
  isRead: boolean;
  status: 'new' | 'in-progress' | 'resolved';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactStats {
  total: number;
  unread: number;
  byFormType: {
    contact: number;
    designTeam: number;
  };
  byStatus: {
    new: number;
    inProgress: number;
    resolved: number;
  };
}

interface AdminContactMessagesProps {
  onNavigate?: (page: string) => void;
}

export default function AdminContactMessages({ onNavigate }: AdminContactMessagesProps = {}) {
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'contact' | 'design-team'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in-progress' | 'resolved'>('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const userRole = profile?.role || 'student';

  // Fetch submissions
  const { data: submissions = [], isLoading } = useQuery<ContactSubmission[]>({
    queryKey: ['/api/admin/all', { formType: filter === 'all' ? undefined : filter, status: statusFilter === 'all' ? undefined : statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('formType', filter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      return await apiRequest(`/api/admin/all?${params.toString()}`);
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<ContactStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      return await apiRequest('/api/admin/stats');
    },
  });

  // Update submission mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContactSubmission> }) => {
      return await apiRequest(`/api/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
  });

  // Delete submission mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setSelectedMessage(null);
    },
  });

  const handleMarkAsRead = (submission: ContactSubmission) => {
    updateMutation.mutate({
      id: submission.id,
      data: { isRead: true },
    });
  };

  const handleMarkAsUnread = (submission: ContactSubmission) => {
    updateMutation.mutate({
      id: submission.id,
      data: { isRead: false },
    });
  };

  const handleStatusChange = (submission: ContactSubmission, newStatus: 'new' | 'in-progress' | 'resolved') => {
    updateMutation.mutate({
      id: submission.id,
      data: { status: newStatus },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'new': { bg: '#2d5ddd', text: 'white', label: 'New' },
      'in-progress': { bg: '#ff5834', text: 'white', label: 'In Progress' },
      'resolved': { bg: '#151314', text: 'white', label: 'Resolved' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['new'];
    
    return (
      <Badge style={{ backgroundColor: config.bg, color: config.text }} className="hover:opacity-90">
        {config.label}
      </Badge>
    );
  };

  const getFormTypeBadge = (formType: string) => {
    return (
      <Badge className="bg-[#151314] text-white hover:bg-[#151314]">
        {formType === 'contact' ? 'Contact Form' : 'Design Team'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:block" data-testid="admin-contact-messages">
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#ff5834] flex items-center justify-between px-4 z-50 border-b border-white/10 pt-safe">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          data-testid="mobile-menu-button"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-white font-bold text-lg">Contact Messages</h1>
        <div className="w-10" />
      </div>

      {/* Left Sidebar */}
      <div className={`w-64 fixed left-0 top-0 h-full border-r border-sidebar-border bg-[#ff5834] z-50 overflow-y-auto transition-transform duration-300 ${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex flex-col py-4 px-3 bg-[#ff5834] min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6" data-testid="sidebar-header">
            <h2 className="text-white font-bold text-xl">Admin</h2>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/20"
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
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-dashboard"
              >
                <Home className="w-5 h-5 mr-3 text-black" />
                <span>Dashboard</span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-users"
              >
                <Users className="w-5 h-5 mr-3 text-black" />
                <span>Users</span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-courses"
              >
                <BookOpen className="w-5 h-5 mr-3 text-black" />
                <span>Courses</span>
              </Button>
              
              {userRole !== 'customer_service' && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                    onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                    data-testid="nav-transactions"
                  >
                    <DollarSign className="w-5 h-5 mr-3 text-black" />
                    <span>Transactions</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                    onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                    data-testid="nav-pricing"
                  >
                    <CreditCard className="w-5 h-5 mr-3 text-black" />
                    <span>Pricing Plans</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                    onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                    data-testid="nav-wallet-management"
                  >
                    <DollarSign className="w-5 h-5 mr-3 text-black" />
                    <span>Wallet Management</span>
                  </Button>
                </>
              )}
              
              {userRole === 'admin' && (
                <Button
                  variant="ghost"
                  className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                  onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                  data-testid="nav-manual-plan"
                >
                  <FileText className="w-5 h-5 mr-3 text-black" />
                  <span>Manual Plan Assign</span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                data-testid="nav-communication"
              >
                <MessageSquare className="w-5 h-5 mr-3 text-black" />
                <span>Communication</span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                onClick={() => { onNavigate?.('admin-email-inbox'); setShowMobileMenu(false); }}
                data-testid="nav-email-inbox"
              >
                <Mail className="w-5 h-5 mr-3 text-black" />
                <span>Email Inbox</span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-11 rounded-lg transition-colors justify-start text-black hover:bg-[#c4ee3d] hover:text-black"
                style={{ backgroundColor: "#c4ee3d" }}
                data-testid="nav-contact-messages"
              >
                <FileText className="w-5 h-5 mr-3 text-black" />
                <span>Contact Messages</span>
              </Button>
              
              {userRole === 'admin' && (
                <Button
                  variant="ghost"
                  className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black"
                  onClick={() => { onNavigate?.('admin-dashboard'); setShowMobileMenu(false); }}
                  data-testid="nav-advertisements"
                >
                  <Megaphone className="w-5 h-5 mr-3 text-black" />
                  <span>Advertisements</span>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 mt-16 md:mt-0">
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Contact Messages</h1>
              <p className="text-muted-foreground">View and manage all contact form submissions</p>
            </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-count">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-unread-count">{stats.unread}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contact Forms</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-contact-count">{stats.byFormType.contact}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Design Requests</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-design-count">{stats.byFormType.designTeam}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Form Type</label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger data-testid="select-form-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  <SelectItem value="contact">Contact Forms</SelectItem>
                  <SelectItem value="design-team">Design Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>Messages ({submissions.length})</CardTitle>
            <CardDescription>Click on a message to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-messages">No messages found</div>
            ) : (
              <div className="space-y-2">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent group ${
                      !submission.isRead ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      setSelectedMessage(submission);
                      if (!submission.isRead) {
                        handleMarkAsRead(submission);
                      }
                      if (submission.status === 'new') {
                        handleStatusChange(submission, 'in-progress');
                      }
                    }}
                    data-testid={`message-item-${submission.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {submission.isRead ? (
                          <MailOpen className="h-5 w-5 text-muted-foreground group-hover:text-white mt-1" />
                        ) : (
                          <Mail className="h-5 w-5 text-blue-600 group-hover:text-white mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground group-hover:text-white">{submission.name}</h3>
                            {getFormTypeBadge(submission.formType)}
                            {getStatusBadge(submission.status)}
                          </div>
                          <p className="text-sm text-muted-foreground group-hover:text-white mb-1">{submission.email}</p>
                          <p className="text-sm text-foreground font-medium group-hover:text-white mb-1">
                            {submission.subject || submission.projectType}
                          </p>
                          <p className="text-sm text-muted-foreground group-hover:text-white line-clamp-2">
                            {submission.message}
                          </p>
                          <p className="text-xs text-muted-foreground group-hover:text-white mt-2">
                            {new Date(submission.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </div>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message Details
              </DialogTitle>
              <DialogDescription>
                Received on {new Date(selectedMessage.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[100px]">Name:</span>
                    <span>{selectedMessage.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[100px]">Email:</span>
                    <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                  {selectedMessage.company && (
                    <div className="flex gap-2">
                      <span className="font-medium min-w-[100px]">Company:</span>
                      <span>{selectedMessage.company}</span>
                    </div>
                  )}
                  {selectedMessage.phone && (
                    <div className="flex gap-2">
                      <span className="font-medium min-w-[100px]">Phone:</span>
                      <a href={`tel:${selectedMessage.phone}`} className="text-blue-600 hover:underline">
                        {selectedMessage.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject/Project Details */}
              {selectedMessage.formType === 'contact' && selectedMessage.subject && (
                <div>
                  <h3 className="font-semibold mb-2">Subject</h3>
                  <p className="text-sm">{selectedMessage.subject}</p>
                </div>
              )}

              {selectedMessage.formType === 'design-team' && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Project Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="font-medium min-w-[100px]">Type:</span>
                      <span>{selectedMessage.projectType}</span>
                    </div>
                    {selectedMessage.budget && (
                      <div className="flex gap-2">
                        <span className="font-medium min-w-[100px]">Budget:</span>
                        <span>{selectedMessage.budget}</span>
                      </div>
                    )}
                    {selectedMessage.timeline && (
                      <div className="flex gap-2">
                        <span className="font-medium min-w-[100px]">Timeline:</span>
                        <span>{selectedMessage.timeline}</span>
                      </div>
                    )}
                    {selectedMessage.fileUrl && (
                      <div className="flex gap-2">
                        <span className="font-medium min-w-[100px]">Attachment:</span>
                        <a
                          href={selectedMessage.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View File <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <h3 className="font-semibold mb-2">Message</h3>
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Status Management */}
              <div>
                <h3 className="font-semibold mb-3">Status Management</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedMessage.status === 'new' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange(selectedMessage, 'new')}
                    data-testid="button-status-new"
                  >
                    {selectedMessage.status === 'new' && <CheckmarkIcon size="sm" className="mr-1 bg-green-500" />}
                    New
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedMessage.status === 'in-progress' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange(selectedMessage, 'in-progress')}
                    data-testid="button-status-in-progress"
                  >
                    {selectedMessage.status === 'in-progress' && <CheckmarkIcon size="sm" className="mr-1 bg-green-500" />}
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedMessage.status === 'resolved' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange(selectedMessage, 'resolved')}
                    data-testid="button-status-resolved"
                  >
                    {selectedMessage.status === 'resolved' && <CheckmarkIcon size="sm" className="mr-1 bg-green-500" />}
                    Resolved
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => selectedMessage.isRead ? handleMarkAsUnread(selectedMessage) : handleMarkAsRead(selectedMessage)}
                  data-testid="button-toggle-read"
                >
                  {selectedMessage.isRead ? <Mail className="h-4 w-4 mr-2" /> : <MailOpen className="h-4 w-4 mr-2" />}
                  Mark as {selectedMessage.isRead ? 'Unread' : 'Read'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedMessage.id)}
                  data-testid="button-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex-1"></div>
                <Button onClick={() => setSelectedMessage(null)} data-testid="button-close">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
