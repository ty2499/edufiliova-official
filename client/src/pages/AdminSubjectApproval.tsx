import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Check, XCircle, Clock, Eye, BookOpen, ArrowLeft, Loader2, AlertCircle, GraduationCap, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";

interface Subject {
  id: string;
  name: string;
  gradeSystem: string;
  gradeLevel: number;
  description: string | null;
  iconUrl: string | null;
  createdBy: string;
  approvalStatus: string;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  creatorName: string | null;
  creatorEmail: string | null;
}

interface AdminSubjectApprovalProps {
  onNavigate?: (page: string, transition?: string) => void;
}

export default function AdminSubjectApproval({ onNavigate }: AdminSubjectApprovalProps = {}) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [ajaxStatus, setAjaxStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/admin/subjects", statusFilter],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/subjects?status=${statusFilter}`);
      return response.data || [];
    }
  });

  const approveSubject = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      setAjaxStatus({ type: 'loading', message: 'Approving subject...' });
      return apiRequest(`/api/admin/subjects/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: () => {
      setAjaxStatus({ type: 'success', message: 'Subject approved successfully!' });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      setTimeout(() => {
        setAjaxStatus({ type: 'idle', message: '' });
        setSelectedSubject(null);
        setReviewAction(null);
        setAdminNotes("");
      }, 1500);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to approve subject' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const rejectSubject = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      setAjaxStatus({ type: 'loading', message: 'Rejecting subject...' });
      return apiRequest(`/api/admin/subjects/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: () => {
      setAjaxStatus({ type: 'success', message: 'Subject rejected!' });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      setTimeout(() => {
        setAjaxStatus({ type: 'idle', message: '' });
        setSelectedSubject(null);
        setReviewAction(null);
        setAdminNotes("");
      }, 1500);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to reject subject' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const handleReview = () => {
    if (!selectedSubject || !reviewAction) return;
    
    if (reviewAction === "approve") {
      approveSubject.mutate({ id: selectedSubject.id, notes: adminNotes });
    } else {
      if (!adminNotes.trim()) {
        setAjaxStatus({ type: 'error', message: 'Please provide a reason for rejection' });
        return;
      }
      rejectSubject.mutate({ id: selectedSubject.id, notes: adminNotes });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-primary/15 text-primary-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = subjects.filter(s => s.approvalStatus === 'pending').length;
  const approvedCount = subjects.filter(s => s.approvalStatus === 'approved').length;
  const rejectedCount = subjects.filter(s => s.approvalStatus === 'rejected').length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        {onNavigate && (
          <Button variant="ghost" size="icon" onClick={() => onNavigate('admin-dashboard')} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-foreground" />
            Subject Approvals
          </h1>
          <p className="text-muted-foreground text-sm">Review and approve teacher-created subjects</p>
        </div>
      </div>

      {ajaxStatus.type !== 'idle' && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          ajaxStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
          ajaxStatus.type === 'success' ? 'bg-green-50 text-green-700' :
          'bg-primary/10 text-primary-700'
        }`}>
          {ajaxStatus.type === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {ajaxStatus.type === 'success' && <Check className="h-4 w-4" />}
          {ajaxStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {ajaxStatus.message}
        </div>
      )}

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2" data-testid="tab-pending">
            <Clock className="h-4 w-4" />
            Pending
            {statusFilter !== 'pending' && pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2" data-testid="tab-approved">
            <Check className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2" data-testid="tab-rejected">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2" data-testid="tab-all">
            <BookOpen className="h-4 w-4" />
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
          ) : subjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No subjects found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'pending' ? 'No subjects waiting for approval' :
                   statusFilter === 'approved' ? 'No approved subjects yet' :
                   statusFilter === 'rejected' ? 'No rejected subjects' :
                   'No subjects have been created yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <Card key={subject.id} className="hover:border-primary transition-colors transition-all duration-300" data-testid={`card-subject-${subject.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      {subject.iconUrl ? (
                        <img src={subject.iconUrl} alt={subject.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">Grade {subject.gradeLevel}</Badge>
                          <Badge variant="secondary">{subject.gradeSystem}</Badge>
                          {getStatusBadge(subject.approvalStatus)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {subject.description || 'No description'}
                    </p>
                    <div className="text-xs text-muted-foreground mb-3">
                      <p>Created by: {subject.creatorName || 'Unknown'}</p>
                      <p>Email: {subject.creatorEmail || 'N/A'}</p>
                      <p>Created: {new Date(subject.createdAt).toLocaleDateString()}</p>
                    </div>
                    {subject.approvalStatus === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedSubject(subject);
                            setReviewAction('approve');
                          }}
                          data-testid={`button-approve-${subject.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            setSelectedSubject(subject);
                            setReviewAction('reject');
                          }}
                          data-testid={`button-reject-${subject.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {subject.adminNotes && (
                      <div className="mt-3 p-2 bg-muted rounded text-xs">
                        <strong>Admin Notes:</strong> {subject.adminNotes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSubject && !!reviewAction} onOpenChange={() => { setSelectedSubject(null); setReviewAction(null); setAdminNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Subject' : 'Reject Subject'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? `Are you sure you want to approve "${selectedSubject?.name}"? It will become visible to students.`
                : `Please provide a reason for rejecting "${selectedSubject?.name}".`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {reviewAction === 'approve' ? 'Notes (optional)' : 'Rejection Reason (required)'}
              </label>
              <Textarea
                placeholder={reviewAction === 'approve' ? 'Add any notes...' : 'Explain why this subject is being rejected...'}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                data-testid="textarea-admin-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedSubject(null); setReviewAction(null); setAdminNotes(""); }}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={approveSubject.isPending || rejectSubject.isPending}
              data-testid="button-confirm-review"
            >
              {(approveSubject.isPending || rejectSubject.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
