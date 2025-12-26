import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  Tags,
  Heart,
  MessageCircle,
  ExternalLink,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  Shield
} from 'lucide-react';
import { CheckmarkIcon } from '@/components/ui/checkmark-icon';
import { apiRequest } from '@/lib/queryClient';

// Types
interface PendingProject {
  id: string;
  title: string;
  description: string;
  media: string[];
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  freelancer: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApprovalAction {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export function ShowcaseApprovalDashboard() {
  const [selectedProject, setSelectedProject] = useState<PendingProject | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const queryClient = useQueryClient();

  // Fetch pending projects
  const { data: projects = [], isLoading, error } = useQuery<PendingProject[]>({
    queryKey: ['/api/showcase/admin/pending'],
    queryFn: async () => {
      const response = await apiRequest('/api/showcase/admin/pending');
      return response.data || [];
    }
  });

  // Approval/rejection mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ projectId, action }: { projectId: string; action: ApprovalAction }) => {
      return apiRequest(`/api/showcase/${projectId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(action)
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/showcase/admin/pending'] });
      setSelectedProject(null);
      setRejectionReason('');
      
      const actionText = variables.action.status === 'approved' ? 'approved' : 'rejected';},
    onError: (error: any) => {}
  });

  const handleApproval = (projectId: string, status: 'approved' | 'rejected') => {
    const action: ApprovalAction = {
      status,
      ...(status === 'rejected' && rejectionReason.trim() ? { rejectionReason: rejectionReason.trim() } : {})
    };

    if (status === 'rejected' && !rejectionReason.trim()) {return;
    }

    approvalMutation.mutate({ projectId, action });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckmarkIcon size="sm" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-primary" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-primary/15 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Filter projects based on status
  const filteredProjects = projects.filter(project => 
    filterStatus === 'all' || project.status === filterStatus
  );

  return (
    <div className="space-y-6" data-testid="showcase-approval-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Showcase Approval Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Review and approve freelancer portfolio submissions for the public showcase
          </p>
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            data-testid="filter-status"
          >
            <option value="pending">Pending ({projects.filter(p => p.status === 'pending').length})</option>
            <option value="all">All ({projects.length})</option>
            <option value="approved">Approved ({projects.filter(p => p.status === 'approved').length})</option>
            <option value="rejected">Rejected ({projects.filter(p => p.status === 'rejected').length})</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-800">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-800">
                <CheckmarkIcon size="sm" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-800">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-800">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-24 h-18 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load projects</h3>
            <p className="text-gray-500">Please try refreshing the page</p>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterStatus === 'pending' ? 'No pending projects' : `No ${filterStatus} projects`}
            </h3>
            <p className="text-gray-500">
              {filterStatus === 'pending' 
                ? 'All caught up! New submissions will appear here.' 
                : `No projects with ${filterStatus} status found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow" transition-all duration-300>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Project Thumbnail */}
                  <div className="w-24 h-18 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {project.media && project.media[0] ? (
                      <img
                        src={project.media[0]}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Eye className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="h-3 w-3" />
                          <span>{project.freelancer.name}</span>
                          <span>•</span>
                          <span>{project.freelancer.email}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusIcon(project.status)}
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-600 line-clamp-2 mb-3">
                      {project.description}
                    </p>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tags className="h-3 w-3" />
                          {project.media.length} media
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedProject(project)}
                              data-testid={`button-review-${project.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                Review Project: {project.title}
                              </DialogTitle>
                              <DialogDescription>
                                Review this submission and decide whether to approve or reject it for the showcase
                              </DialogDescription>
                            </DialogHeader>

                            <ScrollArea className="max-h-[70vh]">
                              {selectedProject && (
                                <div className="space-y-6 pr-4">
                                  {/* Project Details */}
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Project Information</h4>
                                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">Freelancer:</span>
                                          <span>{selectedProject.freelancer.name} ({selectedProject.freelancer.email})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">Submitted:</span>
                                          <span>{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Tags className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">Tags:</span>
                                          <div className="flex flex-wrap gap-1">
                                            {selectedProject.tags.map((tag) => (
                                              <Badge key={tag} variant="secondary" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold mb-2">Description</h4>
                                      <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                                        {selectedProject.description}
                                      </p>
                                    </div>

                                    {/* Media Gallery */}
                                    {selectedProject.media && selectedProject.media.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold mb-2">Media ({selectedProject.media.length})</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {selectedProject.media.map((mediaUrl, index) => (
                                            <div key={index} className="rounded-lg overflow-hidden bg-gray-100">
                                              <img
                                                src={mediaUrl}
                                                alt={`${selectedProject.title} - Image ${index + 1}`}
                                                className="w-full h-48 object-cover"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <Separator />

                                  {/* Approval Actions */}
                                  {selectedProject.status === 'pending' && (
                                    <div className="space-y-4">
                                      <h4 className="font-semibold">Review Decision</h4>
                                      
                                      {/* Rejection Reason (shown when rejecting) */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Rejection Reason (required for rejection)
                                        </label>
                                        <Textarea
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="Please provide a clear reason for rejection to help the freelancer improve their submission"
                                          rows={3}
                                          data-testid="textarea-rejection-reason"
                                        />
                                      </div>

                                      <div className="flex gap-3 pt-4">
                                        <Button
                                          onClick={() => handleApproval(selectedProject.id, 'approved')}
                                          disabled={approvalMutation.isPending}
                                          className="bg-primary hover:bg-primary" transition-all duration-300
                                          data-testid="button-approve"
                                        >
                                          {approvalMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          ) : (
                                            <CheckmarkIcon size="sm" className="mr-2" />
                                          )}
                                          Approve Project
                                        </Button>
                                        <Button
                                          onClick={() => handleApproval(selectedProject.id, 'rejected')}
                                          disabled={approvalMutation.isPending}
                                          variant="destructive"
                                          data-testid="button-reject"
                                        >
                                          {approvalMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          ) : (
                                            <XCircle className="h-4 w-4 mr-2" />
                                          )}
                                          Reject Project
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>

                        {project.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproval(project.id, 'approved')}
                              disabled={approvalMutation.isPending}
                              className="bg-primary hover:bg-primary" transition-all duration-300
                              data-testid={`button-quick-approve-${project.id}`}
                            >
                              <CheckmarkIcon size="sm" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedProject(project);
                                setRejectionReason('');
                              }}
                              disabled={approvalMutation.isPending}
                              data-testid={`button-quick-reject-${project.id}`}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
