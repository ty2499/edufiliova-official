import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, Search, MoreVertical, Edit, Trash2, Eye, EyeOff, 
  Package, DollarSign, Clock, Star, ShoppingCart, Loader2, ArrowLeft
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FreelancerService {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  packages: Record<string, any>;
  status: string;
  viewCount: number;
  orderCount: number;
  rating: string | null;
  reviewCount: number;
  createdAt: string;
}

export default function FreelancerServicesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ['/api/freelancer/services/my'],
    queryFn: () => apiRequest('/api/freelancer/services/my'),
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c332c]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in</h3>
          <p className="text-gray-500 mb-4">You need to be logged in to view your services</p>
          <Button onClick={() => navigate('/login')} className="bg-[#0c332c]">Sign In</Button>
        </div>
      </div>
    );
  }

  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => apiRequest(`/api/freelancer/services/${serviceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/services/my'] });
      toast({ title: 'Service deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete service', variant: 'destructive' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ serviceId, status }: { serviceId: string; status: string }) =>
      apiRequest(`/api/freelancer/services/${serviceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/services/my'] });
      toast({ title: 'Service status updated' });
    },
  });

  const services: FreelancerService[] = servicesData?.services || [];
  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLowestPrice = (packages: Record<string, any>) => {
    const prices = Object.values(packages).map(p => parseFloat(p?.price || 0)).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c332c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Services</h1>
            <p className="text-xs sm:text-sm text-gray-500">Manage your services and gigs</p>
          </div>
          {/* Mobile: Icon only */}
          <Button 
            size="icon" 
            onClick={() => navigate('/dashboard/freelancer/services/new')} 
            className="bg-[#0c332c] text-white hover:bg-[#0c332c] sm:hidden"
          >
            <Plus className="w-5 h-5" />
          </Button>
          {/* Desktop: Full button */}
          <Button 
            onClick={() => navigate('/dashboard/freelancer/services/new')} 
            className="bg-[#0c332c] text-white hover:bg-[#0c332c] hidden sm:flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Service
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-500 mb-4">Create your first service to start earning</p>
              <Button onClick={() => navigate('/dashboard/freelancer/services/new')} className="bg-[#0c332c] text-white hover:bg-[#0c332c]">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative bg-gray-100">
                  {service.images?.[0] ? (
                    <img
                      src={service.images[0]}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(service.status)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{service.category}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {service.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      {service.orderCount}
                    </span>
                    {service.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {parseFloat(service.rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#0c332c]">
                      From ${getLowestPrice(service.packages).toFixed(2)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/dashboard/freelancer/services/${service.id}/edit`)}
                          className="hover:bg-[#0c332c] hover:text-white focus:bg-[#0c332c] focus:text-white"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate(`/marketplace/services/${service.id}`)}
                          className="hover:bg-[#0c332c] hover:text-white focus:bg-[#0c332c] focus:text-white"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Live
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleStatusMutation.mutate({
                            serviceId: service.id,
                            status: service.status === 'published' ? 'paused' : 'published'
                          })}
                          className="hover:bg-[#0c332c] hover:text-white focus:bg-[#0c332c] focus:text-white"
                        >
                          {service.status === 'published' ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white"
                          onClick={() => deleteMutation.mutate(service.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
