import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Loader2 } from 'lucide-react';
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
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(groupedSubjects).map(([group, subjects]) => (
                <div key={group} className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">{group}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {subjects.map(subject => (
                      <div 
                        key={subject.id}
                        className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleSubject(subject.id)}
                      >
                        <Checkbox 
                          checked={selectedSubjectIds.includes(subject.id)}
                          onCheckedChange={() => toggleSubject(subject.id)}
                        />
                        <span className="text-sm">{subject.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-4 flex-wrap pt-4 border-t">
              <Button 
                className="bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white"
                onClick={handleSave}
                disabled={saving}
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
            
            {selectedSubjectIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedSubjectIds.length} subject{selectedSubjectIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
