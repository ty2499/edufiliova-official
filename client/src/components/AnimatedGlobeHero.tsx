import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface AnimatedGlobeHeroProps {
  onNavigate: (page: string) => void;
}

const userTypeContent = [
  {
    type: 'Students',
    headline: 'Learn From Anywhere',
    description: 'Access world-class education with personalized courses, expert teachers, and earn certificates that matter.',
    cta: 'Browse Store',
    ctaAction: 'auth',
    secondaryCta: 'Browse Courses',
    secondaryAction: 'course-browse',
    color: '#2f5a4e'
  },
  {
    type: 'Teachers',
    headline: 'Teach The World',
    description: 'Share your expertise globally. Create courses, connect with students, and earn from your knowledge.',
    cta: 'Become a Teacher',
    ctaAction: 'teacher-signup-basic',
    secondaryCta: 'View Teaching Guide',
    secondaryAction: 'help',
    color: '#0C332C'
  },
  {
    type: 'Freelancers',
    headline: 'Create & Earn',
    description: 'Build and sell courses, offer tutoring services, and grow your education business on our platform.',
    cta: 'Join as Freelancer',
    ctaAction: 'freelancer-signup-basic',
    secondaryCta: 'Learn More',
    secondaryAction: 'help',
    color: '#0C332C'
  },
  {
    type: 'Customers',
    headline: 'Shop Educational Products',
    description: 'Discover books, study materials, and educational resources from trusted sellers worldwide.',
    cta: 'Browse Store',
    ctaAction: 'product-shop',
    secondaryCta: 'View Products',
    secondaryAction: 'product-shop',
    color: '#0C332C'
  }
];

export default function AnimatedGlobeHero({ onNavigate }: AnimatedGlobeHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [contentVisible, setContentVisible] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setContentVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setContentVisible(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % userTypeContent.length);
        setContentVisible(true);
      }, 400);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotation = 0;
    const dots: { lat: number; lng: number; size: number }[] = [];

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (let lat = -80; lat <= 80; lat += 8) {
      const latRad = (lat * Math.PI) / 180;
      const circumference = Math.cos(latRad);
      const dotsAtLat = Math.floor(circumference * 45);
      
      for (let i = 0; i < dotsAtLat; i++) {
        const lng = (i / dotsAtLat) * 360 - 180;
        const isLand = Math.random() > 0.3;
        if (isLand) {
          dots.push({
            lat,
            lng,
            size: 1.5 + Math.random() * 1.5
          });
        }
      }
    }

    const project3D = (lat: number, lng: number, radius: number, rotationY: number) => {
      const latRad = (lat * Math.PI) / 180;
      const lngRad = ((lng + rotationY) * Math.PI) / 180;

      const x = radius * Math.cos(latRad) * Math.sin(lngRad);
      const y = radius * Math.sin(latRad);
      const z = radius * Math.cos(latRad) * Math.cos(lngRad);

      return { x, y, z };
    };

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const isMobile = canvas.width < 768;
      const centerX = isMobile ? canvas.width * 0.5 : canvas.width * 0.7;
      const centerY = canvas.height / 2;
      const radiusScale = isMobile ? 0.5 : 0.35;
      const radius = Math.min(canvas.width, canvas.height) * radiusScale;

      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius * 1.5
      );
      gradient.addColorStop(0, 'rgba(160, 250, 178, 0.08)');
      gradient.addColorStop(0.5, 'rgba(12, 51, 44, 0.04)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(160, 250, 178, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      const sortedDots = dots
        .map(dot => {
          const pos = project3D(dot.lat, dot.lng, radius, rotation);
          return { ...dot, ...pos };
        })
        .sort((a, b) => a.z - b.z);

      sortedDots.forEach((dot, i) => {
        if (dot.z < 0) return;

        const screenX = centerX + dot.x;
        const screenY = centerY - dot.y;

        const depth = (dot.z + radius) / (2 * radius);
        const alpha = 0.3 + depth * 0.7;
        const size = dot.size * (0.5 + depth * 0.5);

        if (i % 3 === 0) {
          ctx.fillStyle = `rgba(12, 51, 44, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(160, 250, 178, ${alpha})`;
        }

        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(160, 250, 178, ${0.08 - i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 10 + i * 15, 0, Math.PI * 2);
        ctx.stroke();
      }

      rotation += 0.15;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const currentContent = userTypeContent[activeIndex];

  return (
    <section className="relative min-h-screen overflow-hidden bg-black" data-testid="hero-animated-globe">
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          data-testid="globe-canvas"
        />
      </div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #000000, rgba(0, 0, 0, 0.8), transparent)' }} />
      <div className="relative z-10 container mx-auto px-6 pt-4 md:pt-0 pb-16 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center">
          <div className="w-full lg:w-1/2">
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                EduFiliova
              </h1>
              <p className="text-lg mb-8 text-[#ffffff]" style={{color: "#A0FAB2"}}>
                Learn. Teach. Create. Earn. All in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {userTypeContent.map((item, index) => (
                <button
                  key={item.type}
                  onClick={() => {
                    setContentVisible(false);
                    setTimeout(() => {
                      setActiveIndex(index);
                      setContentVisible(true);
                    }, 300);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform ${
                    activeIndex === index
                      ? 'border border-transparent scale-105 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-transparent hover:scale-105 hover:shadow-lg active:scale-95'
                  }`}
                  style={activeIndex === index ? { 
                    backgroundColor: item.color, 
                    color: item.color === '#A0FAB2' ? '#000000' : '#ffffff' 
                  } : {}}
                  data-testid={`tab-${item.type.toLowerCase()}`}
                >
                  {item.type}
                </button>
              ))}
            </div>

            <div className={`min-h-[280px] transition-all duration-500 ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="mb-4">
                <span 
                  className="text-sm font-semibold uppercase tracking-wider text-white"
                >
                  For {currentContent.type}
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {currentContent.headline}
              </h2>

              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                {currentContent.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => onNavigate(currentContent.ctaAction)}
                  className={`inline-flex items-center justify-center whitespace-nowrap transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer hover:scale-105 active:scale-95 focus-visible:ring-accent font-semibold px-8 py-6 text-lg rounded-full group text-white ${currentContent.type === 'Students' ? 'bg-[#2f5a4e]' : ''}`}
                  style={currentContent.type !== 'Students' ? { 
                    backgroundColor: currentContent.color
                  } : undefined}
                  data-testid={`button-cta-${currentContent.type.toLowerCase()}`}
                >
                  {currentContent.cta}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6" style={{ color: '#A0FAB2' }} />
      </div>
    </section>
  );
}
