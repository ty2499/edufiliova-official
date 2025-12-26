import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CommunityGuidelinesPageProps {
  onNavigate: (page: string) => void;
}

const CommunityGuidelinesPage = ({ onNavigate }: CommunityGuidelinesPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Our Community Values",
      content: [
        "EduFiliova is a safe, inclusive, and respectful learning community for students, teachers, freelancers, schools, and institutions worldwide.",
        "We are committed to:",
        { list: [
          "Providing a safe learning environment",
          "Fostering respect and kindness",
          "Encouraging collaboration and growth",
          "Protecting students, especially minors",
          "Promoting academic integrity"
        ]},
        "By using EduFiliova, you agree to uphold these values and follow these Community Guidelines."
      ]
    },
    {
      id: 2,
      title: "Respectful Behavior",
      content: [
        "All users must treat others with respect and kindness.",
        "DO:",
        { list: [
          "Be polite and professional in all communications",
          "Respect diverse backgrounds, cultures, and beliefs",
          "Provide constructive feedback",
          "Support and encourage fellow learners",
          "Use appropriate language"
        ]},
        "DO NOT:",
        { list: [
          "Bully, harass, or intimidate others",
          "Use offensive, abusive, or discriminatory language",
          "Make threats or promote violence",
          "Engage in hate speech or discrimination",
          "Post sexually explicit or inappropriate content",
          "Spam or troll other users"
        ]}
      ]
    },
    {
      id: 3,
      title: "Safe Communication",
      content: [
        "EduFiliova provides messaging and communication features for educational purposes only.",
        "Rules for messaging:",
        { list: [
          "Keep conversations educational and professional",
          "Do not share personal contact information (e.g., phone numbers, social media, home addresses) in public or with students",
          "Do not request private contact outside the platform",
          "Do not send inappropriate, sexual, or suggestive messages",
          "Report suspicious or inappropriate behavior immediately"
        ]},
        "Teacher-Student Communication:",
        { list: [
          "Teachers must communicate with students only through the EduFiliova platform",
          "Private meetings or contact outside EduFiliova are strictly prohibited",
          "All conversations must be professional and appropriate"
        ]},
        "Violating these rules may result in immediate account suspension and reporting to authorities."
      ]
    },
    {
      id: 4,
      title: "Protecting Minors",
      content: [
        "EduFiliova has zero tolerance for any behavior that endangers or exploits minors (users under 18).",
        "Prohibited activities:",
        { list: [
          "Grooming, soliciting, or exploiting minors",
          "Sharing or requesting inappropriate images or content involving minors",
          "Attempting to meet minors in person without parental/school consent",
          "Asking minors for personal information or private contact",
          "Any form of sexual or predatory behavior toward minors"
        ]},
        "Parents and guardians:",
        { list: [
          "Monitor your child's activity on EduFiliova",
          "Report any suspicious behavior immediately",
          "Review our Privacy Policy and Student Terms of Use"
        ]},
        "Any violation of child safety policies will result in immediate termination and reporting to law enforcement."
      ]
    },
    {
      id: 5,
      title: "Academic Integrity",
      content: [
        "EduFiliova promotes honest learning and academic integrity.",
        "Students must:",
        { list: [
          "Complete assignments and quizzes honestly",
          "Not plagiarize or copy others' work",
          "Not share quiz answers or cheat on assessments",
          "Submit original work unless otherwise instructed",
          "Give credit when using external sources"
        ]},
        "Teachers and freelancers must:",
        { list: [
          "Create original course content or use licensed materials",
          "Not plagiarize from other creators",
          "Give proper attribution for external resources",
          "Ensure fair grading and assessment"
        ]},
        "Violations may result in grade penalties, course removal, or account suspension."
      ]
    },
    {
      id: 6,
      title: "Prohibited Content",
      content: [
        "The following content is strictly prohibited on EduFiliova:",
        { list: [
          "Hate speech, racism, sexism, or discrimination",
          "Sexually explicit or pornographic content",
          "Violence, gore, or graphic imagery",
          "Illegal activities or promotion of illegal behavior",
          "Copyrighted material without permission",
          "Pirated textbooks, software, or content",
          "Spam, scams, or fraudulent content",
          "Misinformation or harmful medical/safety advice",
          "Personal attacks or doxxing (sharing private information)",
          "Content that violates local, national, or international laws"
        ]},
        "Uploading prohibited content may result in immediate content removal and account termination."
      ]
    },
    {
      id: 7,
      title: "Reporting Violations",
      content: [
        "If you encounter content or behavior that violates these guidelines, report it immediately.",
        "How to report:",
        { list: [
          "Email: support@edufiliova.com with subject line 'Community Guidelines Violation'",
          "Include: Description of the violation, username or content link, and why it violates our guidelines"
        ]},
        "What happens after you report:",
        { list: [
          "Our team reviews reports within 24-48 hours",
          "We investigate and take appropriate action",
          "Serious violations are reported to law enforcement if necessary",
          "Your report is kept confidential"
        ]},
        "False or malicious reports may result in penalties."
      ]
    },
    {
      id: 8,
      title: "Consequences of Violations",
      content: [
        "Violating these Community Guidelines may result in:",
        "Minor violations:",
        { list: [
          "Warning and content removal",
          "Temporary messaging restrictions",
          "Course content review or removal"
        ]},
        "Moderate violations:",
        { list: [
          "Account suspension (7-30 days)",
          "Loss of earnings or payout holds (for teachers/freelancers)",
          "Removal from courses or platform features"
        ]},
        "Severe violations:",
        { list: [
          "Permanent account termination",
          "IP ban from the platform",
          "Legal action or reporting to authorities",
          "Forfeiture of payments or refunds"
        ]},
        "EduFiliova reserves the right to enforce these guidelines at its discretion."
      ]
    },
    {
      id: 9,
      title: "Teachers & Freelancers: Additional Responsibilities",
      content: [
        "Teachers and freelancers have additional responsibilities as educators on EduFiliova:",
        { list: [
          "Maintain professionalism at all times",
          "Provide accurate and high-quality educational content",
          "Respond to student inquiries in a timely and respectful manner",
          "Do not engage in inappropriate relationships with students",
          "Do not request payments outside the platform",
          "Do not share student data or progress without authorization",
          "Comply with all applicable educational and child protection laws"
        ]},
        "Failure to uphold these responsibilities may result in removal from the platform and loss of earnings."
      ]
    },
    {
      id: 10,
      title: "Changes to These Guidelines",
      content: [
        "EduFiliova may update these Community Guidelines from time to time to reflect:",
        { list: [
          "Changes in community needs",
          "Legal or regulatory requirements",
          "Platform improvements"
        ]},
        "Significant changes will be communicated via:",
        { list: [
          "Email notification",
          "In-app notification",
          "Update on this page with a new 'Last Updated' date"
        ]},
        "Your continued use of EduFiliova after updates constitutes acceptance of the revised guidelines."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="community-guidelines" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Community Guidelines
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Learn about our community values, expected behavior, and how to create a safe and respectful learning environment for everyone.
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
                  All users must follow these Community Guidelines. Violations may result in content removal, account suspension, or termination.
                </p>
              </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {sections.map((section, index) => (
              <div 
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in" transition-all duration-300
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
                <h2 className="text-xl md:text-2xl font-bold mb-2">Contact</h2>
                <p className="text-primary-foreground/90 text-sm md:text-base">To report violations or ask questions:</p>
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

export default CommunityGuidelinesPage;
