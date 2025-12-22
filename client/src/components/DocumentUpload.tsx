import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
// useToast removed - now using silent operations
import { 
  Upload, 
  File, 
  X, 
  AlertCircle, 
  Eye,
  Download,
  FileText,
  Image,
  Video,
  Archive
} from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'error';
  url?: string;
  uploadProgress?: number;
}

interface DocumentCategory {
  id: string;
  title: string;
  description: string;
  required: boolean;
  acceptedTypes: string[];
  maxSize: number; // in MB
  maxFiles: number;
  examples: string[];
}

interface DocumentUploadProps {
  teacherId: string;
  onUploadComplete?: (categoryId: string, files: DocumentFile[]) => void;
}

const DocumentUpload = ({ teacherId, onUploadComplete }: DocumentUploadProps) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, DocumentFile[]>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Silent operations - no toast notifications

  // Load existing documents on component mount
  useEffect(() => {
    if (teacherId) {
      loadExistingDocuments();
    }
  }, [teacherId]);

  const loadExistingDocuments = async () => {
    try {
      const response = await fetch('/api/teacher/documents', {
        headers: {
          'user-id': teacherId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.documents) {
          // Convert server documents to our format
          const formattedDocs: Record<string, DocumentFile[]> = {};
          Object.entries(data.documents).forEach(([categoryId, docs]) => {
            if (Array.isArray(docs)) {
              formattedDocs[categoryId] = docs.map((doc: any) => ({
                id: doc.id,
                name: doc.originalFileName,
                size: doc.fileSize,
                type: doc.fileType,
                status: 'uploaded' as const,
                url: doc.fileUrl
              }));
            }
          });
          setUploadedDocuments(formattedDocs);
        }
      }
    } catch (error) {
      console.error('Failed to load existing documents:', error);
    }
  };

  const documentCategories: DocumentCategory[] = [
    {
      id: "academic-qualifications",
      title: "Academic Qualifications",
      description: "Degree certificates, diplomas, academic transcripts",
      required: true,
      acceptedTypes: ["image/*", ".pdf", ".doc", ".docx"],
      maxSize: 10,
      maxFiles: 5,
      examples: ["Bachelor's Degree", "Master's Degree", "PhD Certificate", "Academic Transcripts"]
    },
    {
      id: "teaching-certifications",
      title: "Teaching Certifications",
      description: "Teaching licenses, professional certifications, training certificates",
      required: true,
      acceptedTypes: ["image/*", ".pdf", ".doc", ".docx"],
      maxSize: 10,
      maxFiles: 5,
      examples: ["Teaching License", "TESOL Certificate", "Subject-specific Certification"]
    },
    {
      id: "professional-experience",
      title: "Professional Experience",
      description: "Work history, recommendation letters, portfolio samples",
      required: true,
      acceptedTypes: ["image/*", ".pdf", ".doc", ".docx", ".ppt", ".pptx"],
      maxSize: 15,
      maxFiles: 10,
      examples: ["CV/Resume", "Work References", "Teaching Portfolio", "Student Feedback"]
    },
    {
      id: "identity-verification",
      title: "Identity Verification",
      description: "Government-issued ID, passport, background check",
      required: true,
      acceptedTypes: ["image/*", ".pdf"],
      maxSize: 5,
      maxFiles: 3,
      examples: ["Passport", "Driver's License", "National ID", "Background Check"]
    },
    {
      id: "additional-documents",
      title: "Additional Documents",
      description: "Any other relevant documents supporting your application",
      required: false,
      acceptedTypes: ["image/*", ".pdf", ".doc", ".docx", ".ppt", ".pptx"],
      maxSize: 10,
      maxFiles: 5,
      examples: ["Awards", "Publications", "Additional Certifications", "Reference Letters"]
    }
  ];

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <Image className="w-4 h-4" />;
    if (type.includes("video")) return <Video className="w-4 h-4" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4" />;
    if (type.includes("zip") || type.includes("rar")) return <Archive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File, category: DocumentCategory): string | null => {
    // Check file size
    if (file.size > category.maxSize * 1024 * 1024) {
      return `File size exceeds ${category.maxSize}MB limit`;
    }

    // Check file type
    const isValidType = category.acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type not allowed. Accepted types: ${category.acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileUpload = async (files: FileList, categoryId: string) => {
    const category = documentCategories.find(c => c.id === categoryId);
    if (!category) return;

    // Check if teacherId is valid
    if (!teacherId || teacherId.trim() === "") {
      // Silent authentication check
      console.error('Authentication required');
      return;
    }

    // Validate UUID format for teacherId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(teacherId)) {
      console.error('❌ Invalid teacherId format:', teacherId);
      // Silent authentication error
      console.error('Authentication error');
      return;
    }

    const currentFiles = uploadedDocuments[categoryId] || [];
    const newFiles = Array.from(files);

    // Check file count limit
    if (currentFiles.length + newFiles.length > category.maxFiles) {
      // Silent file limit check
      console.error('File limit exceeded');
      return;
    }

    const validFiles: DocumentFile[] = [];

    for (const file of newFiles) {
      const validationError = validateFile(file, category);
      if (validationError) {
        // Silent file validation
        console.error('Invalid file:', file.name, validationError);
        continue;
      }

      const documentFile: DocumentFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        uploadProgress: 0
      };

      validFiles.push(documentFile);
    }

    if (validFiles.length === 0) return;

    // Update state with uploading files
    setUploadedDocuments(prev => ({
      ...prev,
      [categoryId]: [...currentFiles, ...validFiles]
    }));

    // Real file upload to server
    for (let i = 0; i < validFiles.length && i < newFiles.length; i++) {
      const documentFile = validFiles[i];
      const actualFile = newFiles[i];
      
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('documents', actualFile);
        formData.append('categoryId', categoryId);

        // Upload progress tracking
        const interval = setInterval(() => {
          setUploadedDocuments(prev => ({
            ...prev,
            [categoryId]: prev[categoryId]?.map(f =>
              f.id === documentFile.id
                ? { ...f, uploadProgress: Math.min((f.uploadProgress || 0) + 15, 90) }
                : f
            ) || []
          }));
        }, 300);

        // Upload to server - simplified request
        const response = await fetch('/api/teacher/documents/upload', {
          method: 'POST',
          headers: {
            'user-id': teacherId || 'test-user-id'
          },
          body: formData
        });

        clearInterval(interval);
        
        if (response.ok) {
          const result = await response.json();
          
          // Mark as uploaded with server response
          setUploadedDocuments(prev => ({
            ...prev,
            [categoryId]: prev[categoryId]?.map(f =>
              f.id === documentFile.id
                ? { 
                    ...f, 
                    status: 'uploaded', 
                    uploadProgress: 100,
                    url: result.documents?.[0]?.fileUrl || `/uploads/${result.documents?.[0]?.fileName}`
                  }
                : f
            ) || []
          }));

          // Silent upload success

        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }

      } catch (error) {
        
        // Mark as error
        setUploadedDocuments(prev => ({
          ...prev,
          [categoryId]: prev[categoryId]?.map(f =>
            f.id === documentFile.id
              ? { ...f, status: 'error' }
              : f
          ) || []
        }));

        // Silent error handling
        console.error('Upload failed:', error);
      }
    }

    // Notify parent component with updated files
    setTimeout(() => {
      if (onUploadComplete) {
        const finalFiles = uploadedDocuments[categoryId] || [];
        onUploadComplete(categoryId, finalFiles);
      }
    }, 100);
  };

  const handleDrop = useCallback((e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragOver(null);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files, categoryId);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragOver(categoryId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  }, []);

  const removeFile = (categoryId: string, fileId: string) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [categoryId]: prev[categoryId]?.filter(f => f.id !== fileId) || []
    }));
  };

  const getCompletionStatus = () => {
    const requiredCategories = documentCategories.filter(c => c.required);
    const completedRequired = requiredCategories.filter(c => {
      const files = uploadedDocuments[c.id] || [];
      return files.length > 0 && files.every(f => f.status === 'uploaded');
    });
    
    return {
      completed: completedRequired.length,
      total: requiredCategories.length,
      percentage: Math.round((completedRequired.length / requiredCategories.length) * 100)
    };
  };

  const completionStatus = getCompletionStatus();

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Document Upload Progress
          </CardTitle>
          <CardDescription>
            Upload required documents for your teacher application review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={completionStatus.percentage === 100 ? "default" : "secondary"}>
                {completionStatus.completed}/{completionStatus.total} Required Categories
              </Badge>
              <span className="text-sm text-muted-foreground">
                {completionStatus.percentage}% Complete
              </span>
            </div>
            {completionStatus.percentage === 100 && (
              <Badge variant="default" className="bg-green-500">
                <CheckmarkIcon size="sm" variant="success" className="mr-1" />
                Ready for Review
              </Badge>
            )}
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionStatus.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Categories */}
      {documentCategories.map((category) => {
        const categoryFiles = uploadedDocuments[category.id] || [];
        const hasRequiredFiles = categoryFiles.length > 0 && categoryFiles.every(f => f.status === 'uploaded');
        
        return (
          <Card key={category.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {category.title}
                    {category.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                    {hasRequiredFiles && (
                      <CheckmarkIcon size="sm" variant="success" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {category.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {category.examples.map((example, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Upload Zone - Hide after files are uploaded */}
              {categoryFiles.length === 0 && (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver === category.id 
                      ? "border-primary bg-primary/5" 
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDrop={(e) => handleDrop(e, category.id)}
                  onDragOver={(e) => handleDragOver(e, category.id)}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Max {category.maxFiles} files, {category.maxSize}MB each
                    <br />
                    Accepted: {category.acceptedTypes.join(", ")}
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept={category.acceptedTypes.join(",")}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileUpload(e.target.files, category.id);
                      }
                    }}
                    className="hidden"
                    id={`upload-${category.id}`}
                    data-testid={`input-file-${category.id}`}
                  />
                  <Label htmlFor={`upload-${category.id}`} className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" data-testid={`button-upload-${category.id}`}>
                      Choose Files
                    </Button>
                  </Label>
                </div>
              )}

              {/* Show add more files button for categories that allow multiple files */}
              {categoryFiles.length > 0 && categoryFiles.length < category.maxFiles && (
                <div className="mb-4">
                  <Input
                    type="file"
                    multiple
                    accept={category.acceptedTypes.join(",")}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileUpload(e.target.files, category.id);
                      }
                    }}
                    className="hidden"
                    id={`upload-more-${category.id}`}
                  />
                  <Label htmlFor={`upload-more-${category.id}`} className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" data-testid={`button-add-more-${category.id}`}>
                      Add More Files ({categoryFiles.length}/{category.maxFiles})
                    </Button>
                  </Label>
                </div>
              )}

              {/* Uploaded Files */}
              {categoryFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files:</Label>
                  {categoryFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        {file.status === 'uploading' && (
                          <div className="w-full bg-secondary rounded-full h-1 mt-1">
                            <div 
                              className="bg-primary h-1 rounded-full transition-all duration-300"
                              style={{ width: `${file.uploadProgress || 0}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploaded' && (
                          <>
                            <CheckmarkIcon size="sm" variant="success" />
                            {file.url && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                          </>
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => removeFile(category.id, file.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DocumentUpload;
