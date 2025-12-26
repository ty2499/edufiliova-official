import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CookiesPolicyPageProps {
  onNavigate: (page: string) => void;
}

const CookiesPolicyPage = ({ onNavigate }: CookiesPolicyPageProps) => {
  const sections = [
    {
      id: 1,
      title: "What Are Cookies?",
      content: [
        "Cookies are small text files stored on your device when you visit a website or use an app.",
        "They help us:",
        { list: [
          "Recognize your device",
          "Improve your experience",
          "Keep you logged in",
          "Analyze platform usage",
          "Secure your account"
        ]},
        "Cookies do not give us access to your device or personal files."
      ]
    },
    {
      id: 2,
      title: "Types of Cookies We Use",
      content: [
        "EduFiliova uses several categories of cookies to ensure smooth platform operation.",
        "A. Essential Cookies (Strictly Necessary):",
        "These cookies are required for the website and apps to function properly.",
        "They help with:",
        { list: [
          "Login & authentication",
          "Session management",
          "Security & fraud prevention",
          "User preference storage",
          "Payment flow",
          "Server load balancing"
        ]},
        "You cannot disable these cookies."
      ]
    },
    {
      id: 3,
      title: "Functional Cookies",
      content: [
        "These cookies make your experience smoother.",
        "They help:",
        { list: [
          "Save your theme (dark/light mode)",
          "Save grade level and country preferences",
          "Remember language settings",
          "Store dashboard layout preferences"
        ]}
      ]
    },
    {
      id: 4,
      title: "Performance & Analytics Cookies",
      content: [
        "These cookies help us understand how users interact with EduFiliova.",
        "We use them to:",
        { list: [
          "Measure page performance",
          "Track errors & crashes",
          "Improve content and design",
          "Identify popular modules and lessons"
        ]},
        "We use analytics and performance monitoring tools to improve our platform.",
        "All analytics are anonymous and never identify individual users."
      ]
    },
    {
      id: 5,
      title: "Marketing & Communication Cookies (Optional)",
      content: [
        "Only used if you consent.",
        "These help with:",
        { list: [
          "Email tracking (opens/clicks)",
          "WhatsApp & SMS opt-in logs",
          "Promotional banners",
          "Campaign performance"
        ]},
        "EduFiliova does not show third-party ads and does not use advertising cookies that target children."
      ]
    },
    {
      id: 6,
      title: "LocalStorage & SessionStorage",
      content: [
        "Our platform uses browser storage to:",
        { list: [
          "Keep you logged into your account",
          "Store cart items in the shop",
          "Save quiz progress",
          "Store offline learning data",
          "Remember app settings"
        ]},
        "This storage stays on your device and is not transferred to our servers unless needed for learning features."
      ]
    },
    {
      id: 7,
      title: "Third-Party Services That Use Cookies",
      content: [
        "EduFiliova uses secure and reputable third-party providers that may place cookies or similar technologies:",
        { list: [
          "Cloud storage providers (images & files)",
          "Payment processors",
          "Email service providers",
          "Messaging service providers (WhatsApp & SMS)",
          "Security and content delivery networks",
          "Analytics tools"
        ]},
        "These services follow their own privacy and cookie policies."
      ]
    },
    {
      id: 8,
      title: "Why We Use Cookies",
      content: [
        "We use cookies to:",
        { list: [
          "Provide secure login",
          "Protect your data",
          "Improve the learning experience",
          "Personalize content",
          "Support school and teacher dashboards",
          "Track progress, activity, and subscription use",
          "Deliver faster loading and performance",
          "Analyze platform usage for improvements"
        ]},
        "Cookies help us maintain a high-quality learning platform."
      ]
    },
    {
      id: 9,
      title: "How to Manage Cookies",
      content: [
        "You can choose to:",
        { list: [
          "Accept all cookies",
          "Reject optional cookies",
          "Manage cookie preferences",
          "Clear browser cookies anytime",
          "Use the platform with essential cookies only"
        ]},
        "Managing cookies may affect functionality such as:",
        { list: [
          "Staying logged in",
          "Saving dashboard settings",
          "Quick loading of lessons",
          "Personalized recommendations"
        ]}
      ]
    },
    {
      id: 10,
      title: "Disabling Cookies",
      content: [
        "Most browsers allow you to disable or delete cookies:",
        { list: [
          "Chrome: Settings → Privacy → Cookies",
          "Safari: Preferences → Privacy",
          "Firefox: Options → Privacy",
          "Edge: Settings → Cookies & site permissions",
          "Mobile browsers have similar settings"
        ]},
        "You may still use EduFiliova, but some features may not work correctly."
      ]
    },
    {
      id: 11,
      title: "Cookies for Students & Minors",
      content: [
        "EduFiliova is committed to child safety.",
        "We do not:",
        { list: [
          "Track behavior for advertising",
          "Use third-party advertising cookies",
          "Sell data from minors",
          "Share personal data for marketing"
        ]},
        "Only essential, functional, and learning-related cookies are used for minors."
      ]
    },
    {
      id: 12,
      title: "Updates to This Policy",
      content: [
        "We may update this Cookies Policy at any time.",
        "Continued use of EduFiliova means you accept the updated policy."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="cookies-policy" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Cookies Policy
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              This Cookies Policy explains how EduFiliova uses cookies and similar technologies on our website, mobile apps, API services, and learning platform. By using EduFiliova, you agree to the use of cookies as described in this policy.
            </p>
            <div className="mt-4 md:mt-6 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Last updated:</span> 2025
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
              <h2 className="text-xl md:text-2xl font-bold mb-2">Contact Us</h2>
              <p className="text-primary-foreground/90 text-sm md:text-base">If you have questions about cookies or privacy:</p>
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

export default CookiesPolicyPage;
