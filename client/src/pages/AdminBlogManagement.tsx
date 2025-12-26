import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, Pencil, Trash2, Eye, Upload, X, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  "DevOps Success",
  "QA",
  "Continuous Testing",
  "AI Test Scripts",
  "Test Automation",
  "Code Coverage",
  "Education",
  "Technology",
  "Programming",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "Cloud Computing",
  "Cybersecurity",
  "Career Advice",
  "Tutorials",
  "News & Updates",
  "Case Studies",
  "Best Practices",
  "Industry Insights",
  "Product Updates",
  "Community",
  "Other"
];

function AdminBlogManagement() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: CATEGORIES[0],
    coverImage: "",
    youtubeUrl: "",
    isPublished: false
  });

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/admin/blog-posts'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('🚀 Frontend: Creating blog post with data:', data);
      const result = await apiRequest('/api/admin/blog-posts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      console.log('✅ Frontend: Blog post creation response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Frontend: Creation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('❌ Frontend: Blog post creation error:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return await apiRequest(`/api/admin/blog-posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      setIsDialogOpen(false);
      setEditingPost(null);
      resetForm();
    },
    onError: () => {
      // Silent error handling - AJAX only
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/blog-posts/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
    },
    onError: () => {
      // Silent error handling - AJAX only
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      category: CATEGORIES[0],
      coverImage: "",
      youtubeUrl: "",
      isPublished: false
    });
    setSelectedFile(null);
    setImagePreview("");
    setCustomCategory("");
    setIsCustomCategory(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, coverImage: '' }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formDataToUpload = new FormData();
    formDataToUpload.append('file', file);
    formDataToUpload.append('type', 'blog');
    
    const sessionId = localStorage.getItem('sessionId');
    const headers: HeadersInit = {};
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
    }
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formDataToUpload
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to upload image');
    }
    
    return result.url;
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    
    // Check if the post's category is a custom one (not in the predefined list)
    const isCustom = !CATEGORIES.includes(post.category) || post.category === "Other";
    if (isCustom && post.category !== "Other") {
      setIsCustomCategory(true);
      setCustomCategory(post.category);
    } else {
      setIsCustomCategory(false);
      setCustomCategory("");
    }
    
    setFormData({
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
      category: post.category,
      coverImage: post.coverImage || "",
      youtubeUrl: (post as any).youtubeUrl || "",
      isPublished: post.isPublished
    });
    if (post.coverImage) {
      setImagePreview(post.coverImage);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    console.log('🎯 handleSubmit called');
    console.log('📋 Current formData:', formData);
    console.log('🖼️ Selected file:', selectedFile);
    console.log('✏️ Editing post:', editingPost);
    
    try {
      let imageUrl = formData.coverImage;
      
      if (selectedFile) {
        console.log('📤 Uploading image...');
        setIsUploadingImage(true);
        try {
          imageUrl = await uploadImage(selectedFile);
          console.log('✅ Image uploaded:', imageUrl);
          setFormData(prev => ({ ...prev, coverImage: imageUrl }));
        } catch (error) {
          console.error('❌ Image upload failed:', error);
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      }
      
      const dataToSubmit = { ...formData, coverImage: imageUrl };
      console.log('📦 Data to submit:', dataToSubmit);
      
      if (editingPost) {
        console.log('✏️ Calling update mutation');
        updateMutation.mutate({ id: editingPost.id, data: dataToSubmit });
      } else {
        console.log('➕ Calling create mutation');
        createMutation.mutate(dataToSubmit);
      }
    } catch (error) {
      console.error('❌ handleSubmit error:', error);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="w-full p-6 pt-24">
      <Card className="w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin-dashboard?tab=communication")}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Blog Management</h2>
          </div>
          <Button
            onClick={() => {
              setEditingPost(null);
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary text-[#ffffff] transition-all duration-300"
            data-testid="button-create-blog-post"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 border rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors transition-all duration-300"
                data-testid={`blog-post-${post.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      post.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {post.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{post.excerpt}</p>
                  {post.publishedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Published: {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(post)}
                    data-testid={`button-edit-${post.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="text-primary-600 hover:text-primary-700 transition-all duration-300"
                    data-testid={`button-delete-${post.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No blog posts yet. Create your first post!</p>
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Update the blog post details below." : "Fill in the details to create a new blog post."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter blog post title"
                data-testid="input-blog-title"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={isCustomCategory ? "Other" : formData.category} 
                onValueChange={(value) => {
                  if (value === "Other") {
                    setIsCustomCategory(true);
                    setFormData(prev => ({ ...prev, category: customCategory || "" }));
                  } else {
                    setIsCustomCategory(false);
                    setCustomCategory("");
                    setFormData(prev => ({ ...prev, category: value }));
                  }
                }}
              >
                <SelectTrigger data-testid="select-blog-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCustomCategory && (
                <div className="mt-2">
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      setFormData(prev => ({ ...prev, category: e.target.value }));
                    }}
                    placeholder="Enter your custom category"
                    data-testid="input-custom-category"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="coverImage">Cover Image</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Cover preview" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                      data-testid="button-remove-cover-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors transition-all duration-300">
                    <input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-blog-cover-image"
                    />
                    <label htmlFor="coverImage" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload cover image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt (Short Description)</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description for the card"
                rows={2}
                data-testid="textarea-blog-excerpt"
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Full blog post content..."
                rows={10}
                data-testid="textarea-blog-content"
              />
            </div>

            <div>
              <Label htmlFor="youtubeUrl">YouTube Video URL (Optional)</Label>
              <Input
                id="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                data-testid="input-blog-youtube-url"
              />
              <p className="text-xs text-gray-500 mt-1">Paste a YouTube video URL to embed in the blog post</p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                data-testid="switch-blog-published"
              />
              <Label>Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || isUploadingImage}
              data-testid="button-submit-blog-post"
            >
              {isUploadingImage ? "Uploading Image..." : createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminBlogManagement;
