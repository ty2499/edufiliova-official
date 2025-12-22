import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface RefundPolicyPageProps {
  onNavigate: (page: string) => void;
}

const RefundPolicyPage = ({ onNavigate }: RefundPolicyPageProps) => {
  const sections = [
    {
      id: 1,
      title: "General Refund Principles",
      content: [
        "Because EduFiliova provides digital content, instant access, and downloadable products, refunds are handled carefully to protect both customers and creators.",
        "EduFiliova reserves the right to approve or reject refunds based on these rules to prevent misuse, fraud, or digital piracy."
      ]
    },
    {
      id: 2,
      title: "Subscription Refunds (Elementary, High School, University Plans)",
      content: [
        "EduFiliova subscriptions include full access to digital lessons, homework, quizzes, live classes, and certificates.",
        "Subscriptions are generally non-refundable because:",
        { list: [
          "Access to all digital content is granted immediately after purchase",
          "Lessons, videos, documents, and downloads cannot be returned"
        ]},
        "However, a refund may be granted if:",
        { list: [
          "You were charged twice for the same plan",
          "You were unable to access your plan due to a technical issue caused by EduFiliova",
          "A payment was made without your authorization (with proof)",
          "There was an error in the billing system"
        ]},
        "Refunds must be requested within 7 days of purchase.",
        "Refunds are not provided if:",
        { list: [
          "You changed your mind",
          "You no longer want the subscription",
          "You completed the lessons or downloaded content",
          "You subscribed by mistake but still accessed content"
        ]}
      ]
    },
    {
      id: 3,
      title: "Course Purchases (One-Time Courses)",
      content: [
        "One-time course purchases are non-refundable after any of the following:",
        { list: [
          "A lesson has been accessed",
          "A file has been downloaded",
          "Notes, worksheets, or videos have been viewed",
          "A certificate has been generated"
        ]},
        "Refunds may be granted only if:",
        { list: [
          "The course content is broken or incomplete",
          "The course does not match the description",
          "The wrong course was delivered due to a system error"
        ]},
        "Refund requests must be made within 7 days of purchase."
      ]
    },
    {
      id: 4,
      title: "Digital Products (Shop Downloads: Designs, Code, Notes, etc.)",
      content: [
        "Refunds for digital products (e.g., templates, mockups, code, documents) are not available once:",
        { list: [
          "The product has been downloaded",
          "The product file has been opened",
          "Access to the content has been provided"
        ]},
        "Because digital goods cannot be \"returned,\" all sales are final unless:",
        { list: [
          "The product is corrupted or missing files",
          "The product does not match its description",
          "The file cannot be opened due to creator error"
        ]},
        "EduFiliova or the freelancer may request proof (screenshot or video).",
        "Refund requests must be made within 3 days of purchase."
      ]
    },
    {
      id: 5,
      title: "Freelance Services (Custom Work)",
      content: [
        "For custom services offered by freelancers:",
        { list: [
          "Refunds for completed work are not allowed"
        ]},
        "Refunds may be provided if:",
        { list: [
          "The freelancer failed to deliver",
          "The delivered work does not match the agreed description",
          "Work was not started"
        ]},
        "EduFiliova may freeze earnings until the dispute is resolved."
      ]
    },
    {
      id: 6,
      title: "Live Classes & Tutoring Sessions",
      content: [
        "Refunds for live classes may be considered only if:",
        { list: [
          "The teacher did not join the session",
          "Serious technical failure prevented the class from happening",
          "The wrong class link was provided by the teacher/admin"
        ]},
        "Refunds are not available if:",
        { list: [
          "You missed the session",
          "You joined late",
          "You changed your mind"
        ]}
      ]
    },
    {
      id: 7,
      title: "Institutional / School Plans",
      content: [
        "School or institution subscriptions are non-refundable, except when:",
        { list: [
          "Overbilling occurred",
          "Duplicate payments were processed",
          "Access was not provided due to EduFiliova's system issues"
        ]},
        "Requests must be made within 14 days of billing."
      ]
    },
    {
      id: 8,
      title: "Refund Review Process",
      content: [
        "To request a refund:",
        { list: [
          "Contact EduFiliova Support: support@edufiliova.com",
          "Provide: Full name, Email address, Order ID, Reason for refund, Any proof (screenshots, error messages)"
        ]},
        "EduFiliova will:",
        { list: [
          "Respond within 3–7 business days",
          "Investigate with the teacher or freelancer",
          "Approve or decline the request according to this policy"
        ]},
        "Approved refunds will be issued back to the original payment method."
      ]
    },
    {
      id: 9,
      title: "Fraud & Abuse Prevention",
      content: [
        "We reserve the right to deny refunds to users who:",
        { list: [
          "Repeatedly request refunds",
          "Download content then request refunds",
          "Attempt chargebacks without contacting support",
          "Abuse the system or violate our Terms of Use"
        ]},
        "Fraudulent behavior may lead to account suspension."
      ]
    },
    {
      id: 10,
      title: "Changes to Refund Policy",
      content: [
        "EduFiliova may update this Refund Policy at any time.",
        "Continued use of the platform means acceptance of any updates."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="refund-policy" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Refund Policy
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              This Refund Policy describes how refunds are handled for subscriptions, courses, digital products, and services purchased on EduFiliova. By using EduFiliova, you agree to this policy.
            </p>
            <div className="mt-4 md:mt-6 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Last updated:</span> 2025
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {sections.map((section, index) => (
              <div 
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in"
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
                <p className="text-primary-foreground/90 text-sm md:text-base">For refund requests or questions:</p>
              </div>
            <div className="pl-0 md:pl-16 space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Email:</span>
                <a 
                  href="mailto:support@edufiliova.com" 
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors"
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
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors"
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

export default RefundPolicyPage;
