import { useState, useEffect } from 'react';
import { Mail, Send, Clock, ArrowRight } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface PasswordResetAnimationProps {
  isVisible: boolean;
  email: string;
  onClose?: () => void;
  duration?: number;
}

export default function PasswordResetAnimation({ 
  isVisible, 
  email,
  onClose, 
  duration = 4000 
}: PasswordResetAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      
      // Show checkmark after animation starts
      const checkTimer = setTimeout(() => {
        setShowCheck(true);
      }, 1000);

      // Show email sent message
      const emailTimer = setTimeout(() => {
        setShowEmailSent(true);
      }, 1500);

      // Auto close after duration
      const closeTimer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearTimeout(checkTimer);
        clearTimeout(emailTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setShowAnimation(false);
    setShowCheck(false);
    setShowEmailSent(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getMaskedEmail = () => {
    const [local, domain] = email.split('@');
    if (local && domain) {
      const maskedLocal = local.length > 3 
        ? local.substring(0, 2) + '***' + local.slice(-1)
        : local.substring(0, 1) + '***';
      return `${maskedLocal}@${domain}`;
    }
    return email;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div 
        className={`
          bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4
          transform transition-all duration-500 ease-out
          ${showAnimation ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
        `}
      >
        {/* Animated illustration area */}
        <div className="relative mb-6">
          {/* Background circle animation */}
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
            <div 
              className={`
                absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10
                transform transition-all duration-1000 ease-out
                ${showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
              `}
            />
            
            {/* Email sending illustration */}
            <div 
              className={`
                relative z-10 transform transition-all duration-700 delay-300 ease-out
                ${showAnimation ? 'scale-100 opacity-100 rotate-0' : 'scale-75 opacity-0 rotate-12'}
              `}
            >
              {/* Email envelope */}
              <div className="relative">
                <div className="w-20 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg border-2 border-blue-300 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                
                {/* Sending animation - arrow */}
                <div 
                  className={`
                    absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full 
                    flex items-center justify-center transform transition-all duration-800 delay-600
                    ${showAnimation ? 'scale-100 opacity-100 translate-x-0' : 'scale-0 opacity-0 translate-x-4'}
                  `}
                >
                  <Send className="h-4 w-4 text-white" />
                </div>
                
                {/* Success checkmark overlay */}
                <div 
                  className={`
                    absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full 
                    flex items-center justify-center transform transition-all duration-500 delay-1000
                    ${showCheck ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                  `}
                >
                  <CheckmarkIcon size="md" className="bg-transparent" />
                </div>
              </div>
            </div>

            {/* Animated waves/signals */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`
                    absolute w-full h-full rounded-full border-2 border-blue-500/30
                    transform transition-all duration-1000 ease-out
                    ${showAnimation ? 'scale-100 opacity-30' : 'scale-0 opacity-0'}
                  `}
                  style={{
                    animationDelay: `${i * 300 + 600}ms`,
                    animation: showAnimation ? `pulse-wave 2s infinite ${i * 0.3}s` : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <div 
            className={`
              transform transition-all duration-500 delay-700 ease-out
              ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Reset Link Sent Successfully
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Password reset instructions sent to
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              {getMaskedEmail()}
            </p>
          </div>

          <div 
            className={`
              space-y-2 transform transition-all duration-500 delay-900 ease-out
              ${showEmailSent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Link expires in 24 hours</span>
            </div>
            
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Check your inbox and spam folder
            </p>
          </div>

          {/* Action hint */}
          <div 
            className={`
              flex items-center justify-center gap-2 text-sm text-foreground font-medium
              transform transition-all duration-500 delay-1100 ease-out
              ${showEmailSent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
          >
            <span>Follow the link in your email</span>
            <ArrowRight className="h-4 w-4" />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className={`
              mt-6 px-6 py-2 bg-primary text-white rounded-lg font-medium
              hover:bg-primary transition-colors duration-200
              transform transition-all duration-500 delay-1300 ease-out
              ${showEmailSent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
          >
            Continue
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-wave {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            opacity: 0.1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
