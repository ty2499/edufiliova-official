import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  Star
} from 'lucide-react';
import { CheckmarkIcon } from '@/components/ui/checkmark-icon';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  thumbnailUrl: string | null;
  price: string;
  difficulty: string | null;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  isFeatured: boolean;
  featuredAt: string | null;
}

export default function AdminCourseManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Fetch all courses
  const { data: coursesData, isLoading } = useQuery<{ success: boolean; courses: Course[] }>({
    queryKey: ['/api/admin/courses'],
  });

  const courses = coursesData?.courses || [];

  // Filter courses based on search and status
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group courses by status
  const pendingCourses = filteredCourses.filter(c => c.approvalStatus === 'pending');
  const approvedCourses = filteredCourses.filter(c => c.approvalStatus === 'approved');
  const rejectedCourses = filteredCourses.filter(c => c.approvalStatus === 'rejected');

  // Approve course mutation
  const approveMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest(`/api/admin/courses/${courseId}/approve`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setSelectedCourse(null);
    },
    onError: (error: any) => {
      // Silent error handling - AJAX only
    },
  });

  // Reject course mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ courseId, reason }: { courseId: string; reason: string }) => {
      return await apiRequest(`/api/admin/courses/${courseId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setSelectedCourse(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      // Silent error handling - AJAX only
    },
  });

  // Feature/unfeature course mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ courseId, isFeatured }: { courseId: string; isFeatured: boolean }) => {
      return await apiRequest(`/api/courses/${courseId}/feature`, {
        method: 'PATCH',
        body: JSON.stringify({ isFeatured }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'courses', 'featured'] });
    },
    onError: (error: any) => {
      // Silent error handling - AJAX only
    },
  });

  const handleApprove = (course: Course) => {
    if (confirm(`Are you sure you want to approve "${course.title}"?`)) {
      approveMutation.mutate(course.id);
    }
  };

  const handleReject = (course: Course) => {
    setSelectedCourse(course);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!selectedCourse) return;
    if (!rejectionReason.trim()) {
      return;
    }
    rejectMutation.mutate({ courseId: selectedCourse.id, reason: rejectionReason });
  };

  const handleToggleFeatured = (course: Course) => {
    const action = course.isFeatured ? 'unfeature' : 'feature';
    if (confirm(`Are you sure you want to ${action} "${course.title}"?`)) {
      toggleFeatureMutation.mutate({ courseId: course.id, isFeatured: !course.isFeatured });
    }
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 line-clamp-1" data-testid={`course-title-${course.id}`}>
              {course.title}
            </CardTitle>
            <CardDescription className="line-clamp-2" data-testid={`course-description-${course.id}`}>
              {course.description}
            </CardDescription>
          </div>
          <Badge 
            variant={
              course.approvalStatus === 'approved' ? 'default' :
              course.approvalStatus === 'rejected' ? 'destructive' : 
              'secondary'
            }
            data-testid={`course-status-${course.id}`}
          >
            {course.approvalStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {course.thumbnailUrl && (
          <img 
            src={course.thumbnailUrl} 
            alt={course.title}
            className="w-full h-40 object-cover rounded-md"
            data-testid={`course-thumbnail-${course.id}`}
          />
        )}
        
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {course.authorName && (
            <div className="flex items-center gap-1" data-testid={`course-author-${course.id}`}>
              <User className="h-4 w-4" />
              <span>{course.authorName}</span>
            </div>
          )}
          <div className="flex items-center gap-1" data-testid={`course-price-${course.id}`}>
            <span className="font-semibold text-foreground">${course.price}</span>
          </div>
          <div className="flex items-center gap-1" data-testid={`course-created-${course.id}`}>
            <Calendar className="h-4 w-4" />
            <span>{new Date(course.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {course.approvalStatus === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleApprove(course)}
              disabled={approveMutation.isPending}
              data-testid={`button-approve-${course.id}`}
            >
              {approveMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
              ) : (
                <><CheckmarkIcon size="sm" className="mr-2" /> Approve</>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => handleReject(course)}
              disabled={rejectMutation.isPending}
              data-testid={`button-reject-${course.id}`}
            >
              <XCircle className="h-4 w-4 mr-2" /> Reject
            </Button>
          </div>
        )}
        
        {course.approvalStatus === 'approved' && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant={course.isFeatured ? "default" : "outline"}
              className={cn(
                "flex-1",
                course.isFeatured && "bg-amber-500 hover:bg-amber-600"
              )}
              onClick={() => handleToggleFeatured(course)}
              disabled={toggleFeatureMutation.isPending}
              data-testid={`button-feature-${course.id}`}
            >
              {toggleFeatureMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
              ) : (
                <>
                  <Star className={cn("h-4 w-4 mr-2", course.isFeatured && "fill-current")} />
                  {course.isFeatured ? 'Featured' : 'Feature on Landing'}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Course Management</h1>
        <p className="text-muted-foreground" data-testid="page-description">
          Review and manage courses created by freelancers
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses by title, description, or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold" data-testid="stat-pending">{pendingCourses.length}</p>
              </div>
              <div className="p-2 rounded-full bg-gray-800">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold" data-testid="stat-approved">{approvedCourses.length}</p>
              </div>
              <div className="p-2 rounded-full bg-gray-800">
                <CheckmarkIcon size="sm" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold" data-testid="stat-rejected">{rejectedCourses.length}</p>
              </div>
              <div className="p-2 rounded-full bg-gray-800">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingCourses.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({approvedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected ({rejectedCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingCourses.length === 0 ? (
            <Alert data-testid="empty-pending">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No pending courses to review
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="courses-pending-list">
              {pendingCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedCourses.length === 0 ? (
            <Alert data-testid="empty-approved">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No approved courses
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="courses-approved-list">
              {approvedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedCourses.length === 0 ? (
            <Alert data-testid="empty-rejected">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No rejected courses
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="courses-rejected-list">
              {rejectedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>Reject Course</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedCourse?.title}"
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            data-testid="textarea-rejection-reason"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rejecting...</>
              ) : (
                'Reject Course'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
