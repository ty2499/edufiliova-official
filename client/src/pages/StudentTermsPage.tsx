import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface StudentTermsPageProps {
  onNavigate: (page: string) => void;
}

const StudentTermsPage = ({ onNavigate }: StudentTermsPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Eligibility",
      content: [
        "To register as a student on EduFiliova, you confirm that:",
        { list: [
          "You are at least 13 years old, or",
          "You have permission from a parent/guardian if under local age requirements",
          "The information you provide is accurate and true"
        ]},
        "EduFiliova may request verification if needed."
      ]
    },
    {
      id: 2,
      title: "Account Registration",
      content: [
        "When creating an account, you must provide:",
        { list: [
          "Your full name",
          "A valid email address",
          "A valid phone number (for login and WhatsApp features)",
          "Your grade level and education system"
        ]},
        "You are responsible for keeping your login credentials secure.",
        "Do not share your password or access with anyone else."
      ]
    },
    {
      id: 3,
      title: "Student Responsibilities",
      content: [
        "As a student using EduFiliova, you agree to:",
        { list: [
          "Act respectfully towards teachers, staff, and other students",
          "Use the learning content only for personal education",
          "Not upload or share violent, hateful, or inappropriate content",
          "Not cheat, bypass assessments, or misuse platform tools",
          "Not attempt to access features you have not subscribed to",
          "Follow all instructions provided by teachers and administrators"
        ]},
        "Violation may lead to suspension or permanent removal of your account."
      ]
    },
    {
      id: 4,
      title: "Use of Learning Content",
      content: [
        "All lessons, notes, videos, quizzes, documents, and materials on EduFiliova are:",
        { list: [
          "Copyrighted",
          "Owned by EduFiliova or the original creators (teachers or freelancers)",
          "Provided for personal learning only"
        ]},
        "You agree not to:",
        { list: [
          "Copy, download, or redistribute paid content illegally",
          "Share your access with others",
          "Record or leak live classes without permission",
          "Sell or upload our content to other platforms"
        ]},
        "EduFiliova may take legal action against unauthorized distribution."
      ]
    },
    {
      id: 5,
      title: "Subscriptions & Payments",
      content: [
        "Student plans (Elementary, High School, or other available plans):",
        { list: [
          "Provide access to premium lessons, quizzes, certificates, live classes, and other features",
          "Are billed on a recurring monthly basis until cancelled",
          "Are non-refundable unless required by law"
        ]},
        "If your plan expires:",
        { list: [
          "Access will switch to Free Mode",
          "Only 1 free lesson per subject will be available",
          "You cannot join live classes or message teachers"
        ]},
        "Pricing may change in the future, and you will be notified."
      ]
    },
    {
      id: 6,
      title: "Free Mode Limitations",
      content: [
        "If you do not have an active subscription, you understand that you will:",
        { list: [
          "Access only a limited number of lessons",
          "Not participate in live classes",
          "Not message teachers",
          "Not post in community forums (Grade 8–12)",
          "Not receive daily homework or reminders on WhatsApp",
          "Only download limited free shop items",
          "See locked content requiring subscription"
        ]},
        "These limitations ensure fairness and platform security."
      ]
    },
    {
      id: 7,
      title: "Certificates",
      content: [
        "Certificates are issued automatically upon completing:",
        { list: [
          "All lessons in a course",
          "All required assessments (where applicable)"
        ]},
        "Certificates may display:",
        { list: [
          "Your name",
          "Course title",
          "Completion date",
          "Verification code"
        ]},
        "You may share your certificate publicly but must not modify or falsify it."
      ]
    },
    {
      id: 8,
      title: "WhatsApp Learning Services",
      content: [
        "By opting in, you agree to receive:",
        { list: [
          "Homework reminders",
          "Learning updates",
          "Registration or account notices",
          "Course notifications",
          "Payment confirmations"
        ]},
        "You can turn these off at any time by replying STOP on WhatsApp or disabling the switch in your dashboard."
      ]
    },
    {
      id: 9,
      title: "Communication Rules",
      content: [
        "Students must use messaging responsibly:",
        { list: [
          "No spam",
          "No bullying or harassment",
          "No sharing inappropriate media",
          "No asking teachers for personal contact or private payment"
        ]},
        "EduFiliova monitors safety and may restrict messaging if rules are broken."
      ]
    },
    {
      id: 10,
      title: "Data & Privacy",
      content: [
        "EduFiliova collects necessary information to provide educational services, such as:",
        { list: [
          "Login details",
          "Learning progress",
          "Device information",
          "Messages with teachers (for safety, not for profiling)",
          "Course usage data"
        ]},
        "We do not sell your personal information.",
        "For full details, see our Privacy Policy."
      ]
    },
    {
      id: 11,
      title: "Account Suspension",
      content: [
        "Your account may be suspended or removed if you:",
        { list: [
          "Break safety rules",
          "Abuse features",
          "Engage in illegal or harmful activities",
          "Share or leak licensed content",
          "Commit fraud or misuse payment services"
        ]},
        "In serious cases, access to EduFiliova may be permanently terminated."
      ]
    },
    {
      id: 12,
      title: "Changes to Terms",
      content: [
        "EduFiliova may update these Terms at any time.",
        "We will notify you if changes affect your rights or access."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="student-terms" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Student Terms of Use
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              These Student Terms of Use govern your access and use of EduFiliova's learning platform, mobile services, WhatsApp services, digital content, and all related features.
            </p>
            <div className="mt-4 md:mt-6 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Last updated:</span> 2025
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-primary/10 border-l-4 border-primary p-4 md:p-6 rounded-lg mb-6 md:mb-8 animate-fade-in">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">
                Important Notice
              </h3>
              <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                By creating a student account or using EduFiliova, you agree to these Terms. If you do not agree, do not use the platform.
              </p>
            </div>
          </div>

          {/* Terms Sections */}
          <div className="space-y-4 md:space-y-6">
            {sections.map((section, index) => (
              <div 
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in" transition-all duration-300
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`section-${section.id}`}
              >
                <div className="p-5 md:p-8">
                  {/* Section Header */}
                  <div className="mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {section.id}. {section.title}
                    </h2>
                  </div>

                  {/* Section Content */}
                  <div className="pl-0 md:pl-16 space-y-3 md:space-y-4">
                    {section.content.map((item, idx) => {
                      if (typeof item === 'string') {
                        return (
                          <p key={idx} className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                            {item}
                          </p>
                        );
                      } else if ('list' in item) {
                        return (
                          <ul key={idx} className="space-y-2 md:space-y-3 ml-4 md:ml-6">
                            {item.list.map((listItem, listIdx) => (
                              <li 
                                key={listIdx}
                                className="flex items-start gap-2 md:gap-3 text-sm md:text-base text-gray-700 dark:text-gray-300"
                              >
                                <span className="flex-shrink-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full mt-1.5 md:mt-2" />
                                <span className="flex-1">{listItem}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-8 md:mt-12 bg-primary rounded-xl p-6 md:p-8 text-primary-foreground shadow-xl animate-fade-in">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Contact</h2>
              <p className="text-primary-foreground/90 text-sm md:text-base">For questions or support:</p>
            </div>
            <div className="pl-0 md:pl-16 space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Email:</span>
                <a 
                  href="mailto:support@edufiliova.com" 
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors" transition-all duration-300
                  data-testid="link-support-email"
                >
                  support@edufiliova.com
                </a>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Website:</span>
                <a 
                  href="https://www.edufiliova.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors" transition-all duration-300
                  data-testid="link-website"
                >
                  www.edufiliova.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default StudentTermsPage;
