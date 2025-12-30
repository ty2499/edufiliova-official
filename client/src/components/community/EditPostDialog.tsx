import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Post {
  id: string;
  title: string;
  content: string;
  subject?: string;
}

interface EditPostDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; content: string; subject?: string }) => void;
  isLoading?: boolean;
}

export function EditPostDialog({ post, open, onOpenChange, onSubmit, isLoading = false }: EditPostDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: ''
  });

  useEffect(() => {
    if (open && post) {
      setFormData({
        title: post.title,
        content: post.content,
        subject: post.subject || ''
      });
    }
  }, [open, post]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    onSubmit({
      title: formData.title,
      content: formData.content,
      subject: formData.subject || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-post-title">Title</Label>
            <Input
              id="edit-post-title"
              placeholder="What's your post about?"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              data-testid="edit-post-title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="edit-post-content">Content</Label>
            <Textarea
              id="edit-post-content"
              placeholder="Share your thoughts, questions, or knowledge..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[100px]"
              data-testid="edit-post-content"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="edit-post-subject">Subject (optional)</Label>
            <Input
              id="edit-post-subject"
              placeholder="Mathematics, Science, History..."
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              data-testid="edit-post-subject"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit"
              disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
              className="flex-1"
              data-testid="edit-post-submit"
            >
              {isLoading ? 'Updating...' : 'Update Post'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
