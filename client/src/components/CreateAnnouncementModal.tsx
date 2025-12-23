import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, AlertTriangle, Info, Bell, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CreateAnnouncementModalProps {
  trigger?: React.ReactNode;
  className?: string;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  trigger,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [targetAudience, setTargetAudience] = useState<'all' | 'grade_specific'>('all');
  const [targetGrades, setTargetGrades] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create announcement');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate announcements queries for all users
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      
      setSuccess('Announcement published successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reset form
      setTitle('');
      setContent('');
      setPriority('normal');
      setTargetAudience('all');
      setTargetGrades([]);
      setExpiresAt('');
      setOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to create announcement');
      setTimeout(() => setError(''), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Please provide both title and content for the announcement.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const announcementData = {
      authorId: user?.id,
      title: title.trim(),
      content: content.trim(),
      priority,
      targetAudience,
      targetGrades: targetAudience === 'grade_specific' ? targetGrades : [],
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    createAnnouncementMutation.mutate(announcementData);
  };

  const handleGradeToggle = (grade: string) => {
    setTargetGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <Bell className="w-4 h-4" />;
      case 'normal':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <Clock className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-primary text-white hover:bg-primary';
      case 'high':
        return 'bg-primary text-white hover:bg-primary';
      case 'normal':
        return 'bg-blue-500 text-white hover:bg-primary';
      case 'low':
        return 'bg-gray-500 text-white hover:bg-gray-600';
      default:
        return 'bg-blue-500 text-white hover:bg-primary';
    }
  };

  const grades = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="bg-[#A0FAB2] text-black hover:bg-[#A0FAB2]/90"
            data-testid="create-announcement-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#A0FAB2]" />
            Create New Announcement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Announcement Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title..."
              className="w-full"
              data-testid="announcement-title-input"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Content *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement content here..."
              rows={5}
              className="w-full resize-none"
              data-testid="announcement-content-input"
            />
            <p className="text-xs text-gray-500">
              {content.length}/1000 characters
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Priority Level</Label>
            <div className="flex gap-2 flex-wrap">
              {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriority(p)}
                  className={priority === p ? getPriorityColor(p) : ""}
                  data-testid={`priority-${p}-button`}
                >
                  {getPriorityIcon(p)}
                  <span className="ml-1 capitalize">{p}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Target Audience</Label>
            <Select value={targetAudience} onValueChange={(value: 'all' | 'grade_specific') => setTargetAudience(value)}>
              <SelectTrigger data-testid="target-audience-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="grade_specific">Specific Grades</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grade Selection */}
          {targetAudience === 'grade_specific' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Grades</Label>
              <div className="flex gap-2 flex-wrap">
                {grades.map((grade) => (
                  <Button
                    key={grade}
                    type="button"
                    variant={targetGrades.includes(grade) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGradeToggle(grade)}
                    className={targetGrades.includes(grade) ? "bg-[#A0FAB2] text-black hover:bg-[#A0FAB2]/90" : ""}
                    data-testid={`grade-${grade}-button`}
                  >
                    Grade {grade}
                  </Button>
                ))}
              </div>
              {targetGrades.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Selected: {targetGrades.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expires" className="text-sm font-medium">
              Expiration Date (Optional)
            </Label>
            <Input
              id="expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full"
              data-testid="expiration-date-input"
            />
            <p className="text-xs text-gray-500">
              Leave empty for permanent announcements
            </p>
          </div>

          {/* Preview */}
          {(title || content) && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Preview
              </h4>
              <div className="space-y-2">
                {title && (
                  <h5 className="font-semibold text-gray-900">{title}</h5>
                )}
                {content && (
                  <p className="text-sm text-gray-700">{content}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(priority)}>
                    {getPriorityIcon(priority)}
                    <span className="ml-1 capitalize">{priority}</span>
                  </Badge>
                  <Badge variant="outline">
                    {targetAudience === 'all' ? 'All Students' : `Grades: ${targetGrades.join(', ')}`}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createAnnouncementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || createAnnouncementMutation.isPending}
              className="bg-[#A0FAB2] text-black hover:bg-[#A0FAB2]/90"
              data-testid="submit-announcement-button"
            >
              {createAnnouncementMutation.isPending ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-black mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publish Announcement
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnnouncementModal;
