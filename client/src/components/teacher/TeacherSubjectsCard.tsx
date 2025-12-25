import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

interface Subject {
  id: string;
  name: string;
  gradeSystem: string;
  gradeLevel: number;
  description?: string;
}

interface TeacherSubject {
  id: string;
  subjectId: string;
  isPrimary: boolean;
  subjectName: string;
  gradeSystem: string;
  gradeLevel: number;
}

interface TeacherSubjectsCardProps {
  teacherId?: string;
}

export function TeacherSubjectsCard({ teacherId }: TeacherSubjectsCardProps) {
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
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
      
      const [availableRes, teacherRes] = await Promise.all([
        fetch('/api/subjects/available', {
          headers: { Authorization: `Bearer ${sessionId}` }
        }),
        fetch(`/api/teacher/${teacherId}/subjects`, {
          headers: { Authorization: `Bearer ${sessionId}` }
        })
      ]);
      
      const availableData = await availableRes.json();
      const teacherData = await teacherRes.json();
      
      if (availableData.success) {
        setAvailableSubjects(availableData.subjects || []);
      }
      
      if (teacherData.success) {
        const selected = (teacherData.subjects || []).map((s: TeacherSubject) => s.subjectId);
        setSelectedSubjectIds(selected);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSave = async () => {
    if (!teacherId) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/${teacherId}/subjects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subjectIds: selectedSubjectIds })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Subjects updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update subjects' });
      }
    } catch (error) {
      console.error('Error saving subjects:', error);
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const groupedSubjects = availableSubjects.reduce((acc, subject) => {
    const key = `${subject.gradeSystem} - Grade ${subject.gradeLevel}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Subjects I Teach
        </CardTitle>
        <CardDescription>
          Select the subjects you teach. Students will see you when they search for these subjects.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : availableSubjects.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No subjects available yet.</p>
        ) : (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Subjects to Teach</label>
              <Select onValueChange={(subjectId) => toggleSubject(subjectId)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a subject to add..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableSubjects.map((subject) => (
                    <SelectItem 
                      key={subject.id} 
                      value={subject.id}
                      disabled={selectedSubjectIds.includes(subject.id)}
                    >
                      <span className="text-sm">
                        {subject.name} ({subject.gradeSystem} - Grade {subject.gradeLevel})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubjectIds.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">Selected Subjects ({selectedSubjectIds.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSubjectIds.map((subjectId) => {
                    const subject = availableSubjects.find(s => s.id === subjectId);
                    return (
                      <Badge 
                        key={subjectId}
                        variant="secondary" 
                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      >
                        <span className="text-xs">
                          {subject?.name} ({subject?.gradeSystem} G{subject?.gradeLevel})
                        </span>
                        <button
                          onClick={() => toggleSubject(subjectId)}
                          className="ml-1 hover:opacity-70 transition-opacity"
                          aria-label="Remove subject"
                        >
                          <X className="h-3 w-3" />
                        </button>
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
                disabled={saving || selectedSubjectIds.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Subjects'
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
