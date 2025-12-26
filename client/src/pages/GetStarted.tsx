import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, isInCordovaApp, navigateOrOpenExternal } from "@/lib/utils";

const studentsImage = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/getstarted/c61f5133-ed63-4a25-85ed-26bc7a91c2df.png";
const teachersImage = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/getstarted/28a48c69-9c9a-4a76-850a-0c0c3d29389f.png";
const freelancersImage = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/getstarted/60202a2c-c030-45d2-a0ce-29e9c8949069.png";

interface GetStartedProps {
  onComplete: () => void;
}

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  bgGradient: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    title: "For Students",
    subtitle: "Learn & Grow",
    description: "Access expert teachers, interactive courses, and earn certificates. Your journey to knowledge starts here.",
    image: studentsImage,
    bgGradient: "from-orange-600/90 via-orange-500/80 to-red-500/70",
  },
  {
    id: 2,
    title: "For Teachers",
    subtitle: "Share & Earn",
    description: "Share your knowledge with students globally. Create courses, conduct live sessions, and earn from your expertise.",
    image: teachersImage,
    bgGradient: "from-emerald-600/90 via-teal-500/80 to-cyan-500/70",
  },
  {
    id: 3,
    title: "For Freelancers",
    subtitle: "Create & Connect",
    description: "Showcase your portfolio, find clients worldwide, and grow your freelance business with our platform.",
    image: freelancersImage,
    bgGradient: "from-violet-600/90 via-purple-500/80 to-fuchsia-500/70",
  },
];

const SLIDE_DURATION = 5000;

export default function GetStarted({ onComplete }: GetStartedProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const isMobileApp = isInCordovaApp();

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(nextSlide, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const handleGetStarted = () => {
    localStorage.setItem("edufiliova_onboarding_completed", "true");
    onComplete();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.05,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.95,
    }),
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 200, damping: 25, duration: 0.5 },
            opacity: { duration: 0.4, ease: "easeInOut" },
            scale: { duration: 0.4, ease: "easeOut" },
          }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full">
            <img
              src={currentSlideData.image}
              alt={currentSlideData.title}
              className="w-full h-full object-cover"
              data-testid={`slide-image-${currentSlide}`}
            />
            
            <div className={`absolute inset-0 bg-gradient-to-t ${currentSlideData.bgGradient}`} />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-0 left-0 right-0 z-10 pt-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center"
        >
          <img 
            src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" 
            alt="EduFiliova" 
            className="h-10 w-auto object-contain drop-shadow-lg"
            data-testid="logo-white"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 pb-10 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4"
            >
              {currentSlideData.subtitle}
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              data-testid={`slide-title-${currentSlide}`}
            >
              {currentSlideData.title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 text-lg max-w-md mx-auto leading-relaxed"
              data-testid={`slide-description-${currentSlide}`}
            >
              {currentSlideData.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-row items-center justify-center gap-3 mb-8" style={{ flexDirection: 'row' }}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="rounded-full transition-all duration-300"
              style={{
                width: index === currentSlide ? '24px' : '8px',
                height: '8px',
                minWidth: index === currentSlide ? '24px' : '8px',
                minHeight: '8px',
                backgroundColor: index === currentSlide ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.4)',
              }}
              data-testid={`slide-indicator-${index}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex justify-center gap-4"
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="group relative bg-gradient-to-r from-primary to-red-500 hover:from-orange-600 hover:to-primary text-white font-semibold px-16 py-4 rounded-full text-base shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 transition-all duration-300"
            data-testid="button-get-started"
          >
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 transition-all duration-300" />
            </span>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="text-center text-white/40 text-xs mt-5"
        >
          Swipe or tap dots to explore
        </motion.p>
      </div>

      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/20">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          key={currentSlide}
          transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
          style={{ transformOrigin: "left" }}
        />
      </div>
    </div>
  );
}
