import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, FileText, Image, Video, File, Plus, Trash2, HelpCircle } from 'lucide-react';

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text_entry';
  options?: string[]; // For multiple choice (A, B, C, D)
  correctAnswer: string; // For multiple choice: the correct option, for text: the expected answer
  explanation?: string;
}

interface ParsedQuestion extends QuizQuestion {
  isFromParsing: boolean;
}

export function CreateAssignmentDialog({ open, onOpenChange, onSuccess }: CreateAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    subject: '',
    grade: 7, // Default to grade 7
    dueDate: '',
    maxGrade: 100,
    targetType: 'all' as 'all' | 'individual',
    targetStudents: [] as string[],
    allowLateSubmission: false,
    allowResubmission: false
  });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);

  const subjects = [
    'Mathematics', 'English', 'Science', 'History', 'Geography', 
    'Physics', 'Chemistry', 'Biology', 'Art', 'Music', 'Physical Education'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-parse questions when description changes
    if (field === 'description' && value) {
      parseQuestionsFromText(value);
    }
  };

  // Parse questions from assignment description
  const parseQuestionsFromText = (text: string) => {
    const questionPatterns = [
      // Pattern: "1. Question text? A) Option B) Option C) Option D) Option [Answer: A]"
      /(\d+\.\s*[^?]+\?)\s*A\)\s*([^B]+)\s*B\)\s*([^C]+)\s*C\)\s*([^D]+)\s*D\)\s*([^[\n]+)(?:\s*\[Answer:\s*([A-D])\])?/gi,
      // Pattern: "Question text? a) Option b) Option c) Option d) Option"
      /([^?]+\?)\s*a\)\s*([^b]+)\s*b\)\s*([^c]+)\s*c\)\s*([^d]+)\s*d\)\s*([^\n]+)/gi,
    ];

    const foundQuestions: ParsedQuestion[] = [];
    
    questionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [, question, optionA, optionB, optionC, optionD, correctLetter] = match;
        
        if (question && optionA && optionB && optionC && optionD) {
          const options = [
            optionA.trim(),
            optionB.trim(), 
            optionC.trim(),
            optionD.trim()
          ];
          
          const correctAnswer = correctLetter ? 
            options[correctLetter.charCodeAt(0) - 'A'.charCodeAt(0)] : 
            options[0]; // Default to first option if no answer specified
          
          foundQuestions.push({
            id: Date.now().toString() + Math.random(),
            question: question.trim(),
            type: 'multiple_choice',
            options,
            correctAnswer,
            explanation: '',
            isFromParsing: true
          });
        }
      }
    });

    setParsedQuestions(foundQuestions);
  };

  // Add a new question manually
  const addNewQuestion = (type: 'multiple_choice' | 'text_entry') => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString() + Math.random(),
      question: '',
      type,
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
      correctAnswer: '',
      explanation: ''
    };
    
    setQuestions(prev => [...prev, newQuestion]);
  };

  // Update a question
  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  // Remove a question
  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Accept parsed questions
  const acceptParsedQuestions = () => {
    const newQuestions = parsedQuestions.map(({ isFromParsing, ...q }) => q);
    setQuestions(prev => [...prev, ...newQuestions]);
    setParsedQuestions([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    
    try {
      const uploadedFiles: AttachmentFile[] = [];
      
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'assignment-attachment');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Upload response:', data);
          
          if (data.success && data.url) {
            uploadedFiles.push({
              id: Date.now().toString() + Math.random(),
              name: file.name,
              size: file.size,
              type: file.type,
              url: data.url
            });
          } else {
            console.error('Upload failed for file:', file.name, 'Error:', data.error || 'Unknown error');
            throw new Error(data.error || `Failed to upload ${file.name}`);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          console.error('Upload request failed:', response.status, errorData);
          throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }
      }

      setAttachments(prev => [...prev, ...uploadedFiles]);
      setUploadError(null);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.subject || !formData.grade || !formData.dueDate) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('sessionId');
      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          attachments: attachments.map(att => ({
            name: att.name,
            url: att.url,
            size: att.size,
            type: att.type
          })),
          questions: questions.length > 0 ? questions : undefined
        })
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({
          title: '',
          description: '',
          instructions: '',
          subject: '',
          grade: 7,
          dueDate: '',
          maxGrade: 100,
          targetType: 'all',
          targetStudents: [],
          allowLateSubmission: false,
          allowResubmission: false
        });
        setAttachments([]);
      } else {
        const error = await response.json();
        console.error('Failed to create assignment:', error.error);
      }
    } catch (error) {
      console.error('Create assignment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full px-3 sm:px-6" data-testid="dialog-create-assignment">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Create a new assignment with questions for your students to complete
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            <TabsTrigger value="details" className="px-1 sm:px-3">Details</TabsTrigger>
            <TabsTrigger value="questions" className="px-1 sm:px-3">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="attachments" className="px-1 sm:px-3">Files ({attachments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter assignment title"
                data-testid="input-assignment-title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the assignment (questions will be auto-parsed)"
                rows={4}
                data-testid="textarea-assignment-description"
              />
              {parsedQuestions.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-2">
                    🎯 Found {parsedQuestions.length} questions in your description!
                  </p>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={acceptParsedQuestions}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-accept-parsed-questions"
                  >
                    Add to Questions Tab
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="instructions">Detailed Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Provide detailed instructions for students"
                rows={4}
                data-testid="textarea-assignment-instructions"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => handleInputChange('subject', value)}
                >
                  <SelectTrigger data-testid="select-assignment-subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="grade">Grade Level *</Label>
                <Select 
                  value={formData.grade.toString()} 
                  onValueChange={(value) => handleInputChange('grade', parseInt(value))}
                >
                  <SelectTrigger data-testid="select-assignment-grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>Grade {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  data-testid="input-assignment-due-date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxGrade">Maximum Grade</Label>
              <Input
                id="maxGrade"
                type="number"
                min="1"
                max="1000"
                value={formData.maxGrade}
                onChange={(e) => handleInputChange('maxGrade', parseInt(e.target.value))}
                data-testid="input-assignment-max-grade"
              />
            </div>

            <div className="space-y-3">
              <Label>Assignment Settings</Label>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
                  data-testid="checkbox-allow-late-submission"
                  className="shrink-0"
                />
                <Label htmlFor="allowLateSubmission" className="text-sm">Allow late submissions</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="allowResubmission"
                  checked={formData.allowResubmission}
                  onCheckedChange={(checked) => handleInputChange('allowResubmission', checked)}
                  data-testid="checkbox-allow-resubmission"
                  className="shrink-0"
                />
                <Label htmlFor="allowResubmission" className="text-sm">Allow resubmissions after grading</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Questions & Quiz Builder</h3>
                  <p className="text-sm text-gray-600">Create multiple choice and text entry questions for your assignment</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => addNewQuestion('multiple_choice')}
                    data-testid="button-add-multiple-choice"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Multiple Choice
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => addNewQuestion('text_entry')}
                    data-testid="button-add-text-entry"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Text Entry
                  </Button>
                </div>
              </div>

              {questions.length === 0 ? (
                <Card className="p-8 text-center">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Questions Yet</h3>
                  <p className="text-gray-500 mb-4">Add questions above or include them in your assignment description to auto-parse</p>
                  <p className="text-sm text-gray-400">Example: "1. What is 2+2? A) 3 B) 4 C) 5 D) 6 [Answer: B]"</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-500 hover:text-red-700"
                            data-testid={`button-remove-question-${question.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div>
                          <Label>Question Text *</Label>
                          <Textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                            placeholder="Enter your question here..."
                            rows={2}
                            data-testid={`textarea-question-${question.id}`}
                          />
                        </div>

                        {question.type === 'multiple_choice' && (
                          <div className="space-y-3">
                            <Label>Answer Options (A, B, C, D)</Label>
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <Badge variant="secondary" className="min-w-[24px] text-center">
                                  {String.fromCharCode(65 + optIndex)}
                                </Badge>
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(question.options || [])];
                                    newOptions[optIndex] = e.target.value;
                                    updateQuestion(question.id, { options: newOptions });
                                  }}
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                  data-testid={`input-option-${question.id}-${optIndex}`}
                                />
                              </div>
                            ))}
                            
                            <div>
                              <Label>Correct Answer *</Label>
                              <Select 
                                value={question.correctAnswer} 
                                onValueChange={(value) => updateQuestion(question.id, { correctAnswer: value })}
                              >
                                <SelectTrigger data-testid={`select-correct-answer-${question.id}`}>
                                  <SelectValue placeholder="Select correct answer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options?.map((option, optIndex) => (
                                    option && (
                                      <SelectItem key={optIndex} value={option}>
                                        {String.fromCharCode(65 + optIndex)}) {option}
                                      </SelectItem>
                                    )
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {question.type === 'text_entry' && (
                          <div>
                            <Label>Expected Answer *</Label>
                            <Input
                              value={question.correctAnswer}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                              placeholder="Enter the expected answer"
                              data-testid={`input-text-answer-${question.id}`}
                            />
                          </div>
                        )}

                        <div>
                          <Label>Explanation (Optional)</Label>
                          <Textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                            placeholder="Explain why this is the correct answer..."
                            rows={2}
                            data-testid={`textarea-explanation-${question.id}`}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
                <CardDescription>
                  Upload files, documents, or resources for this assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, PPT, Images, Videos (MAX. 10MB each)</p>
                      </div>
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                        onChange={handleFileUpload}
                        disabled={uploadingFiles}
                        data-testid="input-file-upload"
                      />
                    </label>
                  </div>

                  {uploadingFiles && (
                    <div className="text-center">
                      <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white border border-gray-300">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading files...
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      {uploadError}
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(file.type)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(file.id)}
                            className="text-red-500 hover:text-red-700"
                            data-testid={`button-remove-attachment-${file.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2d5ddd] text-[#ffffff]"
              data-testid="button-save-assignment"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
