import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void;
}

const PrivacyPolicyPage = ({ onNavigate }: PrivacyPolicyPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Information We Collect",
      content: [
        "We collect information to provide safe learning experiences, improve our services, and comply with legal requirements.",
        "A. Information You Provide:",
        { list: [
          "Full name",
          "Email address",
          "Phone number (including WhatsApp number)",
          "Password (encrypted)",
          "Country and timezone",
          "Grade level / education system",
          "School/institution details (if applicable)",
          "Uploaded documents (ID, certificates, academic files)",
          "Portfolio samples (freelancers & teachers)"
        ]},
        "B. Automatically Collected Information:",
        { list: [
          "Device type, operating system",
          "IP address & approximate location",
          "Browser and usage data",
          "Login timestamps",
          "Session activity",
          "Clickstream & behavior analytics"
        ]},
        "C. Payment Information:",
        "Handled exclusively by secure third-party payment processors. We never store full credit card numbers.",
        "D. WhatsApp Communication Data:",
        "If you opt-in, we collect: WhatsApp phone number, Messages received and sent through EduFiliova bots, Delivery reports, OTP verification, and Homework and learning activity logs. We do not access your personal WhatsApp contacts or media."
      ]
    },
    {
      id: 2,
      title: "How We Use Your Information",
      content: [
        "A. Provide Core Services:",
        { list: [
          "Create and manage your EduFiliova account",
          "Deliver lessons, quizzes, and course content",
          "Enable live classes and messaging",
          "Verify identity and qualifications",
          "Issue certificates"
        ]},
        "B. Learning & Platform Features:",
        { list: [
          "Track progress and performance",
          "Provide personalized recommendations",
          "Send homework, reminders, and updates",
          "Manage subscriptions and payments"
        ]},
        "C. Safety & Compliance:",
        { list: [
          "Detect fraud, abuse, or violations",
          "Protect students and minors",
          "Maintain platform security",
          "Comply with global privacy laws"
        ]},
        "D. Communication:",
        { list: [
          "Send important notifications",
          "Provide customer support",
          "Send WhatsApp learning messages (opt-in)",
          "Notify teachers & freelancers about earnings or approvals",
          "Send verification codes (SMS & WhatsApp)"
        ]},
        "You may opt out of optional communications at any time."
      ]
    },
    {
      id: 3,
      title: "Sharing of Information",
      content: [
        "We do not sell your personal information.",
        "We only share data with:",
        "A. Service Providers (Strictly for Platform Use):",
        { list: [
          "Cloud storage providers",
          "Payment processors",
          "Messaging service providers (SMS/WhatsApp)",
          "Email service providers",
          "Analytics tools"
        ]},
        "B. Teachers & Institutions:",
        "Students' names and progress may be visible to: Teachers teaching their course, Institution administrators, and Course creators (in analytics only).",
        "C. Legal Requirements:",
        "We may disclose your information when legally required to: Comply with court orders, Investigate fraud, Protect minors, or Prevent harm or illegal activity."
      ]
    },
    {
      id: 4,
      title: "Student Privacy",
      content: [
        "EduFiliova follows international student safety standards including:",
        { list: [
          "COPPA (US) – Protecting children under 13",
          "GDPR-K (EU) – Parental consent for minors",
          "Local child protection laws"
        ]},
        "Students under required age must have:",
        { list: [
          "Parent/guardian permission",
          "School administrative authorization"
        ]},
        "We do NOT:",
        { list: [
          "Display ads targeted to children",
          "Track behavior for advertising",
          "Allow teacher-student private contact outside the platform"
        ]}
      ]
    },
    {
      id: 5,
      title: "Cookies & Tracking Technologies",
      content: [
        "We use:",
        { list: [
          "Essential cookies",
          "Security cookies",
          "Performance analytics",
          "LocalStorage for user sessions",
          "Anonymous visitor tracking",
          "Device fingerprinting (for fraud prevention)"
        ]},
        "You can manage cookie preferences anytime."
      ]
    },
    {
      id: 6,
      title: "Data Security",
      content: [
        "We use advanced security measures:",
        { list: [
          "HTTPS/TLS encryption",
          "Bcrypt password hashing",
          "JWT secure sessions",
          "Row-level database security",
          "Regular backups",
          "Access control & monitoring"
        ]},
        "We take reasonable steps to protect your data but cannot guarantee 100% security."
      ]
    },
    {
      id: 7,
      title: "Data Retention",
      content: [
        "We retain your information:",
        { list: [
          "As long as your account is active",
          "As required by law",
          "As needed to resolve disputes",
          "Or until you request deletion"
        ]},
        "Deleted accounts may retain minimal data for fraud prevention."
      ]
    },
    {
      id: 8,
      title: "Your Rights",
      content: [
        "Depending on your region (EU, UK, South Africa, US, etc.), you have the right to:",
        { list: [
          "Access your data",
          "Correct inaccurate information",
          "Delete your account",
          "Request a copy of your data",
          "Withdraw consent (WhatsApp/SMS/Emails)",
          "Restrict processing",
          "Opt out of marketing messages"
        ]},
        "Requests can be made via: privacy@edufiliova.com"
      ]
    },
    {
      id: 9,
      title: "Account Deletion",
      content: [
        "When you delete your account:",
        { list: [
          "Personal data is removed or anonymized",
          "Certificates and progress cannot be recovered",
          "Marketplace purchases remain with customers",
          "Teacher/freelancer earnings pending may be delayed"
        ]},
        "Some data must remain for legal or safety reasons."
      ]
    },
    {
      id: 10,
      title: "International Data Transfers",
      content: [
        "Because EduFiliova operates globally, your data may be processed in:",
        { list: [
          "The United States",
          "The European Union",
          "Africa",
          "Asia",
          "Other regions supported by our service providers"
        ]},
        "We ensure legal protection through:",
        { list: [
          "Standard Contractual Clauses (SCCs)",
          "Encryption and secure transfer protocols"
        ]}
      ]
    },
    {
      id: 11,
      title: "Updates to This Policy",
      content: [
        "EduFiliova may update this Privacy Policy at any time.",
        "We will notify users of significant changes by email or in-app notice."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="privacy-policy" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Privacy Policy
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              EduFiliova is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use our website, mobile apps, marketplace, and communication services such as WhatsApp.
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
                  By accessing or using EduFiliova, you agree to this Privacy Policy.
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
                <h2 className="text-xl md:text-2xl font-bold mb-2">Contact Information</h2>
                <p className="text-primary-foreground/90 text-sm md:text-base">For privacy and data protection inquiries:</p>
              </div>
            <div className="pl-0 md:pl-16 space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Email:</span>
                <a 
                  href="mailto:privacy@edufiliova.com" 
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors transition-all duration-300"
                  data-testid="link-privacy-email"
                >
                  privacy@edufiliova.com
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

export default PrivacyPolicyPage;
