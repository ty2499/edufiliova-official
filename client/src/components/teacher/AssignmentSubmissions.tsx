import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Clock, FileText, AlertCircle, Download, MessageSquare, Eye, Image, FileVideo, File } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  description: string;
  maxGrade: number;
  dueDate: string;
  allowResubmission: boolean;
  questions?: any[]; // Array of quiz questions
}

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  fileUrls?: any[];
  textContent?: string;
  questionAnswers?: Record<string, string>; // Object mapping question IDs to student answers
  submittedAt: string;
  grade?: string;
  numericGrade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'resubmit';
  isLate: boolean;
  resubmissionCount: number;
  gradedAt?: string;
}

interface AssignmentSubmissionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment;
}

export function AssignmentSubmissions({ open, onOpenChange, assignment }: AssignmentSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingData, setGradingData] = useState({
    grade: '',
    numericGrade: '',
    feedback: '',
    allowResubmission: false
  });
  const [gradingLoading, setGradingLoading] = useState(false);

  const fetchSubmissions = async () => {
    if (!assignment.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/assignments/${assignment.id}/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.data || []);
      } else {}
    } catch (error) {
      console.error('Error fetching submissions:', error);} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && assignment.id) {
      fetchSubmissions();
    }
  }, [open, assignment.id]);

  const handleGradeSubmission = async (submissionId: string) => {
    if (!gradingData.grade && !gradingData.numericGrade) {return;
    }

    setGradingLoading(true);

    try {
      const token = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/assignments/${assignment.id}/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grade: gradingData.grade || undefined,
          numericGrade: gradingData.numericGrade ? parseInt(gradingData.numericGrade) : undefined,
          feedback: gradingData.feedback || undefined,
          allowResubmission: gradingData.allowResubmission
        })
      });

      if (response.ok) {// Reset grading form
        setGradingData({
          grade: '',
          numericGrade: '',
          feedback: '',
          allowResubmission: false
        });
        
        setSelectedSubmission(null);
        fetchSubmissions();
      } else {
        const error = await response.json();}
    } catch (error) {
      console.error('Error grading submission:', error);} finally {
      setGradingLoading(false);
    }
  };

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === 'graded') {
      return <Badge variant="default">Graded</Badge>;
    }
    if (status === 'resubmit') {
      return <Badge variant="secondary">Needs Resubmission</Badge>;
    }
    if (isLate) {
      return <Badge variant="destructive">Late Submission</Badge>;
    }
    return <Badge variant="outline">Submitted</Badge>;
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileTypeIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'avi', 'mov'].includes(extension || '')) {
      return <FileVideo className="h-5 w-5 text-purple-500" />;
    }
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const isImageFile = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  };

  const isPdfFile = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'pdf' || mimeType === 'application/pdf';
  };

  const isVideoFile = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return mimeType?.startsWith('video/') || ['mp4', 'webm', 'avi', 'mov'].includes(extension || '');
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Submissions</DialogTitle>
            <DialogDescription>Loading submissions...</DialogDescription>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="dialog-assignment-submissions">
        <DialogHeader>
          <DialogTitle>
            Submissions for "{assignment.title}"
          </DialogTitle>
          <DialogDescription>
            Review and grade student submissions for this assignment
          </DialogDescription>
        </DialogHeader>

        {selectedSubmission ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setSelectedSubmission(null)}
                data-testid="button-back-to-submissions"
              >
                ← Back to Submissions
              </Button>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedSubmission.status, selectedSubmission.isLate)}
                <span className="text-sm text-gray-600">
                  Submitted by {selectedSubmission.studentName}
                </span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedSubmission.studentName}'s Submission
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Submitted {format(new Date(selectedSubmission.submittedAt), 'MMM dd, yyyy at h:mm a')}
                  </span>
                  {selectedSubmission.resubmissionCount > 0 && (
                    <span className="text-amber-600">
                      Resubmission #{selectedSubmission.resubmissionCount}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {selectedSubmission.textContent && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <Label className="text-lg font-semibold text-gray-900">Written Response</Label>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-500 shadow-sm">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-gray-900 leading-relaxed text-base">{selectedSubmission.textContent}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedSubmission.fileUrls && selectedSubmission.fileUrls.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Download className="h-5 w-5 text-indigo-600" />
                      <Label className="text-lg font-semibold text-gray-900">File Attachments</Label>
                      <Badge variant="outline" className="ml-2">{selectedSubmission.fileUrls.length} file{selectedSubmission.fileUrls.length > 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="space-y-4">
                      {selectedSubmission.fileUrls.map((file, index) => {
                        const fileName = file.name || `File ${index + 1}`;
                        const fileUrl = file.url;
                        
                        return (
                          <div key={index} className="border rounded-lg overflow-hidden">
                            {/* File Header */}
                            <div className="flex items-center justify-between p-3 bg-gray-50">
                              <div className="flex items-center gap-3">
                                {getFileTypeIcon(fileName, file.mimeType)}
                                <div>
                                  <p className="font-medium">{fileName}</p>
                                  <p className="text-sm text-gray-500">
                                    {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(fileUrl, '_blank')}
                                  data-testid={`button-view-file-${index}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadFile(fileUrl, fileName)}
                                  data-testid={`button-download-file-${index}`}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                            
                            {/* File Preview */}
                            <div className="p-3">
                              {isImageFile(fileName, file.mimeType) && (
                                <div className="flex justify-center">
                                  <img 
                                    src={fileUrl} 
                                    alt={fileName}
                                    className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              
                              {isPdfFile(fileName, file.mimeType) && (
                                <div className="w-full">
                                  <iframe
                                    src={`${fileUrl}#view=FitH`}
                                    className="w-full h-96 border-0 rounded-lg"
                                    title={fileName}
                                  />
                                  <p className="text-sm text-gray-500 mt-2 text-center">
                                    PDF Preview - Click "View" to open in new tab for better quality
                                  </p>
                                </div>
                              )}
                              
                              {isVideoFile(fileName, file.mimeType) && (
                                <div className="flex justify-center">
                                  <video 
                                    controls 
                                    className="max-w-full max-h-96 rounded-lg shadow-md"
                                    preload="metadata"
                                  >
                                    <source src={fileUrl} type={file.mimeType || 'video/mp4'} />
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                              
                              {!isImageFile(fileName, file.mimeType) && 
                               !isPdfFile(fileName, file.mimeType) && 
                               !isVideoFile(fileName, file.mimeType) && (
                                <div className="text-center py-8 text-gray-500">
                                  <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p>Preview not available for this file type</p>
                                  <p className="text-sm">Click "View" or "Download" to access the file</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedSubmission.questionAnswers && assignment.questions && assignment.questions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Question Answers:</Label>
                    <div className="mt-2 space-y-4">
                      {assignment.questions.map((question, index) => {
                        const studentAnswer = selectedSubmission.questionAnswers?.[question.id];
                        const isCorrect = question.type === 'multiple_choice' 
                          ? studentAnswer === question.correctAnswer
                          : studentAnswer?.toLowerCase()?.trim() === question.correctAnswer?.toLowerCase()?.trim();
                        
                        return (
                          <Card key={question.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">Question {index + 1}</Badge>
                                {studentAnswer && (
                                  <Badge 
                                    variant={isCorrect ? "default" : "destructive"}
                                    className={isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                  >
                                    {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                                  </Badge>
                                )}
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                                
                                {question.type === 'multiple_choice' && question.options && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Options:</p>
                                    <div className="grid grid-cols-1 gap-2">
                                      {question.options.map((option: string, optIndex: number) => {
                                        const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
                                        // Student answer could be letter (like "B") or full text
                                        const isSelected = studentAnswer === letter || studentAnswer === option;
                                        const isCorrectOption = option === question.correctAnswer || letter === question.correctAnswer;
                                        
                                        return (
                                          <div 
                                            key={optIndex}
                                            className={`p-3 rounded-lg border-2 transition-all ${
                                              isSelected 
                                                ? isCorrectOption 
                                                  ? 'bg-green-50 border-green-400 shadow-md' 
                                                  : 'bg-red-50 border-red-400 shadow-md'
                                                : isCorrectOption 
                                                  ? 'bg-blue-50 border-blue-300' 
                                                  : 'bg-white border-gray-200'
                                            }`}
                                          >
                                            <div className="flex items-center">
                                              <span className="font-bold text-lg mr-3 inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-current">
                                                {letter}
                                              </span>
                                              <span className="text-base">{option}</span>
                                            </div>
                                            {isSelected && (
                                              <div className="mt-2 flex items-center">
                                                <span className="ml-11 text-sm font-medium px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                                                  ← Student's Answer
                                                </span>
                                              </div>
                                            )}
                                            {isCorrectOption && !isSelected && (
                                              <div className="mt-2 flex items-center">
                                                <span className="ml-11 text-sm text-green-600 font-medium px-2 py-1 rounded-md bg-green-100">
                                                  ← Correct Answer
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {question.type === 'text_entry' && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Student's Answer:</p>
                                    <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-gray-50'}`}>
                                      <p className="text-gray-900">{studentAnswer || 'No answer provided'}</p>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      <strong>Expected Answer:</strong> {question.correctAnswer}
                                    </p>
                                  </div>
                                )}

                                {question.explanation && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                                    <p className="text-sm text-blue-800">{question.explanation}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!selectedSubmission.textContent && 
                 (!selectedSubmission.fileUrls || selectedSubmission.fileUrls.length === 0) && 
                 (!selectedSubmission.questionAnswers || Object.keys(selectedSubmission.questionAnswers || {}).length === 0) && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Submission Content Found</h3>
                    <p className="text-gray-600 mb-4">This submission appears to be empty or the content failed to load.</p>
                    <div className="text-left bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Debug Information:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Text Content: {selectedSubmission.textContent ? 'Present' : 'None'}</li>
                        <li>• File Attachments: {selectedSubmission.fileUrls?.length || 0}</li>
                        <li>• Quiz Answers: {selectedSubmission.questionAnswers ? Object.keys(selectedSubmission.questionAnswers).length : 0}</li>
                        <li>• Assignment has questions: {assignment.questions?.length || 0}</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedSubmission.status === 'graded' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Graded Submission
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Grade Display with Status */}
                        <div className="p-4 rounded-lg border-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`px-4 py-2 rounded-full text-lg font-bold ${
                                selectedSubmission.grade === 'A' || selectedSubmission.grade === 'B' 
                                  ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                                  : selectedSubmission.grade === 'C' 
                                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                                    : 'bg-red-100 text-red-800 border-2 border-red-300'
                              }`}>
                                {selectedSubmission.grade}
                              </div>
                              <div className="text-lg font-semibold">
                                Status: {selectedSubmission.grade === 'A' || selectedSubmission.grade === 'B' ? (
                                  <span className="text-green-600 font-bold">✓ PASS</span>
                                ) : selectedSubmission.grade === 'C' ? (
                                  <span className="text-yellow-600 font-bold">~ AVERAGE</span>
                                ) : (
                                  <span className="text-red-600 font-bold">✗ FAILED</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-800">
                                {selectedSubmission.numericGrade || selectedSubmission.grade}
                              </div>
                              <div className="text-sm text-gray-600">
                                out of {assignment.maxGrade}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Feedback */}
                        {selectedSubmission.feedback && (
                          <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-semibold text-gray-900 mb-2">Teacher Feedback:</h4>
                            <p className="text-gray-800 whitespace-pre-wrap">{selectedSubmission.feedback}</p>
                          </div>
                        )}

                        {/* Grading Info */}
                        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                          <span>Graded on {format(new Date(selectedSubmission.gradedAt!), 'MMM dd, yyyy at h:mm a')}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              selectedSubmission.grade === 'A' || selectedSubmission.grade === 'B' 
                                ? 'bg-green-100 text-green-700' 
                                : selectedSubmission.grade === 'C' 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {selectedSubmission.grade === 'A' || selectedSubmission.grade === 'B' ? 'PASSED' 
                               : selectedSubmission.grade === 'C' ? 'AVERAGE' 
                               : 'FAILED'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {selectedSubmission.status !== 'graded' && (
              <Card>
                <CardHeader>
                  <CardTitle>Grade This Submission</CardTitle>
                  <CardDescription>
                    Grade System: A & B = Pass (Green) | C = Average | D = Failed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Letter Grade Selection */}
                  <div>
                    <Label className="text-base font-semibold">Letter Grade</Label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      {[
                        { letter: 'A', status: 'Pass', color: 'bg-green-100 border-green-400 text-green-800', numeric: assignment.maxGrade },
                        { letter: 'B', status: 'Pass', color: 'bg-green-100 border-green-400 text-green-800', numeric: Math.round(assignment.maxGrade * 0.85) },
                        { letter: 'C', status: 'Average', color: 'bg-yellow-100 border-yellow-400 text-yellow-800', numeric: Math.round(assignment.maxGrade * 0.75) },
                        { letter: 'D', status: 'Failed', color: 'bg-red-100 border-red-400 text-red-800', numeric: Math.round(assignment.maxGrade * 0.65) }
                      ].map((grade) => (
                        <button
                          key={grade.letter}
                          onClick={() => {
                            setGradingData(prev => ({
                              ...prev,
                              grade: grade.letter,
                              numericGrade: grade.numeric.toString()
                            }));
                          }}
                          className={`p-4 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                            gradingData.grade === grade.letter
                              ? `${grade.color} shadow-lg scale-105`
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                          data-testid={`button-grade-${grade.letter}`}
                        >
                          <div className="text-2xl font-bold">{grade.letter}</div>
                          <div className="text-sm font-medium mt-1">{grade.status}</div>
                          <div className="text-xs text-gray-600 mt-1">{grade.numeric}/{assignment.maxGrade}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grade Preview */}
                  {gradingData.grade && (
                    <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            gradingData.grade === 'A' || gradingData.grade === 'B' 
                              ? 'bg-green-100 text-green-800' 
                              : gradingData.grade === 'C' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            Grade: {gradingData.grade}
                          </div>
                          <div className="text-sm font-medium">
                            Status: {gradingData.grade === 'A' || gradingData.grade === 'B' ? (
                              <span className="text-green-600 font-semibold">✓ PASS</span>
                            ) : gradingData.grade === 'C' ? (
                              <span className="text-yellow-600 font-semibold">~ AVERAGE</span>
                            ) : (
                              <span className="text-red-600 font-semibold">✗ FAILED</span>
                            )}
                          </div>
                        </div>
                        <div className="text-lg font-bold">
                          {gradingData.numericGrade}/{assignment.maxGrade} points
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Grade Override */}
                  <div className="border-t pt-4">
                    <Label className="text-sm text-gray-600">Manual Grade Override (optional)</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Input
                          placeholder="Custom letter (e.g. A+, B-)"
                          value={gradingData.grade}
                          onChange={(e) => setGradingData(prev => ({ ...prev, grade: e.target.value }))}
                          data-testid="input-custom-letter"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          min="0"
                          max={assignment.maxGrade}
                          placeholder={`Custom points (0-${assignment.maxGrade})`}
                          value={gradingData.numericGrade}
                          onChange={(e) => setGradingData(prev => ({ ...prev, numericGrade: e.target.value }))}
                          data-testid="input-custom-numeric"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={gradingData.feedback}
                      onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Provide constructive feedback to help the student improve..."
                      rows={4}
                      data-testid="textarea-feedback"
                    />
                  </div>

                  {assignment.allowResubmission && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowResubmission"
                        checked={gradingData.allowResubmission}
                        onChange={(e) => setGradingData(prev => ({ ...prev, allowResubmission: e.target.checked }))}
                        className="rounded"
                        data-testid="checkbox-allow-resubmission"
                      />
                      <Label htmlFor="allowResubmission">
                        Allow student to resubmit this assignment
                      </Label>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSubmission(null)}
                      disabled={gradingLoading}
                      data-testid="button-cancel-grading"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleGradeSubmission(selectedSubmission.id)}
                      disabled={gradingLoading || !gradingData.grade}
                      className="bg-[#2d5ddd] hover:bg-[#2447b8] text-white"
                      data-testid="button-submit-grade"
                    >
                      {gradingLoading ? 'Grading...' : 'Submit Grade'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Assignment due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy at h:mm a')}
                </p>
                <p className="text-sm text-gray-600">
                  Maximum grade: {assignment.maxGrade} points
                </p>
              </div>
              <Badge variant="outline">
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {submissions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                  <p className="text-gray-600 text-center">
                    Students haven't submitted their work for this assignment yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {submissions.map((submission) => (
                    <Card 
                      key={submission.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedSubmission(submission)}
                      data-testid={`submission-card-${submission.studentId}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{submission.studentName}</h3>
                              {getStatusBadge(submission.status, submission.isLate)}
                              {submission.resubmissionCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Resubmission #{submission.resubmissionCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(submission.submittedAt), 'MMM dd, yyyy at h:mm a')}
                              </span>
                              {submission.fileUrls && submission.fileUrls.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  {submission.fileUrls.length} file{submission.fileUrls.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {submission.textContent && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  Written response
                                </span>
                              )}
                            </div>
                            {submission.status === 'graded' && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium text-[#42fa76]">
                                  Grade: {submission.grade || `${submission.numericGrade}/${assignment.maxGrade}`}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(submission);
                            }}
                            data-testid={`button-view-submission-${submission.studentId}`}
                          >
                            {submission.status === 'graded' ? 'Review' : 'Grade'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
