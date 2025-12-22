import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Users, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Clock,
  Globe,
  MessageCircle,
  Baby
} from "lucide-react";

interface TeacherTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const TeacherTermsModal = ({ isOpen, onClose, onAccept, onDecline }: TeacherTermsModalProps) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  const handleDecline = () => {
    onDecline();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="tracking-tight font-bold flex items-center gap-2 text-[19px]">
            EduFiliova Teacher Terms & Conditions
          </DialogTitle>
          <DialogDescription>
            Please read and accept these terms to join our teaching community
          </DialogDescription>
        </DialogHeader>

        <ScrollArea 
          className="h-[60vh] w-full pr-4" 
          onScrollCapture={handleScroll}
        >
          <div className="space-y-6 text-sm">
            
            {/* Introduction */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Welcome to EduFiliova Teaching Platform</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                By registering as a teacher on EduFiliova, you agree to these terms and conditions that govern your use of our platform and your relationship with students and the platform.
              </p>
            </section>

            <Separator />

            {/* Child Safety - PRIORITY SECTION */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Baby className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Child Safety & Protection (HIGHEST PRIORITY)</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium mb-2 text-red-900">Zero Tolerance Policy</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Absolutely NO inappropriate communication with minors under any circumstances</li>
                    <li>• All interactions must be strictly educational and age-appropriate</li>
                    <li>• Violation of child safety policies results in immediate account termination and reporting to authorities</li>
                    <li>• Teachers must complete mandatory child safety training upon approval</li>
                  </ul>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <h4 className="font-medium mb-2">Required Background Checks</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Criminal background check required before teaching minors (under 18)</li>
                    <li>• Regular re-verification may be requested</li>
                    <li>• Teachers must disclose any criminal history related to children</li>
                    <li>• Platform reserves the right to conduct additional screening</li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Content Guidelines for Minors</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• All content for students under 18 must be age-appropriate</li>
                    <li>• No violent, sexual, or otherwise inappropriate material</li>
                    <li>• Course materials reviewed and approved before publishing to minor audiences</li>
                    <li>• Parental consent required for students under 13</li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium mb-2">Communication Boundaries</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• ALL communication with minors must occur within the platform only</li>
                    <li>• Never share personal contact information (phone, social media, email)</li>
                    <li>• Never arrange in-person meetings outside authorized contexts</li>
                    <li>• All messages are monitored for safety compliance</li>
                  </ul>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Reporting Obligations</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Teachers must immediately report any suspected child abuse or safety concerns</li>
                    <li>• Report button available in all student interactions</li>
                    <li>• Platform cooperates fully with law enforcement investigations</li>
                    <li>• Failure to report constitutes a serious violation</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Teaching Standards */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Teaching Standards & Responsibilities</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Professional Conduct</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Maintain professional behavior in all interactions with students</li>
                    <li>• Provide accurate and up-to-date information in your teaching materials</li>
                    <li>• Respond to student inquiries within 24 hours during business days</li>
                    <li>• Maintain appropriate boundaries in student-teacher relationships</li>
                  </ul>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Content Quality</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Ensure all content is original or properly attributed</li>
                    <li>• Maintain high educational standards in all materials</li>
                    <li>• Provide accurate course descriptions and learning outcomes</li>
                    <li>• Update content regularly to maintain relevance</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Payment Terms */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Payment & Commission Structure</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Commission Rates</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Badge variant="default" className="mb-2">Premium Courses</Badge>
                      <p className="text-sm text-muted-foreground">Teachers receive 70% of course sales revenue</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Live Sessions</Badge>
                      <p className="text-sm text-muted-foreground">Teachers receive 80% of session fees</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium mb-2">Payment Terms</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Payments processed monthly by the 15th</li>
                    <li>• Minimum payout threshold: $50</li>
                    <li>• Payment methods: Bank transfer, PayPal</li>
                    <li>• Tax compliance is teacher's responsibility</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Platform Usage */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Platform Usage Guidelines</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium mb-2">Permitted Activities</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Create and sell educational courses</li>
                    <li>• Conduct live teaching sessions</li>
                    <li>• Communicate with students through platform messaging</li>
                    <li>• Access student analytics and progress reports</li>
                  </ul>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium mb-2">Prohibited Activities</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Sharing inappropriate or harmful content</li>
                    <li>• Requesting student contact outside the platform</li>
                    <li>• Plagiarizing or copying other teachers' content</li>
                    <li>• Engaging in discriminatory behavior</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Document Requirements */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Document Requirements</h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <h4 className="font-medium mb-2">Required Documentation</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Valid government-issued ID or passport</li>
                  <li>• Teaching qualification certificates</li>
                  <li>• Proof of relevant experience (CV/Resume)</li>
                  <li>• Background check (where applicable)</li>
                  <li>• Bank account details for payments</li>
                </ul>
                <p className="text-xs text-orange-700 mt-2">
                  📋 All documents must be uploaded within 7 days of registration for account approval.
                </p>
              </div>
            </section>

            <Separator />

            {/* Communication */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Communication Policy</h3>
              </div>
              <div className="p-3 bg-cyan-50 rounded-lg">
                <h4 className="font-medium mb-2">Pending Account Status</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• During review, you can only contact platform administrators</li>
                  <li>• Use admin contact for questions about your application</li>
                  <li>• Upload required documents through your dashboard</li>
                  <li>• Full platform access granted after approval</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Legal */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" style={{ color: '#0C332C' }} />
                <h3 className="text-lg font-semibold">Legal & Compliance</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium mb-2">Important Legal Notes</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• These terms are governed by applicable local laws</li>
                    <li>• EduFiliova reserves the right to terminate accounts for violations</li>
                    <li>• Changes to terms will be communicated 30 days in advance</li>
                    <li>• Disputes will be resolved through binding arbitration</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Last updated: 2025 </p>
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
              variant="outline" 
              onClick={handleDecline}
              className="flex-1"
            >
              Decline
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!hasScrolledToBottom}
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept Terms & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherTermsModal;
