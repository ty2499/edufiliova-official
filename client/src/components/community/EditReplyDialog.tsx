import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

interface EditReplyDialogProps {
  reply: Reply;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { content: string }) => void;
  isLoading?: boolean;
}

export function EditReplyDialog({ reply, open, onOpenChange, onSubmit, isLoading = false }: EditReplyDialogProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (open && reply) {
      setContent(reply.content);
    }
  }, [open, reply]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onSubmit({ content: content.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Reply</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-reply-content">Reply</Label>
            <Textarea
              id="edit-reply-content"
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px]"
              data-testid="edit-reply-content"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="edit-reply-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!content.trim() || isLoading}
              data-testid="edit-reply-submit"
            >
              {isLoading ? 'Updating...' : 'Update Reply'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
