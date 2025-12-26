import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PaymentBillingPolicyPageProps {
  onNavigate: (page: string) => void;
}

const PaymentBillingPolicyPage = ({ onNavigate }: PaymentBillingPolicyPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Introduction",
      content: [
        "This Payment & Billing Policy explains how EduFiliova handles payments, subscriptions, billing, and refunds.",
        "It applies to:",
        { list: [
          "Student subscriptions",
          "Course purchases",
          "Certificate fees",
          "Teacher/freelancer earnings and payouts",
          "School/institution billing"
        ]},
        "By making a purchase or payment on EduFiliova, you agree to this policy."
      ]
    },
    {
      id: 2,
      title: "Accepted Payment Methods",
      content: [
        "EduFiliova accepts the following payment methods:",
        { list: [
          "Credit cards (Visa, Mastercard, American Express, Discover)",
          "Debit cards",
          "Secure payment processors",
          "Other region-specific payment methods (where available)"
        ]},
        "All payments are processed securely by third-party payment processors.",
        "EduFiliova does NOT store your full credit card numbers. Payment data is handled exclusively by our payment processors in compliance with PCI-DSS standards."
      ]
    },
    {
      id: 3,
      title: "Student Subscriptions & Pricing",
      content: [
        "EduFiliova offers tiered subscription plans for students based on grade level:",
        "A. Elementary (Grades 1-7):",
        { list: [
          "Price: $5.99/month or $59.99/year",
          "Access to elementary-level courses, quizzes, and learning materials",
          "Homework assistance and WhatsApp messaging (opt-in)"
        ]},
        "B. High School (Grades 8-12):",
        { list: [
          "Price: $9.99/month or $99.99/year",
          "Access to high school courses, advanced quizzes, and exam prep",
          "Live classes and teacher support"
        ]},
        "C. College/University:",
        { list: [
          "Price: $99.00/month or $799.00/year",
          "Access to university-level courses, certifications, and professional development",
          "1-on-1 tutoring and career guidance"
        ]},
        "Prices may vary by region and are subject to change with prior notice.",
        "Annual subscriptions offer savings compared to monthly plans."
      ]
    },
    {
      id: 4,
      title: "Subscription Billing & Renewals",
      content: [
        "How billing works:",
        { list: [
          "Monthly subscriptions renew automatically on the same day each month",
          "Annual subscriptions renew automatically one year from the purchase date",
          "You will be charged automatically unless you cancel before the renewal date",
          "Renewal reminders are sent 7 days before your subscription renews"
        ]},
        "Cancellation:",
        { list: [
          "You can cancel your subscription anytime in account settings",
          "Cancellation takes effect at the end of the current billing period",
          "You will retain access until the subscription expires",
          "No refunds for partial months or unused time (see Refund Policy)"
        ]},
        "Failed payments:",
        { list: [
          "If a payment fails, we will retry the charge up to 3 times",
          "Your subscription may be suspended if payment is not successful",
          "Update your payment method in account settings to avoid interruption"
        ]}
      ]
    },
    {
      id: 5,
      title: "One-Time Purchases",
      content: [
        "In addition to subscriptions, EduFiliova offers one-time purchases for:",
        { list: [
          "Individual courses (price varies)",
          "Certificates ($15 per certificate)",
          "Tutoring sessions (price set by teacher)",
          "Special workshops or masterclasses"
        ]},
        "One-time purchases are non-refundable unless:",
        { list: [
          "The content was not delivered",
          "There is a technical error preventing access",
          "The course was misrepresented or fraudulent"
        ]},
        "See our Refund Policy for more details."
      ]
    },
    {
      id: 6,
      title: "Payment Security",
      content: [
        "EduFiliova prioritizes payment security:",
        { list: [
          "All transactions are encrypted using SSL/TLS",
          "Payment processing complies with PCI-DSS standards",
          "We do not store full credit card numbers",
          "Payment data is handled exclusively by secure payment processors",
          "Suspicious transactions are flagged for fraud prevention"
        ]},
        "Your payment information is safe with us."
      ]
    },
    {
      id: 7,
      title: "Refund Policy",
      content: [
        "Refunds are handled according to our Refund Policy, which includes:",
        "A. Subscription Refunds:",
        { list: [
          "Full refund within 7 days of initial purchase if no content was accessed",
          "No refunds for renewals or partial months"
        ]},
        "B. Course & Certificate Refunds:",
        { list: [
          "Full refund within 14 days if less than 20% of the course was accessed",
          "Certificate fees are refundable if the certificate was not generated or sent"
        ]},
        "C. Tutoring Session Refunds:",
        { list: [
          "Full refund if the session did not occur",
          "Partial refund if the session was incomplete or unsatisfactory (at EduFiliova's discretion)"
        ]},
        "To request a refund, contact support@edufiliova.com within the refund eligibility period.",
        "For full details, see our Refund Policy."
      ]
    },
    {
      id: 8,
      title: "Teacher & Freelancer Payments",
      content: [
        "Teachers and freelancers earn money through EduFiliova based on:",
        { list: [
          "Course sales (revenue share model)",
          "Tutoring sessions (70-80% of session fee)",
          "Freelance services (commission-based)"
        ]},
        "Payout schedule:",
        { list: [
          "Payouts are processed monthly (first week of each month)",
          "Minimum payout threshold: $50",
          "Earnings below $50 are rolled over to the next month"
        ]},
        "Payout methods:",
        { list: [
          "Secure payment processors",
          "Bank transfer (where available)"
        ]},
        "For full details, see our Commission & Payout Policy.",
        "Taxes:",
        { list: [
          "Teachers and freelancers are responsible for reporting and paying their own taxes",
          "EduFiliova provides annual earning statements for tax purposes"
        ]}
      ]
    },
    {
      id: 9,
      title: "Disputes & Chargebacks",
      content: [
        "If you have a billing issue, contact us first at support@edufiliova.com before filing a chargeback or dispute.",
        "Chargebacks:",
        { list: [
          "Filing a chargeback may result in immediate account suspension",
          "We will investigate and respond to chargebacks with supporting documentation",
          "Fraudulent chargebacks may result in permanent account termination and legal action"
        ]},
        "Dispute resolution:",
        { list: [
          "We aim to resolve billing disputes within 7-14 business days",
          "Provide detailed information about the issue to expedite resolution"
        ]}
      ]
    },
    {
      id: 10,
      title: "Price Changes",
      content: [
        "EduFiliova reserves the right to change pricing at any time.",
        "How price changes work:",
        { list: [
          "Existing subscribers are grandfathered at their current price for 6 months",
          "You will be notified 30 days before any price increase",
          "You can cancel before the new price takes effect"
        ]},
        "Price changes do not apply retroactively to existing subscriptions."
      ]
    },
    {
      id: 11,
      title: "Taxes",
      content: [
        "Prices displayed on EduFiliova may not include applicable taxes (e.g., VAT, GST, sales tax).",
        "Taxes are calculated at checkout based on your location.",
        "You are responsible for paying any applicable taxes.",
        "Tax invoices are available in your account settings after purchase."
      ]
    },
    {
      id: 12,
      title: "Changes to This Policy",
      content: [
        "EduFiliova may update this Payment & Billing Policy from time to time.",
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
      <Header onNavigate={onNavigate} currentPage="payment-billing" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Payment & Billing Policy
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Understand how payments, subscriptions, billing, and refunds work on EduFiliova.
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
                  All payments are processed securely by trusted payment processors. Subscriptions renew automatically unless canceled.
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
                <p className="text-primary-foreground/90 text-sm md:text-base">For billing questions or disputes:</p>
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

export default PaymentBillingPolicyPage;
