import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface WhatsAppPolicyPageProps {
  onNavigate: (page: string) => void;
}

const WhatsAppPolicyPage = ({ onNavigate }: WhatsAppPolicyPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Introduction",
      content: [
        "EduFiliova uses WhatsApp messaging to provide learning services, account updates, and support.",
        "This policy explains:",
        { list: [
          "What messages you'll receive",
          "How to opt-in and opt-out",
          "Your rights regarding WhatsApp communications",
          "How we handle your WhatsApp data"
        ]},
        "By providing your WhatsApp phone number and opting in, you consent to receive messages from EduFiliova."
      ]
    },
    {
      id: 2,
      title: "Opt-In Consent",
      content: [
        "You must actively opt-in to receive WhatsApp messages from EduFiliova.",
        "Opt-in methods:",
        { list: [
          "Checking the WhatsApp opt-in box during registration",
          "Enabling WhatsApp messaging in your account settings",
          "Replying 'YES' or 'START' to our initial WhatsApp message",
          "Requesting WhatsApp notifications through customer support"
        ]},
        "By opting in, you confirm that:",
        { list: [
          "The phone number belongs to you",
          "You have access to this WhatsApp account",
          "You consent to receive educational and service-related messages",
          "You are at least 13 years old, or have parental/guardian consent"
        ]}
      ]
    },
    {
      id: 3,
      title: "Types of Messages You May Receive",
      content: [
        "If you opt-in, EduFiliova may send you:",
        "A. Educational Messages:",
        { list: [
          "Homework reminders",
          "Learning updates and tips",
          "Course announcements",
          "Quiz and assignment notifications",
          "Study material links"
        ]},
        "B. Account & Service Messages:",
        { list: [
          "Registration confirmations",
          "Password resets and OTP verification",
          "Payment receipts",
          "Subscription renewals",
          "Certificate delivery"
        ]},
        "C. Support Messages:",
        { list: [
          "Responses to your support inquiries",
          "Platform updates",
          "Safety and policy notifications"
        ]},
        "D. Optional Messages (You Can Disable Anytime):",
        { list: [
          "Teacher availability updates",
          "Platform feature announcements",
          "Learning tips and motivation",
          "Special offers or promotions (if applicable)"
        ]}
      ]
    },
    {
      id: 4,
      title: "How to Opt-Out",
      content: [
        "You can stop receiving WhatsApp messages at any time by:",
        { list: [
          "Replying 'STOP' or 'UNSUBSCRIBE' to any WhatsApp message from EduFiliova",
          "Disabling WhatsApp messaging in your account settings",
          "Contacting support@edufiliova.com and requesting opt-out",
          "Deleting your account (this stops all communications)"
        ]},
        "After opting out:",
        { list: [
          "You will no longer receive educational or promotional WhatsApp messages",
          "Critical account security messages (e.g., password resets) may still be sent",
          "You can re-enable WhatsApp messaging anytime in your account settings"
        ]},
        "Note: Opting out of WhatsApp does not cancel your subscription or delete your account."
      ]
    },
    {
      id: 5,
      title: "Data We Collect via WhatsApp",
      content: [
        "When you use WhatsApp messaging with EduFiliova, we collect:",
        { list: [
          "Your WhatsApp phone number",
          "Messages you send to us",
          "Delivery status (sent, delivered, read)",
          "Timestamps of messages",
          "Your responses to homework or quizzes (if sent via WhatsApp)"
        ]},
        "We do NOT access:",
        { list: [
          "Your personal WhatsApp contacts",
          "Media files from your device",
          "Messages outside of EduFiliova conversations",
          "WhatsApp calls or voice messages"
        ]},
        "All WhatsApp data is subject to our Privacy Policy and is protected with industry-standard security."
      ]
    },
    {
      id: 6,
      title: "Message Frequency",
      content: [
        "Message frequency depends on your activity and settings:",
        { list: [
          "Daily homework reminders: 1-3 messages per day (if enabled)",
          "Course updates: 2-5 messages per week",
          "Account notifications: Only when necessary",
          "Support responses: As needed based on your inquiries"
        ]},
        "You can adjust notification frequency in your account settings.",
        "Standard messaging and data rates from your mobile carrier may apply."
      ]
    },
    {
      id: 7,
      title: "Third-Party Services",
      content: [
        "EduFiliova uses WhatsApp Business API and third-party messaging service providers to send messages.",
        "These providers are bound by strict data privacy and security agreements.",
        "WhatsApp messages are encrypted end-to-end using industry-standard security protocols.",
        "We do not share your WhatsApp data with advertisers or unrelated third parties."
      ]
    },
    {
      id: 8,
      title: "Your Rights",
      content: [
        "You have the right to:",
        { list: [
          "Opt-in or opt-out at any time",
          "Request deletion of your WhatsApp data",
          "Access data we've collected via WhatsApp",
          "Correct inaccurate information",
          "Withdraw consent for non-essential messages"
        ]},
        "To exercise these rights, contact us at support@edufiliova.com or privacy@edufiliova.com."
      ]
    },
    {
      id: 9,
      title: "Changes to This Policy",
      content: [
        "EduFiliova may update this WhatsApp Messaging Consent Policy from time to time.",
        "Significant changes will be communicated via:",
        { list: [
          "Email notification",
          "WhatsApp message (if applicable)",
          "In-app notification",
          "Update on this page with a new 'Last Updated' date"
        ]},
        "Continued use of WhatsApp messaging after updates constitutes acceptance of the new policy."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="whatsapp-policy" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              WhatsApp Messaging Consent Policy
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Understand how EduFiliova uses WhatsApp messaging and how you can control your communication preferences.
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
                  WhatsApp messaging is optional. You can opt-in or opt-out at any time without affecting your EduFiliova account.
                </p>
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
                <p className="text-primary-foreground/90 text-sm md:text-base">For questions about WhatsApp messaging:</p>
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

export default WhatsAppPolicyPage;
