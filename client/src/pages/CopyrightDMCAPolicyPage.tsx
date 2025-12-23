import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CopyrightDMCAPolicyPageProps {
  onNavigate: (page: string) => void;
}

const CopyrightDMCAPolicyPage = ({ onNavigate }: CopyrightDMCAPolicyPageProps) => {
  const sections = [
    {
      id: 1,
      title: "Introduction",
      content: [
        "EduFiliova respects intellectual property rights and expects all users to do the same.",
        "This policy explains:",
        { list: [
          "What copyrighted content is",
          "How to report copyright infringement (DMCA process)",
          "Consequences of copyright violations",
          "EduFiliova's role and responsibilities"
        ]},
        "If you believe your copyrighted work has been used without permission on EduFiliova, please follow the DMCA takedown process outlined below."
      ]
    },
    {
      id: 2,
      title: "What is Copyrighted Content?",
      content: [
        "Copyrighted content includes any original work protected by intellectual property law, such as:",
        { list: [
          "Books, textbooks, and educational materials",
          "Videos, audio recordings, and multimedia content",
          "Images, graphics, and illustrations",
          "Software, code, and digital tools",
          "Courses, quizzes, and lesson plans",
          "Music, lyrics, and sound effects",
          "Articles, blog posts, and written works"
        ]},
        "Using copyrighted material without permission from the copyright owner is illegal and may result in legal action."
      ]
    },
    {
      id: 3,
      title: "EduFiliova's Copyright Ownership",
      content: [
        "EduFiliova owns all rights to:",
        { list: [
          "Platform design, code, and functionality",
          "EduFiliova branding, logos, and trademarks",
          "Original courses created by EduFiliova staff",
          "Platform-generated content (e.g., certificates, analytics)"
        ]},
        "User-Generated Content:",
        "Teachers, freelancers, and students who upload content to EduFiliova retain ownership of their original work, but grant EduFiliova a license to use, display, and distribute it on the platform as outlined in the Terms of Use."
      ]
    },
    {
      id: 4,
      title: "Prohibited Activities",
      content: [
        "Users must NOT:",
        { list: [
          "Upload or share copyrighted material without permission",
          "Copy or redistribute paid courses without authorization",
          "Plagiarize content from other creators",
          "Use copyrighted images, videos, or music without a license",
          "Share pirated textbooks, PDFs, or software",
          "Distribute leaked or unauthorized content",
          "Violate trademarks or brand rights"
        ]},
        "Violating this policy may result in:",
        { list: [
          "Content removal",
          "Account suspension or termination",
          "Loss of earnings (for teachers/freelancers)",
          "Legal action by the copyright owner"
        ]}
      ]
    },
    {
      id: 5,
      title: "DMCA Takedown Process",
      content: [
        "If you believe your copyrighted work has been infringed on EduFiliova, you can file a DMCA takedown notice.",
        "Your notice must include:",
        { list: [
          "Your full name, address, and contact information",
          "Description of the copyrighted work being infringed",
          "URL or location of the infringing content on EduFiliova",
          "A statement that you have a good faith belief the use is unauthorized",
          "A statement that the information provided is accurate",
          "Your physical or electronic signature",
          "Statement that you are the copyright owner or authorized to act on behalf of the owner"
        ]},
        "Send DMCA notices to:",
        { list: [
          "Email: support@edufiliova.com",
          "Subject line: 'DMCA Takedown Notice'"
        ]},
        "EduFiliova will review and respond within 7 business days.",
        "Note: Filing a false DMCA claim may result in legal penalties under US law (17 U.S.C. § 512(f))."
      ]
    },
    {
      id: 6,
      title: "Counter-Notice Process",
      content: [
        "If your content was removed due to a DMCA claim and you believe it was a mistake, you can file a counter-notice.",
        "Your counter-notice must include:",
        { list: [
          "Your full name, address, and contact information",
          "Description of the content that was removed",
          "URL or location where the content appeared",
          "Statement under penalty of perjury that the removal was a mistake or misidentification",
          "Consent to jurisdiction of your local federal court",
          "Your physical or electronic signature"
        ]},
        "Send counter-notices to:",
        { list: [
          "Email: support@edufiliova.com",
          "Subject line: 'DMCA Counter-Notice'"
        ]},
        "If we receive a valid counter-notice, we will forward it to the original complainant. If they do not file a lawsuit within 10-14 business days, we may restore your content."
      ]
    },
    {
      id: 7,
      title: "Repeat Infringer Policy",
      content: [
        "EduFiliova has a zero-tolerance policy for repeat copyright infringers.",
        "Consequences for repeat violations:",
        { list: [
          "First violation: Warning + content removal",
          "Second violation: Temporary account suspension (7-30 days)",
          "Third violation: Permanent account termination",
          "Severe or intentional violations: Immediate termination + legal action"
        ]},
        "We reserve the right to terminate accounts at our discretion for serious or repeated copyright violations."
      ]
    },
    {
      id: 8,
      title: "Fair Use & Educational Exceptions",
      content: [
        "In some cases, limited use of copyrighted material may be allowed under 'Fair Use' (US law) or similar exceptions in other countries.",
        "Fair use may apply when content is used for:",
        { list: [
          "Educational purposes",
          "Criticism or commentary",
          "News reporting",
          "Research or scholarship"
        ]},
        "However:",
        { list: [
          "Fair use is determined case-by-case by courts",
          "It does NOT allow free use of entire copyrighted works",
          "Teachers and freelancers should obtain permission or use licensed materials whenever possible"
        ]},
        "EduFiliova does not provide legal advice on fair use. If unsure, consult a legal professional."
      ]
    },
    {
      id: 9,
      title: "Reporting Other Violations",
      content: [
        "If you encounter content that violates EduFiliova's Community Guidelines or Terms of Use (but is not a copyright issue), report it via:",
        { list: [
          "Email: support@edufiliova.com",
          "Subject line: 'Content Violation Report'"
        ]},
        "Include:",
        { list: [
          "Description of the violation",
          "URL or location of the content",
          "Why you believe it violates our policies"
        ]}
      ]
    },
    {
      id: 10,
      title: "Changes to This Policy",
      content: [
        "EduFiliova may update this Copyright & DMCA Policy from time to time.",
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
      <Header onNavigate={onNavigate} currentPage="copyright-dmca" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              Copyright & DMCA Policy
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Learn about copyright protection, DMCA takedown procedures, and intellectual property rights on EduFiliova.
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
                  EduFiliova respects intellectual property rights. Uploading or sharing copyrighted material without permission may result in content removal and account termination.
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
                <p className="text-primary-foreground/90 text-sm md:text-base">For DMCA notices and copyright questions:</p>
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
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CopyrightDMCAPolicyPage;
