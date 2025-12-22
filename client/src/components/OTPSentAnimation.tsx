import { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Smartphone, Clock, Sparkles, Send } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface OTPSentAnimationProps {
  isVisible: boolean;
  method: 'email' | 'sms' | 'whatsapp';
  contactInfo: string;
  onClose?: () => void;
  duration?: number;
}

export default function OTPSentAnimation({ 
  isVisible, 
  method, 
  contactInfo, 
  onClose, 
  duration = 4000 
}: OTPSentAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      
      // Show checkmark after animation starts
      const checkTimer = setTimeout(() => {
        setShowCheck(true);
      }, 1000);

      // Auto close after duration
      const closeTimer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearTimeout(checkTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setShowAnimation(false);
    setShowCheck(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const getMethodIcon = () => {
    switch (method) {
      case 'email':
        return <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      case 'sms':
        return <Phone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case 'whatsapp':
        return <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />;
      default:
        return <Smartphone className="h-6 w-6 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getMethodText = () => {
    switch (method) {
      case 'email':
        return 'Email Sent Successfully';
      case 'sms':
        return 'SMS Sent Successfully';
      case 'whatsapp':
        return 'WhatsApp Sent Successfully';
      default:
        return 'Message Sent Successfully';
    }
  };

  const getMaskedContact = () => {
    if (method === 'email') {
      const [local, domain] = contactInfo.split('@');
      if (local && domain) {
        const maskedLocal = local.length > 3 
          ? local.substring(0, 2) + '***' + local.slice(-1)
          : local.substring(0, 1) + '***';
        return `${maskedLocal}@${domain}`;
      }
    } else {
      // Phone number masking
      if (contactInfo.length > 6) {
        return contactInfo.substring(0, 3) + '***' + contactInfo.slice(-4);
      }
    }
    return contactInfo;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-md">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-2 h-2 bg-primary/20 rounded-full blur-sm
              transform transition-all duration-1000 ease-out
              ${showAnimation ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              left: `${10 + (i * 7)}%`,
              top: `${15 + (i * 6)}%`,
              animationDelay: `${i * 200 + 800}ms`,
              animation: showAnimation ? `float-particle 4s infinite ease-in-out ${i * 0.3}s` : 'none'
            }}
          />
        ))}
      </div>

      <div 
        className={`
          relative bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10
          rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4
          transform transition-all duration-700 ease-&lsqb;cubic-bezier(0.34,1.56,0.64,1)&rsqb;
          before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none
          ${showAnimation ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'}
        `}
      >
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        
        {/* Modern device illustration */}
        <div className="relative mb-8">
          <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
            
            {/* Animated background rings */}
            <div className="absolute inset-0">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`
                    absolute inset-0 rounded-full border border-primary/10
                    transform transition-all duration-1200 ease-out
                    ${showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
                  `}
                  style={{
                    animationDelay: `${i * 150 + 400}ms`,
                    animation: showAnimation ? `ripple-expand 3s infinite ease-out ${i * 0.4}s` : 'none'
                  }}
                />
              ))}
            </div>

            {/* Central device container */}
            <div 
              className={`
                relative z-10 transform transition-all duration-800 delay-500 ease-&lsqb;cubic-bezier(0.34,1.56,0.64,1)&rsqb;
                ${showAnimation ? 'scale-100 opacity-100 rotate-0' : 'scale-60 opacity-0 rotate-12'}
              `}
            >
              {/* Premium device design */}
              <div className="relative group">
                <div className="w-24 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl border border-slate-300/50 dark:border-slate-600/50 shadow-lg">
                  {/* Screen bezel */}
                  <div className="w-full h-3 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-700 rounded-t-2xl border-b border-slate-300/30 dark:border-slate-500/30"></div>
                  
                  {/* Screen content */}
                  <div className="p-3 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-b-2xl">
                    <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg">
                      {getMethodIcon()}
                    </div>
                  </div>
                </div>
                
                {/* Floating success indicator */}
                <div 
                  className={`
                    absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full 
                    flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800
                    transform transition-all duration-600 delay-1200 ease-&lsqb;cubic-bezier(0.68,-0.55,0.27,1.55)&rsqb;
                    ${showCheck ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-90'}
                  `}
                >
                  <CheckmarkIcon size="md" className="bg-transparent" />
                </div>

                {/* Sparkling effect */}
                <div 
                  className={`
                    absolute -top-4 -left-4 transform transition-all duration-500 delay-1000
                    ${showCheck ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-45'}
                  `}
                >
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div 
                  className={`
                    absolute -bottom-4 -right-4 transform transition-all duration-500 delay-1200
                    ${showCheck ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-45'}
                  `}
                >
                  <Sparkles className="h-3 w-3 text-primary/70 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Animated signal waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`
                    absolute w-full h-full rounded-full border border-primary/20
                    transform transition-all duration-1000 ease-out
                    ${showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                  `}
                  style={{
                    animationDelay: `${i * 200 + 800}ms`,
                    animation: showAnimation ? `pulse-ripple 2.5s infinite ease-out ${i * 0.2}s` : 'none'
                  }}
                />
              ))}
            </div>

            {/* Message send indicator */}
            <div 
              className={`
                absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full
                flex items-center justify-center shadow-md
                transform transition-all duration-600 delay-800 ease-out
                ${showAnimation ? 'scale-100 opacity-100 translate-x-0 translate-y-0' : 'scale-0 opacity-0 translate-x-4 -translate-y-4'}
              `}
            >
              <Send className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Modern content section */}
        <div className="relative z-10 text-center space-y-6">
          <div 
            className={`
              transform transition-all duration-600 delay-900 ease-out
              ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
            `}
          >
            <h3 className="text-2xl font-bold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3">
              {getMethodText()}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
              Verification code sent to
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
              <p className="text-primary font-semibold text-sm">
                {getMaskedContact()}
              </p>
            </div>
          </div>

          <div 
            className={`
              flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400
              px-4 py-2 bg-white/50 dark:bg-black/20 rounded-lg border border-white/20 dark:border-gray-700/50
              transform transition-all duration-600 delay-1000 ease-out
              ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
            `}
          >
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">Valid for 10 minutes</span>
          </div>

          {/* Premium continue button */}
          <button
            onClick={handleClose}
            className={`
              group relative mt-8 px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground 
              rounded-xl font-semibold text-sm shadow-lg border border-primary/20
              hover:from-primary/90 hover:to-primary/70 hover:shadow-xl hover:scale-105
              transition-all duration-300 ease-out overflow-hidden
              transform transition-all duration-600 delay-1200 ease-out
              ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
            `}
          >
            <span className="relative z-10">Continue</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        
        @keyframes ripple-expand {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            opacity: 0.2;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
        
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(120deg);
          }
          66% {
            transform: translateY(10px) rotate(240deg);
          }
        }
      `}</style>
    </div>
  );
}
