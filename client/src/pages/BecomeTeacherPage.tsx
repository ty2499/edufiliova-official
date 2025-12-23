import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  DollarSign, 
  Users, 
  Award, 
  BookOpen, 
  TrendingUp,
  ArrowRight,
  Star,
  Globe,
  Calendar,
  Video,
  MessageCircle,
  BarChart3
} from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface BecomeTeacherPageProps {
  onNavigate: (page: string) => void;
}

function BecomeTeacherPage({ onNavigate }: BecomeTeacherPageProps) {
  const benefits = [
    {
      icon: DollarSign,
      title: "Earn While You Teach",
      description: "Set your own rates and earn money sharing your expertise with eager learners worldwide."
    },
    {
      icon: Users,
      title: "Global Student Base",
      description: "Connect with students from around the world and build a diverse learning community."
    },
    {
      icon: Calendar,
      title: "Flexible Schedule",
      description: "Work on your own terms. Set your availability and teach when it suits you best."
    },
    {
      icon: Video,
      title: "Integrated Video Tools",
      description: "Use our built-in video conferencing and interactive whiteboard for engaging lessons."
    },
    {
      icon: BarChart3,
      title: "Track Your Growth",
      description: "Access detailed analytics to monitor your performance and student engagement."
    },
    {
      icon: Award,
      title: "Professional Recognition",
      description: "Build your reputation with student reviews and earn badges for excellence."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description: "Fill out a simple application form with your qualifications and teaching experience."
    },
    {
      number: "02",
      title: "Get Verified",
      description: "Our team will review your application and credentials within 24-48 hours."
    },
    {
      number: "03",
      title: "Set Up Your Classes",
      description: "Create your course offerings, set your rates, and define your availability."
    },
    {
      number: "04",
      title: "Start Teaching",
      description: "Begin accepting students and start earning while making a real impact."
    }
  ];

  const stats = [
    { value: "10,000+", label: "Active Students", icon: Users },
    { value: "500+", label: "Expert Teachers", icon: GraduationCap },
    { value: "95%", label: "Satisfaction Rate", icon: Star },
    { value: "150+", label: "Countries Reached", icon: Globe }
  ];

  const requirements = [
    "Bachelor's degree or equivalent professional experience",
    "Proven expertise in your subject area",
    "Passion for teaching and helping students succeed",
    "Reliable internet connection and quiet teaching space",
    "Fluency in English or the language you'll be teaching in",
    "Ability to commit to at least 5 hours per week"
  ];

  return (
    <div className="min-h-screen">
      {/* Epic Hero Section */}
      <div className="relative bg-[#0C332C] dark:bg-[#0C332C] overflow-hidden pt-16 md:pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large glow orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px]"></div>
          
          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-14 py-12 sm:py-16 md:py-24 lg:py-40">
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight animate-fade-in-up">
              Inspire the Next
              <br />
              <span className="text-white">
                Generation of Learners
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed animate-fade-in-up delay-100 px-2">
              Share your knowledge, earn competitive income, and make a lasting impact on students worldwide
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6 animate-fade-in-up delay-200">
              <Button
                onClick={() => onNavigate("teacher-signup-basic")}
                size="lg"
                className="bg-white text-foreground text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 rounded-full font-bold transition-all duration-300 group w-full sm:w-auto" transition-all duration-300
                data-testid="button-start-application"
              >
                Start Your Application
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform" transition-all duration-300 />
              </Button>
              <Button
                onClick={() => onNavigate("contact")}
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-md text-white border-2 border-white/30 text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 rounded-full font-bold transition-all duration-300 w-full sm:w-auto" transition-all duration-300
                data-testid="button-learn-more"
              >
                <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Have Questions?
              </Button>
            </div>

            
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path 
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="currentColor" 
              className="text-gray-50 dark:text-gray-900"
            />
          </svg>
        </div>
      </div>

      {/* Why Teach With Us Section */}
      <div className="py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-14 max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <Badge className="mb-3 sm:mb-4 bg-[#0C332C]/10 text-foreground dark:bg-[#0C332C]/20 dark:text-foreground px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
            Benefits
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
            Why Teach With Us?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-2">
            Join thousands of educators who have transformed their passion into a thriving teaching career
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <Card 
              key={index}
              className="border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 group" transition-all duration-300
              data-testid={`benefit-card-${index}`}
            >
              <CardContent className="p-4 sm:p-6 md:p-8">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-14 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-[#0C332C]/10 text-foreground dark:bg-[#0C332C]/20 dark:text-foreground px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              Simple Process
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
              How to Get Started
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-2">
              Four simple steps to begin your teaching journey with us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative" data-testid={`step-card-${index}`}>
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-[#0C332C] -z-10" />
                )}
                
                <Card className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 h-full" transition-all duration-300>
                  <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-[#0C332C] flex items-center justify-center mx-auto mb-4 sm:mb-5 md:mb-6 shadow-lg">
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{step.number}</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-14 max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <Badge className="mb-3 sm:mb-4 bg-[#0C332C]/10 text-foreground dark:bg-[#0C332C]/20 dark:text-foreground px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
            Requirements
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
            What We're Looking For
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-2">
            We seek passionate educators committed to delivering exceptional learning experiences
          </p>
        </div>

        <Card className="max-w-4xl mx-auto border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {requirements.map((requirement, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-2 sm:gap-3 md:gap-4 group"
                  data-testid={`requirement-${index}`}
                >
                  <CheckmarkIcon size="md" className="bg-[#0C332C] flex-shrink-0 mt-0.5 sm:mt-1 transition-transform" transition-all duration-300 />
                  <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg">
                    {requirement}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final CTA Section */}
      <div className="py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-14 bg-[#0C332C]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 px-2">
            Ready to Make a Difference?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">
            Join our community of passionate educators and start your teaching journey today. 
            Your expertise could change someone's life.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              onClick={() => onNavigate("teacher-signup-basic")}
              size="lg"
              className="bg-white text-foreground hover:bg-white text-sm sm:text-base md:text-lg px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 rounded-full font-bold group w-full sm:w-auto"
              data-testid="button-apply-now"
            >
              Apply Now
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              onClick={() => onNavigate("help")}
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-md text-white border-2 border-white/50 hover:bg-white/10 hover:border-white/50 text-sm sm:text-base md:text-lg px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 rounded-full font-bold w-full sm:w-auto"
              data-testid="button-help-center"
            >
              <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Visit Help Center
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BecomeTeacherPage;
