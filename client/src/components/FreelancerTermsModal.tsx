import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Briefcase,
  Award,
  TrendingUp
} from "lucide-react";

interface FreelancerTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FreelancerTermsModal = ({ isOpen, onClose }: FreelancerTermsModalProps) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="tracking-tight font-bold flex items-center gap-2 text-[19px]">
            EduFiliova Freelancer Terms & Policies
          </DialogTitle>
          <DialogDescription>
            Please review these terms, commission structure, and refund policy
          </DialogDescription>
        </DialogHeader>

        <ScrollArea 
          className="h-[60vh] w-full pr-4" 
          onScrollCapture={handleScroll}
        >
          <div className="space-y-6 text-sm">
            
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Welcome to EduFiliova Freelancer Platform</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                By registering as a freelancer on EduFiliova, you agree to these terms and conditions that govern your use of our platform and your relationship with customers.
              </p>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Content & Intellectual Property</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-900">Ownership & Rights</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• You must own all rights to the work you upload and sell</li>
                    <li>• You grant EduFiliova a license to display and distribute your work</li>
                    <li>• You retain copyright and ownership of your original work</li>
                    <li>• Plagiarism or copyright infringement will result in immediate account termination</li>
                  </ul>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <h4 className="font-medium mb-2">Content Guidelines</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• All content must be appropriate for educational purposes</li>
                    <li>• No offensive, harmful, or inappropriate material</li>
                    <li>• Content must match your provided descriptions</li>
                    <li>• Quality standards must be maintained for all products</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Commission Structure</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Platform Commission Rates</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Badge variant="default" className="mb-2 bg-[#0C332C]">Digital Products</Badge>
                      <p className="text-sm text-muted-foreground">Freelancers receive 75% of sales revenue</p>
                      <p className="text-xs text-muted-foreground mt-1">EduFiliova takes 25% platform fee</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Custom Services</Badge>
                      <p className="text-sm text-muted-foreground">Freelancers receive 80% of service fees</p>
                      <p className="text-xs text-muted-foreground mt-1">EduFiliova takes 20% platform fee</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium mb-2">Payment Terms</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Payments processed monthly between the 2nd and 5th</li>
                    <li>• Minimum payout threshold: $20</li>
                    <li>• Payment methods: PayPal, Bank transfer</li>
                    <li>• Tax compliance is your responsibility</li>
                    <li>• Earnings held for 14 days after first sale (dispute period)</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Refund Policy</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <h4 className="font-medium mb-2">Digital Products</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Customers can request refunds within 7 days of purchase</li>
                    <li>• Refunds granted if product is defective or doesn't match description</li>
                    <li>• You must respond to refund requests within 48 hours</li>
                    <li>• Refunded amounts are deducted from your earnings</li>
                    <li>• Excessive refund rates may result in account review</li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium mb-2">Custom Services</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Refund terms must be clearly stated in your service description</li>
                    <li>• Partial refunds available based on work completed</li>
                    <li>• Disputes resolved through platform mediation</li>
                    <li>• Milestone-based payments help protect both parties</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Professional Standards</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-cyan-50 rounded-lg">
                  <h4 className="font-medium mb-2">Quality Expectations</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Maintain high quality in all products and services</li>
                    <li>• Provide accurate descriptions and preview materials</li>
                    <li>• Respond to customer messages within 24 hours</li>
                    <li>• Deliver custom work on time as agreed</li>
                  </ul>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <h4 className="font-medium mb-2">Customer Service</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Be professional and courteous in all interactions</li>
                    <li>• Provide support for products you sell</li>
                    <li>• Address customer concerns promptly</li>
                    <li>• Maintain positive ratings and reviews</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Platform Usage</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-teal-50 rounded-lg">
                  <h4 className="font-medium mb-2">Permitted Activities</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Sell digital products (templates, designs, code, documents)</li>
                    <li>• Offer custom services (design, coding, tutoring)</li>
                    <li>• Communicate with customers through platform messaging</li>
                    <li>• Promote your work within platform guidelines</li>
                  </ul>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <h4 className="font-medium mb-2">Prohibited Activities</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Requesting direct payment outside the platform</li>
                    <li>• Sharing contact information to bypass platform fees</li>
                    <li>• Uploading copyrighted or stolen content</li>
                    <li>• Engaging in fraudulent or deceptive practices</li>
                    <li>• Creating duplicate accounts to manipulate reviews</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Account Requirements</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <h4 className="font-medium mb-2">Profile & Verification</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Valid government-issued ID required for verification</li>
                  <li>• Portfolio samples must demonstrate your skills</li>
                  <li>• Payment information must be accurate and verified</li>
                  <li>• Profile must be kept up-to-date</li>
                  <li>• EduFiliova reserves the right to request additional verification</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Legal & Compliance</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <h4 className="font-medium mb-2">Account Termination</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• EduFiliova reserves the right to suspend or terminate accounts</li>
                    <li>• Violations of terms result in immediate account review</li>
                    <li>• You may close your account at any time with 30-day notice</li>
                    <li>• Pending earnings will be paid out according to schedule</li>
                  </ul>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Important Legal Notes</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• These terms are governed by applicable local laws</li>
                    <li>• Changes to terms will be communicated 30 days in advance</li>
                    <li>• Disputes will be resolved through binding arbitration</li>
                    <li>• You are responsible for complying with tax regulations</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Last updated: 2025</p>
              <p className="text-xs text-muted-foreground mt-1">
                For questions about these terms, contact: support@edufiliova.com
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex flex-col gap-3 pt-4">
          {!hasScrolledToBottom && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Clock className="w-4 h-4" />
              Please scroll to the bottom to read all terms
            </div>
          )}
          
          <div className="flex gap-3">
            <Button 
              onClick={onClose}
              disabled={!hasScrolledToBottom}
              className="flex-1 bg-[#0C332C] hover:bg-[#2448b8] transition-all duration-300"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              I Have Read & Understood
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FreelancerTermsModal;
