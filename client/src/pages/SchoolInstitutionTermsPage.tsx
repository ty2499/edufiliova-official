import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface SchoolInstitutionTermsPageProps {
  onNavigate: (page: string) => void;
}

const SchoolInstitutionTermsPage = ({ onNavigate }: SchoolInstitutionTermsPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Eligibility",
      content: [
        "To register an institution on EduFiliova, you confirm that:",
        { list: [
          "You are an authorized representative of the institution",
          "All institution information is accurate and verifiable",
          "You have the right to manage student and teacher data",
          "You agree to comply with local educational laws",
          "You accept EduFiliova's privacy and data policies"
        ]},
        "EduFiliova may request verification documents."
      ]
    },
    {
      id: 2,
      title: "Institution Account Setup",
      content: [
        "Institutions must:",
        { list: [
          "Provide accurate school information",
          "Assign an official admin representative",
          "Upload verification documents (if requested)",
          "Accept these Terms on behalf of the school"
        ]},
        "Institutions are responsible for:",
        { list: [
          "Keeping admin login credentials secure",
          "Ensuring staff use the platform correctly",
          "Managing student data responsibly"
        ]}
      ]
    },
    {
      id: 3,
      title: "Institution Dashboard Features",
      content: [
        "Approved institutions gain access to:",
        { list: [
          "Student management tools",
          "Teacher management tools",
          "Class and grade setup",
          "Assignment and tracking tools",
          "Course access based on subscription level",
          "Performance analytics",
          "Secure messaging with students",
          "Billing and subscription controls"
        ]},
        "Different plans may unlock different levels of features."
      ]
    },
    {
      id: 4,
      title: "Student & Teacher Accounts Under an Institution",
      content: [
        "By adding students or teachers, the institution confirms:",
        { list: [
          "You have parental consent where required",
          "You have permission to manage user data",
          "You will follow local laws regarding minors"
        ]},
        "Institutions are responsible for:",
        { list: [
          "Assigning correct grade levels",
          "Managing the subscription status",
          "Removing access for staff who leave",
          "Ensuring proper behavior and usage"
        ]},
        "EduFiliova is not liable for misuse by school staff."
      ]
    },
    {
      id: 5,
      title: "Subscription Plans & Payment",
      content: [
        "Institutions may subscribe to:",
        { list: [
          "School Learning Plans",
          "Bulk student plans",
          "Teacher packages",
          "Course bundles"
        ]},
        "Payments:",
        { list: [
          "Are billed monthly or yearly",
          "Are non-refundable unless required by local law",
          "Must be paid to maintain full access",
          "May change in the future with notification"
        ]},
        "If payment fails or expires:",
        { list: [
          "Student and teacher accounts revert to Free Mode",
          "Access to premium lessons, live classes, and assignments may be restricted"
        ]}
      ]
    },
    {
      id: 6,
      title: "Content Usage Rules",
      content: [
        "Institutions must ensure teachers and students do NOT:",
        { list: [
          "Distribute paid EduFiliova content outside the platform",
          "Upload copyrighted materials without permission",
          "Record or republish course videos",
          "Forge certificates or manipulate assessments"
        ]},
        "All content on EduFiliova is protected by copyright."
      ]
    },
    {
      id: 7,
      title: "Communication & Messaging Rules",
      content: [
        "Institution admins and teachers may communicate with:",
        { list: [
          "Their students",
          "Parents (if enabled)",
          "EduFiliova support"
        ]},
        "They must NOT:",
        { list: [
          "Share personal phone numbers",
          "Request payments outside the platform",
          "Encourage off-platform communication",
          "Send inappropriate, harmful, or unprofessional content"
        ]},
        "All communication must follow child-safety standards."
      ]
    },
    {
      id: 8,
      title: "Live Classes & Safety",
      content: [
        "If institutions use live classes:",
        "Teachers must:",
        { list: [
          "Maintain a professional teaching environment",
          "Never engage in inappropriate communication",
          "Not ask students to turn on cameras unnecessarily",
          "Not record or distribute sessions unless permitted"
        ]},
        "EduFiliova may monitor or review sessions to ensure safety."
      ]
    },
    {
      id: 9,
      title: "Data Protection & Privacy",
      content: [
        "Institutions agree to:",
        { list: [
          "Follow data protection laws (e.g., GDPR for EU schools)",
          "Manage student data responsibly",
          "Use EduFiliova tools ethically",
          "Not export or misuse private student information"
        ]},
        "EduFiliova will:",
        { list: [
          "Protect data using encryption and security protocols",
          "Never sell personal data",
          "Only use data to improve learning services"
        ]}
      ]
    },
    {
      id: 10,
      title: "Certificates",
      content: [
        "EduFiliova issues certificates for completed courses.",
        "Institutions must NOT:",
        { list: [
          "Alter or fake certificates",
          "Issue certificates outside EduFiliova",
          "Misuse certificate verification codes"
        ]},
        "All certificates must remain in their original form."
      ]
    },
    {
      id: 11,
      title: "Prohibited Institutional Activities",
      content: [
        "Institutions must not:",
        { list: [
          "Create fake student accounts",
          "Manipulate attendance or assessment records",
          "Upload harmful materials",
          "Use the platform for political or unauthorized religious influence",
          "Attempt to hack or reverse-engineer the system",
          "Share accounts or access credentials"
        ]},
        "Violations may lead to suspension or permanent removal."
      ]
    },
    {
      id: 12,
      title: "Account Suspension or Termination",
      content: [
        "EduFiliova may:",
        { list: [
          "Suspend institution dashboards",
          "Restrict teacher or student accounts",
          "Remove harmful content",
          "Freeze access for unpaid bills",
          "Terminate accounts for serious violations"
        ]},
        "Severe cases (e.g., safety threats) may result in permanent bans."
      ]
    },
    {
      id: 13,
      title: "Liability",
      content: [
        "EduFiliova is not liable for:",
        { list: [
          "Misconduct by teachers or staff",
          "Incorrect information uploaded by institutions",
          "Loss of access due to unpaid subscriptions",
          "Unauthorized data handling by institution personnel"
        ]},
        "Institutions are responsible for their own staff and data management."
      ]
    },
    {
      id: 14,
      title: "Changes to Terms",
      content: [
        "EduFiliova may update these Terms at any time.",
        "Institutions will be notified of significant changes.",
        "Continued use of the platform means acceptance of updated Terms."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="school-terms" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              School & Institution Terms of Use
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              These School & Institution Terms of Use govern how schools, academies, training centers, and educational organizations use EduFiliova's services. By registering an institution or using EduFiliova for teachers, students, or administrators, you agree to these Terms.
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
                  If you do not agree, do not use the platform.
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
                <p className="text-primary-foreground/90 text-sm md:text-base">For school/institution support:</p>
              </div>
            <div className="pl-0 md:pl-16 space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Email:</span>
                <a 
                  href="mailto:support@edufiliova.com" 
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors"
                  data-testid="link-institution-support-email"
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

export default SchoolInstitutionTermsPage;
