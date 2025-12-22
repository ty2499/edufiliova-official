import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  darkMode?: boolean;
}

export default function VerificationCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  darkMode = false
}: VerificationCodeInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasTriggeredComplete = useRef(false);

  const digits = value.split('').concat(Array(length - value.length).fill(''));

  useEffect(() => {
    if (value.length < length) {
      hasTriggeredComplete.current = false;
    }
  }, [value, length]);

  useEffect(() => {
    if (value.length === length && onComplete && !hasTriggeredComplete.current && !disabled) {
      hasTriggeredComplete.current = true;
      onComplete(value);
    }
  }, [value, length, onComplete, disabled]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;
    
    const sanitized = digit.replace(/\D/g, '');
    if (sanitized.length > 1) return;

    const newDigits = [...digits];
    newDigits[index] = sanitized;
    const newValue = newDigits.join('').slice(0, length);
    onChange(newValue);

    if (sanitized && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2 sm:gap-3">
        {digits.slice(0, length).map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={`
              w-12 h-14 sm:w-14 sm:h-16
              text-center text-xl sm:text-2xl font-semibold
              border-2 rounded-xl
              transition-all duration-200
              focus:outline-none
              ${darkMode 
                ? disabled 
                  ? 'bg-gray-800 cursor-not-allowed opacity-60' 
                  : 'bg-gray-900/80 text-white'
                : disabled 
                  ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                  : 'bg-white'
              }
              ${error 
                ? 'border-red-400 text-red-600 shake-animation' 
                : digit 
                  ? darkMode 
                    ? 'border-amber-400 text-white' 
                    : 'border-[#0C332C] text-gray-900' 
                  : darkMode
                    ? 'border-gray-600 text-white focus:border-amber-400'
                    : 'border-gray-200 text-gray-900 focus:border-[#0C332C]'
              }
              ${focused && !error && !digit ? darkMode ? 'ring-2 ring-amber-400/30' : 'ring-2 ring-[#0C332C]/20' : ''}
            `}
            data-testid={`input-code-digit-${index}`}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
