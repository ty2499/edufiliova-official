import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileText, Image, Video, File } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  subject: string;
  maxGrade: number;
  status: 'draft' | 'published' | 'closed';
  attachments?: any[];
  allowLateSubmission: boolean;
  allowResubmission: boolean;
}

interface EditAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment;
  onSuccess: () => void;
}

interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export function EditAssignmentDialog({ open, onOpenChange, assignment, onSuccess }: EditAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    subject: '',
    dueDate: '',
    maxGrade: 100,
    allowLateSubmission: false,
    allowResubmission: false
  });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const subjects = [
    'Mathematics', 'English', 'Science', 'History', 'Geography', 
    'Physics', 'Chemistry', 'Biology', 'Art', 'Music', 'Physical Education'
  ];

  useEffect(() => {
    if (assignment && open) {
      setFormData({
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions || '',
        subject: assignment.subject,
        dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
        maxGrade: assignment.maxGrade,
        allowLateSubmission: assignment.allowLateSubmission,
        allowResubmission: assignment.allowResubmission
      });
      
      // Convert existing attachments
      if (assignment.attachments && Array.isArray(assignment.attachments)) {
        const existingAttachments = assignment.attachments.map((att, index) => ({
          id: `existing-${index}`,
          name: att.name || 'Attachment',
          size: att.size || 0,
          type: att.type || 'application/octet-stream',
          url: att.url
        }));
        setAttachments(existingAttachments);
      }
    }
  }, [assignment, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    
    try {
      const uploadedFiles: AttachmentFile[] = [];
      
      for (const file of Array.from(files)) {
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        formDataObj.append('type', 'assignment-attachment');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataObj,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          uploadedFiles.push({
            id: Date.now().toString() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: data.url
          });
        }
      }

      setAttachments(prev => [...prev, ...uploadedFiles]);} catch (error) {
      console.error('Upload error:', error);} finally {
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
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.subject || !formData.dueDate) {return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/assignments/${assignment.id}`, {
        method: 'PUT',
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
          }))
        })
      });

      if (response.ok) {onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();}
    } catch (error) {
      console.error('Update assignment error:', error);} finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-assignment">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update the assignment details and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter assignment title"
                data-testid="input-edit-title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the assignment"
                rows={3}
                data-testid="textarea-edit-description"
              />
            </div>

            <div>
              <Label htmlFor="instructions">Detailed Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Provide detailed instructions for students"
                rows={4}
                data-testid="textarea-edit-instructions"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => handleInputChange('subject', value)}
                >
                  <SelectTrigger data-testid="select-edit-subject">
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
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  data-testid="input-edit-due-date"
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
                data-testid="input-edit-max-grade"
              />
            </div>

            <div className="space-y-3">
              <Label>Assignment Settings</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
                  data-testid="checkbox-edit-late-submission"
                />
                <Label htmlFor="allowLateSubmission">Allow late submissions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowResubmission"
                  checked={formData.allowResubmission}
                  onCheckedChange={(checked) => handleInputChange('allowResubmission', checked)}
                  data-testid="checkbox-edit-resubmission"
                />
                <Label htmlFor="allowResubmission">Allow resubmissions after grading</Label>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
                <CardDescription>
                  Update files, documents, or resources for this assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-upload-edit" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100" transition-all duration-300>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, PPT, Images, Videos (MAX. 10MB each)</p>
                      </div>
                      <input 
                        id="file-upload-edit" 
                        type="file" 
                        className="hidden" 
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                        onChange={handleFileUpload}
                        disabled={uploadingFiles}
                        data-testid="input-edit-file-upload"
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
                            className="text-primary hover:text-primary" transition-all duration-300
                            data-testid={`button-edit-remove-attachment-${file.id}`}
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
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#A0FAB2] hover:bg-[#32e566] text-black" transition-all duration-300
              data-testid="button-save-edit-assignment"
            >
              {loading ? 'Updating...' : 'Update Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
