import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, MicOff, Image, Video, FileText, X, Smile, Check, Upload, Loader, RotateCw, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptimizedSocket } from '../../hooks/useOptimizedSocket';
import { compressImage, type OptimizedImage, formatFileSize, getCompressionSavings } from '../../utils/imageOptimization';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { QuickResponse } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';

interface MessageComposerProps {
  onSendMessage: (content: string, file?: File) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  conversationId: string;
}

interface UploadProgress {
  id: string;
  file: File;
  preview: string;
  thumbnail?: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'completed' | 'error';
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

/**
 * Advanced message composer with optimized performance
 * Features:
 * - Auto-expanding textarea with smooth animations
 * - Throttled typing indicators
 * - Voice recording with visualization
 * - File upload with preview and compression
 * - Emoji picker integration
 * - Draft message persistence
 * - Keyboard shortcuts
 */
export default function MessageComposer({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
  conversationId
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [quickResponseQuery, setQuickResponseQuery] = useState('');
  const [selectedQuickResponseIndex, setSelectedQuickResponseIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const quickResponsesRef = useRef<HTMLDivElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { sendTypingIndicator } = useOptimizedSocket();
  const { profile } = useAuth();

  // Check if user is support staff (admin, moderator, or customer_service)
  const isSupportStaff = profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'customer_service';

  // Fetch active quick responses for support staff only
  const { data: quickResponses = [] } = useQuery({
    queryKey: ['/api/quick-responses/active'],
    queryFn: async () => {
      const response = await apiRequest('/api/quick-responses/active');
      // apiRequest already unwraps response.data, so response is the array directly
      return Array.isArray(response) ? response : [];
    },
    enabled: isSupportStaff
  });

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of 120px
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Handle input with typing indicators and quick response detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    adjustTextareaHeight();

    // Check for quick response trigger (only for support staff)
    if (isSupportStaff) {
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
      
      if (lastSlashIndex !== -1) {
        // Check if "/" is at the start or after whitespace
        const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : ' ';
        if (charBeforeSlash === ' ' || charBeforeSlash === '\n' || lastSlashIndex === 0) {
          const query = textBeforeCursor.substring(lastSlashIndex + 1);
          setQuickResponseQuery(query);
          setShowQuickResponses(true);
          setSelectedQuickResponseIndex(0);
        } else {
          setShowQuickResponses(false);
        }
      } else {
        setShowQuickResponses(false);
      }
    }

    // Throttled typing indicator
    sendTypingIndicator(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);

    // Save draft
    localStorage.setItem(`draft_${conversationId}`, value);
  }, [conversationId, sendTypingIndicator, adjustTextareaHeight, isSupportStaff]);

  // Filter quick responses based on query
  const filteredQuickResponses = quickResponses.filter((response: QuickResponse) => 
    response.shortcut?.toLowerCase().includes(quickResponseQuery.toLowerCase()) ||
    response.title.toLowerCase().includes(quickResponseQuery.toLowerCase())
  );

  // Insert quick response
  const insertQuickResponse = useCallback((response: QuickResponse) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1) {
      const newMessage = textBeforeCursor.substring(0, lastSlashIndex) + response.content + textAfterCursor;
      setMessage(newMessage);
      setShowQuickResponses(false);
      
      // Set cursor position after the inserted content
      setTimeout(() => {
        const newCursorPosition = lastSlashIndex + response.content.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        textarea.focus();
        adjustTextareaHeight();
      }, 0);
    }
  }, [message, adjustTextareaHeight]);

  // Handle keyboard navigation for quick responses
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showQuickResponses && filteredQuickResponses.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedQuickResponseIndex(prev => 
            prev < filteredQuickResponses.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedQuickResponseIndex(prev => 
            prev > 0 ? prev - 1 : filteredQuickResponses.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          insertQuickResponse(filteredQuickResponses[selectedQuickResponseIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowQuickResponses(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [showQuickResponses, filteredQuickResponses, selectedQuickResponseIndex, insertQuickResponse]);

  // Load draft message on mount
  useEffect(() => {
    const draft = localStorage.getItem(`draft_${conversationId}`);
    if (draft) {
      setMessage(draft);
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [conversationId, adjustTextareaHeight]);

  // Handle message sending with upload progress simulation
  const handleSendMessage = useCallback(async () => {
    if ((!message.trim() && !selectedFile) || disabled) return;

    if (selectedFile) {
      // Update progress to indicate sending
      const activeUpload = uploadProgress.find(p => p.file === selectedFile);
      if (activeUpload) {
        setUploadProgress(prev => prev.map(p => 
          p.file === selectedFile ? { ...p, progress: 50, status: 'uploading' } : p
        ));
      }
    }

    try {
      // Send message
      await onSendMessage(message.trim(), selectedFile || undefined);
      
      // Update progress to completed
      if (selectedFile) {
        setUploadProgress(prev => prev.map(p => 
          p.file === selectedFile ? { ...p, progress: 100, status: 'completed' } : p
        ));
        
        // Auto-remove completed uploads after delay
        setTimeout(() => {
          setUploadProgress(prev => prev.filter(p => p.file !== selectedFile));
        }, 2000);
      }
      
      // Reset state
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      sendTypingIndicator(false);
      
      // Clear draft
      localStorage.removeItem(`draft_${conversationId}`);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
    } catch (error) {
      console.error('Send message error:', error);
      
      // Update progress to error
      if (selectedFile) {
        setUploadProgress(prev => prev.map(p => 
          p.file === selectedFile ? { 
            ...p, 
            status: 'error', 
            error: 'Failed to send message' 
          } : p
        ));
      }
    }
  }, [message, selectedFile, disabled, onSendMessage, conversationId, sendTypingIndicator, uploadProgress]);

  // Note: handleKeyDown function is defined above (line ~149) with quick response navigation

  // Fast file handling with compression and instant preview
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAttachments(false);
    
    // Create upload progress entry
    const uploadId = Math.random().toString(36).substring(2, 15);
    const progressEntry: UploadProgress = {
      id: uploadId,
      file,
      preview: '',
      progress: 0,
      status: 'compressing'
    };
    
    setUploadProgress(prev => [...prev, progressEntry]);
    
    try {
      if (file.type.startsWith('image/')) {
        setIsCompressing(true);
        
        // Compress image for faster upload
        const optimized: OptimizedImage = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          format: 'jpeg',
          thumbnailSize: 200
        });
        
        setIsCompressing(false);
        
        // Update progress with optimized image
        setUploadProgress(prev => prev.map(p => 
          p.id === uploadId ? {
            ...p,
            file: optimized.file,
            preview: optimized.dataUrl,
            thumbnail: optimized.thumbnail,
            originalSize: optimized.originalSize,
            compressedSize: optimized.compressedSize,
            status: 'uploading' as const,
            progress: 10
          } : p
        ));
        
        setSelectedFile(optimized.file);
        setFilePreview(optimized.dataUrl);
        
      } else {
        // For non-images, create preview URL
        const url = URL.createObjectURL(file);
        setUploadProgress(prev => prev.map(p => 
          p.id === uploadId ? {
            ...p,
            preview: url,
            status: 'uploading' as const,
            progress: 10
          } : p
        ));
        
        setSelectedFile(file);
        setFilePreview(url);
      }
      
    } catch (error) {
      console.error('File processing error:', error);
      setIsCompressing(false);
      
      // Update progress with error
      setUploadProgress(prev => prev.map(p => 
        p.id === uploadId ? {
          ...p,
          status: 'error' as const,
          error: 'Failed to process file'
        } : p
      ));
    }
  }, []);

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0]; // Handle first file only for now
      // Simulate file input change event
      const fakeEvent = {
        target: { files: [file] } as unknown as HTMLInputElement
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const attachmentButtons = [
    { icon: Image, label: 'Photo', accept: 'image/*', color: 'text-green-500' },
    { icon: Video, label: 'Video', accept: 'video/*', color: 'text-blue-500' },
    { icon: FileText, label: 'Document', accept: '.pdf,.doc,.docx,.txt', color: 'text-purple-500' }
  ];

  return (
    <div 
      className={cn(
        "border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all duration-200",
        isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 dark:text-blue-400 font-medium">Drop image here to send</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Compression status */}
      <AnimatePresence>
        {isCompressing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2 flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400"
          >
            <Loader className="w-4 h-4 animate-spin" />
            <span>Optimizing image for faster upload...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced file preview with compression info */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-green-500"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {filePreview && (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) ? (
                  <div className="relative">
                    {selectedFile.type.startsWith('image/') ? (
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="w-16 h-16 rounded object-cover shadow-sm" 
                      />
                    ) : (
                      <video 
                        src={filePreview} 
                        className="w-16 h-16 rounded object-cover shadow-sm" 
                      />
                    )}
                    {uploadProgress.find(p => p.file === selectedFile)?.status === 'completed' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center shadow-sm">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    {uploadProgress.find(p => p.file === selectedFile)?.originalSize && 
                     uploadProgress.find(p => p.file === selectedFile)?.compressedSize && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 dark:text-green-400">
                          {getCompressionSavings(
                            uploadProgress.find(p => p.file === selectedFile)!.originalSize!,
                            uploadProgress.find(p => p.file === selectedFile)!.compressedSize!
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* WhatsApp-style circular progress */}
                  {uploadProgress.find(p => p.file === selectedFile) && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="relative w-5 h-5">
                        {/* Background circle */}
                        <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-gray-300 dark:text-gray-600"
                          />
                        </svg>
                        
                        {/* Progress circle */}
                        <svg className="absolute inset-0 w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                          <motion.circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-green-500"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ 
                              pathLength: (uploadProgress.find(p => p.file === selectedFile)?.progress || 0) / 100 
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{
                              strokeDasharray: "50.27",
                              strokeDashoffset: "50.27"
                            }}
                          />
                        </svg>
                        
                        {/* Rotating arrow for uploading state */}
                        {uploadProgress.find(p => p.file === selectedFile)?.status === 'uploading' && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ rotate: 360 }}
                            transition={{ 
                              duration: 1, 
                              repeat: Infinity, 
                              ease: "linear" 
                            }}
                          >
                            <RotateCw className="w-2.5 h-2.5 text-green-500" />
                          </motion.div>
                        )}
                        
                        {/* Check mark for completed */}
                        {uploadProgress.find(p => p.file === selectedFile)?.status === 'completed' && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <Check className="w-3 h-3 text-green-500" />
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize text-gray-600 dark:text-gray-400">
                            {uploadProgress.find(p => p.file === selectedFile)?.status === 'compressing' ? 'Optimizing...' :
                             uploadProgress.find(p => p.file === selectedFile)?.status === 'uploading' ? 'Uploading...' :
                             uploadProgress.find(p => p.file === selectedFile)?.status === 'completed' ? 'Uploaded' : 
                             uploadProgress.find(p => p.file === selectedFile)?.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {uploadProgress.find(p => p.file === selectedFile)?.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                  setUploadProgress(prev => prev.filter(p => p.file !== selectedFile));
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end space-x-2">
        {/* Attachment menu */}
        <div className="relative">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            disabled={disabled}
            className={cn(
              'p-2 rounded-full transition-colors',
              'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            data-testid="attachment-button"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showAttachments && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2"
              >
                {attachmentButtons.map(({ icon: Icon, label, accept, color }) => (
                  <button
                    key={label}
                    onClick={() => {
                      fileInputRef.current?.click();
                      fileInputRef.current?.setAttribute('accept', accept);
                    }}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors transition-all duration-300"
                  >
                    <Icon className={cn('w-5 h-5', color)} />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full px-4 py-2 pr-12 rounded-2xl border border-gray-200 dark:border-gray-600',
              'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
              'resize-none overflow-hidden transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            data-testid="message-input"
          />

          {/* Quick Responses Dropdown */}
          <AnimatePresence>
            {showQuickResponses && filteredQuickResponses.length > 0 && (
              <motion.div
                ref={quickResponsesRef}
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto z-50"
              >
                <div className="p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 border-b border-gray-200 dark:border-gray-600">
                    Quick Responses
                  </div>
                  {filteredQuickResponses.map((response: QuickResponse, index: number) => (
                    <button
                      key={response.id}
                      onClick={() => insertQuickResponse(response)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md transition-colors mt-1',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        index === selectedQuickResponseIndex && 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                          /{response.shortcut || response.title}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {response.content}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji button (placeholder) */}
          <button
            className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors transition-all duration-300"
            onClick={() => {
              // Placeholder for emoji picker
              console.log('Emoji picker would open here');
            }}
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Voice recording / Send button */}
        <div className="flex space-x-2">
          {!message.trim() && !selectedFile ? (
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              className={cn(
                'p-2 rounded-full transition-all duration-200',
                isRecording
                  ? 'bg-primary text-white hover:bg-primary'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="voice-record-button"
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSendMessage}
              disabled={disabled || (!message.trim() && !selectedFile)}
              className={cn(
                'p-2 rounded-full bg-blue-500 text-white transition-all duration-200',
                'hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="send-button"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileSelect}
      />
    </div>
  );
}
