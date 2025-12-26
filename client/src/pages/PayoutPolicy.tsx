import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PayoutPolicyProps {
  onNavigate: (page: string) => void;
}

export function PayoutPolicy({ onNavigate }: PayoutPolicyProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="payout-policy" />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              EduFiliova Teacher Payout Policy
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive guidelines for teacher earnings and payment processing
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
                Payouts are processed monthly with secure payment methods. Teachers earn commissions based on course sales, tutoring, and platform engagement.
              </p>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
          
          {/* Earnings Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                
                Earnings Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Course Sales Commission</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Teachers earn 70% of course price for direct sales</li>
                  <li>• Platform subscription courses: $15 per student enrollment</li>
                  <li>• Live session teaching: $25 per hour (with 1,000+ students attending)</li>
                  <li>• One-on-one tutoring: Keep 85% of session fee</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Bonus Programs</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Student retention bonus: $5 per student completing 80% of course</li>
                  <li>• Rating bonus: Additional 5% for courses with 4.8+ star ratings</li>
                  <li>• Monthly achievement rewards for top-performing teachers</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                
                Payment Schedule & Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Monthly Payout Cycle</h4>
                <div className="p-4 rounded-lg" style={{backgroundColor: 'rgba(242, 90, 54, 0.1)'}}>
                  <ul className="space-y-2 text-sm">
                    <li><strong>1st-15th:</strong> Earnings accumulation period</li>
                    <li><strong>16th-20th:</strong> Payout processing window</li>
                    <li><strong>21st-25th:</strong> Payment delivery to accounts</li>
                    <li><strong>26th-End:</strong> Next cycle preparation</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Minimum Payout Requirements</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Minimum balance of $80 USD required for payout</li>
                  <li>• Earnings below minimum carry over to next month</li>
                  <li>• Emergency payouts available for balances over $200 (processing fee applies)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                
                Supported Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2" style={{color: '#f25a36'}}>Bank Transfer</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Available in 195+ countries</li>
                    <li>• Processing: 3-5 business days</li>
                    <li>• No processing fees</li>
                    <li>• Requires valid bank account</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2" style={{color: '#f25a36'}}>Secure Payment Methods</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Multiple payment options</li>
                    <li>• Fast processing times</li>
                    <li>• Secure and verified</li>
                    <li>• Account verification required</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                
                Account Management & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Account Limits & Restrictions</h4>
                <div className="border rounded-lg p-4" style={{backgroundColor: 'rgba(242, 90, 54, 0.1)', borderColor: 'rgba(242, 90, 54, 0.3)'}}>
                  <ul className="space-y-2 text-sm">
                    <li>• Maximum 2 payment accounts per teacher</li>
                    <li>• Account modifications allowed after 5 days of creation</li>
                    <li>• Account verification required before first payout</li>
                    <li>• Suspicious activity may trigger account review</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Security Measures</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Two-factor authentication required for account changes</li>
                  <li>• Email notifications for all payment activities</li>
                  <li>• Encrypted storage of financial information</li>
                  <li>• Regular security audits and compliance checks</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                
                Tax Information & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Tax Responsibilities</h4>
                <div className="p-4 rounded-lg" style={{backgroundColor: 'rgba(21, 19, 20, 0.05)'}}>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Teachers are responsible for reporting earnings to tax authorities</li>
                    <li>• Annual tax forms (1099-NEC for US teachers) provided by January 31st</li>
                    <li>• International teachers receive earnings summary for local tax filing</li>
                    <li>• Consultation with tax professionals recommended</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Required Documentation</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Valid government-issued ID</li>
                  <li>• Tax identification number (SSN, EIN, or equivalent)</li>
                  <li>• Proof of address (utility bill or bank statement)</li>
                  <li>• Banking information verification</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Resolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                
                Dispute Resolution & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Payment Disputes</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Report payment issues within 30 days of expected payment date</li>
                  <li>• Provide transaction IDs and supporting documentation</li>
                  <li>• Resolution timeline: 5-10 business days for most cases</li>
                  <li>• Escalation to senior support team for complex issues</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="flex items-center gap-2">
                  
                  <span className="text-sm">payments@edufiliova.com</span>
                </div>
              </div>
            </CardContent>
          </Card>

          </div>

          <div className="mt-8 md:mt-12 bg-primary rounded-xl p-6 md:p-8 text-primary-foreground shadow-xl animate-fade-in">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Contact</h2>
              <p className="text-primary-foreground/90 text-sm md:text-base">For payout and commission questions:</p>
            </div>
            <div className="pl-0 md:pl-16 space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Email:</span>
                <a 
                  href="mailto:payments@edufiliova.com" 
                  className="text-primary-foreground/90 hover:text-primary-foreground underline text-sm md:text-base transition-colors transition-all duration-300"
                  data-testid="link-payments-email"
                >
                  payments@edufiliova.com
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
}
