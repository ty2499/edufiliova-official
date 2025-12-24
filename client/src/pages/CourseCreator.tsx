import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import CourseCreatorPages from "@/components/CourseCreatorPages";
import { 
  Plus, 
  BookOpen, 
  PlayCircle, 
  FileText, 
  Upload, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  Edit,
  Save,
  X,
  ArrowLeft,
  AlertCircle,
  Award,
  GraduationCap,
  Eye,
  EyeOff,
  Star,
  User,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CourseCreatorProps {
  onNavigate: (page: string) => void;
  userRole?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
  isFeatured?: boolean;
  thumbnailUrl?: string;
  price?: string | number;
  createdAt: string;
  authorName?: string;
}

interface Module {
  id: number;
  title: string;
  orderNum: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  orderNum: number;
  quizzes: Quiz[];
  media: LessonMedia[];
}

interface Quiz {
  id: number;
  question: string;
  options: string;
  correctAnswer: string;
  explanation?: string;
  questionType: string;
  points: number;
  orderNum: number;
}

interface LessonMedia {
  id: number;
  type: 'image' | 'file';
  fileUrl: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  isCollapsible?: boolean;
  isVisibleByDefault?: boolean;
}

// View mode state machine - prevents overlapping modals
type ViewMode = 'list' | 'create' | 'edit';
type OverlayState = null | {
  type: 'confirmDelete';
  payload: {
    kind: 'course' | 'module' | 'lesson' | 'quiz' | 'media';
    id: string | number;
    name: string;
  };
};

// Action message for inline feedback
interface ActionMessage {
  status: 'idle' | 'loading' | 'success' | 'error';
  text: string;
}

export default function CourseCreator({ onNavigate, userRole = 'student' }: CourseCreatorProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Determine the appropriate dashboard based on user role
  const getDashboardRoute = () => {
    switch (userRole) {
      case 'admin':
        return 'admin-dashboard';
      case 'teacher':
        return 'teacher-dashboard';
      case 'freelancer':
        return 'freelancer-dashboard';
      default:
        return 'student-dashboard';
    }
  };
  
  // State machine - prevents overlapping UI
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  
  // Inline feedback states - replaces toast usage
  const [actionMessage, setActionMessage] = useState<ActionMessage>({ status: 'idle', text: '' });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  
  // Form editing state
  const [editingItem, setEditingItem] = useState<{type: 'course' | 'module' | 'lesson' | 'quiz', id: string | number} | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    thumbnailUrl: '',
    gradeTier: 'college_university',
    certificationType: 'certificate',
    pricingType: 'free' as 'free' | 'fixed_price' | 'subscription',
    price: '0',
    learningObjectives: [] as string[],
    prerequisites: [] as string[]
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [moduleForm, setModuleForm] = useState({
    title: '',
    orderNum: 1
  });

  const [editingModule, setEditingModule] = useState<number | null>(null);

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    orderNum: 1
  });

  const [editingLesson, setEditingLesson] = useState<number | null>(null);

  const [quizForm, setQuizForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    questionType: 'mcq',
    points: 1,
    orderNum: 1
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ courseId, courseData }: { courseId: string, courseData: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/courses/${courseId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(courseData)
      });
      if (!response.ok) throw new Error('Failed to update course');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Course updated successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setEditingItem(null);
      setViewMode('list');
      setCourseForm({ title: '', description: '', category: '', thumbnailUrl: '', gradeTier: 'college_university', certificationType: 'certificate', pricingType: 'free', price: '0', learningObjectives: [], prerequisites: [] });
      setThumbnailFile(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to update course' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete course');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses'] });
      setActionMessage({ status: 'success', text: 'Course deleted successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setSelectedCourse(null);
      setOverlay(null);
      setViewMode('list');
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to delete course' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setOverlay(null);
    }
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ moduleId, moduleData }: { moduleId: number, moduleData: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(moduleData)
      });
      if (!response.ok) throw new Error('Failed to update module');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Module updated successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setModuleForm({ title: '', orderNum: 1 });
      setEditingModule(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to update module' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/modules/${moduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete module');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Module deleted successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setOverlay(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to delete module' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setOverlay(null);
    }
  });

  // Get user courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/course-creator/courses'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/course-creator/courses', {
        headers: { 'Authorization': `Bearer ${sessionId}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      return data.courses;
    }
  });

  // Get specific course with modules/lessons
  const { data: courseDetails } = useQuery({
    queryKey: ['/api/course-creator/courses', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/courses/${selectedCourse}`, {
        headers: { 'Authorization': `Bearer ${sessionId}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch course details');
      const data = await response.json();
      return data.course;
    },
    enabled: !!selectedCourse
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/course-creator/courses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(courseData)
      });
      if (!response.ok) throw new Error('Failed to create course');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses'] });
      setActionMessage({ status: 'success', text: 'Course created successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setViewMode('list');
      setCourseForm({ title: '', description: '', category: '', thumbnailUrl: '', gradeTier: 'college_university', certificationType: 'certificate', pricingType: 'free', price: '0', learningObjectives: [], prerequisites: [] });
      setThumbnailFile(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to create course' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async ({ courseId, moduleData }: { courseId: string, moduleData: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(moduleData)
      });
      if (!response.ok) throw new Error('Failed to create module');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Module created successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setModuleForm({ title: '', orderNum: 1 });
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to create module' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({ lessonId, lessonData }: { lessonId: number, lessonData: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(lessonData)
      });
      if (!response.ok) throw new Error('Failed to update lesson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Lesson updated successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setLessonForm({ title: '', content: '', videoUrl: '', orderNum: 1 });
      setEditingLesson(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to update lesson' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async ({ moduleId, lessonData }: { moduleId: number, lessonData: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(lessonData)
      });
      if (!response.ok) throw new Error('Failed to create lesson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Lesson created successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setLessonForm({ title: '', content: '', videoUrl: '', orderNum: 1 });
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to create lesson' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async ({ lessonId, quizData }: { lessonId: number, quizData: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/lessons/${lessonId}/quizzes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(quizData)
      });
      if (!response.ok) throw new Error('Failed to create quiz');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Quiz created successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setQuizForm({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        questionType: 'mcq',
        points: 1,
        orderNum: 1
      });
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to create quiz' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: async ({ quizId, quizData }: { quizId: number, quizData: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(quizData)
      });
      if (!response.ok) throw new Error('Failed to update quiz');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Quiz updated successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
      setQuizForm({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        questionType: 'mcq',
        points: 1,
        orderNum: 1
      });
      setEditingItem(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to update quiz' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: number) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete quiz');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Quiz deleted successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setOverlay(null);
      // Clear quiz edit state after deletion
      setEditingItem(null);
      setQuizForm({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        questionType: 'mcq',
        points: 1,
        orderNum: 1
      });
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to delete quiz' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setOverlay(null);
    }
  });

  // Toggle course active status mutation
  const toggleCourseActiveMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return apiRequest(`/api/course-creator/courses/${courseId}/toggle-active`, {
        method: 'PATCH'
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ 
        status: 'success', 
        text: `Course ${data.isActive ? 'activated' : 'deactivated'} successfully!` 
      });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to toggle course status' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Toggle course featured status mutation
  const toggleCourseFeaturedMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const course = courses?.find((c: Course) => c.id === courseId);
      return apiRequest(`/api/courses/${courseId}/feature`, {
        method: 'PATCH',
        body: JSON.stringify({ isFeatured: !course?.isFeatured })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'courses', 'featured'] });
      setActionMessage({ 
        status: 'success', 
        text: `Course ${data.isFeatured ? 'marked as featured' : 'removed from featured'} successfully!` 
      });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to toggle featured status' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Approve course mutation (Admin only)
  const approveCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return apiRequest(`/api/admin/courses/${courseId}/approve`, {
        method: 'PATCH'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ 
        status: 'success', 
        text: 'Course published successfully!' 
      });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to publish course' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  // Media management mutations
  const uploadLessonMediaMutation = useMutation({
    mutationFn: async ({ lessonId, file }: { lessonId: number, file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/lessons/${lessonId}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        credentials: 'include',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload media');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Media uploaded successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to upload media' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  const updateLessonMediaMutation = useMutation({
    mutationFn: async ({ mediaId, file }: { mediaId: number, file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        credentials: 'include',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to update media');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Media updated successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 2000);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to update media' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  const deleteLessonMediaMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/media/${mediaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete media');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
      setActionMessage({ status: 'success', text: 'Media deleted successfully!' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setOverlay(null);
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to delete media' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      setOverlay(null);
    }
  });

  const updateMediaSettingsMutation = useMutation({
    mutationFn: async ({ mediaId, settings }: { mediaId: number, settings: { isCollapsible?: boolean, isVisibleByDefault?: boolean } }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/course-creator/media/${mediaId}/settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}` 
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to update media settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', selectedCourse] });
    },
    onError: (error: any) => {
      setActionMessage({ status: 'error', text: error.message || 'Failed to update media settings' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
    }
  });

  const handleThumbnailUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'course-thumbnail');
    
    const sessionId = localStorage.getItem('sessionId');
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId}`
      },
      body: formData
    });
    
    if (!response.ok) throw new Error('Failed to upload thumbnail');
    const data = await response.json();
    return data.url;
  };

  const handleCreateCourse = async () => {
    if (!courseForm.title || !courseForm.description || !courseForm.category || !courseForm.gradeTier) {
      setActionMessage({ status: 'error', text: 'Please fill in all required fields' });
      setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
      return;
    }

    let thumbnailUrl = courseForm.thumbnailUrl;
    
    // Upload thumbnail if file is selected
    if (thumbnailFile) {
      setUploadingThumbnail(true);
      try {
        thumbnailUrl = await handleThumbnailUpload(thumbnailFile);
      } catch (error) {
        setActionMessage({ status: 'error', text: 'Failed to upload thumbnail image' });
        setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
        setUploadingThumbnail(false);
        return;
      }
      setUploadingThumbnail(false);
    }

    createCourseMutation.mutate({
      ...courseForm,
      thumbnailUrl
    });
  };

  const handleCreateModule = () => {
    if (!moduleForm.title || !selectedCourse) return;
    
    if (editingModule !== null) {
      // Update existing module
      updateModuleMutation.mutate({
        moduleId: editingModule,
        moduleData: moduleForm
      });
    } else {
      // Create new module
      createModuleMutation.mutate({ 
        courseId: selectedCourse, 
        moduleData: moduleForm 
      });
    }
  };

  const handleEditModule = (module: Module) => {
    setModuleForm({
      title: module.title,
      orderNum: module.orderNum
    });
    setEditingModule(module.id);
  };

  const handleCancelModuleEdit = () => {
    setModuleForm({ title: '', orderNum: 1 });
    setEditingModule(null);
  };

  const handleCreateLesson = (moduleId: number) => {
    if (!lessonForm.title) return;

    if (editingLesson !== null) {
      // Update existing lesson
      updateLessonMutation.mutate({
        lessonId: editingLesson,
        lessonData: lessonForm
      });
    } else {
      // Create new lesson
      createLessonMutation.mutate({ 
        moduleId, 
        lessonData: lessonForm 
      });
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      orderNum: lesson.orderNum
    });
    setEditingLesson(lesson.id);
    
    // If lesson has quizzes, load the first quiz into the quiz form for editing
    if (lesson.quizzes && lesson.quizzes.length > 0) {
      const firstQuiz = lesson.quizzes[0];
      const optionsList = firstQuiz.options ? firstQuiz.options.split(',').map(opt => opt.trim()) : ['', '', '', ''];
      // Ensure we have exactly 4 options
      while (optionsList.length < 4) optionsList.push('');
      
      setQuizForm({
        question: firstQuiz.question,
        options: optionsList.slice(0, 4),
        correctAnswer: firstQuiz.correctAnswer,
        explanation: firstQuiz.explanation || '',
        questionType: firstQuiz.questionType,
        points: firstQuiz.points,
        orderNum: firstQuiz.orderNum
      });
      setEditingItem({ type: 'quiz', id: firstQuiz.id });
    } else {
      // Clear quiz edit state if lesson has no quizzes
      setQuizForm({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        questionType: 'mcq',
        points: 1,
        orderNum: 1
      });
      setEditingItem(null);
    }
  };

  const handleCancelLessonEdit = () => {
    setLessonForm({ title: '', content: '', videoUrl: '', orderNum: 1 });
    setEditingLesson(null);
    // Also clear quiz form and editing state
    setQuizForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      questionType: 'mcq',
      points: 1,
      orderNum: 1
    });
    setEditingItem(null);
  };

  const handleCreateQuiz = (lessonId: number) => {
    if (!quizForm.question || !quizForm.correctAnswer) return;
    
    const quizData = {
      ...quizForm,
      options: quizForm.options.filter(opt => opt.trim() !== '')
    };
    
    if (editingItem?.type === 'quiz' && editingItem.id) {
      // Verify the quiz belongs to the current lesson before updating
      const currentLesson = courseDetails?.modules
        ?.flatMap((m: Module) => m.lessons)
        ?.find((l: Lesson) => l.id === lessonId);
      
      const quizBelongsToLesson = currentLesson?.quizzes?.some((q: Quiz) => q.id === editingItem.id);
      
      if (quizBelongsToLesson) {
        // Update existing quiz
        updateQuizMutation.mutate({ 
          quizId: editingItem.id as number, 
          quizData 
        });
      } else {
        // Quiz doesn't belong to this lesson, reset to create mode
        setEditingItem(null);
        createQuizMutation.mutate({ 
          lessonId, 
          quizData 
        });
      }
    } else {
      // Create new quiz
      createQuizMutation.mutate({ 
        lessonId, 
        quizData 
      });
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    const optionsList = quiz.options ? quiz.options.split(',').map(opt => opt.trim()) : ['', '', '', ''];
    // Ensure we have exactly 4 options
    while (optionsList.length < 4) optionsList.push('');
    
    setQuizForm({
      question: quiz.question,
      options: optionsList.slice(0, 4),
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation || '',
      questionType: quiz.questionType,
      points: quiz.points,
      orderNum: quiz.orderNum
    });
    setEditingItem({ type: 'quiz', id: quiz.id });
  };

  const handleCancelQuizEdit = () => {
    setQuizForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      questionType: 'mcq',
      points: 1,
      orderNum: 1
    });
    setEditingItem(null);
  };

  const handleDeleteQuiz = (quizId: number, quizQuestion: string) => {
    setOverlay({
      type: 'confirmDelete',
      payload: { kind: 'quiz', id: quizId, name: quizQuestion.substring(0, 50) + '...' }
    });
  };

  const handleUploadLessonMedia = (lessonId: number, file: File) => {
    uploadLessonMediaMutation.mutate({ lessonId, file });
  };

  const handleReplaceMedia = (mediaId: number, file: File) => {
    updateLessonMediaMutation.mutate({ mediaId, file });
  };

  const handleDeleteMedia = (mediaId: number, mediaName: string) => {
    setOverlay({
      type: 'confirmDelete',
      payload: { kind: 'media', id: mediaId, name: mediaName }
    });
  };

  const toggleModuleExpansion = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getStatusColor = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected': return 'bg-primary/15 text-primary-800 border-red-200 dark:bg-red-900 dark:text-primary-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleEditCourse = (course: Course) => {
    setCourseForm({
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnailUrl: course.thumbnailUrl || '',
      gradeTier: (course as any).gradeTier || 'college_university',
      certificationType: (course as any).certificationType || 'certificate',
      pricingType: (course as any).pricingType || 'free',
      price: (course as any).price || '0',
      learningObjectives: (course as any).learningObjectives || [],
      prerequisites: (course as any).prerequisites || []
    });
    setEditingItem({ type: 'course', id: course.id });
    setSelectedCourse(course.id);
    setViewMode('edit');
  };

  const handleUpdateCourse = async () => {
    if (!editingItem || editingItem.type !== 'course') return;
    
    let thumbnailUrl = courseForm.thumbnailUrl;
    
    if (thumbnailFile) {
      setUploadingThumbnail(true);
      try {
        thumbnailUrl = await handleThumbnailUpload(thumbnailFile);
      } catch (error) {
        setActionMessage({ status: 'error', text: 'Failed to upload thumbnail image' });
        setTimeout(() => setActionMessage({ status: 'idle', text: '' }), 3000);
        setUploadingThumbnail(false);
        return;
      }
      setUploadingThumbnail(false);
    }

    updateCourseMutation.mutate({
      courseId: editingItem.id as string,
      courseData: { ...courseForm, thumbnailUrl }
    });
  };

  const handleDeleteCourse = (courseId: string, courseName: string) => {
    setOverlay({
      type: 'confirmDelete',
      payload: { kind: 'course', id: courseId, name: courseName }
    });
  };

  const handleDeleteModule = (moduleId: number, moduleName: string) => {
    setOverlay({
      type: 'confirmDelete',
      payload: { kind: 'module', id: moduleId, name: moduleName }
    });
  };

  const confirmDelete = () => {
    if (!overlay || overlay.type !== 'confirmDelete') return;
    
    if (overlay.payload.kind === 'course') {
      deleteCourseMutation.mutate(overlay.payload.id as string);
    } else if (overlay.payload.kind === 'module') {
      deleteModuleMutation.mutate(overlay.payload.id as number);
    } else if (overlay.payload.kind === 'quiz') {
      deleteQuizMutation.mutate(overlay.payload.id as number);
    } else if (overlay.payload.kind === 'media') {
      deleteLessonMediaMutation.mutate(overlay.payload.id as number);
    }
  };

  // Helper functions for view mode navigation
  const handleCreateNewCourse = () => {
    setViewMode('create');
    setCourseForm({ title: '', description: '', category: '', thumbnailUrl: '', gradeTier: 'college_university', certificationType: 'certificate', pricingType: 'free', price: '0', learningObjectives: [], prerequisites: [] });
    setThumbnailFile(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCourse(null);
    setEditingItem(null);
    setCourseForm({ title: '', description: '', category: '', thumbnailUrl: '', gradeTier: 'college_university', certificationType: 'certificate', pricingType: 'free', price: '0', learningObjectives: [], prerequisites: [] });
    setThumbnailFile(null);
  };

  // Overlay content renderer
  const renderOverlayContent = () => {
    if (!overlay || overlay.type !== 'confirmDelete') return null;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-destructive">
            Confirm Delete
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Are you sure you want to delete this {overlay.payload.kind} "{overlay.payload.name}"? 
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => setOverlay(null)}
            variant="outline"
            className="flex-1"
            data-testid="cancel-delete"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="destructive"
            disabled={deleteCourseMutation.isPending || deleteModuleMutation.isPending || deleteQuizMutation.isPending || deleteLessonMediaMutation.isPending}
            className="flex-1"
            data-testid="confirm-delete"
          >
            {(deleteCourseMutation.isPending || deleteModuleMutation.isPending || deleteQuizMutation.isPending || deleteLessonMediaMutation.isPending) ? "Deleting..." : `Delete ${overlay.payload.kind}`}
          </Button>
        </div>
      </div>
    );
  };

  if (coursesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading courses...</div>
      </div>
    );
  }

  // Show the course creator pages if creating a course
  if (viewMode === 'create') {
    return (
      <CourseCreatorPages
        onComplete={(courseId) => {
          setViewMode('list');
          setSelectedCourse(courseId);
        }}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // Show full page edit course if editing
  if (viewMode === 'edit' && selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Edit Course</h1>
                <p className="text-muted-foreground mt-2">{courseDetails?.title || 'Loading...'}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBackToList}
                  data-testid="button-cancel-edit"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Courses
                </Button>
                <Button
                  onClick={handleUpdateCourse}
                  disabled={!courseForm.title || !courseForm.description || !courseForm.category || updateCourseMutation.isPending || uploadingThumbnail}
                  data-testid="button-save-course"
                >
                  {uploadingThumbnail ? "Uploading..." : updateCourseMutation.isPending ? "Saving..." : "Save Course"}
                </Button>
              </div>
            </div>
            {/* Action Message */}
            {actionMessage.status !== 'idle' && (
              <Alert className={`mt-4 ${
                actionMessage.status === 'success' 
                  ? 'border-green-200 text-green-800' 
                  : actionMessage.status === 'error'
                  ? 'border-red-200 text-primary-800'
                  : 'border-blue-200 text-blue-800'
              }`}>
                {actionMessage.status === 'error' && <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{actionMessage.text}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        {/* Edit Form - Two Column Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Course Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                  <CardDescription>Update your course details and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Title *</label>
                    <Input
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      placeholder="Course title"
                      className="mt-1"
                      data-testid="edit-course-title"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Description *</label>
                    <Textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      placeholder="Course description"
                      rows={4}
                      className="mt-1"
                      data-testid="edit-course-description"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Category *</label>
                    <Select 
                      value={courseForm.category} 
                      onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}
                    >
                      <SelectTrigger className="mt-1" data-testid="edit-course-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="programming">Programming & Technology</SelectItem>
                        <SelectItem value="design">Design & Creative Arts</SelectItem>
                        <SelectItem value="business">Business & Entrepreneurship</SelectItem>
                        <SelectItem value="marketing">Marketing & Branding</SelectItem>
                        <SelectItem value="photography">Photography & Video</SelectItem>
                        <SelectItem value="music">Music & Audio Production</SelectItem>
                        <SelectItem value="health">Health, Wellness & Fitness</SelectItem>
                        <SelectItem value="languages">Languages & Communication</SelectItem>
                        <SelectItem value="science">Science, Engineering & Mathematics</SelectItem>
                        <SelectItem value="other">Other / Miscellaneous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Course Thumbnail</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                      className="mt-1"
                      data-testid="edit-course-thumbnail"
                    />
                    {courseForm.thumbnailUrl && (
                      <p className="text-xs text-muted-foreground mt-1">Current thumbnail will be kept if no new file is selected</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Pricing Type *</label>
                    <Select 
                      value={courseForm.pricingType} 
                      onValueChange={(value: 'free' | 'fixed_price' | 'subscription') => setCourseForm({ ...courseForm, pricingType: value })}
                    >
                      <SelectTrigger className="mt-1" data-testid="edit-pricing-type">
                        <SelectValue placeholder="Select pricing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free Course</SelectItem>
                        <SelectItem value="fixed_price">Paid Course (One-time payment)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {courseForm.pricingType === 'fixed_price' && (
                    <div>
                      <label className="text-sm font-medium text-foreground">Course Price (USD) *</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                        placeholder="0.00"
                        className="mt-1"
                        data-testid="edit-course-price"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Learning Objectives</label>
                    <p className="text-xs text-muted-foreground mb-2">What will students learn from this course?</p>
                    <div className="space-y-2">
                      {courseForm.learningObjectives.map((objective, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={objective}
                            onChange={(e) => {
                              const newObjectives = [...courseForm.learningObjectives];
                              newObjectives[index] = e.target.value;
                              setCourseForm({ ...courseForm, learningObjectives: newObjectives });
                            }}
                            placeholder="Learning objective"
                            data-testid={`edit-objective-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newObjectives = courseForm.learningObjectives.filter((_, i) => i !== index);
                              setCourseForm({ ...courseForm, learningObjectives: newObjectives });
                            }}
                            data-testid={`remove-objective-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCourseForm({ ...courseForm, learningObjectives: [...courseForm.learningObjectives, ''] })}
                        className="w-full"
                        data-testid="add-objective"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Learning Objective
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Prerequisites</label>
                    <p className="text-xs text-muted-foreground mb-2">What should students know before taking this course?</p>
                    <div className="space-y-2">
                      {courseForm.prerequisites.map((prerequisite, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={prerequisite}
                            onChange={(e) => {
                              const newPrerequisites = [...courseForm.prerequisites];
                              newPrerequisites[index] = e.target.value;
                              setCourseForm({ ...courseForm, prerequisites: newPrerequisites });
                            }}
                            placeholder="Prerequisite"
                            data-testid={`edit-prerequisite-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newPrerequisites = courseForm.prerequisites.filter((_, i) => i !== index);
                              setCourseForm({ ...courseForm, prerequisites: newPrerequisites });
                            }}
                            data-testid={`remove-prerequisite-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCourseForm({ ...courseForm, prerequisites: [...courseForm.prerequisites, ''] })}
                        className="w-full"
                        data-testid="add-prerequisite"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Prerequisite
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Modules & Lessons */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Course Content</CardTitle>
                      <CardDescription>Manage modules, lessons, and quizzes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Module Form */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="text-sm font-semibold mb-3">
                      {editingModule !== null ? 'Edit Module' : 'Add New Module'}
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Module title"
                        value={moduleForm.title}
                        onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                        data-testid="input-module-title"
                      />
                      <Button
                        onClick={handleCreateModule}
                        disabled={!moduleForm.title || createModuleMutation.isPending || updateModuleMutation.isPending}
                        data-testid="button-save-module"
                      >
                        {editingModule !== null ? (
                          <><Save className="h-4 w-4 mr-2" /> Update</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" /> Add</>
                        )}
                      </Button>
                      {editingModule !== null && (
                        <Button
                          variant="outline"
                          onClick={handleCancelModuleEdit}
                          data-testid="button-cancel-module"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Modules List */}
                  {courseDetails?.modules && courseDetails.modules.length > 0 ? (
                    <div className="space-y-3">
                      {courseDetails.modules.map((module: Module, moduleIndex: number) => (
                        <div key={module.id} className="border rounded-lg overflow-hidden">
                          {/* Module Header */}
                          <div className="bg-muted/50 p-3">
                            <div className="flex items-center justify-between">
                              <div 
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                                onClick={() => toggleModuleExpansion(module.id)}
                              >
                                {expandedModules.has(module.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <BookOpen className="h-4 w-4" />
                                <span className="font-medium">{module.title}</span>
                                <Badge variant="outline" className="ml-2">
                                  {module.lessons?.length || 0} lessons
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditModule(module)}
                                  data-testid={`button-edit-module-${module.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteModule(module.id, module.title)}
                                  data-testid={`button-delete-module-${module.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Module Content (Lessons) */}
                          {expandedModules.has(module.id) && (
                            <div className="p-3 space-y-3">
                              {/* Add Lesson Form */}
                              <div className="p-3 border rounded bg-background">
                                <h5 className="text-xs font-medium mb-2">
                                  {editingLesson !== null ? 'Edit Lesson' : 'Add Lesson'}
                                </h5>
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Lesson title"
                                    value={lessonForm.title}
                                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                    data-testid={`input-lesson-title-${module.id}`}
                                  />
                                  <Textarea
                                    placeholder="Lesson content"
                                    value={lessonForm.content}
                                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                    rows={2}
                                    data-testid={`input-lesson-content-${module.id}`}
                                  />
                                  <Input
                                    placeholder="Video URL (optional)"
                                    value={lessonForm.videoUrl}
                                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                    data-testid={`input-lesson-video-${module.id}`}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleCreateLesson(module.id)}
                                      disabled={!lessonForm.title || createLessonMutation.isPending || updateLessonMutation.isPending}
                                      data-testid={`button-save-lesson-${module.id}`}
                                    >
                                      {editingLesson !== null ? 'Update Lesson' : 'Add Lesson'}
                                    </Button>
                                    {editingLesson !== null && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelLessonEdit}
                                        data-testid={`button-cancel-lesson-${module.id}`}
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Lessons List */}
                              {module.lessons && module.lessons.length > 0 && (
                                <div className="space-y-2">
                                  {module.lessons.map((lesson: Lesson) => (
                                    <div key={lesson.id} className="p-2 border rounded bg-background">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          <PlayCircle className="h-3 w-3" />
                                          <span className="text-sm font-medium">{lesson.title}</span>
                                          {lesson.quizzes && lesson.quizzes.length > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                              {lesson.quizzes.length} quiz(zes)
                                            </Badge>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditLesson(lesson)}
                                          data-testid={`button-edit-lesson-${lesson.id}`}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      {lesson.content && (
                                        <p className="text-xs text-muted-foreground">
                                          {lesson.content.substring(0, 80)}...
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No modules yet</p>
                      <p className="text-xs">Add your first module to start building your course</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate(getDashboardRoute())}
                data-testid="button-back-to-dashboard"
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Course Management</h1>
                <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Create and manage your online courses</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={handleCreateNewCourse}
                data-testid="button-create-course"
                className="w-full sm:w-auto text-white"
                style={{ backgroundColor: '#2f5a4e' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </div>
          </div>
          {/* Action Message */}
          {actionMessage.status !== 'idle' && (
            <Alert className={`mt-4 ${
              actionMessage.status === 'success' 
                ? 'border-green-200 text-green-800' 
                : actionMessage.status === 'error'
                ? 'border-red-200 text-primary-800'
                : 'border-blue-200 text-blue-800'
            }`}>
              {actionMessage.status === 'error' && <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{actionMessage.text}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      {/* Courses Grid/List View */}
      <div className="container mx-auto px-4 py-8">
        {(!courses || courses.length === 0) ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">Create your first course to get started</p>
            <Button 
              onClick={handleCreateNewCourse}
              className="text-white"
              style={{ backgroundColor: '#2f5a4e' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course: Course) => (
              <Card 
                key={course.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" transition-all duration-300
                data-testid={`course-card-${course.id}`}
              >
                {/* Course Thumbnail */}
                {course.thumbnailUrl && (
                  <div 
                    className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden"
                    onClick={() => handleEditCourse(course)}
                  >
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" transition-all duration-300
                    />
                  </div>
                )}
                {!course.thumbnailUrl && (
                  <div 
                    className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                    onClick={() => handleEditCourse(course)}
                  >
                    <BookOpen className="h-16 w-16 text-white opacity-50" />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle 
                      className="text-lg line-clamp-2 cursor-pointer hover:text-foreground transition-colors" transition-all duration-300
                      onClick={() => handleEditCourse(course)}
                      data-testid={`course-title-${course.id}`}
                    >
                      {course.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2" data-testid={`course-description-${course.id}`}>
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${getStatusColor(course.approvalStatus)}`}>
                      {course.approvalStatus}
                    </Badge>
                    {course.isFeatured && (
                      <Badge className="text-xs bg-amber-500 text-white">
                        <Star className="h-2 w-2 mr-1 fill-current inline" />
                        Featured
                      </Badge>
                    )}
                    {course.isActive === false && (
                      <Badge variant="secondary" className="text-xs bg-gray-400 text-white">
                        Inactive
                      </Badge>
                    )}
                    {course.price && parseFloat(course.price.toString()) > 0 && (
                      <Badge variant="outline" className="text-xs">
                        ${course.price}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Course Stats */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {course.authorName && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs">{course.authorName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">{new Date(course.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <Separator />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditCourse(course)}
                      data-testid={`edit-course-btn-${course.id}`}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </Button>
                    {userRole === 'admin' && course.approvalStatus === 'pending' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white" transition-all duration-300
                        onClick={(e) => {
                          e.stopPropagation();
                          approveCourseMutation.mutate(course.id);
                        }}
                        disabled={approveCourseMutation.isPending}
                        data-testid={`publish-course-btn-${course.id}`}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`transition-colors ${
                        course.isFeatured 
                          ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' 
                          : 'hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCourseFeaturedMutation.mutate(course.id);
                      }}
                      data-testid={`toggle-featured-btn-${course.id}`}
                    >
                      <Star className={`h-4 w-4 ${course.isFeatured ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCourseActiveMutation.mutate(course.id);
                      }}
                      data-testid={`toggle-active-btn-${course.id}`}
                    >
                      {course.isActive === false ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10" transition-all duration-300
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id, course.title);
                      }}
                      data-testid={`delete-course-btn-${course.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Overlay Manager */}
      {overlay && (
        <>
          {isMobile ? (
            <Drawer open={true} onOpenChange={(open: boolean) => !open && setOverlay(null)}>
              <DrawerContent className="p-4">
                <DrawerHeader>
                  <DrawerTitle className="sr-only">Confirmation Required</DrawerTitle>
                </DrawerHeader>
                {renderOverlayContent()}
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog open={true} onOpenChange={(open: boolean) => !open && setOverlay(null)}>
              <DialogContent className="sm:max-w-md">
                {renderOverlayContent()}
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}
