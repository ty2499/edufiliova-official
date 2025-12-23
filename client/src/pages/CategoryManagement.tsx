import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  Save,
  X,
  Grid,
  Filter,
  Settings,
  Globe,
  User
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Types for shop categories
interface ShopCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageUrl?: string;
  backgroundColor: string;
  sortOrder: number;
  isActive: boolean;
  scope?: 'global' | 'seller';
  createdBy?: string;
  createdAt: string;
}

interface CategoryFilter {
  id?: string;
  name: string;
  displayName: string;
  type: 'range' | 'multiselect' | 'singleselect' | 'boolean';
  sortOrder: number;
  isActive: boolean;
  options: CategoryFilterOption[];
}

interface CategoryFilterOption {
  id?: string;
  value: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

interface CategoryFormData {
  name: string;
  displayName: string;
  description: string;
  backgroundColor: string;
  sortOrder: number;
  isActive: boolean;
  scope?: 'global' | 'seller';
  filters: CategoryFilter[];
}

interface CategoryManagementProps {
  embedded?: boolean;
  allowedRoles?: string[];
}

export function CategoryManagement({ embedded = false, allowedRoles = ['admin', 'teacher', 'freelancer'] }: CategoryManagementProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  
  const userRole = profile?.role || 'student';
  const canCreateCategories = allowedRoles.includes(userRole);
  const isAdmin = userRole === 'admin';
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    displayName: '',
    description: '',
    backgroundColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
    sortOrder: 0,
    isActive: true,
    scope: isAdmin ? 'global' : 'seller',
    filters: []
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [editingFilter, setEditingFilter] = useState<CategoryFilter | null>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Predefined background color options
  const backgroundOptions = [
    { value: 'bg-gradient-to-br from-blue-100 to-blue-200', label: 'Blue', color: 'bg-blue-200' },
    { value: 'bg-gradient-to-br from-purple-100 to-purple-200', label: 'Purple', color: 'bg-purple-200' },
    { value: 'bg-gradient-to-br from-green-100 to-green-200', label: 'Green', color: 'bg-green-200' },
    { value: 'bg-gradient-to-br from-yellow-100 to-yellow-200', label: 'Yellow', color: 'bg-yellow-200' },
    { value: 'bg-gradient-to-br from-pink-100 to-pink-200', label: 'Pink', color: 'bg-pink-200' },
    { value: 'bg-gradient-to-br from-indigo-100 to-indigo-200', label: 'Indigo', color: 'bg-indigo-200' },
    { value: 'bg-gradient-to-br from-primary/10 to-primary/15', label: 'Red', color: 'bg-red-200' },
    { value: 'bg-gradient-to-br from-gray-100 to-gray-200', label: 'Gray', color: 'bg-gray-200' }
  ];

  // Fetch categories with role-based visibility
  const { data: categories = [], isLoading, isError } = useQuery<ShopCategory[]>({
    queryKey: ['/api/shop-categories', { visibility: isAdmin ? 'all' : 'mine' }],
    queryFn: async () => {
      const visibility = isAdmin ? 'all' : 'mine';
      const response = await apiRequest(`/api/shop-categories?visibility=${visibility}`);
      return response || [];
    },
    enabled: canCreateCategories
  });

  // Create/Update category mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { imageFile?: File }) => {
      const formData = new FormData();
      
      // Maintain backward compatibility - append scalar fields individually
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'imageFile' && key !== 'filters' && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Add filters as separate JSON field for future backend support
      if (data.filters && data.filters.length > 0) {
        formData.append('filters', JSON.stringify(data.filters));
      }

      if (data.imageFile) {
        formData.append('image', data.imageFile);
      }

      const url = editingCategory 
        ? `/api/shop-categories/${editingCategory.id}`
        : '/api/shop-categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      return await apiRequest(url, {
        method,
        body: formData,
      });
    },
    onSuccess: () => {
      setSuccess(`Category ${editingCategory ? 'updated' : 'created'} successfully.`);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/shop-categories'] });
      setTimeout(() => {
        handleCloseDialog();
        setSuccess(null);
      }, 1500);
    },
    onError: (error: any) => {
      setError(error.message || `Failed to ${editingCategory ? 'update' : 'create'} category.`);
      setSuccess(null);
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest(`/api/shop-categories/${categoryId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      setSuccess("Category deleted successfully.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/shop-categories'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to delete category.");
      setSuccess(null);
    }
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ categoryId, imageFile }: { categoryId: string; imageFile: File }) => {
      const formData = new FormData();
      formData.append('image', imageFile);

      return await apiRequest(`/api/shop-categories/${categoryId}/image`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      setSuccess("Category image updated successfully.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/shop-categories'] });
      setUploadingImage(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to upload image.");
      setSuccess(null);
      setUploadingImage(null);
    }
  });

  const handleCreateNew = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      backgroundColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
      sortOrder: categories.length,
      isActive: true,
      scope: isAdmin ? 'global' : 'seller',
      filters: []
    });
    setActiveTab('basic');
    setIsDialogOpen(true);
  };

  const handleEdit = (category: ShopCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      displayName: category.displayName,
      description: category.description,
      backgroundColor: category.backgroundColor,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      scope: category.scope || (isAdmin ? 'global' : 'seller'),
      filters: [] // TODO: Load filters from API
    });
    setActiveTab('basic');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setActiveTab('basic');
    setError(null);
    setSuccess(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      backgroundColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
      sortOrder: 0,
      isActive: true,
      scope: isAdmin ? 'global' : 'seller',
      filters: []
    });
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.displayName.trim()) {
      setError("Name and display name are required.");
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);
    saveCategoryMutation.mutate(formData);
  };

  const handleImageUpload = (categoryId: string, file: File) => {
    setUploadingImage(categoryId);
    uploadImageMutation.mutate({ categoryId, imageFile: file });
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    const confirmed = await confirm({
      title: 'Delete Category',
      description: `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`
    });
    if (confirmed) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  // Filter management functions
  const handleAddFilter = () => {
    const newFilter: CategoryFilter = {
      name: '',
      displayName: '',
      type: 'multiselect',
      sortOrder: formData.filters.length,
      isActive: true,
      options: []
    };
    setEditingFilter(newFilter);
    setIsFilterDialogOpen(true);
  };

  const handleEditFilter = (filter: CategoryFilter) => {
    setEditingFilter(filter);
    setIsFilterDialogOpen(true);
  };

  const handleDeleteFilter = (filterIndex: number) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.filter((_, index) => index !== filterIndex)
    }));
  };

  const handleSaveFilter = (filter: CategoryFilter) => {
    if (editingFilter && editingFilter.id) {
      // Edit existing filter - find by ID or reference if no ID
      const filterIndex = formData.filters.findIndex(f => 
        (f.id && f.id === editingFilter.id) || f === editingFilter
      );
      if (filterIndex >= 0) {
        setFormData(prev => ({
          ...prev,
          filters: prev.filters.map((f, index) => index === filterIndex ? filter : f)
        }));
      }
    } else {
      // Add new filter - assign temporary ID for editing
      const newFilter = {
        ...filter,
        id: filter.id || `temp_${Date.now()}_${Math.random()}`
      };
      setFormData(prev => ({
        ...prev,
        filters: [...prev.filters, newFilter]
      }));
    }
    setIsFilterDialogOpen(false);
    setEditingFilter(null);
  };

  const handleAddFilterOption = (filterIndex: number) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.map((filter, index) => 
        index === filterIndex 
          ? {
              ...filter,
              options: [...filter.options, {
                value: '',
                displayName: '',
                sortOrder: filter.options.length,
                isActive: true
              }]
            }
          : filter
      )
    }));
  };

  const handleDeleteFilterOption = (filterIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.map((filter, index) => 
        index === filterIndex 
          ? {
              ...filter,
              options: filter.options.filter((_, idx) => idx !== optionIndex)
            }
          : filter
      )
    }));
  };

  return (
    <div className={embedded ? "bg-transparent" : "min-h-screen bg-gray-50 p-6"}>
      <div className={embedded ? "w-full" : "max-w-7xl mx-auto"}>
        {/* Header */}
        {/* Global Status Messages */}
        {(error || success) && (
          <div className="mb-6">
            {error && (
              <div className="bg-primary/10 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  <X className="h-5 w-5 text-primary-400 mr-2" />
                  <p className="text-sm text-primary-700">{error}</p>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="h-5 w-5 text-green-400 mr-2">✓</div>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Shop Category Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage product categories with custom images and styling
              {!isAdmin && (
                <span className="ml-2 text-blue-600">• Personal categories only</span>
              )}
              {isAdmin && (
                <span className="ml-2 text-green-600">• Global & personal categories</span>
              )}
            </p>
          </div>
          {canCreateCategories ? (
            <Button 
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-create-category"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
              Only admins, teachers, and freelancers can create categories
            </div>
          )}
        </div>

        {/* Role-based access control */}
        {!canCreateCategories ? (
          <Card className="p-12 text-center">
            <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Access Restricted</h3>
            <p className="text-gray-500 mb-6">
              Only admins, teachers, and freelancers can manage categories.
            </p>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((category) => (
                <Card 
                  key={category.id} 
                  className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow"
                  data-testid={`category-card-${category.id}`}
                >
                  {/* Category Preview */}
                  <div className={`relative h-48 overflow-hidden ${category.imageUrl ? '' : category.backgroundColor}`}>
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.displayName}
                        className="absolute inset-0 w-full h-full object-cover block"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Render decorative dots only when no image */}
                    {!category.imageUrl && (
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-6 left-6 w-8 h-8 bg-white rounded-full"></div>
                        <div className="absolute bottom-8 right-8 w-6 h-6 bg-white rounded-full"></div>
                        <div className="absolute top-1/2 right-6 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="absolute top-4 right-4 z-20">
                      <label 
                        htmlFor={`upload-${category.id}`}
                        className={`cursor-pointer bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-105 block ${
                          uploadingImage === category.id ? 'pointer-events-none opacity-50' : ''
                        }`}
                        title="Upload category image"
                      >
                        <Upload className="h-4 w-4 text-gray-700" />
                        <input
                          id={`upload-${category.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(category.id, file);
                          }}
                          data-testid={`input-upload-${category.id}`}
                        />
                      </label>
                    </div>

                    {/* Status and Scope Badges */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
                      <Badge 
                        variant={category.isActive ? "default" : "secondary"}
                        className={category.isActive ? "bg-green-500" : "bg-gray-400"}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {category.scope && (
                        <Badge 
                          variant="outline"
                          className={`${
                            category.scope === 'global' 
                              ? 'bg-blue-50 border-blue-200 text-blue-700' 
                              : 'bg-primary/10 border-orange-200 text-orange-700'
                          }`}
                        >
                          {category.scope === 'global' ? (
                            <><Globe className="h-3 w-3 mr-1" />Global</>
                          ) : (
                            <><User className="h-3 w-3 mr-1" />Personal</>
                          )}
                        </Badge>
                      )}
                    </div>

                    {/* Upload Loading */}
                    {uploadingImage === category.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                        <div className="flex flex-col items-center text-white">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
                          <div className="text-sm">Uploading image...</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category Info */}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {category.displayName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {category.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          ID: {category.name} • Order: {category.sortOrder}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="flex-1"
                        data-testid={`button-edit-${category.id}`}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id, category.displayName)}
                        className="text-primary-600 hover:text-primary-700 hover:border-red-200"
                        data-testid={`button-delete-${category.id}`}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        {deleteCategoryMutation.isPending ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Grid className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No categories yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first shop category to get started with the marketplace.
            </p>
            <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Category
            </Button>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
            </DialogHeader>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-primary/10 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  <X className="h-5 w-5 text-primary-400 mr-2" />
                  <p className="text-sm text-primary-700">{error}</p>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="h-5 w-5 text-green-400 mr-2">✓</div>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Basic Settings
                </TabsTrigger>
                <TabsTrigger value="filters" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters ({formData.filters.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Category ID</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., digital_templates"
                    data-testid="input-category-name"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used in URLs and code (no spaces, use underscores)
                  </p>
                </div>

                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="e.g., Digital Templates"
                    data-testid="input-display-name"
                  />
                </div>
              </div>

              {/* Scope Selector for Admins */}
              {isAdmin && (
                <div>
                  <Label htmlFor="scope">Category Scope</Label>
                  <Select 
                    value={formData.scope} 
                    onValueChange={(value: 'global' | 'seller') => setFormData(prev => ({ ...prev, scope: value }))}
                  >
                    <SelectTrigger data-testid="select-scope">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <span>Global - Visible to all users</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="seller">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-500" />
                          <span>Seller - Personal categories</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.scope === 'global' 
                      ? 'Global categories are visible to all users and can be used by teachers and freelancers' 
                      : 'Seller categories are only visible to the creator and their products'
                    }
                  </p>
                </div>
              )}

              {/* Non-admin scope info */}
              {!isAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Personal Category</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    This category will be private to you and only visible in your product listings.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this category contains..."
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              {/* Background Color */}
              <div>
                <Label>Background Color</Label>
                <div className="grid grid-cols-4 gap-3 mt-2">
                  {backgroundOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, backgroundColor: option.value }))}
                      className={`relative h-12 rounded-lg border-2 transition-all ${
                        formData.backgroundColor === option.value 
                          ? 'border-blue-500 scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${option.color}`}
                      data-testid={`color-option-${option.label.toLowerCase()}`}
                    >
                      {formData.backgroundColor === option.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                        </div>
                      )}
                      <span className="sr-only">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    data-testid="input-sort-order"
                  />
                </div>

                <div className="flex items-center space-x-2 mt-6">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                    data-testid="checkbox-is-active"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label>Preview</Label>
                <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                  <div className={`relative h-32 ${formData.backgroundColor} rounded-lg flex items-center justify-center`}>
                    <div className="flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-2 left-2 w-4 h-4 bg-white rounded-full"></div>
                      <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <h4 className="font-medium">{formData.displayName || 'Category Name'}</h4>
                    <p className="text-sm text-gray-600">{formData.description || 'Category description'}</p>
                  </div>
                </div>
              </div>
              </TabsContent>

              <TabsContent value="filters" className="space-y-6 py-4">
                {/* Filters Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Category Filters</h3>
                    <p className="text-sm text-gray-600">Manage filters that users can use to search products in this category</p>
                  </div>
                  <Button onClick={handleAddFilter} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>
                </div>

                {/* Filters List */}
                {formData.filters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No filters yet</p>
                    <p className="text-sm">Add filters to help users find products in this category</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.filters.map((filter, filterIndex) => (
                      <Card key={filterIndex} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{filter.displayName || 'Unnamed Filter'}</h4>
                            <p className="text-sm text-gray-600">Type: {filter.type} • Options: {filter.options.length}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleEditFilter(filter)} 
                              variant="outline" 
                              size="sm"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteFilter(filterIndex)} 
                              variant="outline" 
                              size="sm"
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Filter Options Preview */}
                        {filter.options.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {filter.options.slice(0, 5).map((option, optionIndex) => (
                              <Badge key={optionIndex} variant="secondary" className="text-xs">
                                {option.displayName || option.value || 'Unnamed Option'}
                              </Badge>
                            ))}
                            {filter.options.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{filter.options.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveCategoryMutation.isPending}
                data-testid="button-save"
              >
                {saveCategoryMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingCategory ? 'Update' : 'Create'} Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filter Edit Dialog */}
        <FilterEditDialog
          filter={editingFilter}
          isOpen={isFilterDialogOpen}
          onClose={() => {
            setIsFilterDialogOpen(false);
            setEditingFilter(null);
          }}
          onSave={handleSaveFilter}
        />
      </div>
    </div>
  );
}

