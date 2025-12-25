import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Plus, 
  BookOpen, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  Edit,
  Save,
  X,
  ArrowLeft,
  AlertCircle,
  Upload,
  ImageIcon,
  Loader2,
  GraduationCap
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SubjectCreatorProps {
  onNavigate: (page: string) => void;
  userRole: string;
}

interface Subject {
  id: string;
  name: string;
  gradeSystem: string;
  gradeLevel: number;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  chapters?: Chapter[];
  createdAt: string;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  notes: string;
  examples: string[];
  cloudinaryImages: string[];
  order: number;
  durationMinutes: number;
  exercises?: Exercise[];
}

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  order: number;
}

type ViewMode = 'list' | 'create' | 'manage';

interface ActionMessage {
  status: 'idle' | 'loading' | 'success' | 'error';
  text: string;
}

const GRADE_SYSTEMS = [
  { value: 'all', label: 'All Systems (Available to Everyone)' },
  { value: 'Cambridge', label: 'Cambridge International' },
  { value: 'Zimbabwe', label: 'Zimbabwe (ZIMSEC)' },
  { value: 'South_Africa', label: 'South African (CAPS)' },
  { value: 'Nigerian_NERDC', label: 'Nigerian (NERDC)' },
  { value: 'Kenyan', label: 'Kenyan (CBC)' },
  { value: 'American', label: 'American (Common Core)' },
  { value: 'British', label: 'British National Curriculum' },
  { value: 'IB', label: 'International Baccalaureate' },
];

