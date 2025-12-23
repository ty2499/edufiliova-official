import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Clock, User, AlertCircle, X, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: string;
  targetGrades: string[];
  targetSubjects: string[];
  isActive: boolean;
  publishedAt: string;
  expiresAt?: string;
  isRead: boolean;
}

interface AnnouncementFeedProps {
  userId: string;
  className?: string;
  showUnreadCount?: boolean;
}

export const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({
  userId,
  className,
  showUnreadCount = true
}) => {
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch announcements
  const { data: announcements, isLoading, error } = useQuery<{ success: boolean; data: Announcement[] }>({
    queryKey: ['/api/announcements', userId],
    queryFn: async () => {
      const response = await fetch(`/api/announcements/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ success: boolean; unreadCount: number }>({
    queryKey: ['/api/announcements', userId, 'unread-count'],
    queryFn: async () => {
      const response = await fetch(`/api/announcements/${userId}/unread-count`);
      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!userId && showUnreadCount,
  });

  // Mark announcement as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to mark announcement as read');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch announcements and unread count
      queryClient.invalidateQueries({ queryKey: ['/api/announcements', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements', userId, 'unread-count'] });
    },
  });

  // Real-time WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_announcement') {
          // Invalidate announcements query to fetch the new announcement
          queryClient.invalidateQueries({ queryKey: ['/api/announcements', userId] });
          queryClient.invalidateQueries({ queryKey: ['/api/announcements', userId, 'unread-count'] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      socket.close();
    };
  }, [userId, queryClient]);

  const handleMarkAsRead = (announcementId: string) => {
    markAsReadMutation.mutate(announcementId);
  };

  const toggleExpanded = (announcementId: string) => {
    setExpandedAnnouncements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId);
      } else {
        newSet.add(announcementId);
        // Also mark as read when expanded
        if (announcements?.data) {
          const announcement = announcements.data.find((a: Announcement) => a.id === announcementId);
          if (announcement && !announcement.isRead) {
            handleMarkAsRead(announcementId);
          }
        }
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-primary text-white';
      case 'high':
        return 'bg-primary text-white';
      case 'normal':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4" />;
      case 'high':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-primary/10", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-primary">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Unable to load announcements. Please complete your profile setup first.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)} data-testid="announcement-feed">
      {/* Header with unread count */}
      {showUnreadCount && unreadData?.unreadCount && unreadData.unreadCount > 0 && (
        <div className="flex items-center justify-end">
          <Badge 
            variant="default" 
            className="bg-primary text-white"
            data-testid="unread-count-badge"
          >
            {unreadData?.unreadCount} new
          </Badge>
        </div>
      )}
      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="w-full h-4 mb-2" />
                <Skeleton className="w-3/4 h-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Announcements list */}
      {announcements?.data && announcements.data.length > 0 ? (
        <div className="space-y-3">
          {announcements.data.map((announcement: Announcement) => {
            const isExpanded = expandedAnnouncements.has(announcement.id);
            const shouldTruncate = announcement.content.length > 150;
            
            return (
              <Card 
                key={announcement.id} 
                className={cn(
                  "transition-all duration-200 hover:shadow-md cursor-pointer border-l-4",
                  announcement.isRead 
                    ? "border-l-gray-300 bg-white" 
                    : "border-l-[#A0FAB2] bg-green-50/30",
                  announcement.priority === 'urgent' && "border-l-red-500 bg-primary/10/30",
                  announcement.priority === 'high' && "border-l-orange-500 bg-primary/10/30"
                )}
                data-testid={`announcement-${announcement.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#A0FAB2] text-white text-sm">
                          {announcement.authorRole === 'admin' ? 'A' : 'T'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle 
                            className="text-sm font-semibold text-gray-900 truncate"
                            data-testid={`announcement-title-${announcement.id}`}
                          >
                            {announcement.title}
                          </CardTitle>
                          {!announcement.isRead && (
                            <div className="w-2 h-2 bg-[#A0FAB2] rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">{announcement.authorName}</span>
                          <span>•</span>
                          <span className="capitalize">{announcement.authorRole}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(announcement.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge 
                        className={cn("text-xs px-2 py-1", getPriorityColor(announcement.priority))}
                        data-testid={`priority-badge-${announcement.id}`}
                      >
                        <span className="flex items-center gap-1">
                          {getPriorityIcon(announcement.priority)}
                          {announcement.priority}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div 
                    onClick={() => shouldTruncate && toggleExpanded(announcement.id)}
                    className={cn(
                      "text-sm text-gray-700 leading-relaxed",
                      shouldTruncate && "cursor-pointer"
                    )}
                    data-testid={`announcement-content-${announcement.id}`}
                  >
                    {isExpanded || !shouldTruncate 
                      ? announcement.content 
                      : truncateContent(announcement.content)
                    }
                  </div>

                  {shouldTruncate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(announcement.id)}
                      className="mt-2 p-0 h-auto text-[#A0FAB2] hover:text-[#A0FAB2]/80 font-medium"
                      data-testid={`expand-button-${announcement.id}`}
                    >
                      {isExpanded ? (
                        <span className="flex items-center gap-1 text-[#f44e3c]">
                          Show less <ChevronUp className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          Read more <ChevronDown className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  )}

                  {!announcement.isRead && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(announcement.id);
                        }}
                        disabled={markAsReadMutation.isPending}
                        className="text-xs"
                        data-testid={`mark-read-button-${announcement.id}`}
                      >
                        {markAsReadMutation.isPending ? (
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                            Marking as read...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Mark as read
                          </span>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Expiry notice */}
                  {announcement.expiresAt && (
                    <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires on {new Date(announcement.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : !isLoading && (
        <Card className="text-center py-8">
          <CardContent>
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
            <p className="text-gray-500">
              You're all caught up! New announcements will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnnouncementFeed;
