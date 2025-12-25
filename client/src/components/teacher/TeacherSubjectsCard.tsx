import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
}

interface TeacherCategoriesCardProps {
  teacherId?: string;
}

// 15 Core Teaching Categories
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
  { id: '15', name: 'Economics' }
];

export function TeacherSubjectsCard({ teacherId }: TeacherCategoriesCardProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
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
        body: JSON.stringify({ categoryIds: selectedCategories })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Teaching categories updated successfully!' });
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
          Check the subjects you specialize in. Students will see you when they search for these categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {TEACHING_CATEGORIES.map((category) => (
                <div 
                  key={category.id}
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <Checkbox 
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
              ))}
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
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      >
                        {category?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            
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
