import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
}

interface TeacherCategoriesCardProps {
  teacherId?: string;
}

// 31+ Teaching Categories
const TEACHING_CATEGORIES: Category[] = [
  { id: '1', name: 'English' },
  { id: '2', name: 'Spanish' },
  { id: '3', name: 'Mathematics' },
  { id: '4', name: 'Science' },
  { id: '5', name: 'Physics' },
  { id: '6', name: 'Chemistry' },
  { id: '7', name: 'Biology' },
  { id: '8', name: 'History' },
  { id: '9', name: 'Geography' },
  { id: '10', name: 'Computer Science' },
  { id: '11', name: 'Art' },
  { id: '12', name: 'Music' },
  { id: '13', name: 'Physical Education' },
  { id: '14', name: 'Philosophy' },
  { id: '15', name: 'Economics' },
  { id: '16', name: 'Accounting' },
  { id: '17', name: 'Dutch' },
  { id: '18', name: 'Chinese' },
  { id: '19', name: 'Deutsch' },
  { id: '20', name: 'Portuguese' },
  { id: '21', name: 'Mooré' },
  { id: '22', name: 'French' },
  { id: '23', name: 'Italian' },
  { id: '24', name: 'Japanese' },
  { id: '25', name: 'Korean' },
  { id: '26', name: 'Arabic' },
  { id: '27', name: 'Statistics' },
  { id: '28', name: 'Business' },
  { id: '29', name: 'Law' },
  { id: '30', name: 'Psychology' },
  { id: '31', name: 'Literature' }
];

export function TeacherSubjectsCard({ teacherId }: TeacherCategoriesCardProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (teacherId) {
      fetchData();
    }
  }, [teacherId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`/api/teacher/${teacherId}/categories`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const categoryIds = (data.categories || []).map((c: Category) => c.id);
        setSelectedCategories(categoryIds);
        setSpecialization(data.specialization || '');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = (categoryId: string) => {
    if (!selectedCategories.includes(categoryId)) {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
  };

  const handleSave = async () => {
    if (!teacherId) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/${teacherId}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          categoryIds: selectedCategories,
          specialization: specialization.trim()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Teaching categories and specialization updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update categories' });
      }
    } catch (error) {
      console.error('Error saving categories:', error);
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Teaching Categories
        </CardTitle>
        <CardDescription>
          Select the subjects you specialize in. Students will see you when they search for these categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Label htmlFor="category-select" className="text-base font-semibold">
                Select Categories
              </Label>
              <Select onValueChange={addCategory}>
                <SelectTrigger id="category-select" className="w-full">
                  <SelectValue placeholder="Choose a category to add..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {TEACHING_CATEGORIES.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      disabled={selectedCategories.includes(category.id)}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Click the dropdown to select categories. You can add multiple.
              </p>
            </div>

            {selectedCategories.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">Selected Categories ({selectedCategories.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((categoryId) => {
                    const category = TEACHING_CATEGORIES.find(c => c.id === categoryId);
                    return (
                      <Badge 
                        key={categoryId}
                        className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-[#2f5a4e] hover:text-white transition-colors cursor-pointer"
                      >
                        <span>{category?.name}</span>
                        <button
                          onClick={() => removeCategory(categoryId)}
                          className="ml-1 hover:opacity-70 transition-opacity"
                          aria-label="Remove category"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t">
              <Label htmlFor="specialization" className="text-base font-semibold">
                What do you teach? (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Add details about your teaching focus, experience, or specialization (e.g., "Advanced AP Physics", "IELTS Exam Prep")
              </p>
              <Textarea
                id="specialization"
                placeholder="Tell students about your specialization and what you can teach them..."
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="min-h-24 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {specialization.length}/500
              </p>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap pt-4 border-t">
              <Button 
                className="bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white"
                onClick={handleSave}
                disabled={saving || selectedCategories.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Categories'
                )}
              </Button>
              {message && (
                <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {message.text}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
