import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface DataRetentionPolicyPageProps {
  onNavigate: (page: string) => void;
}

const DataRetentionPolicyPage = ({ onNavigate }: DataRetentionPolicyPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Introduction",
      content: [
        "This Data Retention Policy explains how long EduFiliova retains your personal information, why we keep it, and how you can request deletion.",
        "We retain data only as long as necessary to:",
        { list: [
          "Provide our learning services",
          "Comply with legal obligations",
          "Resolve disputes",
          "Enforce our agreements",
          "Support business operations"
        ]},
        "This policy applies to all users: students, teachers, freelancers, schools, and institutions."
      ]
    },
    {
      id: 2,
      title: "Types of Data We Retain",
      content: [
        "EduFiliova retains various types of data for different periods:",
        "A. Account & Profile Information:",
        { list: [
          "Name, email, phone number",
          "Password (hashed and encrypted)",
          "Profile photo and bio",
          "Educational details (grade, school, subjects)",
          "Teacher/freelancer qualifications and portfolios"
        ]},
        "B. Learning & Progress Data:",
        { list: [
          "Course enrollments and completions",
          "Quiz scores and assignment submissions",
          "Certificates earned",
          "Learning analytics and activity logs",
          "Homework and study material"
        ]},
        "C. Communication Data:",
        { list: [
          "Messages sent through the platform",
          "WhatsApp messages (opt-in)",
          "Email communications",
          "Support tickets and chat logs"
        ]},
        "D. Payment & Transaction Data:",
        { list: [
          "Purchase history",
          "Subscription records",
          "Payment receipts",
          "Refund requests",
          "Teacher/freelancer earnings and payouts"
        ]},
        "E. Technical & Usage Data:",
        { list: [
          "Device information",
          "IP addresses and location data",
          "Session logs",
          "Error reports",
          "Analytics and cookies"
        ]}
      ]
    },
    {
      id: 3,
      title: "Retention Periods",
      content: [
        "We retain different types of data for varying periods based on legal, operational, and user needs:",
        "A. Active Account Data:",
        "Retained indefinitely while your account is active.",
        { list: [
          "Profile and account information",
          "Learning progress and certificates",
          "Enrolled courses and materials"
        ]},
        "B. Inactive Account Data:",
        "If you do not log in for 3 years, your account may be marked inactive. After 5 years of inactivity, we may delete non-essential data unless legally required to retain it.",
        "C. Deleted Account Data:",
        "After account deletion:",
        { list: [
          "Personal identifiers removed within 30 days",
          "Learning data anonymized or deleted within 90 days",
          "Payment records retained for 7 years (legal requirement)",
          "Dispute-related data retained until resolution + 1 year"
        ]},
        "D. Payment & Financial Data:",
        "Retained for 7 years from the transaction date to comply with tax and accounting laws.",
        "E. Communication Data:",
        { list: [
          "Platform messages: Deleted 90 days after account deletion",
          "WhatsApp messages: Deleted 30 days after opt-out or account deletion",
          "Support tickets: Retained for 2 years for quality assurance"
        ]},
        "F. Legal & Safety Data:",
        "Data related to legal investigations, disputes, or safety incidents may be retained longer as required by law or to protect rights and safety."
      ]
    },
    {
      id: 4,
      title: "Data Deletion & Anonymization",
      content: [
        "When data is no longer needed, we either delete it or anonymize it.",
        "Deletion:",
        "Personal identifiers (name, email, phone) are permanently removed from our systems.",
        "Anonymization:",
        "Learning data (e.g., quiz performance, course analytics) may be anonymized and aggregated for:",
        { list: [
          "Platform improvement",
          "Educational research",
          "Statistical reporting"
        ]},
        "Anonymized data cannot be traced back to you."
      ]
    },
    {
      id: 5,
      title: "Legal & Compliance Requirements",
      content: [
        "EduFiliova must retain certain data to comply with laws, including:",
        { list: [
          "Tax laws (7 years for financial records)",
          "Accounting regulations",
          "Consumer protection laws",
          "Child safety regulations (COPPA, GDPR-K)",
          "Anti-fraud and anti-money laundering laws",
          "Data breach notification requirements"
        ]},
        "If we receive a legal request (e.g., subpoena, court order), we may retain data beyond standard periods until the matter is resolved."
      ]
    },
    {
      id: 6,
      title: "Your Rights & Data Requests",
      content: [
        "You have the right to:",
        "A. Request Data Deletion:",
        "You can request deletion of your personal data by:",
        { list: [
          "Deleting your account in account settings",
          "Emailing privacy@edufiliova.com or support@edufiliova.com"
        ]},
        "Note: Some data may be retained for legal or operational reasons (see Retention Periods).",
        "B. Access Your Data:",
        "Request a copy of your data by emailing privacy@edufiliova.com. We will provide it within 30 days.",
        "C. Correct Inaccurate Data:",
        "Update your profile information in account settings or contact support.",
        "D. Opt-Out of Data Collection:",
        { list: [
          "Disable cookies in your browser",
          "Opt-out of WhatsApp messaging",
          "Unsubscribe from marketing emails"
        ]},
        "To exercise these rights, contact us at:",
        { list: [
          "Email: privacy@edufiliova.com",
          "Support: support@edufiliova.com"
        ]}
      ]
    },
    {
      id: 7,
      title: "Exceptions to Deletion",
      content: [
        "We may not delete your data if:",
        { list: [
          "Required by law (e.g., tax records, legal hold)",
          "Needed to complete a transaction or service",
          "Necessary to detect fraud or abuse",
          "Required to enforce our Terms of Use",
          "Involved in an ongoing legal dispute",
          "Needed to protect the safety of users or the public"
        ]},
        "If deletion is not possible, we will anonymize your data where legally permitted."
      ]
    },
    {
      id: 8,
      title: "Changes to This Policy",
      content: [
        "EduFiliova may update this Data Retention Policy from time to time to reflect:",
        { list: [
          "Changes in legal requirements",
          "Updates to our services",
          "Improvements in data practices"
        ]},
        "Significant changes will be communicated via:",
        { list: [
          "Email notification",
          "In-app notification",
          "Update on this page with a new 'Last Updated' date"
        ]},
        "Your continued use of EduFiliova after updates constitutes acceptance of the revised policy."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="data-retention" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Data Retention Policy
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Learn how long we keep your data, why we retain it, and how you can request deletion.
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
                  EduFiliova retains data only as necessary to provide services and comply with legal requirements. You can request data deletion at any time.
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
                <p className="text-primary-foreground/90 text-sm md:text-base">For data retention questions:</p>
              </div>
            <div className="pl-0 md:pl-16 space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Email:</span>
                <a 
                  href="mailto:privacy@edufiliova.com" 
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors" transition-all duration-300
                  data-testid="link-privacy-email"
                >
                  privacy@edufiliova.com
                </a>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Support:</span>
                <a 
                  href="mailto:support@edufiliova.com" 
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors" transition-all duration-300
                  data-testid="link-support-email"
                >
                  support@edufiliova.com
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

export default DataRetentionPolicyPage;
