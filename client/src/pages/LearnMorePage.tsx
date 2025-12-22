import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import Footer from "@/components/Footer";
import { 
  BookOpen, 
  Users, 
  Clock, 
  Award, 
  Star, 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Shield,
  MessageCircle,
  Play,
  ArrowRight,
  Zap,
  Heart,
  Globe
} from "lucide-react";

interface LearnMorePageProps {
  onNavigate: (page: string) => void;
}

const LearnMorePage = ({ onNavigate }: LearnMorePageProps) => {
  const features = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Comprehensive Curriculum",
      description: "Access to over 500+ premium courses with 95% student success rate. Each course is designed by education experts and guarantees grade improvement."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Personal Expert Teachers",
      description: "Get 24/7 support from certified personal teachers who adapt to your learning style. Ask questions anytime and receive instant, personalized explanations."
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Smart Learning System",
      description: "Our proven system tracks your progress and adjusts the difficulty level in real-time, ensuring you're always challenged but never overwhelmed."
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Industry Certifications",
      description: "Earn industry-recognized certificates accepted by top universities and employers worldwide. 100% guaranteed recognition."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Learn at Your Pace",
      description: "Study whenever and wherever you want. Our platform works on all devices, so you can continue learning whether you're at home or on the go."
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics, progress reports, and achievement badges that keep you motivated."
    }
  ];

  const subjects = [
    {
      title: "Programming & Computer Science",
      courses: ["Python Programming", "Web Development", "Data Structures", "Mobile App Development", "Game Development"],
      icon: <BookOpen className="h-6 w-6" />,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Mathematics",
      courses: ["Algebra", "Geometry", "Calculus", "Statistics", "Discrete Mathematics"],
      icon: <Target className="h-6 w-6" />,
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Science",
      courses: ["Physics", "Chemistry", "Biology", "Environmental Science", "Astronomy"],
      icon: <Lightbulb className="h-6 w-6" />,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Language Arts",
      courses: ["Creative Writing", "Literature", "Grammar", "Public Speaking", "Research Skills"],
      icon: <MessageCircle className="h-6 w-6" />,
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Business & Economics",
      courses: ["Entrepreneurship", "Financial Literacy", "Marketing", "Economics", "Leadership"],
      icon: <TrendingUp className="h-6 w-6" />,
      color: "bg-red-50 text-primary-600"
    },
    {
      title: "Arts & Design",
      courses: ["Digital Art", "Graphic Design", "Music Theory", "Photography", "3D Modeling"],
      icon: <Heart className="h-6 w-6" />,
      color: "bg-pink-50 text-pink-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "High School Student",
      text: "EduFiliova transformed my learning experience. The AI teacher helped me understand calculus concepts I struggled with for months. I went from failing to getting A's!",
      rating: 5,
      achievement: "Improved grade from F to A in Calculus"
    },
    {
      name: "Michael Chen",
      role: "College Freshman",
      text: "The programming courses are incredible. I built my first app in just 6 weeks with the help of my AI mentor. The step-by-step guidance made everything so clear.",
      rating: 5,
      achievement: "Built first mobile app"
    },
    {
      name: "Emma Rodriguez",
      role: "8th Grade Student",
      text: "I love how the platform adapts to my learning speed. When I need more practice, it gives me extra problems. When I'm ready to move on, it challenges me with harder concepts.",
      rating: 5,
      achievement: "Advanced 2 grade levels in Math"
    },
    {
      name: "David Kim",
      role: "Parent",
      text: "My daughter's confidence has skyrocketed since using EduFiliova. She actually looks forward to studying now, and her grades have improved dramatically across all subjects.",
      rating: 5,
      achievement: "Daughter's GPA improved by 1.5 points"
    }
  ];

  const stats = [
    { number: "50,000+", label: "Active Students", icon: <Users className="h-6 w-6" /> },
    { number: "500+", label: "Courses Available", icon: <BookOpen className="h-6 w-6" /> },
    { number: "98%", label: "Student Satisfaction", icon: <Heart className="h-6 w-6" /> },
    { number: "24/7", label: "AI Teacher Support", icon: <MessageCircle className="h-6 w-6" /> },
  ];

  const pricingFeatures = [
    "Access to all premium courses",
    "Personal AI teacher available 24/7",
    "Unlimited practice problems",
    "Progress tracking and analytics",
    "Industry-recognized certificates",
    "Mobile app access",
    "Parent/teacher dashboard",
    "Priority customer support"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-8 md:px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-6xl font-bold mb-8">
              Transform Your Learning Journey with Expert-Led Education
            </h1>
            <p className="text-2xl mb-8 text-primary-foreground/90 leading-relaxed">
              Join thousands of successful students worldwide with our proven educational system. 
              Experience personalized teaching from qualified educators available 24/7 to unlock your full potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => onNavigate("auth")}
                className="bg-slate-900 text-foreground hover:bg-slate-800 text-lg px-10 py-4"
                data-testid="button-start-journey"
              >
                Start Your Journey Today
              </Button>
              <Button 
                size="lg"
                onClick={() => onNavigate("contact")}
                className="bg-slate-900 text-white hover:bg-slate-800 text-lg px-10 py-4"
                data-testid="button-contact-us"
              >
                Contact Our Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-8 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-center text-foreground mb-2">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-slate-900">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-8 md:px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-5xl font-bold mb-6 text-slate-900">
              Why Choose EduFiliova?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform combines expert teaching with proven educational methodologies 
              to create the most effective learning experience with guaranteed results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:scale-105 transition-transform duration-300">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full text-foreground">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-12 md:py-24 bg-white">
        <div className="container mx-auto px-6 md:px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-5xl font-bold mb-6 text-slate-900">
              Comprehensive Subject Coverage
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From foundational skills to advanced topics, our curriculum covers everything 
              you need to succeed in today's competitive world.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject, index) => (
              <Card key={index} className="overflow-hidden hover:scale-105 transition-transform duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${subject.color}`}>
                      {subject.icon}
                    </div>
                    <CardTitle className="text-xl">{subject.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subject.courses.map((course, courseIndex) => (
                      <div key={courseIndex} className="flex items-center space-x-2">
                        <CheckmarkIcon size="sm" />
                        <span className="text-sm">{course}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 md:px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-5xl font-bold mb-6 text-slate-900">
              How EduFiliova Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our proven learning system is designed to adapt to your unique learning style 
              and pace, ensuring maximum effectiveness and guaranteed results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Sign Up & Assess</h3>
              <p className="text-muted-foreground">
                Complete our comprehensive assessment to understand your current knowledge level 
                and learning preferences.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Get Personalized Plan</h3>
              <p className="text-muted-foreground">
                Our experts create a customized learning path tailored specifically to your goals, 
                strengths, and areas for improvement.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Learn & Excel</h3>
              <p className="text-muted-foreground">
                Start learning with your personal teacher, track your progress, and watch your 
                knowledge and confidence grow exponentially.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-24 bg-white">
        <div className="container mx-auto px-6 md:px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-5xl font-bold mb-6 text-slate-900">
              Success Stories
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how EduFiliova has transformed the learning experience for thousands of students worldwide.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{testimonial.name}</h4>
                      <p className="text-muted-foreground">{testimonial.role}</p>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <Badge variant="secondary" className="bg-primary/10 text-foreground">
                    {testimonial.achievement}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-24 bg-white">
        <div className="container mx-auto px-6 md:px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-5xl font-bold mb-6 text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get answers to the most common questions about EduFiliova.
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How does the AI teacher work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Our AI teacher uses advanced machine learning algorithms to understand your learning style, 
                  pace, and preferences. It provides personalized explanations, adapts difficulty levels in real-time, 
                  and is available 24/7 to answer questions and provide guidance.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What ages and grade levels do you support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  EduFiliova supports learners from elementary school through college and beyond. 
                  Our content spans grades K-12 and includes college-level and professional development courses.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Can I cancel my subscription anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Yes! You can cancel your subscription at any time with no penalties or hidden fees. 
                  You'll continue to have access to premium features until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Do you offer certificates upon completion?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Yes! Upon completing courses, you'll receive industry-recognized certificates that you can 
                  share on LinkedIn, include in your resume, or present to educational institutions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 md:px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-5xl font-bold mb-8">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-2xl mb-8 text-primary-foreground/90 leading-relaxed">
              Join thousands of students who have already unlocked their potential with EduFiliova. 
              Start your premium learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => onNavigate("auth")}
                className="bg-slate-900 text-foreground hover:bg-slate-800 text-lg px-12 py-4"
                data-testid="button-start-final-cta"
              >
                Get Premium Access
              </Button>
              <Button 
                size="lg"
                onClick={() => onNavigate("contact")}
                className="bg-slate-900 text-white hover:bg-slate-800 text-lg px-12 py-4"
                data-testid="button-contact-final-cta"
              >
                Talk to Our Team
              </Button>
            </div>
            <p className="mt-6 text-primary-foreground/80">
              Questions? Contact us at support@edufiliova.com or call 1-800-EDUFILIO
            </p>
          </div>
        </div>
      </section>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default LearnMorePage;
