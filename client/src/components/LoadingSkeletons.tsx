import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CardSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="skeleton-card">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-2" />
      </CardContent>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="skeleton-product-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="skeleton-course-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-4/5" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b" data-testid="skeleton-table-row">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-md border" data-testid="skeleton-table">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b" data-testid="skeleton-list-item">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="rounded-md border" data-testid="skeleton-list">
      {Array.from({ length: items }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6" data-testid="skeleton-profile">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="skeleton-dashboard-stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function GridSkeleton({ 
  items = 6, 
  columns = 3,
  CardComponent = CardSkeleton 
}: { 
  items?: number; 
  columns?: number;
  CardComponent?: () => JSX.Element;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid gap-6 ${gridCols}`} data-testid="skeleton-grid">
      {Array.from({ length: items }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8" data-testid="skeleton-page">
      {title && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      )}
      <DashboardStatsSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <GridSkeleton items={6} />
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6" data-testid="skeleton-form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}

export function ChatMessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`} data-testid="skeleton-chat-message">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className={`space-y-1 ${isOwn ? 'items-end' : ''}`}>
        <Skeleton className="h-4 w-20" />
        <Skeleton className={`h-16 w-64 rounded-lg ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`} />
      </div>
    </div>
  );
}

export function ChatSkeleton({ messages = 5 }: { messages?: number }) {
  return (
    <div className="space-y-4 p-4" data-testid="skeleton-chat">
      {Array.from({ length: messages }).map((_, i) => (
        <ChatMessageSkeleton key={i} isOwn={i % 3 === 0} />
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4" data-testid="skeleton-sidebar">
      <Skeleton className="h-8 w-full rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function InlineLoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div 
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-muted border-t-primary`}
      data-testid="inline-loading-spinner"
    />
  );
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" data-testid="full-page-loader">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export function FeaturedProductsSkeleton() {
  return (
    <div className="space-y-4" data-testid="skeleton-featured-products">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function HeroSectionSkeleton() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] bg-muted animate-pulse" data-testid="skeleton-hero">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        <Skeleton className="h-12 w-3/4 max-w-lg mb-4" />
        <Skeleton className="h-6 w-1/2 max-w-md mb-6" />
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>
    </div>
  );
}

export function NavigationSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4" data-testid="skeleton-navigation">
      <Skeleton className="h-10 w-32" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function MeetingCardSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="skeleton-meeting-card">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 p-4" data-testid="skeleton-message-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className={`space-y-2 max-w-[70%] ${i % 2 === 0 ? '' : 'items-end'}`}>
            <Skeleton className={`h-16 w-48 rounded-lg ${i % 2 === 0 ? 'rounded-bl-none' : 'rounded-br-none'}`} />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1" data-testid="skeleton-conversation-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border-b">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function AnnouncementSkeleton() {
  return (
    <div className="space-y-4 p-4 border rounded-lg" data-testid="skeleton-announcement">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-md" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function BlogPostSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="skeleton-blog-post">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-3 mt-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card data-testid="skeleton-stat-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32 mt-1" />
      </CardContent>
    </Card>
  );
}

export function DataGridSkeleton({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} data-testid="skeleton-data-grid">
      {Array.from({ length: rows * cols }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default {
  CardSkeleton,
  ProductCardSkeleton,
  CourseCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  ProfileSkeleton,
  DashboardStatsSkeleton,
  GridSkeleton,
  PageSkeleton,
  FormSkeleton,
  ChatMessageSkeleton,
  ChatSkeleton,
  SidebarSkeleton,
  InlineLoadingSpinner,
  FullPageLoader,
  FeaturedProductsSkeleton,
  HeroSectionSkeleton,
  NavigationSkeleton,
  MeetingCardSkeleton,
  MessageListSkeleton,
  ConversationListSkeleton,
  AnnouncementSkeleton,
  BlogPostSkeleton,
  StatCardSkeleton,
  DataGridSkeleton,
};
