import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ArrowUp } from 'lucide-react';

interface ScrollButtonsProps {
  target?: string;
  showOnScroll?: boolean;
}

const ScrollButtons = ({ target, showOnScroll = true }: ScrollButtonsProps) => {
  const [showButtons, setShowButtons] = useState(!showOnScroll);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      if (target) {
        const element = document.querySelector(target);
        if (element) {
          const scrollTop = element.scrollTop;
          const scrollHeight = element.scrollHeight;
          const clientHeight = element.clientHeight;
          
          setIsAtTop(scrollTop <= 10);
          setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
          
          if (showOnScroll) {
            setShowButtons(scrollTop > 100);
          }
        }
      } else {
        const scrollTop = window.pageYOffset;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        
        setIsAtTop(scrollTop <= 10);
        setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
        
        if (showOnScroll) {
          setShowButtons(scrollTop > 100);
        }
      }
    };

    if (target) {
      const targetElement = document.querySelector(target);
      if (targetElement) {
        targetElement.addEventListener('scroll', checkScrollPosition);
        checkScrollPosition(); // Initial call
        return () => {
          targetElement.removeEventListener('scroll', checkScrollPosition);
        };
      }
    } else {
      window.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition(); // Initial call
      return () => {
        window.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [target, showOnScroll]);

  const scrollToTop = () => {
    if (target) {
      const element = document.querySelector(target);
      if (element) {
        element.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (target) {
      const element = document.querySelector(target);
      if (element) {
        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  if (!showButtons) return null;

  return (
    <>
      {/* Scroll to Top Button */}
      {!isAtTop && (
        <button
          onClick={scrollToTop}
          className="scroll-button top"
          data-testid="button-scroll-top"
          title="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Scroll to Bottom Button */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="scroll-button bottom"
          data-testid="button-scroll-bottom"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default ScrollButtons;