export default function SubjectCreator({ onNavigate, userRole }: SubjectCreatorProps) {
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage>({ status: 'idle', text: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'subject' | 'chapter' | 'lesson' | 'exercise';
    id: string;
    name: string;
  } | null>(null);

  // Form states
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    gradeSystem: '',
    gradeLevel: 7,
    description: '',
    iconUrl: ''
  });

  const [chapterForm, setChapterForm] = useState({ title: '', description: '', order: 1 });
  const [lessonForm, setLessonForm] = useState({
    title: '',
    notes: '',
    examples: [''],
    order: 1,
    durationMinutes: 30
  });
  const [exerciseForm, setExerciseForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    order: 1
  });

  // Upload image through server
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setActionMessage({ status: 'error', text: 'Please select an image file' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionMessage({ status: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'subjects');

      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      if (data.success && data.url) {
        setSubjectForm({ ...subjectForm, iconUrl: data.url });
        setActionMessage({ status: 'success', text: 'Image uploaded!' });
        setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      }
    } catch (error: any) {
      setActionMessage({ status: 'error', text: error.message || 'Failed to upload image' });
    } finally {
      setIsUploading(false);
    }
  };

  // Get user's subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/subjects', { creatorOnly: true }],
    queryFn: async () => {
      const subjects = await apiRequest('/api/subjects?creatorOnly=true');
      return subjects.data || [];
    }
  });

  // Get specific subject with chapters/lessons/exercises
  const { data: subjectDetails, refetch: refetchSubjectDetails } = useQuery({
    queryKey: ['/api/subjects', selectedSubject?.id],
    queryFn: async () => {
      if (!selectedSubject?.id) return null;
      const subject = await apiRequest(`/api/subjects/${selectedSubject.id}`);
      return subject;
    },
    enabled: !!selectedSubject?.id,
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: async (subjectData: any) => {
      return await apiRequest('/api/subjects', { method: 'POST', body: JSON.stringify(subjectData) });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      queryClient.refetchQueries({ queryKey: ['/api/subjects'] });
      setActionMessage({ status: 'success', text: 'Subject created! Now add chapters and lessons.' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      // Automatically select the new subject and go to manage mode
      if (data && data.id) {
        setSelectedSubject(data);
        setSubjectForm({
          name: data.name || '',
          gradeSystem: data.gradeSystem || '',
          gradeLevel: data.gradeLevel || 7,
          description: data.description || '',
          iconUrl: data.iconUrl || ''
        });
        setViewMode('manage');
      } else {
        setViewMode('list');
        setSubjectForm({ name: '', gradeSystem: '', gradeLevel: 7, description: '', iconUrl: '' });
      }
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to create subject' });
    }
  });

  // Update subject mutation
  const updateSubjectMutation = useMutation({
    mutationFn: async ({ subjectId, subjectData }: { subjectId: string, subjectData: any }) => {
      return await apiRequest(`/api/subjects/${subjectId}`, { method: 'PUT', body: JSON.stringify(subjectData) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      if (selectedSubject) {
        queryClient.invalidateQueries({ queryKey: ['/api/subjects', selectedSubject.id] });
      }
      setActionMessage({ status: 'success', text: 'Subject updated!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to update subject' });
    }
  });

  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      return await apiRequest(`/api/subjects/${subjectId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setActionMessage({ status: 'success', text: 'Subject deleted!' });
      setSelectedSubject(null);
      setViewMode('list');
      setDeleteDialog(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to delete subject' });
      setDeleteDialog(null);
    }
  });

  // Helper to update subject details in cache
  const updateSubjectDetailsCache = (updater: (old: any) => any) => {
    if (selectedSubject?.id) {
      queryClient.setQueryData(['/api/subjects', selectedSubject.id], (old: any) => {
        if (!old) return old;
        return updater(old);
      });
    }
  };

  // Chapter mutations
  const createChapterMutation = useMutation({
    mutationFn: async ({ subjectId, chapterData }: { subjectId: string, chapterData: any }) => {
      return await apiRequest(`/api/subjects/${subjectId}/chapters`, { method: 'POST', body: JSON.stringify(chapterData) });
    },
    onSuccess: (data: any) => {
      // Update cache directly with new chapter
      if (data && selectedSubject?.id) {
        queryClient.setQueryData(['/api/subjects', selectedSubject.id], (old: any) => {
          if (!old) {
            return { ...selectedSubject, chapters: [{ ...data, lessons: [] }] };
          }
          return {
            ...old,
            chapters: [...(old.chapters || []), { ...data, lessons: [] }]
          };
        });
      }
      setActionMessage({ status: 'success', text: 'Chapter added!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setChapterForm({ title: '', description: '', order: 1 });
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to create chapter' });
    }
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      return await apiRequest(`/api/chapters/${chapterId}`, { method: 'DELETE' });
    },
    onSuccess: (_data, chapterId) => {
      updateSubjectDetailsCache((old) => ({
        ...old,
        chapters: (old.chapters || []).filter((c: any) => c.id !== chapterId)
      }));
      setActionMessage({ status: 'success', text: 'Chapter deleted!' });
      setDeleteDialog(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to delete chapter' });
      setDeleteDialog(null);
    }
  });

  // Lesson mutations
  const createLessonMutation = useMutation({
    mutationFn: async ({ chapterId, lessonData }: { chapterId: string, lessonData: any }) => {
      return await apiRequest(`/api/chapters/${chapterId}/lessons`, { method: 'POST', body: JSON.stringify(lessonData) });
    },
    onSuccess: (data: any, variables) => {
      // Update cache directly with new lesson
      updateSubjectDetailsCache((old) => ({
        ...old,
        chapters: (old.chapters || []).map((c: any) => 
          c.id === variables.chapterId 
            ? { ...c, lessons: [...(c.lessons || []), { ...data, exercises: [] }] }
            : c
        )
      }));
      setActionMessage({ status: 'success', text: 'Lesson added!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setLessonForm({ title: '', notes: '', examples: [''], order: 1, durationMinutes: 30 });
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to create lesson' });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return await apiRequest(`/api/lessons/${lessonId}`, { method: 'DELETE' });
    },
    onSuccess: (_data, lessonId) => {
      updateSubjectDetailsCache((old) => ({
        ...old,
        chapters: (old.chapters || []).map((c: any) => ({
          ...c,
          lessons: (c.lessons || []).filter((l: any) => l.id !== lessonId)
        }))
      }));
      setActionMessage({ status: 'success', text: 'Lesson deleted!' });
      setDeleteDialog(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to delete lesson' });
      setDeleteDialog(null);
    }
  });

  // Exercise mutations
  const createExerciseMutation = useMutation({
    mutationFn: async ({ lessonId, exerciseData }: { lessonId: string, exerciseData: any }) => {
      return await apiRequest(`/api/lessons/${lessonId}/exercises`, { method: 'POST', body: JSON.stringify({ exercises: [exerciseData] }) });
    },
    onSuccess: (data: any, variables) => {
      // Update cache directly with new exercise
      const newExercise = Array.isArray(data) ? data[0] : data;
      updateSubjectDetailsCache((old) => ({
        ...old,
        chapters: (old.chapters || []).map((c: any) => ({
          ...c,
          lessons: (c.lessons || []).map((l: any) =>
            l.id === variables.lessonId
              ? { ...l, exercises: [...(l.exercises || []), newExercise] }
              : l
          )
        }))
      }));
      setActionMessage({ status: 'success', text: 'Quiz question added!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setExerciseForm({ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', order: 1 });
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to create exercise' });
    }
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      return await apiRequest(`/api/exercises/${exerciseId}`, { method: 'DELETE' });
    },
    onSuccess: (_data, exerciseId) => {
      updateSubjectDetailsCache((old) => ({
        ...old,
        chapters: (old.chapters || []).map((c: any) => ({
          ...c,
          lessons: (c.lessons || []).map((l: any) => ({
            ...l,
            exercises: (l.exercises || []).filter((e: any) => e.id !== exerciseId)
          }))
        }))
      }));
      setActionMessage({ status: 'success', text: 'Exercise deleted!' });
      setDeleteDialog(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to delete exercise' });
      setDeleteDialog(null);
    }
  });

  const handleCreateSubject = () => {
    if (!subjectForm.name || !subjectForm.gradeSystem) {
      setActionMessage({ status: 'error', text: 'Please fill in subject name and grade system' });
      return;
    }
    createSubjectMutation.mutate(subjectForm);
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setSubjectForm({
      name: subject.name,
      gradeSystem: subject.gradeSystem,
      gradeLevel: subject.gradeLevel,
      description: subject.description || '',
      iconUrl: subject.iconUrl || ''
    });
    setViewMode('manage');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedSubject(null);
    setSubjectForm({ name: '', gradeSystem: '', gradeLevel: 7, description: '', iconUrl: '' });
    setExpandedChapters(new Set());
    setExpandedLessons(new Set());
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const confirmDelete = () => {
    if (!deleteDialog) return;
    
    switch (deleteDialog.type) {
      case 'subject':
        deleteSubjectMutation.mutate(deleteDialog.id);
        break;
      case 'chapter':
        deleteChapterMutation.mutate(deleteDialog.id);
        break;
      case 'lesson':
        deleteLessonMutation.mutate(deleteDialog.id);
        break;
      case 'exercise':
        deleteExerciseMutation.mutate(deleteDialog.id);
        break;
    }
  };

  // Loading state
  if (subjectsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-gray-700 dark:text-gray-400 text-sm">
              {viewMode === 'list' ? 'Create and manage subjects for students' : 
               viewMode === 'create' ? 'Fill in the details for your new subject' :
               'Add chapters, lessons and quizzes'}
            </p>
          </div>
        </div>
        {viewMode === 'list' && (
          <Button 
            onClick={() => setViewMode('create')} 
            data-testid="button-create-subject"
            className="text-white border-0 hover:bg-[#2f5a4e] active:bg-[#2f5a4e] focus:bg-[#2f5a4e] transition-none p-2 sm:px-4 sm:py-2"
            style={{ backgroundColor: '#2f5a4e' }}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Subject</span>
          </Button>
        )}
      </div>

      {/* Action Message */}
      {actionMessage.status !== 'idle' && (
        <Alert className={`mb-4 ${actionMessage.status === 'error' ? 'border-destructive' : 'border-green-500'}`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionMessage.text}</AlertDescription>
        </Alert>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="grid gap-4 md:grid-cols-2">
          {subjects && subjects.length > 0 ? (
            subjects.map((subject: Subject) => (
              <Card 
                key={subject.id} 
                className="cursor-pointer hover:border-primary transition-colors" transition-all duration-300
                onClick={() => handleSelectSubject(subject)}
                data-testid={`card-subject-${subject.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    {subject.iconUrl ? (
                      <img src={subject.iconUrl} alt={subject.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">Grade {subject.gradeLevel}</Badge>
                        <Badge variant="secondary">{subject.gradeSystem}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.description || 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {subject.chapters?.length || 0} chapters
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-2">
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first subject to get started</p>
                <Button onClick={() => setViewMode('create')} data-testid="button-create-first-subject" className="bg-[#2f5a4e] text-white hover:bg-[#254a3f]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subject
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CREATE VIEW */}
      {viewMode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Details</CardTitle>
            <CardDescription>Enter the basic information for your subject</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Name *</label>
                <Input
                  placeholder="e.g., Mathematics, English"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  data-testid="input-subject-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Grade Level *</label>
                <Select 
                  value={subjectForm.gradeLevel.toString()} 
                  onValueChange={(value) => setSubjectForm({ ...subjectForm, gradeLevel: parseInt(value) })}
                >
                  <SelectTrigger data-testid="select-grade-level">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>Grade {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Grade System *</label>
              <Select 
                value={subjectForm.gradeSystem} 
                onValueChange={(value) => setSubjectForm({ ...subjectForm, gradeSystem: value })}
              >
                <SelectTrigger data-testid="select-grade-system">
                  <SelectValue placeholder="Select curriculum system" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_SYSTEMS.map(system => (
                    <SelectItem key={system.value} value={system.value}>{system.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Brief description of the subject..."
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                rows={3}
                data-testid="textarea-description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cover Image</label>
              <div className="flex items-center gap-4">
                {subjectForm.iconUrl ? (
                  <img src={subjectForm.iconUrl} alt="Cover" className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => document.getElementById('cover-upload')?.click()}
                    data-testid="button-upload-image"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG or PNG</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateSubject}
                disabled={createSubjectMutation.isPending}
                data-testid="button-save-subject"
              >
                {createSubjectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Create Subject
              </Button>
              <Button variant="outline" onClick={handleBackToList} data-testid="button-cancel">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MANAGE VIEW */}
      {viewMode === 'manage' && selectedSubject && (
        <div className="space-y-6">
          {/* Subject Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {subjectForm.iconUrl ? (
                    <img src={subjectForm.iconUrl} alt={subjectForm.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-foreground" />
                    </div>
                  )}
                  <div>
                    <CardTitle>{subjectForm.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">Grade {subjectForm.gradeLevel}</Badge>
                      <Badge variant="secondary">{subjectForm.gradeSystem}</Badge>
                    </div>
                    {subjectForm.description && (
                      <p className="text-sm text-muted-foreground mt-2">{subjectForm.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialog({ open: true, type: 'subject', id: selectedSubject.id, name: subjectForm.name })}
                  data-testid="button-delete-subject"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Add Chapter Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Chapter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="Chapter title"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="md:col-span-2"
                  data-testid="input-chapter-title"
                />
                <Input
                  type="number"
                  placeholder="Order"
                  value={chapterForm.order}
                  onChange={(e) => setChapterForm({ ...chapterForm, order: parseInt(e.target.value) || 1 })}
                  data-testid="input-chapter-order"
                />
              </div>
              <Textarea
                placeholder="Chapter description (optional)"
                value={chapterForm.description}
                onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                rows={2}
                data-testid="textarea-chapter-description"
              />
              <Button
                onClick={() => {
                  if (!chapterForm.title) {
                    setActionMessage({ status: 'error', text: 'Please enter a chapter title' });
                    return;
                  }
                  createChapterMutation.mutate({ subjectId: selectedSubject.id, chapterData: chapterForm });
                }}
                disabled={createChapterMutation.isPending}
                data-testid="button-add-chapter"
              >
                {createChapterMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Chapter
              </Button>
            </CardContent>
          </Card>

          {/* Chapters List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Chapters ({subjectDetails?.chapters?.length || 0})</h3>
            
            {subjectDetails?.chapters && subjectDetails.chapters.length > 0 ? (
              subjectDetails.chapters.map((chapter: Chapter) => (
                <Card key={chapter.id}>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors py-3" transition-all duration-300
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedChapters.has(chapter.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{chapter.title}</span>
                        <Badge variant="outline" className="ml-2">{chapter.lessons?.length || 0} lessons</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({ open: true, type: 'chapter', id: chapter.id, name: chapter.title });
                        }}
                        data-testid={`button-delete-chapter-${chapter.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>

                  {expandedChapters.has(chapter.id) && (
                    <CardContent className="border-t pt-4 space-y-4">
                      {chapter.description && (
                        <p className="text-sm text-muted-foreground">{chapter.description}</p>
                      )}

                      {/* Add Lesson Form */}
                      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-sm">Add Lesson</h4>
                        <div className="grid gap-3 md:grid-cols-3">
                          <Input
                            placeholder="Lesson title"
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            className="md:col-span-2"
                            data-testid="input-lesson-title"
                          />
                          <Input
                            type="number"
                            placeholder="Duration (min)"
                            value={lessonForm.durationMinutes}
                            onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value) || 30 })}
                            data-testid="input-lesson-duration"
                          />
                        </div>
                        <Textarea
                          placeholder="Lesson notes/content"
                          value={lessonForm.notes}
                          onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                          rows={3}
                          data-testid="textarea-lesson-notes"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!lessonForm.title) {
                              setActionMessage({ status: 'error', text: 'Please enter a lesson title' });
                              return;
                            }
                            createLessonMutation.mutate({ chapterId: chapter.id, lessonData: lessonForm });
                          }}
                          disabled={createLessonMutation.isPending}
                          data-testid="button-add-lesson"
                        >
                          {createLessonMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                          Add Lesson
                        </Button>
                      </div>

                      {/* Lessons List */}
                      {chapter.lessons && chapter.lessons.length > 0 && (
                        <div className="space-y-2">
                          {chapter.lessons.map((lesson: Lesson) => (
                            <div key={lesson.id} className="border rounded-lg">
                              <div 
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50" transition-all duration-300
                                onClick={() => toggleLesson(lesson.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedLessons.has(lesson.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  <span className="text-sm">{lesson.title}</span>
                                  <Badge variant="secondary" className="text-xs">{lesson.durationMinutes}min</Badge>
                                  {lesson.exercises && lesson.exercises.length > 0 && (
                                    <Badge variant="outline" className="text-xs">{lesson.exercises.length} quiz</Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialog({ open: true, type: 'lesson', id: lesson.id, name: lesson.title });
                                  }}
                                  data-testid={`button-delete-lesson-${lesson.id}`}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>

                              {expandedLessons.has(lesson.id) && (
                                <div className="border-t p-3 bg-muted/20 space-y-3">
                                  {lesson.notes && (
                                    <p className="text-sm text-muted-foreground">{lesson.notes}</p>
                                  )}

                                  {/* Add Quiz Question */}
                                  <div className="bg-background rounded-lg p-3 space-y-2">
                                    <h5 className="font-medium text-xs">Add Quiz Question</h5>
                                    <Input
                                      placeholder="Question"
                                      value={exerciseForm.question}
                                      onChange={(e) => setExerciseForm({ ...exerciseForm, question: e.target.value })}
                                      className="text-sm"
                                      data-testid="input-exercise-question"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      {exerciseForm.options.map((option, idx) => (
                                        <Input
                                          key={idx}
                                          placeholder={`Option ${idx + 1}`}
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...exerciseForm.options];
                                            newOptions[idx] = e.target.value;
                                            setExerciseForm({ ...exerciseForm, options: newOptions });
                                          }}
                                          className="text-sm"
                                          data-testid={`input-exercise-option-${idx}`}
                                        />
                                      ))}
                                    </div>
                                    <Input
                                      placeholder="Correct answer (must match an option)"
                                      value={exerciseForm.correctAnswer}
                                      onChange={(e) => setExerciseForm({ ...exerciseForm, correctAnswer: e.target.value })}
                                      className="text-sm"
                                      data-testid="input-exercise-correct-answer"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (!exerciseForm.question || !exerciseForm.correctAnswer) {
                                          setActionMessage({ status: 'error', text: 'Please enter question and correct answer' });
                                          return;
                                        }
                                        createExerciseMutation.mutate({ 
                                          lessonId: lesson.id, 
                                          exerciseData: {
                                            ...exerciseForm,
                                            options: exerciseForm.options.filter(o => o.trim())
                                          }
                                        });
                                      }}
                                      disabled={createExerciseMutation.isPending}
                                      data-testid="button-add-exercise"
                                    >
                                      {createExerciseMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                                      Add Question
                                    </Button>
                                  </div>

                                  {/* Existing Exercises */}
                                  {lesson.exercises && lesson.exercises.length > 0 && (
                                    <div className="space-y-2">
                                      <h5 className="font-medium text-xs">Quiz Questions</h5>
                                      {lesson.exercises.map((exercise: Exercise, idx: number) => (
                                        <div key={exercise.id} className="flex items-center justify-between bg-background rounded p-2 text-sm">
                                          <div>
                                            <span className="font-medium">Q{idx + 1}:</span> {exercise.question}
                                            <span className="text-green-600 ml-2">✓ {exercise.correctAnswer}</span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteDialog({ open: true, type: 'exercise', id: exercise.id, name: exercise.question })}
                                            data-testid={`button-delete-exercise-${exercise.id}`}
                                          >
                                            <X className="h-3 w-3 text-destructive" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No chapters yet. Add your first chapter above.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteDialog?.type} "{deleteDialog?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialog(null)} data-testid="cancel-delete">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteSubjectMutation.isPending || deleteChapterMutation.isPending || deleteLessonMutation.isPending || deleteExerciseMutation.isPending}
              data-testid="confirm-delete"
            >
              {(deleteSubjectMutation.isPending || deleteChapterMutation.isPending || deleteLessonMutation.isPending || deleteExerciseMutation.isPending) 
                ? 'Deleting...' 
                : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
