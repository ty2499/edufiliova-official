import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Logo from "@/components/Logo";
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Image,
  DollarSign,
  X,
  Award,
  GraduationCap
} from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import LessonBlockEditor, { ContentBlock } from "./LessonBlockEditor";

interface CourseCreatorPagesProps {
  onComplete: (courseId: string) => void;
  onCancel: () => void;
}

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  gradeTier: string;
  certificationType: string;
  duration: number;
  language: string;
  pricingPlanId: string;
  pricingType: 'free' | 'fixed_price' | 'subscription';
  price: string;
}

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  billingPeriod: string;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

interface ModuleData {
  title: string;
  orderNum: number;
  lessons: LessonData[];
}

interface LessonData {
  title: string;
  content: string;
  videoUrl?: string;
  orderNum: number;
  quizzes: QuizData[];
  files: LessonFile[];
  contentBlocks?: ContentBlock[];
}

interface LessonFile {
  type: 'image' | 'pdf' | 'document';
  name: string;
  url: string;
  file?: File;
}

interface QuizData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  questionType: string;
  points: number;
  orderNum: number;
}

export default function CourseCreatorPages({ onComplete, onCancel }: CourseCreatorPagesProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form data with localStorage persistence
  const [courseForm, setCourseForm] = useState<CourseFormData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('courseCreatorForm');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved course form data');
        }
      }
    }
    return {
      title: '',
      description: '',
      category: '',
      thumbnailUrl: '',
      gradeTier: 'college_university',
      certificationType: 'certificate',
      duration: 15,
      language: 'english',
      pricingPlanId: '',
      pricingType: 'free',
      price: '0'
    };
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('courseCreatorForm', JSON.stringify(courseForm));
    }
  }, [courseForm]);

  // Fetch course pricing plans from database
  const { data: pricingPlans = [], isLoading: pricingLoading } = useQuery({
    queryKey: ['/api/course-pricing/plans'],
    queryFn: async () => {
      const response = await fetch('/api/course-pricing/plans');
      if (!response.ok) throw new Error('Failed to fetch pricing plans');
      const result = await response.json();
      return result.plans || [];
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 24 * 60 * 60 * 1000 // 24 hours
  });

  const [modules, setModules] = useState<ModuleData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('courseCreatorModules');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved modules data');
        }
      }
    }
    return [];
  });

  // Save modules to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('courseCreatorModules', JSON.stringify(modules));
    }
  }, [modules]);
  const [currentModule, setCurrentModule] = useState<ModuleData>({
    title: '',
    orderNum: 1,
    lessons: []
  });

  const [currentLesson, setCurrentLesson] = useState<LessonData>({
    title: '',
    content: '',
    videoUrl: '',
    orderNum: 1,
    quizzes: [],
    files: [],
    contentBlocks: []
  });

  const [currentQuiz, setCurrentQuiz] = useState<QuizData>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    questionType: 'mcq',
    points: 1,
    orderNum: 1
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const sessionId = localStorage.getItem('sessionId');
      
      // Step 1: Create the course (basic info only)
      const courseResponse = await fetch('/api/course-creator/courses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          category: courseData.category,
          thumbnailUrl: courseData.thumbnailUrl,
          gradeTier: courseData.gradeTier,
          certificationType: courseData.certificationType,
          duration: courseData.duration,
          language: courseData.language,
          pricingPlanId: courseData.pricingPlanId,
          pricingType: courseData.pricingType,
          price: courseData.price
        })
      });
      
      if (!courseResponse.ok) throw new Error('Failed to create course');
      const courseResult = await courseResponse.json();
      const courseId = courseResult.course.id;
      
      // Step 2: Create modules, lessons, and quizzes sequentially
      for (const moduleData of courseData.modules) {
        const moduleResponse = await fetch(`/api/course-creator/courses/${courseId}/modules`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`
          },
          credentials: 'include',
          body: JSON.stringify({
            title: moduleData.title,
            orderNum: moduleData.orderNum
          })
        });
        
        if (!moduleResponse.ok) throw new Error(`Failed to create module: ${moduleData.title}`);
        const moduleResult = await moduleResponse.json();
        const moduleId = moduleResult.module.id;
        
        // Create lessons for this module
        for (const lessonData of moduleData.lessons) {
          const lessonResponse = await fetch(`/api/course-creator/modules/${moduleId}/lessons`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include',
            body: JSON.stringify({
              title: lessonData.title,
              content: lessonData.content,
              videoUrl: lessonData.videoUrl,
              orderNum: lessonData.orderNum,
              files: lessonData.files?.map((f: LessonFile) => ({ type: f.type, name: f.name, url: f.url })) || []
            })
          });
          
          if (!lessonResponse.ok) throw new Error(`Failed to create lesson: ${lessonData.title}`);
          const lessonResult = await lessonResponse.json();
          const lessonId = lessonResult.lesson.id;
          
          // Create content blocks for this lesson (Shaw Academy/Alison style)
          if (lessonData.contentBlocks && lessonData.contentBlocks.length > 0) {
            const blocks = lessonData.contentBlocks.map((block: ContentBlock, i: number) => {
              const mappedBlock: any = {
                blockType: block.blockType,
                isCollapsible: block.isCollapsible || false,
                isExpandedByDefault: block.isExpandedByDefault !== undefined ? block.isExpandedByDefault : true,
                displayOrder: i + 1
              };
              
              // Only include optional fields if they have actual values
              if (block.title) mappedBlock.title = block.title;
              if (block.content) mappedBlock.content = block.content;
              if (block.mediaUrl) mappedBlock.mediaUrl = block.mediaUrl;
              if (block.mediaType) mappedBlock.mediaType = block.mediaType;
              
              return mappedBlock;
            });
            
            const blockResponse = await fetch(`/api/lessons/${lessonId}/content-blocks`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionId}`
              },
              credentials: 'include',
              body: JSON.stringify({ blocks })
            });
            
            if (!blockResponse.ok) {
              throw new Error(`Failed to create content blocks for lesson: ${lessonData.title}`);
            }
          }
          
          // Create quiz for this lesson (if there are quiz questions)
          if (lessonData.quizzes && lessonData.quizzes.length > 0) {
            const quizResponse = await fetch(`/api/course-creator/lessons/${lessonId}/quizzes`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionId}`
              },
              credentials: 'include',
              body: JSON.stringify({
                title: `${lessonData.title} Quiz`,
                description: `Quiz for ${lessonData.title}`,
                questions: lessonData.quizzes.map((quizData: QuizData) => ({
                  question: quizData.question,
                  options: quizData.options,
                  correctAnswer: quizData.correctAnswer,
                  explanation: quizData.explanation || '',
                  questionType: quizData.questionType || 'mcq',
                  points: quizData.points || 1
                }))
              })
            });
            
            if (!quizResponse.ok) {
              const errorText = await quizResponse.text();
              throw new Error(`Failed to create quiz for lesson: ${lessonData.title}. ${errorText}`);
            }
          }
        }
      }
      
      return { course: { id: courseId } };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/course-creator/courses', data.course.id] });
      // Clear localStorage after successful creation
      if (typeof window !== 'undefined') {
        localStorage.removeItem('courseCreatorForm');
        localStorage.removeItem('courseCreatorModules');
      }
      onComplete(data.course.id);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Failed to create course. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
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

  const handleFileUpload = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const sessionId = localStorage.getItem('sessionId');
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId}`
      },
      body: formData
    });
    
    if (!response.ok) throw new Error('Failed to upload file');
    const data = await response.json();
    return data.url;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate course basic info
      if (!courseForm.title || !courseForm.description || !courseForm.category) {
        setErrorMessage('Please fill in all required fields: Title, Description, and Category');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
      
      if (!courseForm.gradeTier) {
        setErrorMessage('Please select a grade tier for your course');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
      
      // Validate pricing - if paid, price must be greater than 0
      if (courseForm.pricingType === 'fixed_price') {
        if (!courseForm.price || parseFloat(courseForm.price) <= 0) {
          setErrorMessage('Please enter a valid price greater than 0 for paid courses');
          setTimeout(() => setErrorMessage(''), 5000);
          return;
        }
      }
      
      setErrorMessage('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Final step - create course
      await handleCreateCourse();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateCourse = async () => {
    let thumbnailUrl = courseForm.thumbnailUrl;
    
    // Upload thumbnail if file is selected
    if (thumbnailFile) {
      setUploadingThumbnail(true);
      try {
        thumbnailUrl = await handleThumbnailUpload(thumbnailFile);
      } catch (error) {
        setUploadingThumbnail(false);
        setErrorMessage('Failed to upload thumbnail image. Please try again.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
      setUploadingThumbnail(false);
    }

    createCourseMutation.mutate({
      ...courseForm,
      thumbnailUrl,
      modules
    });
  };

  const addModule = () => {
    if (!currentModule.title) {return;
    }
    
    setModules([...modules, { ...currentModule, orderNum: modules.length + 1 }]);
    setCurrentModule({ title: '', orderNum: modules.length + 2, lessons: [] });
  };

  const removeModule = (index: number) => {
    const newModules = modules.filter((_, i) => i !== index);
    setModules(newModules);
  };

  const addLessonToModule = (moduleIndex: number) => {
    if (!currentLesson.title) {return;
    }

    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push({
      ...currentLesson,
      orderNum: updatedModules[moduleIndex].lessons.length + 1
    });
    setModules(updatedModules);
    setCurrentLesson({ title: '', content: '', videoUrl: '', orderNum: 1, quizzes: [], files: [] });
  };

  const addQuizToLesson = (moduleIndex: number, lessonIndex: number) => {
    if (!currentQuiz.question || !currentQuiz.correctAnswer) {return;
    }

    const updatedModules = [...modules];
    const validOptions = currentQuiz.options.filter(opt => opt.trim() !== '');
    updatedModules[moduleIndex].lessons[lessonIndex].quizzes.push({
      ...currentQuiz,
      options: validOptions,
      orderNum: updatedModules[moduleIndex].lessons[lessonIndex].quizzes.length + 1
    });
    setModules(updatedModules);
    setCurrentQuiz({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      questionType: 'mcq',
      points: 1,
      orderNum: 1
    });
  };

  const addFileToLesson = async (file: File, type: 'image' | 'pdf' | 'document') => {
    try {
      const url = await handleFileUpload(file, `lesson-${type}`);
      const newFile: LessonFile = {
        type,
        name: file.name,
        url,
        file
      };
      setCurrentLesson({
        ...currentLesson,
        files: [...currentLesson.files, newFile]
      });} catch (error) {}
  };

  const removeFileFromLesson = (index: number) => {
    const newFiles = currentLesson.files.filter((_, i) => i !== index);
    setCurrentLesson({ ...currentLesson, files: newFiles });
  };

  const renderHeader = () => (
    <CardHeader className="text-center space-y-4">
      <div className="flex justify-center">
        <Logo size="2xl" type="home" />
      </div>
      <div>
        <CardTitle className="text-2xl">Create New Course</CardTitle>
        <CardDescription>Build an engaging learning experience for your students</CardDescription>
      </div>
      
      {/* Progress indicators */}
      <div className="flex justify-center space-x-4 pt-4">
        <div className={`flex items-center ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
          }`}>
            {currentStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
          </div>
          <span className="ml-2 text-sm font-medium">Course Info</span>
        </div>
        
        <div className={`flex items-center ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
          }`}>
            {currentStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
          </div>
          <span className="ml-2 text-sm font-medium">Course Content</span>
        </div>
        
        <div className={`flex items-center ${currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 3 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
          }`}>
            {currentStep > 3 ? <CheckCircle2 className="h-4 w-4" /> : '3'}
          </div>
          <span className="ml-2 text-sm font-medium">Review & Publish</span>
        </div>
      </div>
      
      {/* Error Message Display */}
      {errorMessage && (
        <Alert className="border-red-200 bg-primary/10 text-red-800">
          <AlertDescription className="flex items-center gap-2">
            <X className="h-4 w-4" />
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
    </CardHeader>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="course-title">Course Title *</Label>
        <Input
          id="course-title"
          placeholder="Enter your course title"
          value={courseForm.title}
          onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
          data-testid="input-course-title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-description">Course Description *</Label>
        <Textarea
          id="course-description"
          placeholder="Describe what students will learn in this course"
          value={courseForm.description}
          onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
          rows={4}
          data-testid="textarea-course-description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-category">Category *</Label>
        <Select
          value={courseForm.category}
          onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}
        >
          <SelectTrigger data-testid="select-course-category">
            <SelectValue placeholder="Select a category" />
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

      <div className="space-y-2">
        <Label htmlFor="course-thumbnail">Course Thumbnail</Label>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Upload Image File</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setThumbnailFile(file);
                  setCourseForm({ ...courseForm, thumbnailUrl: '' });
                }
              }}
              className="cursor-pointer"
              data-testid="input-course-thumbnail-file"
            />
            {thumbnailFile && (
              <p className="text-xs text-green-600 mt-1">
                Selected: {thumbnailFile.name}
              </p>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or use URL
              </span>
            </div>
          </div>
          <Input
            placeholder="https://example.com/image.jpg"
            value={courseForm.thumbnailUrl}
            onChange={(e) => {
              setCourseForm({ ...courseForm, thumbnailUrl: e.target.value });
              if (e.target.value) {
                setThumbnailFile(null);
              }
            }}
            data-testid="input-course-thumbnail-url"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="certificate-type">Certificate Type *</Label>
        <p className="text-sm text-muted-foreground">
          Choose what students receive upon completing this course
        </p>
        <Select
          value={courseForm.certificationType}
          onValueChange={(value) => setCourseForm({ ...courseForm, certificationType: value })}
        >
          <SelectTrigger data-testid="select-certificate-type">
            <SelectValue placeholder="Select certificate type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="certificate">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Certificate of Completion</div>
                  <div className="text-xs text-muted-foreground">Standard course completion certificate</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="diploma">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">Diploma</div>
                  <div className="text-xs text-muted-foreground">Comprehensive program diploma (recommended for full courses)</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {/* Show selected certificate type info */}
        {courseForm.certificationType && (
          <div className={`p-4 border rounded-lg ${
            courseForm.certificationType === 'diploma' 
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-start gap-3">
              {courseForm.certificationType === 'diploma' ? (
                <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
              ) : (
                <Award className="h-5 w-5 text-blue-600 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className={`text-sm font-medium ${
                  courseForm.certificationType === 'diploma' 
                    ? 'text-purple-800 dark:text-purple-200' 
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {courseForm.certificationType === 'diploma' ? 'Diploma Program' : 'Certificate Course'}
                </p>
                <p className={`text-xs ${
                  courseForm.certificationType === 'diploma' 
                    ? 'text-primary dark:text-purple-300' 
                    : 'text-blue-600 dark:text-blue-300'
                }`}>
                  {courseForm.certificationType === 'diploma' 
                    ? 'Students will receive a professional diploma upon successful completion of all course requirements and assessments.' 
                    : 'Students will receive a certificate of completion after finishing the course.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Course Duration *</Label>
        <p className="text-sm text-muted-foreground">
          Select the estimated duration for completing this course
        </p>
        <Select
          value={courseForm.duration.toString()}
          onValueChange={(value) => setCourseForm({ ...courseForm, duration: parseInt(value) })}
        >
          <SelectTrigger data-testid="select-duration">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 weeks</SelectItem>
            <SelectItem value="6">6 weeks</SelectItem>
            <SelectItem value="8">8 weeks</SelectItem>
            <SelectItem value="10">10 weeks</SelectItem>
            <SelectItem value="12">12 weeks</SelectItem>
            <SelectItem value="15">15 weeks (1 semester)</SelectItem>
            <SelectItem value="16">16 weeks</SelectItem>
            <SelectItem value="20">20 weeks</SelectItem>
            <SelectItem value="24">24 weeks (6 months)</SelectItem>
            <SelectItem value="30">30 weeks (2 semesters)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Course Language *</Label>
        <p className="text-sm text-muted-foreground">
          Select the primary language of instruction
        </p>
        <Select
          value={courseForm.language}
          onValueChange={(value) => setCourseForm({ ...courseForm, language: value })}
        >
          <SelectTrigger data-testid="select-language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="spanish">Spanish</SelectItem>
            <SelectItem value="french">French</SelectItem>
            <SelectItem value="german">German</SelectItem>
            <SelectItem value="chinese">Chinese (Mandarin)</SelectItem>
            <SelectItem value="arabic">Arabic</SelectItem>
            <SelectItem value="portuguese">Portuguese</SelectItem>
            <SelectItem value="russian">Russian</SelectItem>
            <SelectItem value="japanese">Japanese</SelectItem>
            <SelectItem value="korean">Korean</SelectItem>
            <SelectItem value="hindi">Hindi</SelectItem>
            <SelectItem value="italian">Italian</SelectItem>
            <SelectItem value="dutch">Dutch</SelectItem>
            <SelectItem value="turkish">Turkish</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricing-type">Pricing Type *</Label>
        <p className="text-sm text-muted-foreground">
          Select whether this course is free or paid
        </p>
        <Select
          value={courseForm.pricingType}
          onValueChange={(value: 'free' | 'fixed_price' | 'subscription') => setCourseForm({ ...courseForm, pricingType: value })}
        >
          <SelectTrigger data-testid="select-pricing-type">
            <SelectValue placeholder="Select pricing type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free Course</SelectItem>
            <SelectItem value="fixed_price">Paid Course (One-time payment)</SelectItem>
            <SelectItem value="subscription">Subscription Course (Monthly)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {courseForm.pricingType === 'fixed_price' && (
        <div className="space-y-2">
          <Label htmlFor="course-price">Course Price (USD) *</Label>
          <Select
            value={courseForm.price}
            onValueChange={(value) => setCourseForm({ ...courseForm, price: value })}
          >
            <SelectTrigger data-testid="select-course-price">
              <SelectValue placeholder="Select price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="39">$39 - One-time payment</SelectItem>
              <SelectItem value="69">$69 - One-time payment</SelectItem>
              <SelectItem value="99">$99 - One-time payment</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select the one-time price for your course
          </p>
        </div>
      )}

      {courseForm.pricingType === 'subscription' && (
        <div className="space-y-2">
          <Label htmlFor="course-price">Monthly Subscription Price *</Label>
          <Select
            value={courseForm.price}
            onValueChange={(value) => setCourseForm({ ...courseForm, price: value })}
          >
            <SelectTrigger data-testid="select-subscription-price">
              <SelectValue placeholder="Select subscription price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="89">$89/month - Monthly subscription</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Monthly recurring subscription price
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Build Your Course Content</h3>
        <p className="text-muted-foreground">Add modules, lessons, and quizzes to structure your course</p>
      </div>

      {/* Add Module Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Add Module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Module title"
            value={currentModule.title}
            onChange={(e) => setCurrentModule({ ...currentModule, title: e.target.value })}
            data-testid="input-module-title"
          />
          <Button onClick={addModule} data-testid="button-add-module">
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </CardContent>
      </Card>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <Card key={moduleIndex}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {module.title}
                  <Badge variant="secondary">{module.lessons.length} lessons</Badge>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeModule(moduleIndex)}
                  data-testid={`button-remove-module-${moduleIndex}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Lesson to this Module */}
              <div className="p-3 border rounded bg-muted/50">
                <h5 className="font-medium mb-2">Add Lesson</h5>
                <div className="space-y-2">
                  <Input
                    placeholder="Lesson title"
                    value={currentLesson.title}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                    data-testid={`input-lesson-title-${moduleIndex}`}
                  />
                  
                  {/* Block-based content editor - Shaw Academy/Alison style */}
                  <div className="border rounded-lg p-4 bg-background">
                    <LessonBlockEditor
                      blocks={currentLesson.contentBlocks || []}
                      onChange={(blocks) => setCurrentLesson({ ...currentLesson, contentBlocks: blocks })}
                      onFileUpload={handleFileUpload}
                    />
                  </div>
                  
                  <Button
                    onClick={() => addLessonToModule(moduleIndex)}
                    size="sm"
                    data-testid={`button-add-lesson-${moduleIndex}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Lesson
                  </Button>
                </div>
              </div>

              {/* Lessons List */}
              {module.lessons.map((lesson, lessonIndex) => (
                <div key={lessonIndex} className="ml-4 p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="font-medium">{lesson.title}</h6>
                    <Badge variant="outline">{lesson.quizzes.length} quiz(es)</Badge>
                  </div>
                  
                  {/* Add Quiz to this Lesson */}
                  <div className="mt-3 p-2 border rounded bg-muted/30">
                    <h6 className="text-sm font-medium mb-2">Add Quiz Question</h6>
                    <div className="space-y-2">
                      <Input
                        placeholder="Question"
                        value={currentQuiz.question}
                        onChange={(e) => setCurrentQuiz({ ...currentQuiz, question: e.target.value })}
                        data-testid={`input-quiz-question-${moduleIndex}-${lessonIndex}`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {currentQuiz.options.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...currentQuiz.options];
                              newOptions[optionIndex] = e.target.value;
                              setCurrentQuiz({ ...currentQuiz, options: newOptions });
                            }}
                            data-testid={`input-quiz-option-${moduleIndex}-${lessonIndex}-${optionIndex}`}
                          />
                        ))}
                      </div>
                      <Input
                        placeholder="Correct answer"
                        value={currentQuiz.correctAnswer}
                        onChange={(e) => setCurrentQuiz({ ...currentQuiz, correctAnswer: e.target.value })}
                        data-testid={`input-quiz-answer-${moduleIndex}-${lessonIndex}`}
                      />
                      <Button
                        onClick={() => addQuizToLesson(moduleIndex, lessonIndex)}
                        size="sm"
                        data-testid={`button-add-quiz-${moduleIndex}-${lessonIndex}`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Quiz
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Review Your Course</h3>
        <p className="text-muted-foreground">Review all the details before publishing your course</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Title</Label>
            <p className="text-sm text-muted-foreground">{courseForm.title}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Description</Label>
            <p className="text-sm text-muted-foreground">{courseForm.description}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Category</Label>
            <p className="text-sm text-muted-foreground capitalize">{courseForm.category}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Pricing</Label>
            <p className="text-sm text-muted-foreground">
              {(() => {
                if (courseForm.pricingType === 'free') return 'Free';
                if (courseForm.pricingType === 'subscription') return `$${courseForm.price}/month - Monthly subscription`;
                if (courseForm.pricingType === 'fixed_price') return `$${courseForm.price} - One-time payment`;
                return 'No pricing selected';
              })()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm">
              <strong>{modules.length}</strong> modules, <strong>{modules.reduce((acc, mod) => acc + mod.lessons.length, 0)}</strong> lessons, <strong>{modules.reduce((acc, mod) => acc + mod.lessons.reduce((lAcc, lesson) => lAcc + lesson.quizzes.length, 0), 0)}</strong> quizzes
            </div>
            {modules.map((module, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium">{index + 1}. {module.title}</p>
                <div className="ml-4 text-muted-foreground">
                  {module.lessons.map((lesson, lIndex) => (
                    <p key={lIndex}>• {lesson.title} ({lesson.quizzes.length} quiz(es))</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  const renderFooter = () => (
    <div className="flex justify-between pt-6">
      <Button
        variant="outline"
        onClick={currentStep === 1 ? onCancel : handlePrevious}
        data-testid="button-previous"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {currentStep === 1 ? 'Cancel' : 'Previous'}
      </Button>
      
      <Button
        onClick={handleNext}
        disabled={createCourseMutation.isPending || uploadingThumbnail}
        data-testid="button-next"
      >
        {currentStep === 3 ? (
          uploadingThumbnail ? 'Uploading...' : createCourseMutation.isPending ? 'Creating...' : 'Create Course'
        ) : (
          <>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full">
        <div className="w-full pt-6">
          <div className="max-w-4xl mx-auto">
            {renderHeader()}
          </div>
          <CardContent className="space-y-6">
            <div className="max-w-4xl mx-auto px-6">
              {renderStepContent()}
              {renderFooter()}
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
