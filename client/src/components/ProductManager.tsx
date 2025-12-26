import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ImageGallery } from '@/components/ImageGallery';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Download, 
  Wallet,
  Star,
  Eye,
  ShoppingCart,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Tags,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronLeft,
  ArrowLeft,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { filterCategories } from '@/data/filterCategories';

// Helper functions
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
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

// Types
interface Product {
  id: string;
  name: string;
  description: string;
  type: 'digital' | 'physical';
  price: string;
  currency: string;
  images: string[]; // Product gallery images
  previewImages: string[]; // Preview images for digital products
  downloadableFiles: ProductFile[]; // Files available for download
  stock?: number;
  category: string;
  tags: string[];
  subcategory?: string;
  fileFormat?: string[];
  style?: string;
  dimensions?: string;
  compatibility?: string[];
  status: 'pending' | 'approved' | 'rejected';
  salesCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  rejectionReason?: string;
}

interface ProductFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: 'main' | 'preview' | 'sample';
  format: string;
  downloadCount?: number;
}

interface CreateProductData {
  name: string;
  description: string;
  type: 'digital' | 'physical';
  price: number;
  currency: string;
  fileUrl?: string;
  downloadLimit?: number;
  images: string[]; // Product gallery images
  previewImages: string[]; // Preview images for showcasing
  downloadableFiles: ProductFile[]; // Files for download
  stock?: number;
  category: string;
  tags: string[];
  subcategory?: string;
  fileFormat?: string[];
  style?: string;
  dimensions?: string;
  compatibility?: string[];
}

