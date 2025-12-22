import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface TermsPageProps {
  onNavigate: (page: string) => void;
}

const TermsPage = ({ onNavigate }: TermsPageProps) => {
  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="terms" />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">
              Terms & Conditions
            </h1>
            
            <div className="prose prose-lg max-w-none text-gray-800 space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 mb-4">
                  By accessing and using EduFiliova ("we," "us," or "our"), operated by PA Creatives, a registered company, you accept and agree to be bound by the terms and provisions of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-gray-600">
                  These Terms of Service ("Terms") govern your use of our website located at edufiliova.com (the "Service") operated by PA Creatives through the EduFiliova platform. 
                  Our Privacy Policy also governs your use of the Service and explains how we collect, safeguard and disclose information that results from your use of our web pages.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. About PA Creatives & EduFiliova</h2>
                <p className="text-gray-600 mb-4">
                  EduFiliova is a revolutionary online learning platform operated by PA Creatives, a legally registered company. We provide comprehensive educational experiences and skill development opportunities for learners worldwide. 
                  Our innovative platform includes:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li><strong>Professional Course Creation:</strong> High-quality educational content developed by expert instructors</li>
                  <li><strong>Certificate & Diploma Programs:</strong> Industry-recognized credentials upon course completion</li>
                  <li><strong>Interactive Learning Tools:</strong> Engaging multimedia content and assessments</li>
                  <li><strong>Global Accessibility:</strong> Learn from anywhere, anytime with our modern platform</li>
                  <li><strong>Teacher-Student Communication:</strong> Direct interaction with qualified instructors</li>
                  <li><strong>Progress Tracking:</strong> Advanced analytics to monitor your learning journey</li>
                  <li><strong>Premium Features:</strong> Enhanced learning experiences for serious learners</li>
                </ul>
                <p className="text-gray-600 mb-4">
                  As a registered company, PA Creatives has the authority to issue certificates and diplomas for courses completed on the EduFiliova platform, recognized across the educational community.
                </p>
                <p className="text-gray-600">
                  We reserve the right to modify, enhance, or discontinue any aspect of the Service to better serve our learning community.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. User Accounts and Registration</h2>
                <p className="text-gray-600 mb-4">
                  To access certain features of the Service, you must register for an account. When creating an account, you must provide accurate, current, and complete information. 
                  You are responsible for:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use of your account</li>
                  <li>Ensuring your contact information remains current and accurate</li>
                </ul>
                <p className="text-gray-600 mb-4">
                  You must be at least 13 years old to create an account. Users under 18 must have parental consent to use our Service.
                </p>
                <p className="text-gray-600">
                  We reserve the right to suspend or terminate accounts that violate these Terms or engage in prohibited activities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. User Conduct and Prohibited Activities</h2>
                <p className="text-gray-600 mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Upload, post, or transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy</li>
                  <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity</li>
                  <li>Upload, post, or transmit any content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights</li>
                  <li>Upload, post, or transmit any unsolicited or unauthorized advertising, promotional materials, spam, or any other form of solicitation</li>
                  <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                  <li>Attempt to gain unauthorized access to any portion of the Service or any other systems or networks</li>
                  <li>Use automated systems or software to extract data from the Service for commercial purposes</li>
                </ul>
                <p className="text-gray-600">
                  Violation of these guidelines may result in immediate suspension or termination of your account and legal action where appropriate.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Certificates, Diplomas & Credentials</h2>
                <p className="text-gray-600 mb-4">
                  <strong>Professional Recognition:</strong> PA Creatives, as a registered company, is authorized to issue certificates and diplomas for successful completion of courses on the EduFiliova platform. These credentials represent your achievement and mastery of the course material.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Certificate Standards:</strong> Our certificates and diplomas are issued based on:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Successful completion of all course modules and assessments</li>
                  <li>Meeting minimum passing grades on examinations</li>
                  <li>Fulfilling all course requirements as specified by the instructor</li>
                  <li>Adherence to academic integrity standards</li>
                </ul>
                <p className="text-gray-600 mb-4">
                  <strong>Verification:</strong> All certificates and diplomas issued can be verified through our platform and contain unique verification codes to prevent fraud.
                </p>
                <p className="text-gray-600">
                  <strong>Industry Value:</strong> Our credentials are designed to enhance your professional profile and demonstrate your commitment to continuous learning and skill development.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Intellectual Property Rights</h2>
                <p className="text-gray-600 mb-4">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of PA Creatives and EduFiliova and its licensors. 
                  The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
                </p>
                <p className="text-gray-600 mb-4">
                  You retain ownership of any content you submit, post, or display on or through the Service ("User Content"). 
                  By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content in connection with operating and providing the Service.
                </p>
                <p className="text-gray-600">
                  You represent and warrant that you own or have the necessary rights to grant us the above license for any User Content you submit.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Premium Services and Investment in Your Future</h2>
                <p className="text-gray-600 mb-4">
                  <strong>Unlock Your Potential:</strong> EduFiliova offers both free and premium subscription services designed to accelerate your learning and career growth. Our premium features are an investment in your future success:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li><strong>Advanced Analytics:</strong> Detailed learning insights to optimize your study approach</li>
                  <li><strong>Priority Support:</strong> Direct access to our expert support team</li>
                  <li><strong>Unlimited Course Access:</strong> Full library access to all premium courses</li>
                  <li><strong>Professional Certificates:</strong> Enhanced credential options for career advancement</li>
                  <li><strong>Personalized Learning Paths:</strong> AI-driven recommendations tailored to your goals</li>
                  <li><strong>Instructor Access:</strong> Direct communication with course creators</li>
                  <li><strong>Advanced Tools:</strong> Professional-grade learning and creation capabilities</li>
                </ul>
                <p className="text-gray-600 mb-4">
                  <strong>Flexible Payment Options:</strong> Subscription fees are billed monthly or annually with significant savings on annual plans. 
                  We accept major payment methods and offer secure payment processing through trusted providers.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Money-Back Satisfaction:</strong> We're confident in our value proposition. Refunds are available within the first 30 days of subscription for eligible plans.
                </p>
                <p className="text-gray-600">
                  <strong>No Hidden Fees:</strong> Transparent pricing with no surprise charges. You can upgrade, downgrade, or cancel your subscription at any time through your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Privacy and Data Protection</h2>
                <p className="text-gray-600 mb-4">
                  Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service. 
                  By using our Service, you agree to the collection and use of information in accordance with our Privacy Policy.
                </p>
                <p className="text-gray-600 mb-4">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. 
                  However, no method of transmission over the Internet or electronic storage is 100% secure.
                </p>
                <p className="text-gray-600">
                  You have the right to access, update, or delete your personal information. For data protection inquiries, please contact us at privacy@edufiliova.com.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Quality Education & Content Standards</h2>
                <p className="text-gray-600 mb-4">
                  <strong>Expert-Curated Content:</strong> Our educational content is developed by qualified professionals and industry experts. We maintain high standards for course quality, ensuring relevant and practical learning experiences.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Continuous Improvement:</strong> We regularly update our courses to reflect industry changes, technological advances, and user feedback. Our content review process ensures materials remain current and valuable.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Practical Application:</strong> Our courses are designed to provide practical skills and knowledge that can be immediately applied in real-world scenarios, enhancing your career prospects and earning potential.
                </p>
                <p className="text-gray-600">
                  <strong>Content Evolution:</strong> We reserve the right to modify, enhance, or update educational content to maintain the highest quality standards and relevance to current market demands.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-600 mb-4">
                  In no event shall EduFiliova, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                </p>
                <p className="text-gray-600 mb-4">
                  Our total liability to you for all claims arising from or relating to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
                </p>
                <p className="text-gray-600">
                  Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability for incidental or consequential damages. 
                  In such jurisdictions, our liability will be limited to the maximum extent permitted by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Indemnification</h2>
                <p className="text-gray-600">
                  You agree to defend, indemnify, and hold harmless EduFiliova and its licensors, employees, contractors, agents, officers and directors from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees) arising from your use of and access to the Service, your violation of these Terms, or your infringement of any third-party rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Termination</h2>
                <p className="text-gray-600 mb-4">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including but not limited to a breach of these Terms.
                </p>
                <p className="text-gray-600 mb-4">
                  You may terminate your account at any time by contacting us or through your account settings. Upon termination, your right to use the Service will cease immediately.
                </p>
                <p className="text-gray-600">
                  All provisions of these Terms which by their nature should survive termination shall survive termination, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Governing Law and Dispute Resolution</h2>
                <p className="text-gray-600 mb-4">
                  These Terms shall be interpreted and governed by the laws of the jurisdiction in which EduFiliova is headquartered, without regard to conflict of law provisions.
                </p>
                <p className="text-gray-600 mb-4">
                  Any disputes arising from these Terms or your use of the Service will be resolved through binding arbitration in accordance with the rules of the relevant arbitration association.
                </p>
                <p className="text-gray-600">
                  You waive any right to participate in class-action lawsuits or class-wide arbitration against EduFiliova.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Changes to Terms</h2>
                <p className="text-gray-600 mb-4">
                  We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                </p>
                <p className="text-gray-600 mb-4">
                  Your continued use of the Service after any such changes constitutes your acceptance of the new Terms. If you do not agree to the new Terms, you must stop using the Service.
                </p>
                <p className="text-gray-600">
                  It is your responsibility to review these Terms periodically for changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">14. Contact PA Creatives & EduFiliova</h2>
                <p className="text-gray-600 mb-4">
                  For any questions about these Terms & Conditions, business inquiries, or partnership opportunities, please contact us:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 mb-2"><strong>Company:</strong> PA Creatives (Registered Company)</p>
                  <p className="text-gray-600 mb-2"><strong>Platform:</strong> EduFiliova</p>
                  <p className="text-gray-600 mb-2"><strong>Customer Support:</strong> support@edufiliova.com</p>
                  <p className="text-gray-600 mb-2"><strong>Privacy Inquiries:</strong> privacy@edufiliova.com</p>
                  <p className="text-gray-600 mb-2"><strong>Payment Support:</strong> payments@edufiliova.com</p>
                  <p className="text-gray-600 mb-2"><strong>Platform Website:</strong> www.edufiliova.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default TermsPage;
