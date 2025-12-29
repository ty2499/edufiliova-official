import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Star, Clock, RefreshCw, Check, Heart, Share2, 
  MessageSquare, Package, Loader2, ChevronLeft, ChevronRight, BadgeCheck
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useFreelancerChat } from '@/contexts/FreelancerChatContext';
import { useToast } from '@/hooks/use-toast';

interface ServicePackage {
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  sellerResponse: string | null;
  createdAt: string;
  reviewerName: string | null;
  reviewerAvatar: string | null;
}

export default function ServiceDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/marketplace/services/:id');
  const serviceId = params?.id;
  const { user, profile } = useAuth();
  const { setIsChatOpen, setFreelancerInfo, setCurrentUserId } = useFreelancerChat();
  const { toast } = useToast();

  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleContactSeller = () => {
    console.log('🟢 handleContactSeller called', { user, profile, freelancer });
    
    if (!user || !profile) {
      navigate('/login');
      return;
    }
    
    if (!freelancer) {
      toast({ title: 'Seller information not available', variant: 'destructive' });
      return;
    }
    
    if (profile.id === freelancer.id) {
      toast({ title: 'You cannot message yourself', variant: 'destructive' });
      return;
    }

    console.log('🟢 Setting chat info', { 
      freelancerId: freelancer.id, 
      freelancerName: freelancer.fullName, 
      profileId: profile.id 
    });
    
    setFreelancerInfo({
      id: freelancer.id,
      name: freelancer.fullName || 'Freelancer',
      avatarUrl: freelancer.profilePicture || undefined,
    });
    setCurrentUserId(profile.id);
    setIsChatOpen(true);
    
    console.log('🟢 Chat should be open now');
  };

  const { data, isLoading } = useQuery({
    queryKey: ['/api/marketplace/services', serviceId],
    queryFn: () => apiRequest(`/api/marketplace/services/${serviceId}`),
    enabled: !!serviceId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['/api/freelancer/orders/services', serviceId, 'reviews'],
    queryFn: () => apiRequest(`/api/freelancer/orders/services/${serviceId}/reviews`),
    enabled: !!serviceId,
  });

  const service = data?.service;
  const reviews: Review[] = reviewsData?.reviews || [];
  const freelancer = service?.freelancer;

  if (!service && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Service not found</h2>
          <Button onClick={() => navigate('/marketplace/services')}>Browse Services</Button>
        </div>
      </div>
    );
  }

  if (isLoading || !service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={() => navigate('/marketplace/services')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-4 animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = service.images || [];
  const packages = service.packages || {};
  const currentPackage: ServicePackage = packages[selectedPackage] || {};

  const handleContinue = () => {
    navigate(`/checkout/service/${serviceId}?package=${selectedPackage}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/marketplace/services')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h1>
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={freelancer?.profilePicture} />
                  <AvatarFallback>{freelancer?.fullName?.[0] || 'F'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{freelancer?.fullName}</p>
                  {freelancer?.displayLevel && (
                    <Badge variant="secondary" className="text-xs">{freelancer.displayLevel}</Badge>
                  )}
                </div>
                {service.rating && parseFloat(service.rating) > 0 && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{parseFloat(service.rating).toFixed(1)}</span>
                    <span className="text-gray-500">({service.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {images.length > 0 && (
              <div className="relative">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={images[currentImageIndex]}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={() => setCurrentImageIndex(i => (i - 1 + images.length) % images.length)}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={() => setCurrentImageIndex(i => (i + 1) % images.length)}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <div className="flex gap-2 mt-4">
                      {images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-20 h-14 rounded overflow-hidden border-2 transition-colors ${
                            idx === currentImageIndex ? 'border-[#0c332c]' : 'border-transparent'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>About This Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{service.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About The Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={freelancer?.profilePicture} />
                    <AvatarFallback className="text-xl">{freelancer?.fullName?.[0] || 'F'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{freelancer?.fullName}</h3>
                      {freelancer?.isVerified && (
                        <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    {freelancer?.displayLevel && (
                      <Badge variant="secondary" className="mb-2">{freelancer.displayLevel}</Badge>
                    )}
                    {freelancer?.bio && (
                      <p className="text-gray-600 text-sm mt-2">{freelancer.bio}</p>
                    )}
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleContactSeller}
                      disabled={!!user && profile?.id === freelancer?.id}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {!user ? 'Sign in to Contact' : 'Contact Seller'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardContent className="p-0">
                  <Tabs value={selectedPackage} onValueChange={(v) => setSelectedPackage(v as any)}>
                    <TabsList className="w-full grid grid-cols-3 rounded-b-none h-auto">
                      {['basic', 'standard', 'premium'].map((tier) => (
                        <TabsTrigger 
                          key={tier} 
                          value={tier}
                          className="py-3 capitalize data-[state=active]:bg-[#0c332c] data-[state=active]:text-white rounded-none first:rounded-tl-lg last:rounded-tr-lg"
                        >
                          {tier}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {(['basic', 'standard', 'premium'] as const).map((tier) => {
                      const pkg = packages[tier] || {};
                      return (
                        <TabsContent key={tier} value={tier} className="p-6 m-0">
                          <div className="flex items-baseline justify-between mb-4">
                            <h3 className="font-semibold text-lg capitalize">{pkg.name || tier}</h3>
                            <span className="text-2xl font-bold">${pkg.price || 0}</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{pkg.description || 'No description'}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {pkg.deliveryDays || 7} days
                            </span>
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-4 h-4" />
                              {pkg.revisions || 0} revisions
                            </span>
                          </div>
                          <Separator className="my-4" />
                          <ul className="space-y-2">
                            {(pkg.features || []).filter(Boolean).map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                  <div className="p-4 pt-0">
                    <Button 
                      className="w-full bg-[#0c332c] text-white hover:bg-[#0c332c] h-12 text-lg"
                      onClick={handleContinue}
                    >
                      Continue (${currentPackage.price || 0})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
