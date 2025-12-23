import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Shield, 
  Eye, 
  EyeOff,
  Save,
  X,
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  Move,
  Upload,
  Image
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';

// Support agent schema for form validation
const supportAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  role: z.string().max(50, 'Role must be less than 50 characters').optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().or(z.literal('')),
  isActive: z.boolean(),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater')
});

type SupportAgentForm = z.infer<typeof supportAgentSchema>;

interface SupportAgent {
  id: number;
  name: string;
  avatarUrl?: string;
  role?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function SupportProfilesManagement() {
  const [editingAgent, setEditingAgent] = useState<SupportAgent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'all'>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<SupportAgentForm>({
    resolver: zodResolver(supportAgentSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      role: '',
      description: '',
      isActive: true,
      sortOrder: 0
    }
  });

  // Fetch support agents
  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['/api/admin/support-agents'],
    queryFn: () => apiRequest('/api/admin/support-agents'),
    select: (response: any) => {
      // The apiRequest function already extracts data, so response is the array directly
      const agentList = Array.isArray(response) ? response : (response?.data || []);
      return viewMode === 'active' 
        ? agentList.filter((agent: SupportAgent) => agent.isActive)
        : agentList;
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: SupportAgentForm) => apiRequest('/api/admin/support-agents', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-agents'] });setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {}
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupportAgentForm> }) => 
      apiRequest(`/api/admin/support-agents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-agents'] });setIsDialogOpen(false);
      setEditingAgent(null);
      form.reset();
    },
    onError: (error: any) => {}
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/support-agents/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-agents'] });},
    onError: (error: any) => {}
  });

  // Upload avatar image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }
      
      return response.json();
    },
  });

  const handleSubmit = async (data: SupportAgentForm) => {
    try {
      // Upload avatar if file is selected
      let finalData = { ...data };
      
      if (selectedFile) {
        setUploadProgress(true);
        const uploadResult = await uploadImageMutation.mutateAsync(selectedFile);
        setUploadProgress(false);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload avatar');
        }
        
        finalData.avatarUrl = uploadResult.url;
      }

      if (editingAgent) {
        updateMutation.mutate({ id: editingAgent.id, data: finalData });
      } else {
        createMutation.mutate(finalData);
      }
    } catch (error: any) {
      setUploadProgress(false);}
  };

  const handleEdit = (agent: SupportAgent) => {
    setEditingAgent(agent);
    setSelectedFile(null);
    form.reset({
      name: agent.name,
      avatarUrl: agent.avatarUrl || '',
      role: agent.role || '',
      description: agent.description || '',
      isActive: agent.isActive,
      sortOrder: agent.sortOrder
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this support agent?')) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingAgent(null);
    setSelectedFile(null);
    form.reset({
      name: '',
      avatarUrl: '',
      role: '',
      description: '',
      isActive: true,
      sortOrder: 0
    });
    setIsDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-primary">
            Error loading support agents: {(error as any)?.message || 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="support-profiles-management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Support Agents</h2>
          <p className="text-sm text-muted-foreground">
            Manage support agent profiles and their availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
            data-testid="view-all-agents"
          >
            All Agents
          </Button>
          <Button
            variant={viewMode === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('active')}
            data-testid="view-active-agents"
          >
            Active Only
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="create-agent-button">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg sm:max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAgent ? 'Edit Support Agent' : 'Create Support Agent'}
                </DialogTitle>
                <DialogDescription>
                  {editingAgent 
                    ? 'Update the support agent information' 
                    : 'Add a new support agent profile'
                  }
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-1">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., John Smith" 
                            {...field} 
                            data-testid="input-agent-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar</FormLabel>
                        <div className="space-y-3">
                          {/* File Upload Section */}
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              id="avatar-upload"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedFile(file);
                                  // Clear the URL field when file is selected
                                  field.onChange('');
                                }
                              }}
                              data-testid="file-avatar-upload"
                            />
                            <label
                              htmlFor="avatar-upload"
                              className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-input bg-background hover:bg-accent hover:text-foreground-foreground cursor-pointer rounded-md text-sm transition-colors"
                            >
                              <Upload className="h-4 w-4" />
                              Upload Image
                            </label>
                            {selectedFile && (
                              <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md truncate">
                                <span className="block truncate" title={selectedFile.name}>
                                  📎 {selectedFile.name}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* URL Input (alternative) */}
                          <div className="relative">
                            <FormControl>
                              <Input 
                                placeholder="Or paste image URL" 
                                {...field} 
                                data-testid="input-avatar-url"
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Clear file selection when URL is entered
                                  if (e.target.value) {
                                    setSelectedFile(null);
                                  }
                                }}
                              />
                            </FormControl>
                          </div>
                          
                          {/* Preview */}
                          {(selectedFile || field.value) && (
                            <div className="flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-md">
                              <Avatar className="h-12 w-12 border-2 border-border">
                                <AvatarImage 
                                  src={selectedFile ? URL.createObjectURL(selectedFile) : field.value} 
                                  alt="Preview" 
                                  className="object-cover"
                                />
                                <AvatarFallback>
                                  <Image className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-center">
                                <p className="text-sm font-medium">Avatar preview</p>
                                <p className="text-xs text-muted-foreground">Looking good!</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Technical Support" 
                            {...field} 
                            data-testid="input-agent-role"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of agent's expertise" 
                            {...field} 
                            data-testid="input-agent-description"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-agent-active"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium">
                            Active
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem className="flex-shrink-0">
                          <FormLabel className="text-sm">Sort Order</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              className="w-20"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-sort-order"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="cancel-button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending || uploadProgress}
                      data-testid="save-agent-button"
                    >
                      {createMutation.isPending || updateMutation.isPending || uploadProgress ? (
                        <>
                          <span className="animate-spin mr-2">⚪</span>
                          {uploadProgress ? 'Uploading...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingAgent ? 'Update' : 'Create'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents?.map((agent: SupportAgent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow" data-testid={`agent-card-${agent.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      {agent.role && (
                        <p className="text-sm text-muted-foreground">{agent.role}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                    {agent.isActive ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {agent.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {agent.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>Sort Order: {agent.sortOrder}</span>
                  <span>ID: {agent.id}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(agent)}
                    className="flex-1"
                    data-testid={`edit-agent-${agent.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(agent.id)}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    data-testid={`delete-agent-${agent.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {agents?.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Support Agents</h3>
                  <p className="text-muted-foreground mb-6">
                    {viewMode === 'active' 
                      ? 'No active support agents found. Create your first agent or view all agents.'
                      : 'Create your first support agent to get started.'
                    }
                  </p>
                  <Button onClick={openCreateDialog} data-testid="empty-state-create-button">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Support Agent
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
