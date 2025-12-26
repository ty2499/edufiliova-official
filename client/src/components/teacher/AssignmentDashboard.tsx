import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, Clock, Users, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { format } from 'date-fns';
import { CreateAssignmentDialog } from './CreateAssignmentDialog';
import { AssignmentSubmissions } from './AssignmentSubmissions';
import { EditAssignmentDialog } from './EditAssignmentDialog';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  subject: string;
  maxGrade: number;
  status: 'draft' | 'published' | 'closed';
  submissionCount: number;
  createdAt: string;
  attachments?: any[];
  allowLateSubmission: boolean;
  allowResubmission: boolean;
}

interface AssignmentDashboardProps {
  teacherId: string;
}

export function AssignmentDashboard({ teacherId }: AssignmentDashboardProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (subjectFilter !== 'all') params.append('subject', subjectFilter);

      const response = await fetch(`/api/teacher/assignments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
      } else {
        console.error('Failed to load assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter, subjectFilter]);

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      setIsDeleting(assignmentId);
      const token = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        console.error('Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePublishAssignment = async (assignmentId: string) => {
    try {
      setIsPublishing(assignmentId);
      const token = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/assignments/${assignmentId}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        console.error('Failed to publish assignment');
      }
    } catch (error) {
      console.error('Error publishing assignment:', error);
    } finally {
      setIsPublishing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      published: { variant: 'default' as const, label: 'Published' },
      closed: { variant: 'destructive' as const, label: 'Closed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subjects = [...new Set(assignments.map(a => a.subject))];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="assignment-dashboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">Create and manage assignments for your students</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="font-medium bg-[#0C332C] text-[#ffffff]"
          data-testid="button-create-assignment"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Input
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-assignments"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-40" data-testid="select-subject-filter">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="mt-6">
          {filteredAssignments.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
                <p className="text-gray-600 text-center mb-4">
                  {searchQuery || statusFilter !== 'all' || subjectFilter !== 'all' 
                    ? "No assignments match your current filters" 
                    : "Get started by creating your first assignment"
                  }
                </p>
                {(!searchQuery && statusFilter === 'all' && subjectFilter === 'all') && (
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-[#0C332C] text-[#ffffff]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow transition-all duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {assignment.title}
                      </CardTitle>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {assignment.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {assignment.subject}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Due {format(new Date(assignment.dueDate), 'MMM dd')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        {assignment.submissionCount} submission{assignment.submissionCount !== 1 ? 's' : ''}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowSubmissionsDialog(true);
                          }}
                          className="bg-gray-100 text-gray-700 border-0"
                          data-testid={`button-view-submissions-${assignment.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowEditDialog(true);
                          }}
                          className="bg-blue-100 text-blue-700 border-0"
                          data-testid={`button-edit-assignment-${assignment.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {assignment.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishAssignment(assignment.id)}
                            className="bg-green-100 text-green-700 border-0"
                            disabled={isPublishing === assignment.id}
                            data-testid={`button-publish-${assignment.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {isPublishing === assignment.id ? 'Publishing...' : 'Publish'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="bg-primary/15 text-primary border-0"
                          disabled={isDeleting === assignment.id}
                          data-testid={`button-delete-${assignment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          {isDeleting === assignment.id && <span className="ml-1">Deleting...</span>}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{assignment.title}</h3>
                        {getStatusBadge(assignment.status)}
                        <Badge variant="outline">{assignment.subject}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{assignment.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        <span>{assignment.submissionCount} submissions</span>
                        <span>Max Grade: {assignment.maxGrade}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowSubmissionsDialog(true);
                        }}
                        className="bg-gray-100 text-gray-700 border-0"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Submissions
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowEditDialog(true);
                        }}
                        className="bg-blue-100 text-blue-700 border-0"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {assignment.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishAssignment(assignment.id)}
                          className="bg-green-100 text-green-700 border-0"
                          disabled={isPublishing === assignment.id}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {isPublishing === assignment.id ? 'Publishing...' : 'Publish'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="bg-primary/15 text-primary border-0"
                        disabled={isDeleting === assignment.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting === assignment.id && <span className="ml-1">Deleting...</span>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showCreateDialog && (
        <CreateAssignmentDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={fetchAssignments}
        />
      )}

      {showEditDialog && selectedAssignment && (
        <EditAssignmentDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          assignment={selectedAssignment}
          onSuccess={fetchAssignments}
        />
      )}

      {showSubmissionsDialog && selectedAssignment && (
        <AssignmentSubmissions
          open={showSubmissionsDialog}
          onOpenChange={setShowSubmissionsDialog}
          assignment={selectedAssignment}
        />
      )}
    </div>
  );
}
