import { useState, useEffect } from 'react';

interface ScrollProgressProps {
  target?: string;
  className?: string;
}

const ScrollProgress = ({ target, className = '' }: ScrollProgressProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      if (target) {
        const element = document.querySelector(target);
        if (element) {
          const scrollTop = element.scrollTop;
          const scrollHeight = element.scrollHeight - element.clientHeight;
          const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
          setScrollProgress(progress);
        }
      } else {
        const scrollTop = window.pageYOffset;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setScrollProgress(progress);
      }
    };

    if (target) {
      const targetElement = document.querySelector(target);
      if (targetElement) {
        targetElement.addEventListener('scroll', updateScrollProgress);
        updateScrollProgress(); // Initial call
        return () => {
          targetElement.removeEventListener('scroll', updateScrollProgress);
        };
      }
    } else {
      window.addEventListener('scroll', updateScrollProgress);
      updateScrollProgress(); // Initial call
      return () => {
        window.removeEventListener('scroll', updateScrollProgress);
      };
    }
  }, [target]);

  return (
    <div className={`scroll-progress ${className}`}>
      <div 
        className="reading-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};

export default ScrollProgress;