// Product Card Component (moved outside to prevent remounting)
const ProductCard = ({ 
  product, 
  onEdit, 
  onDelete, 
  deleteLoading,
  isOwner = false 
}: { 
  product: Product; 
  onEdit: (product: Product) => void; 
  onDelete: (id: string) => void; 
  deleteLoading: boolean;
  isOwner?: boolean; 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const coverImage = product.images?.[0] || product.previewImages?.[0];
  const hoverImage = product.images?.[1] || product.previewImages?.[1];
  const hasHoverEffect = coverImage && hoverImage;
  
  const isVideoUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video');
  };
  
  const currentMedia = isHovered ? hoverImage : coverImage;
  const isCurrentVideo = currentMedia ? isVideoUrl(currentMedia) : false;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 h-full" transition-all duration-300>
      <CardContent className="p-3 sm:p-4 h-full flex flex-col">
        {/* Premium Cover & Hover Image Effect */}
        {hasHoverEffect ? (
          <div 
            className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-gray-100"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isCurrentVideo ? (
              <video
                src={currentMedia}
                className="w-full h-full object-cover transition-all duration-500 ease-in-out transform pointer-events-none"
                style={{
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img 
                src={currentMedia} 
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500 ease-in-out transform pointer-events-none"
                style={{
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
                draggable={false}
              />
            )}
          </div>
        ) : (
          /* Fallback: Enhanced Product Images Gallery with Lightbox */
          <ImageGallery 
            images={[...(product.previewImages || []), ...(product.images || [])]}
            productName={product.name}
          />
        )}
      
      {/* Header with title and status */}
      <div className="mb-3">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 flex-1 overflow-hidden">
            {product.name}
          </h3>
          {product.status === 'pending' && (
            <Badge className={`${getStatusColor(product.status)} flex items-center gap-1 shrink-0 text-xs`}>
              {getStatusIcon(product.status)}
              {product.status}
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 overflow-hidden">
          {product.description}
        </p>
      </div>

      {/* Product type and stats */}
      <div className="mb-3 sm:mb-4 space-y-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <Badge className="text-xs flex-shrink-0 bg-[#0C332C] text-white">
            {product.type === 'digital' ? (
              <><Download className="h-3 w-3 mr-1" /> Digital</>
            ) : (
              <><Package className="h-3 w-3 mr-1" /> Physical</>
            )}
          </Badge>
          <span className="text-xs sm:text-sm text-gray-500 truncate flex-1 min-w-0">{product.category}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm overflow-hidden">
          <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            <span className="font-medium truncate">${product.price}</span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">{product.salesCount} sales</span>
            </div>
          )}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current flex-shrink-0" />
              <span className="truncate">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {product.status === 'rejected' && product.rejectionReason && (
        <div className="mb-4 p-3 bg-primary/10 border border-red-200 rounded-lg">
          <p className="text-sm text-primary line-clamp-3 overflow-hidden">
            <strong>Rejection Reason:</strong> {product.rejectionReason}
          </p>
        </div>
      )}


      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 bg-[#0C332C] text-white border-[#0C332C] shadow-sm flex items-center justify-center"
          onClick={() => onEdit(product)}
          data-testid={`button-edit-${product.id}`}
        >
          <Edit className="h-5 w-5 flex-shrink-0 text-white" style={{ display: 'block' }} />
        </Button>
        {product.type === 'digital' && product.downloadableFiles?.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 bg-[#0C332C] text-white border-[#0C332C] shadow-sm flex items-center justify-center"
            onClick={() => {
              const mainFile = product.downloadableFiles.find(f => f.type === 'main');
              if (mainFile) {
                const link = document.createElement('a');
                link.href = mainFile.url;
                link.download = mainFile.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                alert('Multiple files available. Use individual download buttons above.');
              }
            }}
            data-testid={`button-download-main-${product.id}`}
          >
            <Download className="h-5 w-5 flex-shrink-0 text-white" style={{ display: 'block' }} />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 bg-[#0C332C] text-white border-[#0C332C] shadow-sm flex items-center justify-center"
          onClick={() => onDelete(product.id)}
          disabled={deleteLoading}
          data-testid={`button-delete-${product.id}`}
        >
          <Trash2 className="h-5 w-5 flex-shrink-0 text-white" style={{ display: 'block' }} />
        </Button>
      </div>
    </CardContent>
  </Card>
  );
};

// Product Form Component (moved outside to prevent remounting)  
export const ProductForm = ({ 
  product, 
  onSubmit, 
  isLoading,
  error,
  success
}: { 
  product?: Product; 
  onSubmit: (data: CreateProductData) => void; 
  isLoading: boolean;
  error?: string | null;
  success?: string | null;
}) => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch categories for dropdown
  const { data: categoriesData = [] } = useQuery<any[]>({
    queryKey: ['/api/shop-categories'],
    // Use default queryFn which already handles apiRequest correctly
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState<CreateProductData>({
    name: product?.name || '',
    description: product?.description || '',
    type: product?.type || 'digital',
    price: parseFloat(product?.price || '0'),
    currency: product?.currency || 'USD',
    fileUrl: '',
    downloadLimit: undefined,
    images: product?.images || [],
    previewImages: product?.previewImages || [],
    downloadableFiles: product?.downloadableFiles || [],
    stock: product?.stock || undefined,
    category: product?.category || '',
    tags: product?.tags || [],
    subcategory: product?.subcategory || '',
    fileFormat: product?.fileFormat || [],
    style: product?.style || '',
    dimensions: product?.dimensions || '',
    compatibility: product?.compatibility || [],
  });

  // Reset form data when product prop changes (for edit view)
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        type: product.type || 'digital',
        price: parseFloat(product.price || '0'),
        currency: product.currency || 'USD',
        fileUrl: '',
        downloadLimit: undefined,
        images: product.images || [],
        previewImages: product.previewImages || [],
        downloadableFiles: product.downloadableFiles || [],
        stock: product.stock || undefined,
        category: product.category || '',
        tags: product.tags || [],
        subcategory: product.subcategory || '',
        fileFormat: product.fileFormat || [],
        style: product.style || '',
        dimensions: product.dimensions || '',
        compatibility: product.compatibility || [],
      });
      
      // Pre-select category if product has a subcategory
      if (product.subcategory) {
        const category = filterCategories.find(cat => 
          cat.subcategories.includes(product.subcategory!)
        );
        if (category) {
          setSelectedCategory(category.id);
        }
      }
    }
  }, [product]);
  
  const [imageUploading, setImageUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      setNotification({ type: 'error', message: 'Please select a category for your product.' });
      return;
    }
    
    console.log('📦 Form submit - current formData:', formData);
    console.log('📦 downloadableFiles count:', formData.downloadableFiles.length);
    console.log('📦 downloadableFiles:', JSON.stringify(formData.downloadableFiles, null, 2));
    onSubmit(formData);
  };
  
  // Show notification when error or success props change
  useEffect(() => {
    if (error) {
      setNotification({ type: 'error', message: error });
    } else if (success) {
      setNotification({ type: 'success', message: success });
    }
  }, [error, success]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_SIZE) {
          rejectedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB - exceeds 5MB limit)`);
        } else {
          validFiles.push(file);
        }
      } else {
        validFiles.push(file);
      }
    });

    if (rejectedFiles.length > 0) {
      setNotification({ 
        type: 'error', 
        message: `Videos must be under 5MB: ${rejectedFiles.join(', ')}` 
      });
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setImageUploading(true);
    try {
      const uploadFormData = new FormData();
      validFiles.forEach(file => {
        uploadFormData.append('images', file);
      });

      const result = await apiRequest('/api/products/upload/images', {
        method: 'POST',
        body: uploadFormData,
      });
      if (result.success) {
        const newImages = result.images.map((img: any) => img.url);
        console.log('Image upload success - received URLs:', newImages);
        setFormData(prev => {
          const updated = {
            ...prev,
            images: [...prev.images, ...newImages]
          };
          console.log('Updated form data after image upload:', updated);
          return updated;
        });
        setNotification({ 
          type: 'success', 
          message: `${result.images.length} file(s) added to your product.` 
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to upload media. Please try again.' 
      });
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileUploading(true);
    try {
      const uploadFormData = new FormData();
      const fileTypes: string[] = [];
      
      Array.from(files).forEach((file, index) => {
        uploadFormData.append('files', file);
        fileTypes.push('main');
      });

      uploadFormData.append('fileTypes', JSON.stringify(fileTypes));

      const result = await apiRequest('/api/products/upload/files', {
        method: 'POST',
        body: uploadFormData,
      });
      if (result.success) {
        console.log('🔍 File upload success - received files:', result.files);
        setFormData(prev => {
          const updated = {
            ...prev,
            downloadableFiles: [...prev.downloadableFiles, ...result.files]
          };
          console.log('🔍 Updated form data after file upload:', updated);
          return updated;
        });
        setNotification({ 
          type: 'success', 
          message: `${result.files.length} file(s) added to your product.` 
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to upload files. Please try again.' 
      });
    } finally {
      setFileUploading(false);
      e.target.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Inline Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${notification.type === 'error' ? 'bg-primary/15 border border-red-300 text-red-800' : 'bg-green-100 border border-green-300 text-green-800'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button 
              type="button"
              onClick={() => setNotification(null)}
              className="text-sm hover:opacity-70" transition-all duration-300
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Product Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter product name"
            required
            data-testid="input-product-name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your product..."
          rows={3}
          required
          data-testid="textarea-product-description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Product Type</label>
          <Select 
            value={formData.type} 
            onValueChange={(value: 'digital' | 'physical') => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger data-testid="select-product-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="digital">Digital Download</SelectItem>
              <SelectItem value="physical">Physical Product</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Price ($)</label>
          <Select
            value={formData.price.toString()}
            onValueChange={(value) => setFormData({ ...formData, price: parseFloat(value) })}
          >
            <SelectTrigger data-testid="select-product-price">
              <SelectValue placeholder="Select price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6.99">$6.99</SelectItem>
              <SelectItem value="16.99">$16.99</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.type === 'physical' && (
          <div>
            <label className="block text-sm font-medium mb-2">Stock Quantity</label>
            <Input
              type="number"
              min="0"
              value={formData.stock || ''}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || undefined })}
              placeholder="Leave empty for unlimited"
              data-testid="input-product-stock"
            />
          </div>
        )}
      </div>

      {/* Filter Fields Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Product Filters (For Shop Filtering)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                const category = filterCategories.find(cat => cat.id === value);
                setFormData({ 
                  ...formData, 
                  category: category?.name || '', 
                  subcategory: '' 
                });
              }}
            >
              <SelectTrigger data-testid="select-product-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filterCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium mb-2">Subcategory</label>
              <Select
                value={formData.subcategory || ''}
                onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
              >
                <SelectTrigger data-testid="select-product-subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filterCategories
                    .find(cat => cat.id === selectedCategory)
                    ?.subcategories.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Style</label>
            <Select
              value={formData.style || ''}
              onValueChange={(value) => setFormData({ ...formData, style: value })}
            >
              <SelectTrigger data-testid="select-product-style">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="flat">Flat Design</SelectItem>
                <SelectItem value="3d">3D Render</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="vintage">Vintage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">File Format</label>
            <Select
              value={formData.fileFormat?.[0] || ''}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                fileFormat: value ? [value] : [] 
              })}
            >
              <SelectTrigger data-testid="select-product-file-format">
                <SelectValue placeholder="Select file format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PSD">PSD</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
                <SelectItem value="Sketch">Sketch</SelectItem>
                <SelectItem value="Figma">Figma</SelectItem>
                <SelectItem value="XD">XD</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="PNG">PNG</SelectItem>
                <SelectItem value="JPG">JPG</SelectItem>
                <SelectItem value="SVG">SVG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dimensions</label>
            <Input
              value={formData.dimensions || ''}
              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              placeholder="e.g., 4000x3000px, A4, 1920x1080"
              data-testid="input-product-dimensions"
            />
          </div>
        </div>
      </div>

      {/* Product Images Gallery */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Product Images</label>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-3 mb-2">
          <p className="text-sm text-purple-800 font-medium flex items-center gap-2">
            Premium Hover Effect: Upload 2+ images!
          </p>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-center space-y-3">
            <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload images, GIFs, or videos (max 5MB)</p>
            
            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                id="image-url-input"
                type="url"
                placeholder="Or paste image/video URL"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    const button = document.getElementById('add-image-url-button');
                    if (button) {
                      button.click();
                    }
                  }
                }}
                data-testid="input-image-url"
              />
              <Button
                id="add-image-url-button"
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const input = document.getElementById('image-url-input') as HTMLInputElement;
                  if (!input) return;
                  
                  const url = input.value.trim();
                  if (url) {
                    setFormData(prev => ({
                      ...prev,
                      images: [...prev.images, url]
                    }));
                    input.value = '';
                    setNotification({
                      type: 'success',
                      message: 'Media URL has been added to your product.'
                    });
                  }
                }}
                data-testid="button-add-image-url"
              >
                Add URL
              </Button>
            </div>

            <input
              type="file"
              id="images-upload"
              multiple
              accept="image/*,video/*,.gif"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="mt-2"
              disabled={imageUploading}
              onClick={() => document.getElementById('images-upload')?.click()}
              data-testid="button-upload-images"
            >
              <Upload className="h-4 w-4 mr-2" />
              {imageUploading ? 'Uploading...' : 'Choose Files'}
            </Button>
          </div>
          {formData.images.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {formData.images.map((image, index) => {
                const isVideo = image.match(/\.(mp4|webm|ogg|mov)$/i) || image.includes('video');
                return (
                  <div key={index} className="relative group">
                    {isVideo ? (
                      <video 
                        src={image}
                        className="w-full h-20 object-cover rounded border pointer-events-none"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img 
                        src={image} 
                        alt={`Product media ${index + 1}`}
                        className="w-full h-20 object-cover rounded border pointer-events-none"
                        draggable={false}
                      />
                    )}
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                      {index === 0 ? 'Cover' : index === 1 ? 'Hover' : `#${index + 1}`}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" transition-all duration-300
                      onClick={() => setFormData({
                        ...formData,
                        images: formData.images.filter((_, i) => i !== index)
                      })}
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Digital Product Files */}
      {formData.type === 'digital' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Downloadable Files</label>
          <div className="border border-gray-300 rounded-lg p-4 space-y-3">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Upload files or add file URLs that customers can download</p>
              
              {/* URL Input for Files */}
              <div className="flex gap-2">
                <Input
                  id="file-url-input"
                  type="url"
                  placeholder="Or paste file URL (PDF, ZIP, etc.)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      const button = document.getElementById('add-file-url-button');
                      if (button) {
                        button.click();
                      }
                    }
                  }}
                  data-testid="input-file-url"
                />
                <Button
                  id="add-file-url-button"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const input = document.getElementById('file-url-input') as HTMLInputElement;
                    if (!input) return;
                    
                    const url = input.value.trim();
                    if (url) {
                      const fileName = url.split('/').pop() || 'Downloaded File';
                      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'file';
                      const uniqueId = `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                      
                      const newFile: ProductFile = {
                        id: uniqueId,
                        name: fileName,
                        url: url,
                        size: 0,
                        type: 'main',
                        format: fileExtension.toUpperCase(),
                      };
                      
                      setFormData(prev => ({
                        ...prev,
                        downloadableFiles: [...prev.downloadableFiles, newFile]
                      }));
                      input.value = '';
                      setNotification({
                        type: 'success',
                        message: 'File URL has been added. Users will download through our secure link.'
                      });
                    }
                  }}
                  data-testid="button-add-file-url"
                >
                  Add URL
                </Button>
              </div>

              <input
                type="file"
                id="files-upload"
                multiple
                accept="*/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                disabled={fileUploading}
                onClick={() => document.getElementById('files-upload')?.click()}
                data-testid="button-upload-files"
              >
                <Upload className="h-4 w-4 mr-2" />
                {fileUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
            
            {formData.downloadableFiles.length > 0 && (
              <div className="space-y-2">
                {formData.downloadableFiles.map((file, index) => {
                  const isUrlFile = file.id?.startsWith('url-');
                  return (
                    <div key={file.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            {isUrlFile && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                                Secure Link
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {file.format} • {file.size > 0 ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : 'External URL'} • {file.type}
                          </p>
                        </div>
                      </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={file.type} 
                        onValueChange={(value: 'main' | 'preview' | 'sample') => {
                          const updatedFiles = [...formData.downloadableFiles];
                          updatedFiles[index] = { ...file, type: value };
                          setFormData({ ...formData, downloadableFiles: updatedFiles });
                        }}
                      >
                        <SelectTrigger className="w-24 h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">Main</SelectItem>
                          <SelectItem value="preview">Preview</SelectItem>
                          <SelectItem value="sample">Sample</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setFormData({
                          ...formData,
                          downloadableFiles: formData.downloadableFiles.filter((_, i) => i !== index)
                        })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
            
            {formData.downloadableFiles.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No files uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          data-testid="button-submit-product"
        >
          {isLoading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </Button>
      </div>
    </form>
  );
};

interface ProductManagerProps {
  userRole?: 'freelancer' | 'teacher' | 'admin';
  showAllProducts?: boolean; // For admin to manage all products
}

export function ProductManager({ userRole = 'freelancer', showAllProducts = false }: ProductManagerProps = {}) {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Determine API endpoint based on role and view mode
  const productsEndpoint = showAllProducts && userRole === 'admin' && viewMode === 'all' 
    ? '/api/products/admin/all' 
    : '/api/products/my/products';

  // Fetch products based on role and permissions
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: [productsEndpoint, viewMode],
    queryFn: async () => {
      console.log('🔍 Fetching products from:', productsEndpoint);
      const data = await apiRequest(productsEndpoint);
      console.log('🔍 Products API response:', data);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0, // Always refetch to avoid cache issues
    gcTime: 0, // Don't cache results
  });

  // Fetch performance stats for creator dashboard
  const { data: performanceStats, isLoading: statsLoading } = useQuery<{
    totalDownloads: number;
    totalRevenue: number;
    avgRating: number;
    totalSales: number;
    totalProducts: number;
    approvedProducts: number;
  }>({
    queryKey: ['/api/products/my/performance-stats'],
    enabled: userRole !== 'admin' || viewMode === 'my',
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      // Convert price to string and ensure all required fields are present
      const payload = {
        ...productData,
        price: productData.price.toString(), // Convert number to string
      };
      console.log('🔍 Sending product data:', payload);
      return await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setCreateSuccess("Your product has been submitted for approval.");
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: [productsEndpoint, viewMode] });
      setTimeout(() => {
        setCurrentView('list');
        setCreateSuccess(null);
      }, 2000);
    },
    onError: () => {
      setCreateError("Failed to create product. Please try again.");
      setCreateSuccess(null);
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: Partial<CreateProductData> }) => {
      // Convert price to string if it exists
      const payload = {
        ...productData,
        ...(productData.price !== undefined && { price: productData.price.toString() }),
      };
      return await apiRequest(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setUpdateSuccess("Your product has been updated and submitted for approval.");
      setUpdateError(null);
      queryClient.invalidateQueries({ queryKey: [productsEndpoint, viewMode] });
      setTimeout(() => {
        setCurrentView('list');
        setUpdateSuccess(null);
      }, 2000);
    },
    onError: () => {
      setUpdateError("Failed to update product. Please try again.");
      setUpdateSuccess(null);
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/products/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [productsEndpoint, viewMode] });
    },
    onError: () => {
      // Silent error for delete
    }
  });

  // Get role-specific titles and descriptions
  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: viewMode === 'all' ? 'All Products' : 'My Products',
          description: viewMode === 'all' 
            ? 'Manage all products from freelancers, teachers, and admins'
            : 'Create and manage your own digital and physical products',
          testId: 'admin-product-manager'
        };
      case 'teacher':
        return {
          title: 'My Educational Products',
          description: 'Create and manage your educational materials and courses',
          testId: 'teacher-product-manager'
        };
      case 'freelancer':
      default:
        return {
          title: 'My Products',
          description: 'Create and manage your digital and physical products',
          testId: 'freelancer-product-manager'
        };
    }
  };

  const roleInfo = getRoleInfo();

  // Render different views based on currentView state
  if (currentView === 'create') {
    return (
      <div className="space-y-6" data-testid={roleInfo.testId}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Product</h2>
            <p className="text-gray-600">Add a new product to your shop. It will be submitted for review before going live.</p>
          </div>
        </div>
        
        {/* Full Page Product Form */}
        <Card>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <ProductForm
              onSubmit={(data) => createProductMutation.mutate(data)}
              isLoading={createProductMutation.isPending}
              error={createError}
              success={createSuccess}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'edit' && selectedProduct) {
    return (
      <div className="space-y-6" data-testid={roleInfo.testId}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
            <p className="text-gray-600">Update your product details. Changes will be submitted for review.</p>
          </div>
        </div>
        
        {/* Full Page Product Form */}
        <Card>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <ProductForm
              product={selectedProduct}
              onSubmit={(data) => updateProductMutation.mutate({ 
                id: selectedProduct.id, 
                productData: data 
              })}
              isLoading={updateProductMutation.isPending}
              error={updateError}
              success={updateSuccess}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid={roleInfo.testId}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
        </div>
        <div className="flex items-center gap-3">
          {/* Admin toggle for viewing all products */}
          {userRole === 'admin' && showAllProducts && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'my' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('my')}
                data-testid="button-view-my-products"
              >
                My Products
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
                data-testid="button-view-all-products"
              >
                All Products
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-gray-900" />
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : (performanceStats?.totalProducts || products.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-gray-900" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : (performanceStats?.approvedProducts || products.filter(p => p.status === 'approved').length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-gray-900" />
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : (performanceStats?.totalSales || products.reduce((sum, p) => sum + p.salesCount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-gray-900" />
              <div>
                <p className="text-sm text-gray-600">Your Earnings</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : `$${(
                    performanceStats?.totalRevenue || 
                    products.reduce((sum, p) => sum + (parseFloat(p.price) * p.salesCount), 0)
                  ).toFixed(2)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Product Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => {
            setCreateError(null);
            setCreateSuccess(null);
            setCurrentView('create');
          }}
          className="text-white"
          style={{ backgroundColor: '#0C332C' }}
          data-testid="button-create-product"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-primary">Failed to load products. Please try again.</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/products/my/products'] })}
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">
              Start selling by creating your first product. Digital downloads and physical products are both supported.
            </p>
            <Button 
              onClick={() => {
                setCreateError(null);
                setCreateSuccess(null);
                setCurrentView('create');
              }}
              className="text-white"
              style={{ backgroundColor: '#0C332C' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onEdit={(product) => {
                setSelectedProduct(product);
                setCurrentView('edit');
              }}
              onDelete={(id) => deleteProductMutation.mutate(id)}
              deleteLoading={deleteProductMutation.isPending}
              isOwner={true}
            />
          ))}
        </div>
      )}

    </div>
  );
}
