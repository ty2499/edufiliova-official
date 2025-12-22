import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profilePic?: string;
  };
}

interface ReplyItemProps {
  reply: Reply;
  currentUserId: string;
  onEdit?: (data: { content: string }) => void;
  onDelete?: () => void;
}

export function ReplyItem({ reply, currentUserId, onEdit, onDelete }: ReplyItemProps) {
  const isAuthor = reply.author.id === currentUserId;
  const defaultAvatar = '/default-avatar.png'; // You can set a default avatar path

  return (
    <div className="flex gap-3 p-2 bg-muted/50 rounded" data-testid={`reply-${reply.id}`}>
      <Avatar className="h-6 w-6">
        <AvatarImage 
          src={reply.author.profilePic || defaultAvatar} 
          alt={reply.author.name}
        />
        <AvatarFallback className="text-xs">
          {reply.author.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{reply.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(reply.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          {/* Edit/Delete buttons for reply author */}
          {isAuthor && (onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit({ content: reply.content })}
                  data-testid={`edit-reply-${reply.id}`}
                  className="h-6 w-6 p-0"
                  title="Edit reply"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  data-testid={`delete-reply-${reply.id}`}
                  className="h-6 w-6 p-0"
                  title="Delete reply"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground mt-1">
          {reply.content}
        </div>
      </div>
    </div>
  );
}
