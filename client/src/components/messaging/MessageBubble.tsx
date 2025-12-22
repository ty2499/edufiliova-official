import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Play, Pause, Download, Image, FileText, Check, CheckCheck, Clock } from 'lucide-react';
import { Message } from '@shared/schema';
import { cn } from '@/lib/utils';
import OptimizedMedia from './OptimizedMedia';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onLoad?: () => void;
}

/**
 * Optimized message bubble component with smooth animations
 * Features:
 * - Lazy loading for media content
 * - Compressed thumbnails for images/videos
 * - Audio playback with waveform (optional)
 * - Read receipts and timestamps
 * - Smooth hover animations
 * - File download handling
 */
export default function MessageBubble({ message, isOwnMessage, onLoad }: MessageBubbleProps) {
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Media refs for playback
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle audio playback
  const toggleAudio = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }, [isPlaying]);

  // Handle media load
  const handleMediaLoad = useCallback(() => {
    setIsMediaLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Get message time
  const messageTime = format(new Date(message.createdAt), 'HH:mm');
  
  // WhatsApp-style message status icons
  const StatusIcon = () => {
    if (!isOwnMessage) return null;
    
    return (
      <div className="flex items-center ml-1">
        {(message as any).isPending ? (
          // Pending - clock icon with pulse animation
          <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
        ) : message.readAt ? (
          // Read - double blue check marks
          <CheckCheck className="w-3 h-3 text-blue-500" />
        ) : message.deliveredAt ? (
          // Delivered - double gray check marks
          <CheckCheck className="w-3 h-3 text-gray-400" />
        ) : (
          // Sent - single gray check mark
          <Check className="w-3 h-3 text-gray-400" />
        )}
      </div>
    );
  };

  // File icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <Play className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  // Message content renderer
  const renderContent = () => {
    const { content, fileUrl, fileType } = message;
    const fileName = fileUrl ? fileUrl.split('/').pop() || 'Unknown file' : undefined;

    // Text message
    if (content && !fileUrl) {
      return (
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      );
    }

    // Media message
    if (fileUrl) {
      // Image message
      if (fileType?.startsWith('image/')) {
        return (
          <div className="space-y-2">
            <OptimizedMedia
              src={fileUrl}
              type="image"
              alt={fileName || 'Image'}
              onLoad={handleMediaLoad}
              className="rounded-lg max-w-xs"
            />
            {content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {content}
              </p>
            )}
          </div>
        );
      }

      // Video message
      if (fileType?.startsWith('video/')) {
        return (
          <div className="space-y-2">
            <OptimizedMedia
              src={fileUrl}
              type="video"
              onLoad={handleMediaLoad}
              className="rounded-lg max-w-xs"
            />
            {content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {content}
              </p>
            )}
          </div>
        );
      }

      // Audio message (voice note)
      if (fileType?.startsWith('audio/')) {
        return (
          <div className="flex items-center space-x-3 min-w-[200px]">
            <button
              onClick={toggleAudio}
              className="flex-shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-1 bg-gray-300 rounded-full">
                  <div className="h-1 bg-blue-500 rounded-full w-0 transition-all duration-100" />
                </div>
                <span className="text-xs text-gray-500">0:00</span>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={fileUrl}
              onEnded={() => setIsPlaying(false)}
              onLoadedData={handleMediaLoad}
              preload="metadata"
            />
          </div>
        );
      }

      // File download
      return (
        <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-xs">
          <div className="flex-shrink-0">
            {getFileIcon(fileType || '')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {fileName || 'File'}
            </p>
            {fileType && (
              <p className="text-xs text-gray-500 uppercase">
                {fileType.split('/')[1]}
              </p>
            )}
          </div>
          <button
            onClick={() => window.open(fileUrl, '_blank')}
            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex mb-4 group',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`message-bubble-${message.id}`}
    >
      <div
        className={cn(
          'relative max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow-sm transition-all duration-200',
          isOwnMessage
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md',
          isHovered && 'shadow-md transform scale-[1.02]'
        )}
      >
        {renderContent()}
        
        {/* Message metadata */}
        <div
          className={cn(
            'flex items-center justify-end mt-1 space-x-1 text-xs opacity-70',
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          )}
        >
          <span>{messageTime}</span>
          <StatusIcon />
        </div>

        {/* Message tail */}
        <div
          className={cn(
            'absolute w-0 h-0 bottom-0',
            isOwnMessage
              ? 'right-0 border-l-8 border-l-blue-500 border-b-8 border-b-transparent'
              : 'left-0 border-r-8 border-r-white dark:border-r-gray-800 border-b-8 border-b-transparent'
          )}
        />
      </div>
    </motion.div>
  );
}
