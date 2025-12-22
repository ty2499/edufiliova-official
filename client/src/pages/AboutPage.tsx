
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

const AboutPage = ({ onNavigate }: AboutPageProps) => {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <Header onNavigate={onNavigate} currentPage="about" />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-[#ff5834]">
          <div className="container mx-auto px-6 md:px-10 lg:px-14">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight" data-testid="heading-hero">
                About EduFiliova
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
                We connect passionate learners with expert educators worldwide, offering a comprehensive platform for quality education, professional development, and lifelong learning.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-6 md:px-10 lg:px-14">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                <div data-testid="card-mission">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#151314] mb-4 pb-3 border-b-2 border-[#ff5834]">
                    Our Mission
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                    To democratize access to world-class education by connecting learners with expert teachers and providing personalized learning experiences. We empower people globally to achieve academic excellence through innovative, accessible, and engaging educational solutions.
                  </p>
                </div>
                <div data-testid="card-vision">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#151314] mb-4 pb-3 border-b-2 border-[#ff5834]">
                    Our Vision
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                    To be the world's most trusted educational platform, where every learner has access to personalized learning paths, expert teachers, and cutting-edge tools that unlock their full potential and prepare them for success in an ever-evolving global landscape.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve Section */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-6 md:px-10 lg:px-14">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-[#151314] mb-10 text-center" data-testid="heading-serve">
                Who We Serve
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-lg border border-gray-200" data-testid="serve-learners">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-4">For Learners</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Access thousands of courses, track your progress, earn certificates, and learn from verified expert teachers across all subjects.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg border border-gray-200" data-testid="serve-teachers">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-4">For Teachers</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Create and sell courses, build your professional reputation, manage learners, and earn income through our platform.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg border border-gray-200" data-testid="serve-freelancers">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-4">For Freelancers</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Offer specialized courses, set your own pricing, reach a global audience, and grow your educational business.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-6 md:px-10 lg:px-14">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-[#151314] mb-10 text-center" data-testid="heading-values">
                Our Core Values
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 border-l-4 border-[#ff5834] bg-gray-50" data-testid="value-0">
                  <h3 className="text-lg font-bold text-[#151314] mb-2">Educational Excellence</h3>
                  <p className="text-gray-700">
                    We are committed to delivering the highest quality educational experiences through rigorous content standards and expert instruction.
                  </p>
                </div>
                <div className="p-6 border-l-4 border-[#ff5834] bg-gray-50" data-testid="value-1">
                  <h3 className="text-lg font-bold text-[#151314] mb-2">Accessibility & Inclusion</h3>
                  <p className="text-gray-700">
                    Quality education should be available to everyone, regardless of location, background, or circumstances.
                  </p>
                </div>
                <div className="p-6 border-l-4 border-[#ff5834] bg-gray-50" data-testid="value-2">
                  <h3 className="text-lg font-bold text-[#151314] mb-2">Continuous Innovation</h3>
                  <p className="text-gray-700">
                    We embrace cutting-edge technology and pedagogical research to constantly improve the learning experience.
                  </p>
                </div>
                <div className="p-6 border-l-4 border-[#ff5834] bg-gray-50" data-testid="value-3">
                  <h3 className="text-lg font-bold text-[#151314] mb-2">Empowering Educators</h3>
                  <p className="text-gray-700">
                    We provide teachers with the tools, support, and recognition they deserve to share their expertise with the world.
                  </p>
                </div>
                <div className="p-6 border-l-4 border-[#ff5834] bg-gray-50" data-testid="value-4">
                  <h3 className="text-lg font-bold text-[#151314] mb-2">Learner-Centered Approach</h3>
                  <p className="text-gray-700">
                    Every decision we make prioritizes learner success, engagement, and meaningful educational outcomes.
                  </p>
                </div>
                <div className="p-6 border-l-4 border-[#ff5834] bg-gray-50" data-testid="value-5">
                  <h3 className="text-lg font-bold text-[#151314] mb-2">Trust & Security</h3>
                  <p className="text-gray-700">
                    We maintain the highest standards of data protection, privacy, and platform reliability for all users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Features Section */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-6 md:px-10 lg:px-14">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-[#151314] mb-10 text-center" data-testid="heading-features">
                What Sets Us Apart
              </h2>
              <div className="space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200" data-testid="feature-0">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-3">Verified Teacher Profiles</h3>
                  <p className="text-gray-700 leading-relaxed">
                    All educators undergo thorough verification to ensure they meet professional standards and have proven expertise in their subject areas.
                  </p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200" data-testid="feature-1">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-3">Comprehensive Course Creation</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Our advanced course builder empowers educators to create engaging, multimedia-rich content with quizzes, assignments, video lessons, and interactive elements.
                  </p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200" data-testid="feature-2">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-3">Secure Platform</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Enterprise-grade security with dual verification authentication, secure payment processing, and complete data protection for all users.
                  </p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200" data-testid="feature-3">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-3">Analytics & Reporting</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Both educators and learners access detailed analytics including performance metrics, completion rates, time tracking, and comprehensive progress reports.
                  </p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200" data-testid="feature-4">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-3">Global Accessibility</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Built for international audiences with multi-currency support, localized content, and accessibility features ensuring education reaches learners regardless of location.
                  </p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200" data-testid="feature-5">
                  <h3 className="text-xl font-bold text-[#ff5834] mb-3">Quality Assurance</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Every course undergoes rigorous review by our quality assurance team. We maintain educational standards through instructor verification, content reviews, and continuous improvement protocols.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-[#ff5834]">
          <div className="container mx-auto px-6 md:px-10 lg:px-14">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6" data-testid="heading-cta">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-white/90 text-lg mb-8 leading-relaxed">
                Join thousands of learners and educators who trust EduFiliova for quality education.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={() => onNavigate("course-browse")}
                  className="bg-white text-[#ff5834] hover:bg-gray-100 font-semibold px-8 py-3 rounded-full"
                  data-testid="button-browse-courses"
                >
                  Browse Courses
                </Button>
                <Button 
                  onClick={() => onNavigate("contact")}
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-full"
                  data-testid="button-contact"
                >
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default AboutPage;