// Filter Edit Dialog Component
interface FilterEditDialogProps {
  filter: CategoryFilter | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (filter: CategoryFilter) => void;
}

function FilterEditDialog({ filter, isOpen, onClose, onSave }: FilterEditDialogProps) {
  const [formData, setFormData] = useState<CategoryFilter>({
    name: '',
    displayName: '',
    type: 'multiselect',
    sortOrder: 0,
    isActive: true,
    options: []
  });

  // Update form data when filter prop changes
  React.useEffect(() => {
    if (filter) {
      setFormData({ ...filter });
    } else {
      setFormData({
        name: '',
        displayName: '',
        type: 'multiselect',
        sortOrder: 0,
        isActive: true,
        options: []
      });
    }
  }, [filter]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.displayName.trim()) {
      return;
    }
    onSave(formData);
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, {
        value: '',
        displayName: '',
        sortOrder: prev.options.length,
        isActive: true
      }]
    }));
  };

  const handleDeleteOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, field: keyof CategoryFilterOption, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const filterTypes = [
    { value: 'multiselect', label: 'Multiple Select' },
    { value: 'singleselect', label: 'Single Select' },
    { value: 'range', label: 'Range' },
    { value: 'boolean', label: 'Yes/No' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {filter?.id ? 'Edit Filter' : 'Create New Filter'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Filter Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filter-name">Filter ID</Label>
              <Input
                id="filter-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., price_range"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used in code (no spaces, use underscores)
              </p>
            </div>

            <div>
              <Label htmlFor="filter-display-name">Display Name</Label>
              <Input
                id="filter-display-name"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., Price Range"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filter-type">Filter Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'range' | 'multiselect' | 'singleselect' | 'boolean') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input
                id="filter-active"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="filter-active">Active</Label>
            </div>
          </div>

          {/* Filter Options */}
          {(formData.type === 'multiselect' || formData.type === 'singleselect' || formData.type === 'range') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Filter Options</Label>
                <Button onClick={handleAddOption} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Input
                      placeholder="Value (e.g., 0-50)"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Display Name (e.g., $0 - $50)"
                      value={option.displayName}
                      onChange={(e) => updateOption(index, 'displayName', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleDeleteOption(index)}
                      variant="outline"
                      size="sm"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {formData.options.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No options yet. Add options for users to filter by.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.displayName.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
