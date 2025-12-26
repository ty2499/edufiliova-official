import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, Calendar, Target, MapPin, Clock, TrendingUp, Search, Pause, Play, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface BannerAd {
  id: string;
  title: string;
  imageUrl: string;
  size: string;
  status: string;
  approvalStatus: string;
  durationDays: number;
  targetDashboards: string[];
  targetLocations: string[] | null;
  impressions: number;
  clicks: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface MyAdsProps {
  userRole?: 'student' | 'teacher' | 'freelancer' | 'customer';
}

export default function MyAds({ userRole = 'customer' }: MyAdsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteAdId, setDeleteAdId] = useState<string | null>(null);

  const { data: adsData, isLoading } = useQuery<BannerAd[]>({
    queryKey: ['/api/ads/my-ads'],
  });

  const ads = adsData || [];
  
  // Debug logging
  console.log('🎯 MyAds - adsData:', adsData);
  console.log('🎯 MyAds - ads array:', ads);
  console.log('🎯 MyAds - ads.length:', ads.length);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (adId: string) => {
      const response = await apiRequest(`/api/ads/${adId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads/my-ads'] });
      setDeleteAdId(null);
    },
  });

  // Pause/Resume mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ adId, newStatus }: { adId: string; newStatus: 'paused' | 'approved' }) => {
      const response = await apiRequest(`/api/ads/${adId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads/my-ads'] });
    },
  });

  const getStatusColor = (status: string, approvalStatus: string) => {
    if (approvalStatus === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (approvalStatus === 'rejected') return 'bg-primary/15 text-red-800 border-red-300';
    if (status === 'approved') return 'bg-green-100 text-green-800 border-green-300';
    if (status === 'paused') return 'bg-gray-100 text-gray-800 border-gray-300';
    if (status === 'expired') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (status: string, approvalStatus: string) => {
    if (approvalStatus === 'pending') return 'Pending Approval';
    if (approvalStatus === 'rejected') return 'Rejected';
    if (status === 'approved') return 'Active';
    if (status === 'paused') return 'Paused';
    if (status === 'expired') return 'Expired';
    return status;
  };

  const getDashboardLabel = (dashboard: string) => {
    const labels: Record<string, string> = {
      'student_dashboard': 'Student',
      'teacher_dashboard': 'Teacher',
      'freelancer_dashboard': 'Freelancer',
      'customer_dashboard': 'Customer',
      'advertise_page': 'Advertise Page',
      'learner': 'Student',
      'teacher': 'Teacher',
      'freelancer': 'Freelancer',
      'customer': 'Customer',
    };
    return labels[dashboard] || dashboard;
  };

  const handlePauseResume = (ad: BannerAd) => {
    const newStatus = ad.status === 'paused' ? 'approved' : 'paused';
    toggleStatusMutation.mutate({ adId: ad.id, newStatus });
  };

  const handleDeleteClick = (adId: string) => {
    setDeleteAdId(adId);
  };

  const handleDeleteConfirm = () => {
    if (deleteAdId) {
      deleteMutation.mutate(deleteAdId);
    }
  };

  // Filter ads based on search query
  const filteredAds = ads.filter((ad) =>
    ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ad.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card data-testid="card-my-ads">
        <CardHeader>
          <CardTitle>My Ads</CardTitle>
          <CardDescription>Loading your advertisement campaigns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ads.length === 0) {
    return (
      <Card data-testid="card-my-ads">
        <CardHeader>
          <CardTitle>My Ads</CardTitle>
          <CardDescription>Your advertisement campaigns will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6">Create your first banner ad campaign to reach your target audience</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="card-my-ads">
        <CardHeader>
          <CardTitle>My Ads</CardTitle>
          <CardDescription>Track and manage your advertisement campaigns</CardDescription>
          
          {/* Search Input */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search ads by title or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-ads"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAds.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No ads found</h3>
              <p className="text-gray-600">Try adjusting your search query</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow transition-all duration-300"
                  data-testid={`ad-card-${ad.id}`}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Ad Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-full md:w-48 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                          data-testid={`ad-image-${ad.id}`}
                        />
                      </div>
                    </div>

                    {/* Ad Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900" data-testid={`ad-title-${ad.id}`}>
                            {ad.title}
                          </h3>
                          <p className="text-sm text-gray-600">{ad.size} px banner</p>
                        </div>
                        <Badge 
                          className={getStatusColor(ad.status, ad.approvalStatus)}
                          data-testid={`ad-status-${ad.id}`}
                        >
                          {getStatusText(ad.status, ad.approvalStatus)}
                        </Badge>
                      </div>

                      {/* Campaign Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Target className="w-4 h-4 flex-shrink-0" />
                          <span>{ad.targetDashboards?.map(d => getDashboardLabel(d)).join(', ') || 'All'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{ad.durationDays} days</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{ad.targetLocations ? `${ad.targetLocations.length} countries` : 'Global'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{format(new Date(ad.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      {/* Performance Metrics - Only show for active/completed ads */}
                      {(ad.status === 'approved' || ad.status === 'expired') && (
                        <div className="flex gap-6 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <div className="text-sm">
                              <span className="font-semibold text-gray-900">{ad.impressions.toLocaleString()}</span>
                              <span className="text-gray-600 ml-1">views</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <div className="text-sm">
                              <span className="font-semibold text-gray-900">{ad.clicks.toLocaleString()}</span>
                              <span className="text-gray-600 ml-1">clicks</span>
                            </div>
                          </div>
                          {ad.impressions > 0 && (
                            <div className="text-sm">
                              <span className="text-gray-600">CTR: </span>
                              <span className="font-semibold text-gray-900">
                                {((ad.clicks / ad.impressions) * 100).toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Campaign Dates - Only show for active/completed ads */}
                      {ad.startDate && ad.endDate && (
                        <div className="text-xs text-gray-500">
                          {format(new Date(ad.startDate), 'MMM d')} - {format(new Date(ad.endDate), 'MMM d, yyyy')}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {/* Only show pause/resume for approved or paused ads */}
                        {(ad.status === 'approved' || ad.status === 'paused') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseResume(ad)}
                            disabled={toggleStatusMutation.isPending}
                            data-testid={`button-${ad.status === 'paused' ? 'resume' : 'pause'}-${ad.id}`}
                          >
                            {ad.status === 'paused' ? (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            )}
                          </Button>
                        )}

                        {/* Delete button - available for all ads */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(ad.id)}
                          disabled={deleteMutation.isPending}
                          className="text-primary hover:text-primary hover:bg-primary/10 transition-all duration-300"
                          data-testid={`button-delete-${ad.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAdId !== null} onOpenChange={() => setDeleteAdId(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your ad campaign and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-primary hover:bg-red-700 text-white transition-all duration-300"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
