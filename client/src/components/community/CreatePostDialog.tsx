import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; content: string; subject?: string }) => void;
  isLoading?: boolean;
}

export function CreatePostDialog({ open, onOpenChange, onSubmit, isLoading = false }: CreatePostDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    onSubmit({
      title: formData.title,
      content: formData.content,
      subject: formData.subject || undefined
    });
    
    // Reset form
    setFormData({ title: '', content: '', subject: '' });
  };

  const handleClose = () => {
    setFormData({ title: '', content: '', subject: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="What's your post about?"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              data-testid="create-post-title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="post-content">Content</Label>
            <Textarea
              id="post-content"
              placeholder="Share your thoughts, questions, or knowledge..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[100px]"
              data-testid="create-post-content"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="post-subject">Subject (optional)</Label>
            <Input
              id="post-subject"
              placeholder="Mathematics, Science, History..."
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              data-testid="create-post-subject"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit"
              disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
              className="flex-1"
              data-testid="create-post-submit"
            >
              {isLoading ? 'Creating...' : 'Create Post'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
