import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, Filter, Star, Clock, Package, Loader2, ChevronDown
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface MarketplaceServicesPageProps {
  embedded?: boolean;
  [key: string]: any;
}

interface MarketplaceService {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  packages: Record<string, any>;
  rating: string | null;
  reviewCount: number;
  orderCount: number;
  freelancer: {
    id: string;
    name: string;
    profilePicture: string;
    displayLevel?: string;
  };
}

const CATEGORIES = [
  'All Categories',
  'Graphics & Design',
  'Digital Marketing',
  'Writing & Translation',
  'Video & Animation',
  'Programming & Tech',
  'Business',
  'Music & Audio',
  'Education & Tutoring',
];

export default function MarketplaceServicesPage({ embedded = false }: MarketplaceServicesPageProps) {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [priceRange, setPriceRange] = useState('');
  
  // Check if accessing from dashboard (hide header/footer)
  const urlParams = new URLSearchParams(window.location.search);
  const isFromDashboard = urlParams.get('from') === 'dashboard' || embedded;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/marketplace/services', { search: searchQuery, category, sortBy, priceRange }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (category && category !== 'All Categories') params.append('category', category);
      if (sortBy) params.append('sortBy', sortBy);
      if (priceRange) params.append('priceRange', priceRange);
      return apiRequest(`/api/marketplace/services?${params.toString()}`);
    },
  });

  const services: MarketplaceService[] = data?.services || [];

  const getLowestPrice = (packages: Record<string, any>) => {
    const prices = Object.values(packages).map(p => parseFloat(p?.price || 0)).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const getDeliveryDays = (packages: Record<string, any>) => {
    const days = Object.values(packages).map(p => parseInt(p?.deliveryDays || 0)).filter(d => d > 0);
    return days.length > 0 ? Math.min(...days) : null;
  };

  const pageContent = (
    <div className={isFromDashboard ? "" : "min-h-screen bg-gray-50"}>
      {!isFromDashboard && (
        <div className="bg-[#0c332c] text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-6">Find Services</h1>
            <div className="flex gap-4 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search for services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white text-gray-900"
                />
              </div>
              <Button className="h-12 px-6 bg-white text-[#0c332c] hover:bg-gray-100">
                Search
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${embedded ? 'py-4' : 'py-8'}`}>
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Best Rating</SelectItem>
              <SelectItem value="orders">Most Orders</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Budget</SelectItem>
              <SelectItem value="0-25">Under $25</SelectItem>
              <SelectItem value="25-50">$25 - $50</SelectItem>
              <SelectItem value="50-100">$50 - $100</SelectItem>
              <SelectItem value="100-500">$100 - $500</SelectItem>
              <SelectItem value="500+">$500+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {services.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card 
                key={service.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/marketplace/services/${service.id}`)}
              >
                <div className="aspect-[4/3] relative bg-gray-100 overflow-hidden">
                  {service.images?.[0] ? (
                    <img
                      src={service.images[0]}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={service.freelancer?.profilePicture} />
                      <AvatarFallback>{service.freelancer?.name?.[0] || 'F'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600 truncate">{service.freelancer?.name}</span>
                    {service.freelancer?.displayLevel && (
                      <Badge variant="secondary" className="text-xs">{service.freelancer.displayLevel}</Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 min-h-[48px]">{service.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {service.rating && parseFloat(service.rating) > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{parseFloat(service.rating).toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({service.reviewCount})</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">New</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-gray-500 uppercase">Starting at</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${getLowestPrice(service.packages).toFixed(0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isFromDashboard) {
    return pageContent;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={(page) => navigate(`/${page}`)} currentPage="freelancer" />
      <main className="flex-1">
        {pageContent}
      </main>
      <Footer onNavigate={(page) => navigate(`/${page}`)} />
    </div>
  );
}
