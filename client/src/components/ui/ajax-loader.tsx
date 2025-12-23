import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, Plus, Trash2, Edit, Upload, Download } from 'lucide-react';

export type AjaxOperation = 'loading' | 'adding' | 'updating' | 'deleting' | 'uploading' | 'downloading' | 'success' | 'error' | 'idle';

interface AjaxLoaderProps {
  operation: AjaxOperation;
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  inline?: boolean;
  overlay?: boolean;
}

const operationConfig = {
  loading: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-50', message: 'Loading...' },
  adding: { icon: Loader2, color: 'text-gray-700', bgColor: 'bg-gray-100', message: 'Adding...' },
  updating: { icon: Edit, color: 'text-amber-500', bgColor: 'bg-amber-50', message: 'Updating...' },
  deleting: { icon: Trash2, color: 'text-primary', bgColor: 'bg-primary/10', message: 'Deleting...' },
  uploading: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-50', message: 'Uploading...' },
  downloading: { icon: Download, color: 'text-indigo-500', bgColor: 'bg-indigo-50', message: 'Downloading...' },
  success: { icon: Check, color: 'text-blue-600', bgColor: 'bg-blue-50', message: 'Success!' },
  error: { icon: X, color: 'text-primary', bgColor: 'bg-primary/10', message: 'Error occurred' },
  idle: { icon: null, color: '', bgColor: '', message: '' }
};

const sizeConfig = {
  sm: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-3 py-2' },
  md: { icon: 'w-5 h-5', text: 'text-base', padding: 'px-4 py-3' },
  lg: { icon: 'w-6 h-6', text: 'text-lg', padding: 'px-6 py-4' }
};

export const AjaxLoader: React.FC<AjaxLoaderProps> = ({
  operation,
  message,
  className,
  size = 'md',
  showIcon = true,
  inline = false,
  overlay = false
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (operation !== 'idle') {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [operation]);

  if (!visible || operation === 'idle') return null;

  const config = operationConfig[operation];
  const sizes = sizeConfig[size];
  const IconComponent = config.icon;
  const displayMessage = message || config.message;

  const content = (
    <div className={cn(
      'flex items-center gap-2 rounded-lg border transition-all duration-300',
      config.bgColor,
      config.color,
      sizes.padding,
      sizes.text,
      inline ? 'inline-flex' : 'flex',
      className
    )}>
      {showIcon && IconComponent && (
        <IconComponent 
          className={cn(
            sizes.icon,
            ['loading', 'adding', 'updating', 'deleting', 'uploading', 'downloading'].includes(operation) 
              ? 'animate-spin' : 'animate-pulse'
          )} 
        />
      )}
      {displayMessage && (
        <span className="font-medium">{displayMessage}</span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl border">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Inline Loading Button Component
interface AjaxButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  operation: AjaxOperation;
  children: React.ReactNode;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export const AjaxButton: React.FC<AjaxButtonProps> = ({
  operation,
  children,
  loadingText,
  successText,
  errorText,
  variant = 'default',
  className,
  disabled,
  ...props
}) => {
  const config = operationConfig[operation];
  const IconComponent = config.icon;
  const isLoading = ['loading', 'adding', 'updating', 'deleting', 'uploading', 'downloading'].includes(operation);

  const getButtonText = () => {
    switch (operation) {
      case 'success':
        return successText || 'Success!';
      case 'error':
        return errorText || 'Try Again';
      case 'loading':
      case 'adding':
      case 'updating':
      case 'deleting':
      case 'uploading':
      case 'downloading':
        return loadingText || config.message;
      default:
        return children;
    }
  };

  const getVariantStyles = () => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none';
    
    switch (variant) {
      case 'destructive':
        return cn(base, 'bg-primary text-white hover:bg-primary disabled:bg-primary/30');
      case 'outline':
        return cn(base, 'border border-input bg-background hover:bg-accent hover:text-foreground-foreground disabled:bg-muted');
      case 'secondary':
        return cn(base, 'bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:bg-secondary/50');
      default:
        return cn(base, 'bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-xl hover:scale-105 disabled:bg-primary/50');
    }
  };

  return (
    <button
      className={cn(getVariantStyles(), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && IconComponent && (
        <IconComponent className="w-4 h-4 animate-spin" />
      )}
      {operation === 'success' && <Check className="w-4 h-4" />}
      {operation === 'error' && <X className="w-4 h-4" />}
      <span>{getButtonText()}</span>
    </button>
  );
};

// Card Loading Overlay Component
interface AjaxCardProps {
  operation: AjaxOperation;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const AjaxCard: React.FC<AjaxCardProps> = ({
  operation,
  children,
  message,
  className
}) => {
  const isLoading = ['loading', 'adding', 'updating', 'deleting', 'uploading', 'downloading'].includes(operation);

  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <AjaxLoader operation={operation} message={message} />
        </div>
      )}
    </div>
  );
};

// Inline Status Component
interface AjaxStatusProps {
  operation: AjaxOperation;
  message?: string;
  className?: string;
  autoHide?: number; // Auto hide after X milliseconds
}

export const AjaxStatus: React.FC<AjaxStatusProps> = ({
  operation,
  message,
  className,
  autoHide
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if ((operation === 'success' || operation === 'error') && autoHide) {
      const timer = setTimeout(() => setShow(false), autoHide);
      return () => clearTimeout(timer);
    }
  }, [operation, autoHide]);

  useEffect(() => {
    if (operation !== 'idle') {
      setShow(true);
    }
  }, [operation]);

  if (!show || operation === 'idle') return null;

  return (
    <div className={cn('transition-all duration-300', className)}>
      <AjaxLoader operation={operation} message={message} inline size="sm" />
    </div>
  );
};
