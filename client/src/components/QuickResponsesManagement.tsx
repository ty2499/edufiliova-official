import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Copy,
  Eye,
  Zap,
  Hash,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Local schema for quick response
const quickResponseSchema = z.object({
  trigger: z.string()
    .min(2, 'Trigger must be at least 2 characters')
    .max(50, 'Trigger must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Trigger can only contain letters, numbers, underscores, and dashes')
    .refine(val => !val.startsWith('/'), 'Do not include the "/" prefix'),
  content: z.string()
    .min(5, 'Response content must be at least 5 characters')
    .max(1000, 'Response content must not exceed 1000 characters'),
  category: z.string().min(1, 'Please select a category'),
  isActive: z.boolean().optional().default(true)
});

type QuickResponseFormData = z.infer<typeof quickResponseSchema>;

interface QuickResponse {
  id: number;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  creatorRole?: string | null;
  creatorName?: string | null;
}

const RESPONSE_CATEGORIES = [
  'greeting',
  'troubleshooting', 
  'billing',
  'technical',
  'general',
  'closing'
];

const CATEGORY_ICONS = {
  greeting: '👋',
  troubleshooting: '🔧',
  billing: '💳',
  technical: '⚙️',  
  general: '💬',
  closing: '👋'
};

export default function QuickResponsesManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<QuickResponse | null>(null);
  const [previewResponse, setPreviewResponse] = useState<QuickResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [actionStates, setActionStates] = useState<{[key: string]: 'idle' | 'loading' | 'success' | 'error'}>({});
  const queryClient = useQueryClient();

  // Create form
  const createForm = useForm({
    resolver: zodResolver(quickResponseSchema),
    defaultValues: {
      trigger: '',
      content: '',
      category: '',
      isActive: true
    }
  });

  // Edit form
  const editForm = useForm({
    resolver: zodResolver(quickResponseSchema),
    defaultValues: {
      trigger: '',
      content: '',
      category: '',
      isActive: true
    }
  });

  // Fetch quick responses
  const { data: responses, isLoading, error, refetch } = useQuery<QuickResponse[]>({
    queryKey: ['/api/admin/quick-responses'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/quick-responses');
      
      // Handle different response structures
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        console.error('QuickResponsesManagement: Unexpected response structure:', response);
        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  });

  // Create quick response mutation
  const createResponseMutation = useMutation({
    mutationFn: (data: any) => {
      setActionStates(prev => ({ ...prev, create: 'loading' }));
      return apiRequest('/api/admin/quick-responses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setActionStates(prev => ({ ...prev, create: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quick-responses'] });
      
      // Show success state briefly then reset
      setTimeout(() => {
        setIsCreateDialogOpen(false);
        createForm.reset();
        setActionStates(prev => ({ ...prev, create: 'idle' }));
      }, 1200);
    },
    onError: (error: any) => {
      setActionStates(prev => ({ ...prev, create: 'error' }));
      
      // Reset error state after delay
      setTimeout(() => {
        setActionStates(prev => ({ ...prev, create: 'idle' }));
      }, 3000);
    }
  });

  // Update quick response mutation
  const updateResponseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      setActionStates(prev => ({ ...prev, [`edit-${id}`]: 'loading' }));
      return apiRequest(`/api/admin/quick-responses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (_, { id }) => {
      setActionStates(prev => ({ ...prev, [`edit-${id}`]: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quick-responses'] });
      
      // Show success state briefly then reset
      setTimeout(() => {
        setEditingResponse(null);
        editForm.reset();
        setActionStates(prev => ({ ...prev, [`edit-${id}`]: 'idle' }));
      }, 1200);
    },
    onError: (error: any, { id }) => {
      setActionStates(prev => ({ ...prev, [`edit-${id}`]: 'error' }));
      
      // Reset error state after delay
      setTimeout(() => {
        setActionStates(prev => ({ ...prev, [`edit-${id}`]: 'idle' }));
      }, 3000);
    }
  });

  // Delete quick response mutation
  const deleteResponseMutation = useMutation({
    mutationFn: (id: string) => {
      setActionStates(prev => ({ ...prev, [`delete-${id}`]: 'loading' }));
      return apiRequest(`/api/admin/quick-responses/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, id) => {
      setActionStates(prev => ({ ...prev, [`delete-${id}`]: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quick-responses'] });
      
      // Reset state after success animation
      setTimeout(() => {
        setActionStates(prev => ({ ...prev, [`delete-${id}`]: 'idle' }));
      }, 800);
    },
    onError: (error: any, id) => {
      setActionStates(prev => ({ ...prev, [`delete-${id}`]: 'error' }));
      
      // Reset error state after delay
      setTimeout(() => {
        setActionStates(prev => ({ ...prev, [`delete-${id}`]: 'idle' }));
      }, 3000);
    }
  });

  // Handle create submit
  const handleCreateSubmit = (data: QuickResponseFormData) => {
    // Transform frontend data to match backend schema
    const backendData = {
      title: data.trigger, // Use trigger as title
      shortcut: data.trigger, // Use trigger as shortcut too
      content: data.content,
      category: data.category || 'general', // Provide default category
      isActive: data.isActive !== undefined ? data.isActive : true, // Ensure boolean
      sortOrder: 0 // Provide default sort order
    };
    createResponseMutation.mutate(backendData);
  };

  // Handle edit submit
  const handleEditSubmit = (data: QuickResponseFormData) => {
    if (editingResponse) {
      // Transform frontend data to match backend schema
      const backendData = {
        title: data.trigger, // Use trigger as title
        shortcut: data.trigger, // Use trigger as shortcut too
        content: data.content,
        category: data.category || 'general', // Provide default category
        isActive: data.isActive !== undefined ? data.isActive : true, // Ensure boolean
        sortOrder: editingResponse.sortOrder || 0 // Preserve existing sort order or default
      };
      updateResponseMutation.mutate({ id: editingResponse.id.toString(), data: backendData });
    }
  };

  // Handle delete
  const handleDelete = (id: number) => {
    deleteResponseMutation.mutate(id.toString());
  };

  // Open edit dialog
  const openEditDialog = (response: QuickResponse) => {
    setEditingResponse(response);
    editForm.reset({
      trigger: response.shortcut || response.title, // Use shortcut as trigger, fallback to title
      content: response.content,
      category: response.category,
      isActive: response.isActive
    });
  };

  // Filter responses
  const filteredResponses = responses?.filter((response: QuickResponse) => {
    const matchesSearch = (response.shortcut || response.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
                         response.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || response.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const activeResponses = filteredResponses.filter((r: QuickResponse) => r.isActive);
  const inactiveResponses = filteredResponses.filter((r: QuickResponse) => !r.isActive);

  // Copy response trigger with inline feedback
  const handleCopyTrigger = (shortcut: string, responseId: number) => {
    navigator.clipboard.writeText(`/${shortcut}`);
    setActionStates(prev => ({ ...prev, [`copy-${responseId}`]: 'success' }));
    
    // Reset copy state after showing success
    setTimeout(() => {
      setActionStates(prev => ({ ...prev, [`copy-${responseId}`]: 'idle' }));
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="quick-responses-loading">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quick-responses-management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quick Responses</h2>
          <p className="text-sm text-muted-foreground">
            Manage quick responses for support agents. Agents can use "/" followed by the trigger to insert responses.
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-quick-response-button">
              <Plus className="h-4 w-4 mr-2" />
              Create Response
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Quick Response</DialogTitle>
              <DialogDescription>
                Create a new quick response that agents can use with "/" commands.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="trigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">/</span>
                          <Input
                            placeholder="greeting"
                            {...field}
                            data-testid="input-trigger"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The command agents will type after "/" to insert this response
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESPONSE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              <span className="flex items-center gap-2">
                                <span>{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Hello! How can I help you today?"
                          rows={4}
                          {...field}
                          data-testid="textarea-content"
                        />
                      </FormControl>
                      <FormDescription>
                        The message that will be inserted when this response is used
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="cancel-create-button"
                    disabled={actionStates.create === 'loading'}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={actionStates.create === 'loading'}
                    data-testid="submit-create-button"
                    className={`transition-all duration-300 ${
                      actionStates.create === 'success' ? 'bg-green-600 hover:bg-green-600' : 
                      actionStates.create === 'error' ? 'bg-primary hover:bg-primary' : ''
                    }`}
                  >
                    {actionStates.create === 'loading' && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {actionStates.create === 'success' && (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {actionStates.create === 'error' && (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    {actionStates.create === 'loading' ? 'Creating...' : 
                     actionStates.create === 'success' ? 'Created!' :
                     actionStates.create === 'error' ? 'Failed' : 'Create Response'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]" data-testid="category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {RESPONSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    <span className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{responses?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeResponses.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{inactiveResponses.length}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{new Set(responses?.map((r: QuickResponse) => r.category) || []).size}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Responses Grid */}
      {!isLoading && (!responses || responses.length === 0) ? (
        <Card data-testid="quick-responses-empty-state">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Quick Responses Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first quick response to help agents respond faster
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)} 
              data-testid="empty-create-button"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Quick Response
            </Button>
          </CardContent>
        </Card>
      ) : filteredResponses.length === 0 ? (
        <Card data-testid="quick-responses-filtered-empty-state">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResponses.map((response: QuickResponse) => (
            <Card key={response.id} className={`${!response.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 px-2 py-1 font-mono text-xs"
                      data-testid={`trigger-${response.id}`}
                    >
                      <Hash className="h-3 w-3" />
                      /{response.shortcut || response.title}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <span>{CATEGORY_ICONS[response.category as keyof typeof CATEGORY_ICONS]}</span>
                      {response.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {response.isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`content-${response.id}`}>
                    {response.content}
                  </p>
                  
                  {response.creatorRole && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Created by: {response.creatorName || 'Unknown'} ({response.creatorRole})</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyTrigger(response.shortcut || response.title, response.id)}
                        data-testid={`copy-${response.id}`}
                        className={`transition-all duration-200 ${
                          actionStates[`copy-${response.id}`] === 'success' ? 'text-green-600' : ''
                        }`}
                      >
                        {actionStates[`copy-${response.id}`] === 'success' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewResponse(response)}
                        data-testid={`preview-${response.id}`}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(response)}
                        data-testid={`edit-${response.id}`}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            data-testid={`delete-${response.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Quick Response</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "/{response.shortcut || response.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(response.id)}
                              disabled={actionStates[`delete-${response.id}`] === 'loading'}
                              className={`transition-all duration-300 ${
                                actionStates[`delete-${response.id}`] === 'success' ? 'bg-green-600 hover:bg-green-600' :
                                actionStates[`delete-${response.id}`] === 'error' ? 'bg-primary hover:bg-primary' :
                                'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                              }`}
                            >
                              {actionStates[`delete-${response.id}`] === 'loading' && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              )}
                              {actionStates[`delete-${response.id}`] === 'success' && (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              {actionStates[`delete-${response.id}`] === 'error' && (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              {actionStates[`delete-${response.id}`] === 'loading' ? 'Deleting...' : 
                               actionStates[`delete-${response.id}`] === 'success' ? 'Deleted!' :
                               actionStates[`delete-${response.id}`] === 'error' ? 'Failed' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingResponse} onOpenChange={() => setEditingResponse(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Quick Response</DialogTitle>
            <DialogDescription>
              Update the quick response details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="trigger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">/</span>
                        <Input
                          placeholder="greeting"
                          {...field}
                          data-testid="edit-input-trigger"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The command agents will type after "/" to insert this response
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RESPONSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            <span className="flex items-center gap-2">
                              <span>{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Response Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hello! How can I help you today?"
                        rows={4}
                        {...field}
                        data-testid="edit-textarea-content"
                      />
                    </FormControl>
                    <FormDescription>
                      The message that will be inserted when this response is used
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingResponse(null)}
                  data-testid="cancel-edit-button"
                  disabled={!!(editingResponse && actionStates[`edit-${editingResponse.id}`] === 'loading')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!!(editingResponse && actionStates[`edit-${editingResponse.id}`] === 'loading')}
                  data-testid="submit-edit-button"
                  className={`transition-all duration-300 ${
                    editingResponse && actionStates[`edit-${editingResponse.id}`] === 'success' ? 'bg-green-600 hover:bg-green-600' : 
                    editingResponse && actionStates[`edit-${editingResponse.id}`] === 'error' ? 'bg-primary hover:bg-primary' : ''
                  }`}
                >
                  {editingResponse && actionStates[`edit-${editingResponse.id}`] === 'loading' && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingResponse && actionStates[`edit-${editingResponse.id}`] === 'success' && (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {editingResponse && actionStates[`edit-${editingResponse.id}`] === 'error' && (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  {editingResponse && actionStates[`edit-${editingResponse.id}`] === 'loading' ? 'Updating...' : 
                   editingResponse && actionStates[`edit-${editingResponse.id}`] === 'success' ? 'Updated!' :
                   editingResponse && actionStates[`edit-${editingResponse.id}`] === 'error' ? 'Failed' : 'Update Response'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewResponse} onOpenChange={() => setPreviewResponse(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Preview Quick Response</DialogTitle>
            <DialogDescription>
              See how this response will appear in a chat.
            </DialogDescription>
          </DialogHeader>
          {previewResponse && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    /{previewResponse.shortcut || previewResponse.title}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {CATEGORY_ICONS[previewResponse.category as keyof typeof CATEGORY_ICONS]} {previewResponse.category}
                  </Badge>
                </div>
                <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs ml-auto">
                  <p className="text-sm">{previewResponse.content}</p>
                  <div className="flex items-center gap-1 mt-2 text-blue-100">
                    <User className="h-3 w-3" />
                    <span className="text-xs">Support Agent</span>
                    <Clock className="h-3 w-3 ml-auto" />
                    <span className="text-xs">now</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
