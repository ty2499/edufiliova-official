import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface TeacherTermsPageProps {
  onNavigate: (page: string) => void;
}

const TeacherTermsPage = ({ onNavigate }: TeacherTermsPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Eligibility & Requirements",
      content: [
        "To become a teacher on EduFiliova, you confirm that:",
        { list: [
          "You are at least 18 years old",
          "You have the legal right to teach educational content",
          "The qualifications you provide are accurate and valid",
          "You can communicate professionally with students",
          "You can create your own original educational materials"
        ]},
        "EduFiliova may ask for proof of identity or professional documentation."
      ]
    },
    {
      id: 2,
      title: "Application & Approval",
      content: [
        "Teachers must:",
        { list: [
          "Complete the teacher application form",
          "Upload required documents (certificates, ID, sample lesson materials)",
          "Wait for EduFiliova's review"
        ]},
        "EduFiliova reserves the right to:",
        { list: [
          "Approve or reject applications",
          "Request additional verification",
          "Suspend or remove teachers if rules are violated"
        ]},
        "Approval is not guaranteed."
      ]
    },
    {
      id: 3,
      title: "Teacher Responsibilities",
      content: [
        "As a teacher on EduFiliova, you agree to:",
        { list: [
          "Teach professionally, respectfully, and ethically",
          "Provide accurate, original educational materials",
          "Not copy or upload copyrighted content without permission",
          "Not promote hate speech, discrimination, or inappropriate topics",
          "Respond to student messages in a reasonable time",
          "Conduct live classes in a safe, respectful manner",
          "Maintain high-quality communication and course content"
        ]},
        "EduFiliova may review your courses for quality and compliance."
      ]
    },
    {
      id: 4,
      title: "Ownership of Content",
      content: [
        "You maintain ownership of all educational materials you create and upload.",
        "However, by publishing a course, lesson, or resource on EduFiliova, you grant EduFiliova a non-exclusive license to:",
        { list: [
          "Host, display, and distribute the content on the platform",
          "Stream and deliver your content to enrolled students",
          "Use your course thumbnails and titles for marketing and promotional purposes"
        ]},
        "You may remove your content at any time unless:",
        { list: [
          "Students are currently enrolled",
          "The content has pending assessments",
          "It's part of a purchased or ongoing program"
        ]}
      ]
    },
    {
      id: 5,
      title: "Payments & Commission",
      content: [
        "EduFiliova handles all payments and payouts to teachers.",
        "Teachers agree to:",
        { list: [
          "A standard platform commission (e.g., 35% or your current setting)",
          "Payouts via supported payment methods",
          "Payout requirements (minimum balance, correct details)"
        ]},
        "Teachers will receive:",
        { list: [
          "Earnings for course sales",
          "Earnings from live classes",
          "Earnings from tutoring sessions",
          "Earnings from assignment/marking services (if enabled)"
        ]},
        "Payouts may be delayed if:",
        { list: [
          "Fraud or suspicious activity is detected",
          "Content violates platform policies",
          "Payment methods are invalid"
        ]}
      ]
    },
    {
      id: 6,
      title: "Live Classes & Student Safety",
      content: [
        "When hosting live classes, teachers agree to:",
        { list: [
          "Maintain a professional environment",
          "Respect all students regardless of age, gender, religion, or background",
          "Not ask students for personal contact information outside EduFiliova",
          "Not engage in private or inappropriate communication",
          "Not collect payments outside the platform"
        ]},
        "EduFiliova may monitor or audit live classes for safety reasons."
      ]
    },
    {
      id: 7,
      title: "Messaging & Communication",
      content: [
        "Teachers may communicate with:",
        { list: [
          "Students enrolled in their courses",
          "Admin support",
          "School administrators (if applicable)"
        ]},
        "Teachers must not:",
        { list: [
          "Share personal WhatsApp numbers",
          "Request direct payments",
          "Send abusive, harmful, or unprofessional messages",
          "Ask students for personal details"
        ]},
        "All communication must remain inside the platform."
      ]
    },
    {
      id: 8,
      title: "Prohibited Activities",
      content: [
        "Teachers must not:",
        { list: [
          "Upload stolen content (copyright violations)",
          "Sell fake certificates or academic credentials",
          "Ask students for money outside EduFiliova",
          "Misrepresent qualifications",
          "Manipulate reviews",
          "Promote external websites or competitors",
          "Upload harmful or explicit content",
          "Use AI to create unsafe or false educational material"
        ]},
        "Violations may result in account termination or legal action."
      ]
    },
    {
      id: 9,
      title: "Quality Standards",
      content: [
        "To maintain quality, teachers must:",
        { list: [
          "Provide clear audio/video for recorded lessons",
          "Keep courses accurate and updated",
          "Deliver correct information based on the curriculum",
          "Use original examples and explanations",
          "Provide fair grading and helpful feedback"
        ]},
        "EduFiliova may remove content that does not meet standards."
      ]
    },
    {
      id: 10,
      title: "Certificates & Assessments",
      content: [
        "Certificates issued to students under your course must reflect:",
        { list: [
          "True completion",
          "Accurate performance",
          "Valid assessments created by you"
        ]},
        "Teachers must not:",
        { list: [
          "Issue certificates outside the EduFiliova system",
          "Fake completion records",
          "Modify certificates manually"
        ]}
      ]
    },
    {
      id: 11,
      title: "Removal or Suspension",
      content: [
        "EduFiliova reserves the right to:",
        { list: [
          "Suspend teacher accounts",
          "Remove courses",
          "Freeze payouts",
          "Reject new course submissions"
        ]},
        "Reasons include:",
        { list: [
          "Policy violations",
          "Misconduct",
          "Fraud",
          "Low-quality or harmful content",
          "Academic dishonesty",
          "Safety risks to students"
        ]},
        "Serious violations may lead to permanent removal without refund."
      ]
    },
    {
      id: 12,
      title: "Account Termination",
      content: [
        "Teachers may request to close their account anytime, unless:",
        { list: [
          "Students are currently enrolled",
          "Payments or disputes are pending"
        ]},
        "EduFiliova may permanently terminate accounts for major violations."
      ]
    },
    {
      id: 13,
      title: "Changes to Terms",
      content: [
        "EduFiliova may update these Terms at any time.",
        "Teachers will be notified of major changes."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="teacher-terms" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Teacher Terms of Use
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              These Teacher Terms of Use govern your participation as a teacher on the EduFiliova platform. By applying as a teacher, creating courses, offering lessons, or using any part of the teacher dashboard, you agree to these Terms.
            </p>
            <div className="mt-4 md:mt-6 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Last updated:</span> 2025
            </div>
          </div>

          <div className="bg-primary/10 border-l-4 border-primary p-4 md:p-6 rounded-lg mb-6 md:mb-8 animate-fade-in">
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">
                  Important Notice
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  If you do not agree, do not apply or use the teaching features.
                </p>
              </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {sections.map((section, index) => (
              <div 
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`section-${section.id}`}
              >
                <div className="p-5 md:p-8">
                  <div className="mb-4 md:mb-6">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {section.id}. {section.title}
                      </h2>
                    </div>

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

          <div className="mt-8 md:mt-12 bg-primary rounded-xl p-6 md:p-8 text-primary-foreground shadow-xl animate-fade-in">
            <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-2">Contact & Support</h2>
                <p className="text-primary-foreground/90 text-sm md:text-base">For questions or support:</p>
              </div>
            <div className="pl-0 md:pl-16 space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Email:</span>
                <a 
                  href="mailto:support@edufiliova.com" 
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors transition-all duration-300"
                  data-testid="link-teacher-support-email"
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
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors transition-all duration-300"
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

export default TeacherTermsPage;
