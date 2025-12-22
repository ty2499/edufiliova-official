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
import { Input } from '@/components/ui/input';
import { 
  Eye,
  Heart,
  MessageCircle,
  Trash2,
  Ban,
  Search,
  Filter,
  Calendar,
  User,
  Tags,
  ExternalLink,
  AlertTriangle,
  Shield,
  Clock,
  Globe,
  Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Types
interface LivePortfolio {
  id: string;
  title: string;
  description: string;
  media: string[];
  tags: string[];
  status: 'approved' | 'rejected' | 'suspended';
  viewCount: number;
  likeCount: number;
  createdAt: string;
  approvedAt: string;
  freelancer: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

interface ModerationAction {
  action: 'suspend' | 'delete';
  reason: string;
}

export function PortfolioMonitoringDashboard() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<LivePortfolio | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'views'>('recent');
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [moderationAction, setModerationAction] = useState<'suspend' | 'delete'>('suspend');
  const queryClient = useQueryClient();

  // Fetch live portfolios
  const { data: portfolios = [], isLoading, error } = useQuery<LivePortfolio[]>({
    queryKey: ['/api/showcase/admin/live', { search: searchTerm, sort: sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'approved',
        search: searchTerm,
        sort: sortBy,
        limit: '50'
      });
      const response = await apiRequest(`/api/showcase/admin/all?${params}`);
      return response.data || [];
    }
  });

  // Moderation mutation (suspend/delete)
  const moderationMutation = useMutation({
    mutationFn: async ({ portfolioId, action }: { portfolioId: string; action: ModerationAction }) => {
      if (action.action === 'delete') {
        return apiRequest(`/api/showcase/${portfolioId}`, {
          method: 'DELETE'
        });
      } else {
        return apiRequest(`/api/showcase/${portfolioId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'rejected',
            rejectionReason: action.reason
          })
        });
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/showcase/admin/live'] });
      setSelectedPortfolio(null);
      setModerationReason('');
      setShowModerationDialog(false);
      
      const actionText = variables.action.action === 'delete' ? 'deleted' : 'suspended';},
    onError: (error: any) => {}
  });

  const handleModeration = () => {
    if (!selectedPortfolio || !moderationReason.trim()) {return;
    }

    const action: ModerationAction = {
      action: moderationAction,
      reason: moderationReason.trim()
    };

    moderationMutation.mutate({ portfolioId: selectedPortfolio.id, action });
  };

  const openModerationDialog = (portfolio: LivePortfolio, action: 'suspend' | 'delete') => {
    setSelectedPortfolio(portfolio);
    setModerationAction(action);
    setModerationReason('');
    setShowModerationDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActionIcon = (action: string) => {
    return action === 'delete' ? <Trash2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    return action === 'delete' ? 'text-red-600' : 'text-orange-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading live portfolios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-gray-600">Failed to load portfolios. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Portfolio Monitoring
          </h1>
          <p className="text-gray-600 mt-1">Monitor and moderate live portfolios</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {portfolios.length} Live Portfolios
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search portfolios, creators, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-portfolios"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
                data-testid="button-sort-recent"
              >
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('popular')}
                data-testid="button-sort-popular"
              >
                <Heart className="h-4 w-4 mr-2" />
                Popular
              </Button>
              <Button
                variant={sortBy === 'views' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('views')}
                data-testid="button-sort-views"
              >
                <Eye className="h-4 w-4 mr-2" />
                Views
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No portfolios found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'No live portfolios are currently available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={portfolio.freelancer.avatarUrl} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">
                        {portfolio.freelancer.displayName || portfolio.freelancer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(portfolio.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Live
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Portfolio Preview */}
                {portfolio.media && portfolio.media.length > 0 && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={portfolio.media[0]} 
                      alt={portfolio.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Portfolio Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {portfolio.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                    {portfolio.description}
                  </p>

                  {/* Tags */}
                  {portfolio.tags && portfolio.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {portfolio.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {portfolio.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{portfolio.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {portfolio.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {portfolio.likeCount}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-orange-600 hover:text-orange-700"
                      onClick={() => openModerationDialog(portfolio, 'suspend')}
                      data-testid={`button-suspend-${portfolio.id}`}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => openModerationDialog(portfolio, 'delete')}
                      data-testid={`button-delete-${portfolio.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Moderation Dialog */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${getActionColor(moderationAction)}`}>
              {getActionIcon(moderationAction)}
              {moderationAction === 'delete' ? 'Delete Portfolio' : 'Suspend Portfolio'}
            </DialogTitle>
            <DialogDescription>
              {moderationAction === 'delete' 
                ? 'This will permanently remove the portfolio. This action cannot be undone.'
                : 'This will hide the portfolio from public view. The creator will be notified.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedPortfolio && (
            <div className="space-y-4">
              {/* Portfolio Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">{selectedPortfolio.title}</h4>
                <p className="text-xs text-gray-600">
                  by {selectedPortfolio.freelancer.displayName || selectedPortfolio.freelancer.name}
                </p>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for {moderationAction} <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder={`Explain why you are ${moderationAction === 'delete' ? 'deleting' : 'suspending'} this portfolio...`}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  rows={3}
                  data-testid="textarea-moderation-reason"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModerationDialog(false)}
                  disabled={moderationMutation.isPending}
                  data-testid="button-cancel-moderation"
                >
                  Cancel
                </Button>
                <Button
                  variant={moderationAction === 'delete' ? 'destructive' : 'default'}
                  className={`flex-1 ${moderationAction === 'suspend' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  onClick={handleModeration}
                  disabled={moderationMutation.isPending || !moderationReason.trim()}
                  data-testid="button-confirm-moderation"
                >
                  {moderationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {getActionIcon(moderationAction)}
                      <span className="ml-2">
                        {moderationAction === 'delete' ? 'Delete Portfolio' : 'Suspend Portfolio'}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
