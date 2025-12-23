import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useHelpChat } from "@/contexts/HelpChatContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { 
  Search, 
  BookOpen, 
  Users, 
  Settings, 
  CreditCard, 
  Shield, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  Globe,
  GraduationCap,
  Award,
  Play,
  FileText,
  Monitor,
  Smartphone,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Star,
  ArrowRight,
  Download,
  Upload,
  Video,
  Mic,
  Camera,
  ArrowLeft,
  Home,
  Wifi,
  Lock,
  Zap,
  TrendingUp,
  DollarSign,
  BarChart,
  Eye,
  Bell,
  Calendar,
  Clipboard,
  Languages,
  Accessibility,
  HelpCircle,
  XCircle
} from "lucide-react";

interface HelpCenterProps {
  onNavigate: (page: string) => void;
}

const HelpCenter = ({ onNavigate }: HelpCenterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user, profile } = useAuth();
  const { setIsChatOpen } = useHelpChat();
  
  const handleBackToDashboard = () => {
    if (!user) {
      onNavigate("home");
      return;
    }
    
    // Navigate based on user role
    if (profile?.role === 'admin') {
      onNavigate("admin-dashboard");
    } else if (profile?.role === 'teacher') {
      onNavigate("teacher-dashboard");
    } else if (profile?.role === 'freelancer') {
      onNavigate("freelancer-dashboard");
    } else if (profile?.role === 'general') {
      onNavigate("customer-dashboard");
    } else {
      onNavigate("student-dashboard");
    }
  };

  // Comprehensive FAQ data
  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Play,
      color: "bg-primary/10 text-foreground",
      faqs: [
        {
          question: "How do I create my EduFiliova account?",
          answer: "Creating an account is simple! Click the 'Sign Up' button on our homepage, choose your role (student, teacher, or freelancer), fill in your details including your email and phone number for verification, and follow the email confirmation link. You'll be ready to start within minutes!"
        },
        {
          question: "What information do I need to register?",
          answer: "For student registration, you'll need: your full name, age, grade level, country, email address, and phone number. Teachers and freelancers need to provide qualifications, teaching experience, subjects they specialize in, and relevant verification documents."
        },
        {
          question: "How is EduFiliova different from other platforms?",
          answer: "EduFiliova is a professional education marketplace connecting students with verified teachers and freelance educators globally. We offer comprehensive course creation tools, secure payment processing, analytics dashboards, and a certification system for all users."
        },
        {
          question: "What subscription plans are available?",
          answer: "We offer Basic (free), Standard, and Premium membership tiers with varying features. Premium members get unlimited course access, advanced analytics, priority support, and enhanced course creation tools. Check our pricing page for detailed comparisons."
        },
        {
          question: "Can I try EduFiliova before committing?",
          answer: "Absolutely! Our Basic plan is completely free and gives you access to many platform features. You can browse courses, enroll in select free courses, and explore the platform before deciding to upgrade. No credit card required for the free plan."
        },
        {
          question: "How do I verify my account?",
          answer: "After registration, check your email for a verification link. Click it to verify your email address. For teachers and freelancers, additional document verification is required. Upload your credentials in your profile settings, and our team will review within 3-5 business days."
        },
        {
          question: "What browsers and devices are supported?",
          answer: "EduFiliova works on all modern browsers (Chrome, Firefox, Safari, Edge) and devices (desktop, tablet, smartphone). We recommend using the latest browser version for optimal performance. Our mobile apps are available for iOS and Android."
        },
        {
          question: "Is there a mobile app available?",
          answer: "Yes! Download our mobile apps from the App Store (iOS) or Google Play Store (Android). The mobile app offers full functionality including course viewing, live sessions, messaging, and progress tracking on the go."
        }
      ]
    },
    {
      id: "learning",
      title: "For Students",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
      faqs: [
        {
          question: "How do I find and enroll in courses?",
          answer: "Browse our course catalog with 15,000+ professional courses across all subjects. Use filters for grade level, subject, and difficulty. Click any course to view details, then click 'Enroll' to start learning. Track your enrolled courses in your dashboard."
        },
        {
          question: "How do I earn certificates?",
          answer: "Complete all course modules, pass quizzes and assignments, and achieve the required score. Once completed, your certificate is automatically generated and available for download. You can share certificates on social media or add them to your resume."
        },
        {
          question: "Can I learn at my own pace?",
          answer: "Yes! All courses are self-paced with on-demand access to materials. Study anytime, anywhere, and revisit lessons as needed. Your progress is saved automatically, so you can pick up where you left off."
        },
        {
          question: "How do I contact my course teacher?",
          answer: "Each course page has a 'Contact Teacher' button. Send messages directly to instructors, ask questions about content, or request additional help. Teachers typically respond within 24-48 hours."
        },
        {
          question: "What if I'm not satisfied with a course?",
          answer: "We offer a 14-day satisfaction guarantee. If you're not happy with a course within 14 days of enrollment, contact support for a full refund. We'll process your request within 5-7 business days."
        },
        {
          question: "How do I track my learning progress?",
          answer: "Your student dashboard displays all enrolled courses, completion percentages, upcoming assignments, and earned certificates. Each course also has a progress tracker showing completed modules, quiz scores, and time spent learning."
        },
        {
          question: "Can I download course materials for offline access?",
          answer: "Premium members can download video lectures and PDF materials for offline study. Downloaded content is accessible in your mobile app even without internet connection. Note that interactive quizzes require an internet connection."
        },
        {
          question: "How do I join live class sessions?",
          answer: "Live sessions are scheduled in course calendars. You'll receive email and app notifications before sessions start. Click 'Join Session' from your dashboard or course page at the scheduled time. Make sure your camera and microphone are working."
        },
        {
          question: "Can I get homework help or tutoring?",
          answer: "Yes! Many teachers offer one-on-one tutoring sessions. Look for 'Book Tutoring' on teacher profiles or course pages. You can schedule sessions, video chat with tutors, and get personalized help with assignments."
        },
        {
          question: "What happens if I miss a deadline?",
          answer: "Course deadlines are flexible for self-paced learning. However, for live cohort courses, late submissions may affect your grade. Contact your instructor if you need an extension. Most teachers are understanding about genuine circumstances."
        }
      ]
    },
    {
      id: "teachers",
      title: "For Teachers",
      icon: Users,
      color: "bg-green-100 text-green-600",
      faqs: [
        {
          question: "How do I apply to become a teacher on EduFiliova?",
          answer: "Click 'Become a Teacher' in the header, complete the application form with your qualifications and teaching experience, upload required documents (degree certificates, teaching licenses), and wait for our verification process. We typically respond within 3-5 business days."
        },
        {
          question: "What qualifications do I need to teach?",
          answer: "We require a bachelor's degree (minimum) in your teaching subject, teaching certification or equivalent experience (2+ years), strong communication skills, and the ability to create engaging digital content. Additional certifications strengthen your application."
        },
        {
          question: "How do I create and publish courses?",
          answer: "Use our comprehensive Course Creator tool in your teacher dashboard. Upload content, organize into modules, add quizzes and assignments, set your pricing, and submit for quality review. Approved courses go live within 24-48 hours."
        },
        {
          question: "How much can I earn as a teacher?",
          answer: "Teacher earnings vary based on course enrollment, pricing, student reviews, and engagement. You receive 70% of course revenue. Payments are processed monthly through our secure payment system. Top teachers earn significantly based on their course popularity and student base."
        },
        {
          question: "How do I track my earnings and student progress?",
          answer: "Your teacher dashboard provides detailed analytics including total earnings, student enrollments, course performance, completion rates, and revenue trends. You can export reports for accounting purposes and track individual student progress."
        },
        {
          question: "Can I update my courses after publishing?",
          answer: "Yes! You can update course content, add new modules, fix errors, or improve materials anytime. Updates are reflected immediately for all enrolled students. Major changes may require re-review by our quality team."
        },
        {
          question: "How do I schedule and conduct live sessions?",
          answer: "Use the Live Session Scheduler in your course settings. Set date, time, and duration. Students receive automatic notifications. Start sessions from your dashboard using our built-in video conferencing tool with screen sharing, whiteboard, and recording features."
        },
        {
          question: "Can I offer private tutoring in addition to courses?",
          answer: "Absolutely! Enable 'Private Tutoring' in your profile settings, set your hourly rate and availability. Students can book sessions directly through your profile. You'll receive booking notifications and can manage your calendar in your dashboard."
        },
        {
          question: "How do I handle student disputes or complaints?",
          answer: "If a student raises a concern, respond professionally and promptly. Most issues can be resolved through direct communication. If escalated, our mediation team will review the case and work toward a fair resolution. Maintain all communication on-platform for records."
        },
        {
          question: "What support tools are available for course creation?",
          answer: "We provide video editing tools, presentation templates, quiz builders, assignment creators, curriculum planners, and a media library. Premium teacher accounts get access to advanced analytics, AI-powered content suggestions, and professional design resources."
        }
      ]
    },
    {
      id: "freelancers",
      title: "For Freelancers",
      icon: Award,
      color: "bg-purple-100 text-primary",
      faqs: [
        {
          question: "What is a freelancer on EduFiliova?",
          answer: "Freelancers are independent educators who create and sell specialized courses on our platform. Unlike full-time teachers, freelancers can focus on niche topics, work flexible hours, and build their own educational business while reaching a global student base."
        },
        {
          question: "How do I join as a freelance educator?",
          answer: "Click 'Become a Teacher' and select 'Freelancer' as your role. Submit your professional credentials, expertise areas, and sample work. Once approved, you can start creating courses, set your own pricing, and manage your educational business through your dashboard."
        },
        {
          question: "What's the difference between teachers and freelancers?",
          answer: "Teachers typically offer comprehensive curriculum-based courses, while freelancers focus on specialized skills, professional development, or niche subjects. Both use the same platform tools but may have different pricing structures and target audiences."
        },
        {
          question: "How do I set pricing for my courses?",
          answer: "You have complete control over course pricing. Consider your content depth, competition, target audience, and market rates. We provide pricing analytics to help you optimize. You can also offer discounts, bundle courses, or create subscription packages."
        },
        {
          question: "Can I offer both free and paid courses?",
          answer: "Yes! Many successful freelancers use free introductory courses to attract students, then offer paid advanced courses. This builds trust and showcases your teaching quality. You can mix free and premium content in your course portfolio."
        },
        {
          question: "How do I market my freelance courses?",
          answer: "Use your teacher profile as your portfolio, optimize course titles and descriptions for search, encourage student reviews, offer promotional pricing, and share courses on social media. We also feature high-quality courses in our marketplace promotions."
        },
        {
          question: "Can I sell courses on multiple platforms?",
          answer: "Yes, you retain rights to your content. However, exclusive courses on EduFiliova receive promotional priority and higher visibility in our marketplace. Consider offering some exclusive content to maximize platform benefits."
        },
        {
          question: "How do freelancer payouts work?",
          answer: "Freelancers earn 70% of course revenue. Payouts are processed monthly via your preferred method (bank transfer, PayPal, or Payoneer). Minimum payout threshold is $50. You can track earnings in real-time through your financial dashboard."
        },
        {
          question: "What happens if I want to stop offering a course?",
          answer: "You can unpublish courses anytime, but students who already enrolled retain access to purchased content. Consider archiving rather than deleting to honor existing student access. You can always republish courses later if you change your mind."
        },
        {
          question: "Do I need business insurance or licenses?",
          answer: "Requirements vary by location. We recommend consulting with a tax professional about your freelance education business. EduFiliova provides necessary tax documentation for your earnings. You're responsible for complying with local business regulations."
        }
      ]
    },
    {
      id: "course-creation",
      title: "Course Creation & Management",
      icon: Video,
      color: "bg-primary/15 text-primary",
      faqs: [
        {
          question: "What file formats are supported for course uploads?",
          answer: "We support video files (MP4, MOV, AVI), documents (PDF, DOCX, PPT), images (JPG, PNG, GIF), and audio files (MP3, WAV). Maximum file size is 2GB per upload. For larger files, consider using our video compression tool or splitting into multiple segments."
        },
        {
          question: "How long should my course videos be?",
          answer: "Ideal video length is 5-15 minutes per lesson for better engagement. Break longer topics into multiple short videos. Students prefer bite-sized content they can complete in one sitting. Total course length can range from 2 hours to 50+ hours depending on subject complexity."
        },
        {
          question: "Can I reuse content from my existing courses?",
          answer: "Yes, if you own the content rights. You can upload the same materials to multiple courses or create course variations. However, each course should offer unique value. Simply repackaging identical content into multiple courses may violate our quality guidelines."
        },
        {
          question: "How do I create engaging quizzes and assignments?",
          answer: "Use our Quiz Builder to create multiple-choice, true/false, short answer, and essay questions. Include detailed explanations for correct answers. For assignments, provide clear instructions, grading rubrics, and example submissions. Interactive elements increase course completion rates."
        },
        {
          question: "Can I add guest instructors or co-teachers to my course?",
          answer: "Yes! Premium teachers can add co-instructors to courses. Go to Course Settings > Instructors > Add Co-Teacher. Revenue sharing can be configured between instructors. All instructors must have verified teacher accounts."
        },
        {
          question: "How do I organize my course structure effectively?",
          answer: "Structure courses into logical sections and modules. Start with prerequisites, then build complexity gradually. Include: introduction, main content sections, practical exercises, assessments, and conclusion. Each module should have clear learning objectives and outcomes."
        },
        {
          question: "What's the course review and approval process?",
          answer: "After submission, our quality team reviews courses for content accuracy, video/audio quality, proper structure, and compliance with guidelines. This typically takes 24-48 hours. You'll receive feedback if changes are needed. Once approved, your course goes live immediately."
        },
        {
          question: "Can I offer course completion certificates?",
          answer: "Yes! All courses can issue certificates upon completion. Customize certificate templates with your branding, course details, and signatures. Certificates are automatically generated when students meet completion criteria (typically 80%+ in assessments)."
        },
        {
          question: "How do I handle course updates for enrolled students?",
          answer: "Updates appear automatically for all enrolled students. Send an announcement when making major updates so students know about new content. Students who completed the course can access new materials without additional payment."
        },
        {
          question: "What's the recommended course pricing strategy?",
          answer: "Research similar courses to understand market rates. New instructors often start with lower prices to build reviews, then increase as reputation grows. Consider offering early-bird discounts or bundle deals. Average course prices range from $19 to $199 depending on depth and niche."
        }
      ]
    },
    {
      id: "technical",
      title: "Technical Support",
      icon: Settings,
      color: "bg-primary/15 text-primary-600",
      faqs: [
        {
          question: "What devices and browsers are supported?",
          answer: "EduFiliova works on all modern devices: computers (Windows, Mac, Linux), tablets, and smartphones (iOS, Android). We support Chrome, Firefox, Safari, and Edge browsers. For the best experience, use the latest browser version."
        },
        {
          question: "I'm having trouble with video playback. What should I do?",
          answer: "First, check your internet connection (minimum 5 Mbps recommended). Clear your browser cache, disable ad blockers for our site, try a different browser, or switch to a different network. If issues persist, contact our technical support team."
        },
        {
          question: "How do I reset my password?",
          answer: "Click 'Forgot Password' on the login page, enter your email address, and check for a reset link in your email (including spam folder). The link expires in 24 hours. If you don't receive it, contact support for manual password reset."
        },
        {
          question: "My account seems to be locked. How do I unlock it?",
          answer: "Accounts are temporarily locked after 5 failed login attempts for security. Wait 30 minutes for automatic unlock, or contact our support team with your account details for immediate assistance."
        },
        {
          question: "How do I update my profile information?",
          answer: "Go to Settings > Profile from your dashboard. You can update your name, contact information, grade level, subjects, and profile picture. Some changes (like email) require verification before taking effect."
        },
        {
          question: "What internet speed do I need for live sessions?",
          answer: "Minimum 10 Mbps download and 5 Mbps upload for smooth video conferencing. For HD quality, we recommend 25 Mbps download and 10 Mbps upload. Test your connection before important live sessions using our built-in speed test tool."
        },
        {
          question: "How do I clear my browser cache?",
          answer: "Chrome: Press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac), select 'Cached images and files', then Clear data. Firefox: Ctrl+Shift+Delete, check Cache, Clear Now. Safari: Safari menu > Clear History. Edge: Ctrl+Shift+Delete, select Cached data."
        },
        {
          question: "Can I use EduFiliova on multiple devices simultaneously?",
          answer: "Yes! Your account can be accessed from multiple devices. However, video streaming is limited to one device at a time for security. Your progress syncs across all devices automatically."
        },
        {
          question: "Why am I seeing buffering during video playback?",
          answer: "Buffering usually indicates slow internet connection. Try lowering video quality (click settings icon on player), pause video to let it buffer, close other bandwidth-heavy applications, or switch to a stronger Wi-Fi network. Mobile users should prefer Wi-Fi over cellular data."
        },
        {
          question: "How do I enable notifications for my courses?",
          answer: "Go to Settings > Notifications. Enable browser notifications, email alerts, and mobile push notifications. Customize which events trigger notifications: new announcements, assignment deadlines, live session reminders, messages from instructors, etc."
        }
      ]
    },
    {
      id: "billing",
      title: "Billing & Subscriptions",
      icon: CreditCard,
      color: "bg-yellow-100 text-yellow-600",
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay, and bank transfers in select regions. All transactions are secure and encrypted using industry-standard SSL protection with PCI DSS compliance."
        },
        {
          question: "How do I upgrade to Premium?",
          answer: "Click 'Upgrade to Premium' in your dashboard or visit our pricing page. Choose your preferred plan (monthly or yearly), enter payment details, and your Premium features activate immediately. You'll receive an email confirmation with receipt."
        },
        {
          question: "Can I cancel my Premium subscription anytime?",
          answer: "Yes! You can cancel anytime from Settings > Subscription. Your Premium features remain active until the end of your current billing period. We don't provide partial refunds, but you'll continue to have full access until expiration. Downloaded content remains accessible."
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 14-day money-back guarantee for first-time Premium subscribers and individual course purchases. If you're not satisfied within 14 days, contact support for a full refund. Refunds are processed within 5-7 business days to your original payment method."
        },
        {
          question: "Why was my payment declined?",
          answer: "Payment declines can occur due to insufficient funds, card expiration, incorrect details, international transaction restrictions, or bank fraud protection. Check your card details, contact your bank to authorize the transaction, or try an alternative payment method."
        },
        {
          question: "How do I update my payment information?",
          answer: "Go to Settings > Billing > Payment Methods. Add a new card or update existing payment details. You can set a default payment method for subscriptions and store multiple cards for convenience. All payment data is encrypted and secure."
        },
        {
          question: "What happens if my subscription payment fails?",
          answer: "If auto-renewal fails, you'll receive an email notification. You have 7 days to update payment information before your subscription is cancelled. During this grace period, you retain Premium access. Update payment in Settings > Billing to avoid interruption."
        },
        {
          question: "Can I get a discount for annual subscriptions?",
          answer: "Yes! Annual plans offer 20-30% savings compared to monthly billing. We also offer student discounts (with valid ID), educator discounts, bulk licenses for institutions, and seasonal promotions. Check our pricing page for current offers."
        },
        {
          question: "How do I view my purchase history and invoices?",
          answer: "Access Settings > Billing > Purchase History to view all transactions. Download invoices as PDF for accounting purposes. Invoices include transaction date, amount, payment method, and itemized breakdown. Archives are available for up to 7 years."
        },
        {
          question: "Are there any hidden fees or charges?",
          answer: "No hidden fees! The displayed price is what you pay. For international transactions, your bank may charge currency conversion fees. Course creators pay a 30% platform fee on sales. All fees are clearly disclosed before purchase confirmation."
        },
        {
          question: "Can I switch between monthly and annual billing?",
          answer: "Yes! Upgrade from monthly to annual anytime to save money. When switching, you'll receive a prorated credit for your remaining monthly subscription. Downgrading from annual to monthly takes effect at the end of your current billing cycle."
        },
        {
          question: "How do teacher/freelancer payouts work?",
          answer: "Instructors receive 70% of course revenue. Payouts are processed monthly on the 15th for previous month's earnings. Minimum payout is $50. Choose from bank transfer (1-3 days), PayPal (instant), or Payoneer (1-2 days). Tax forms required for amounts over $600/year."
        }
      ]
    },
    {
      id: "safety",
      title: "Safety & Privacy",
      icon: Shield,
      color: "bg-indigo-100 text-indigo-600",
      faqs: [
        {
          question: "How do you protect my personal information?",
          answer: "We use enterprise-grade security measures including 256-bit SSL encryption, secure cloud servers, regular security audits, penetration testing, and strict data access controls. We never share your personal information with third parties without your explicit consent. Our privacy practices comply with GDPR and CCPA."
        },
        {
          question: "Is it safe for minors to use EduFiliova?",
          answer: "Yes! We have strict safety protocols for users under 18. All teacher interactions are monitored, inappropriate content is filtered using AI and human moderation, and we require parental consent for users under 13. Parents can monitor their child's activity through family accounts and receive activity reports."
        },
        {
          question: "How do I report inappropriate behavior or content?",
          answer: "Use the 'Report' button available on all content and user profiles. Provide detailed information about the issue. Our moderation team reviews all reports within 24 hours and takes appropriate action including warnings, content removal, temporary suspension, or permanent account termination for severe violations."
        },
        {
          question: "Can I control who can contact me on the platform?",
          answer: "Yes! In Settings > Privacy, you can control who can send you messages, view your profile, and see your activity. Options include everyone, teachers only, enrolled students only, or no one. You can also block specific users and report harassment."
        },
        {
          question: "What data do you collect and why?",
          answer: "We collect account information (name, email), learning data (course progress, quiz scores), usage analytics (page views, feature usage), and payment information (securely processed by third-party processors). This data improves your experience, personalizes recommendations, and ensures platform security. View detailed data collection in our Privacy Policy."
        },
        {
          question: "Can I delete my account and data?",
          answer: "Yes, you have the right to delete your account anytime. Go to Settings > Account > Delete Account. This permanently removes your personal data within 30 days, except transaction records required for legal/tax purposes (retained for 7 years). You can export your data before deletion."
        },
        {
          question: "How do you verify teacher credentials?",
          answer: "All teachers must submit government-issued ID, educational certificates, and teaching credentials. Our verification team cross-checks documents, conducts background checks where legally permitted, and may request additional verification. Fake credentials result in immediate account termination and potential legal action."
        },
        {
          question: "Is my payment information secure?",
          answer: "Absolutely! We don't store complete credit card information on our servers. Payments are processed through PCI DSS Level 1 certified providers (Stripe, PayPal). Card details are tokenized and encrypted. We only store the last 4 digits for transaction reference."
        },
        {
          question: "What happens to my data if EduFiliova closes?",
          answer: "In the unlikely event of service closure, we'll provide 90 days notice. You can export all your data (course progress, certificates, uploaded content). We'll transfer data to a successor service if applicable, or securely delete all user data following legal requirements."
        },
        {
          question: "How do I enable two-factor authentication?",
          answer: "Enhance security by enabling 2FA in Settings > Security > Two-Factor Authentication. Choose SMS, email, or authenticator app (Google Authenticator, Authy). You'll need to enter a code each login. Store backup codes safely in case you lose access to your 2FA device."
        }
      ]
    },
    {
      id: "accessibility",
      title: "Accessibility & Inclusion",
      icon: Accessibility,
      color: "bg-teal-100 text-teal-600",
      faqs: [
        {
          question: "What accessibility features are available?",
          answer: "EduFiliova is WCAG 2.1 Level AA compliant with: screen reader support, keyboard navigation, closed captions on all videos, adjustable font sizes, high contrast mode, transcript downloads, audio descriptions for visual content, and compatibility with assistive technologies."
        },
        {
          question: "How do I enable closed captions for videos?",
          answer: "Click the 'CC' button on the video player. Auto-generated captions are available for all videos. Many instructors provide professionally edited captions for accuracy. You can adjust caption size, color, and position in player settings for better readability."
        },
        {
          question: "Are courses available in multiple languages?",
          answer: "Yes! We offer courses in 50+ languages. Use the language filter when browsing courses. Many popular courses have subtitles in multiple languages. The platform interface is available in 20 major languages - change your preference in Settings > Language."
        },
        {
          question: "Can I use EduFiliova with a screen reader?",
          answer: "Absolutely! Our platform is optimized for JAWS, NVDA, VoiceOver, and TalkBack screen readers. All interface elements have proper ARIA labels, images have alt text, and videos include audio descriptions. Report any accessibility issues to help us improve."
        },
        {
          question: "How do I request accommodations for disabilities?",
          answer: "Contact our support team at support@edufiliova.com with your specific needs. We provide: extended time for assessments, alternative formats for content, sign language interpretation for live sessions, and customized learning plans. Accommodations are free and confidential."
        },
        {
          question: "Is there a dyslexia-friendly mode?",
          answer: "Yes! Enable dyslexia-friendly mode in Settings > Accessibility. This activates OpenDyslexic font, increases line spacing, provides text-to-speech, highlights text while reading, and offers customizable background colors to reduce visual stress."
        },
        {
          question: "Can I adjust video playback speed?",
          answer: "Yes! Video player supports 0.5x to 2x speed adjustment. Many students with processing differences find slower speeds helpful, while others prefer faster speeds for review. Speed settings persist across videos and sync across devices."
        },
        {
          question: "Are live sessions accessible for deaf/hard of hearing students?",
          answer: "Yes! Live sessions include real-time auto-captions, live transcription, and chat functionality for text-based participation. Premium members can request professional sign language interpretation for live sessions (48-hour advance notice required)."
        }
      ]
    },
    {
      id: "analytics",
      title: "Analytics & Reporting",
      icon: BarChart,
      color: "bg-cyan-100 text-cyan-600",
      faqs: [
        {
          question: "How do I track my learning progress as a student?",
          answer: "Your student dashboard shows: overall progress percentage, completed courses, time spent learning, quiz scores, certificates earned, and learning streaks. Each course has detailed analytics showing module completion, assessment results, and estimated time to finish."
        },
        {
          question: "What analytics are available for teachers?",
          answer: "Teacher analytics include: total student enrollments, course completion rates, average quiz scores, student engagement metrics, revenue tracking, popular content sections, drop-off points, student demographics, and review ratings. Export reports as CSV or PDF."
        },
        {
          question: "Can I see which students are struggling in my course?",
          answer: "Yes! The Student Progress Dashboard identifies at-risk students based on: low quiz scores, incomplete assignments, inactivity, and time spent on modules. You can send personalized messages, offer additional resources, or schedule one-on-one help sessions."
        },
        {
          question: "How do I export my course data?",
          answer: "Go to Course Management > Analytics > Export Data. Choose date range and metrics (enrollments, revenue, completion, engagement). Export formats: CSV (for spreadsheets), PDF (reports), or JSON (API integration). Schedule automated weekly/monthly reports via email."
        },
        {
          question: "What metrics should I focus on to improve my course?",
          answer: "Key metrics: completion rate (target 70%+), average quiz scores (target 80%+), student satisfaction (4+ stars), engagement rate (video watch time, quiz attempts), and revenue per student. Low completion suggests content length/difficulty issues. Monitor student feedback for qualitative insights."
        },
        {
          question: "Can I A/B test different course elements?",
          answer: "Premium instructors can A/B test: course titles, thumbnail images, pricing, introduction videos, and content order. Split your audience and measure: enrollment rate, completion rate, and student satisfaction. Use winning variations to optimize performance."
        },
        {
          question: "How accurate are the earnings projections?",
          answer: "Earnings projections use historical data, seasonal trends, and similar course performance. Projections become more accurate over time. Actual earnings depend on: marketing efforts, student reviews, pricing changes, competition, and platform trends. Use as estimates, not guarantees."
        },
        {
          question: "What is the student engagement score?",
          answer: "Engagement score (0-100) measures: video watch completion, quiz participation, discussion involvement, assignment submissions, and login frequency. Higher engagement correlates with better learning outcomes and completion rates. Platform average is 65."
        }
      ]
    },
    {
      id: "community",
      title: "Community & Support",
      icon: Users,
      color: "bg-pink-100 text-pink-600",
      faqs: [
        {
          question: "How do I join discussion forums?",
          answer: "Each course has a dedicated discussion forum. Access from the course page or your dashboard. Participate in topic discussions, ask questions, share insights, and help fellow students. Top contributors receive Community Helper badges."
        },
        {
          question: "Can I connect with other students?",
          answer: "Yes! Use the Student Networking feature to find study partners, join study groups, and connect based on shared interests or courses. Enable networking in Settings > Privacy. You can message connections and schedule virtual study sessions."
        },
        {
          question: "How do I become a course reviewer or beta tester?",
          answer: "Active users with 5+ completed courses can apply to be course reviewers. Reviewers get early access to new courses, provide feedback to instructors, and earn rewards. Apply at Community > Become a Reviewer. Selection based on activity and quality feedback."
        },
        {
          question: "Are there student competitions or challenges?",
          answer: "Yes! We host monthly challenges: coding competitions, creative projects, quiz championships, and subject-specific contests. Winners receive prizes, certificates, platform credits, and featured profiles. Check Community > Challenges for upcoming events."
        },
        {
          question: "How do I report bugs or suggest features?",
          answer: "Go to Help > Report Bug or Suggest Feature. Provide details and screenshots. Our product team reviews all submissions. Implemented suggestions earn contributor credits. Track your submissions and vote on others' suggestions in the Feature Request portal."
        },
        {
          question: "Can I become a platform ambassador or affiliate?",
          answer: "Yes! Join our Ambassador Program to earn by referring students and teachers. Receive unique referral links, earn 10-20% commission on referrals, get exclusive swag, and access ambassador-only events. Apply at Community > Ambassador Program."
        },
        {
          question: "Is there a student or teacher community outside the platform?",
          answer: "Join our official communities: Discord server (real-time chat), Facebook group (discussions), LinkedIn group (professional networking), Reddit community (r/edufiliova), and YouTube channel (tutorials, success stories). Links in Help > Community."
        }
      ]
    },
    {
      id: "troubleshooting",
      title: "Common Issues & Troubleshooting",
      icon: AlertCircle,
      color: "bg-rose-100 text-rose-600",
      faqs: [
        {
          question: "Why can't I log into my account?",
          answer: "Common causes: incorrect password (case-sensitive), account not verified (check email), account temporarily locked (after failed login attempts), or browser cache issues. Try: password reset, clearing cache, different browser, or incognito mode. Contact support if persistent."
        },
        {
          question: "My course progress isn't saving. What should I do?",
          answer: "Ensure you're logged in (not guest mode), have stable internet connection, and JavaScript is enabled. Click 'Mark Complete' after each lesson. Clear browser cache and cookies. If using mobile, ensure app is updated. Progress should sync within 5 minutes."
        },
        {
          question: "Why are videos not playing?",
          answer: "Check: internet connection (5+ Mbps), disable VPN/proxy, update browser to latest version, disable ad blockers for our site, clear cache, try different browser. For mobile: update app, check storage space. Still not working? Try lower video quality in player settings."
        },
        {
          question: "I purchased a course but can't access it. Help!",
          answer: "Verify: payment confirmation email received, logged into correct account, course not archived by instructor. Check My Courses dashboard. Payment processing may take 5-10 minutes. If paid but not visible after 30 minutes, contact support with transaction ID."
        },
        {
          question: "My certificate isn't generating. What's wrong?",
          answer: "Certificates generate only after: completing all modules (100%), passing all required quizzes (80%+ typically), submitting all assignments, and meeting any additional course requirements. Check Course Progress for incomplete items. Certificate generation can take up to 24 hours."
        },
        {
          question: "Why am I getting a 404 error?",
          answer: "Page may have been moved, deleted, or the URL is incorrect. Common causes: course unpublished by instructor, temporary server issues, or outdated bookmark. Try: refreshing page, checking URL spelling, going to homepage and navigating from there. Report persistent 404s to support."
        },
        {
          question: "Live session audio/video isn't working. Fix?",
          answer: "Grant camera/microphone permissions in browser settings. Check: correct input/output devices selected, other apps not using camera/mic, latest browser version, hardware drivers updated. Test with device check tool before joining sessions. Use headphones to prevent echo."
        },
        {
          question: "I'm not receiving email notifications. Why?",
          answer: "Check: spam/junk folder, notification settings enabled (Settings > Notifications), email address correct in profile, email provider not blocking our domain (edufiliova.com). Add us to contacts/safe senders. Some email providers delay bulk emails up to 30 minutes."
        },
        {
          question: "Why is the platform running slow?",
          answer: "Possible causes: slow internet connection, outdated browser, too many browser tabs, insufficient device memory, or peak usage times. Solutions: close unnecessary tabs, clear cache, restart browser, update browser/device, use Ethernet instead of Wi-Fi, try off-peak hours."
        },
        {
          question: "My uploaded content failed. What went wrong?",
          answer: "Check: file size within limits (2GB max), supported file format, stable internet during upload, sufficient storage quota remaining. Large files: use wired connection, upload during off-peak hours, compress videos. If upload freezes, clear cache and retry."
        }
      ]
    }
  ];

  // Quick help guides with more detail
  const quickGuides = [
    {
      title: "Student Quick Start Guide",
      description: "Get started with learning in 5 easy steps",
      duration: "5 min read",
      icon: GraduationCap,
      steps: [
        "Create your student account and verify your email",
        "Complete your profile with grade level and interests",
        "Browse 15,000+ courses and enroll in your favorites",
        "Study at your own pace and track your progress",
        "Earn certificates and showcase your achievements"
      ]
    },
    {
      title: "Teacher Success Guide",
      description: "Build your teaching career on EduFiliova",
      duration: "8 min read",
      icon: Users,
      steps: [
        "Apply with your credentials and get verified",
        "Create your professional teacher profile",
        "Build engaging courses using our course creator",
        "Set pricing and publish to our global marketplace",
        "Track earnings and grow your student base"
      ]
    },
    {
      title: "Freelancer Business Guide",
      description: "Launch your educational business as a freelancer",
      duration: "10 min read",
      icon: Award,
      steps: [
        "Join as a freelance educator and get verified",
        "Identify your niche and target audience",
        "Create specialized courses with competitive pricing",
        "Market your courses and build your brand",
        "Scale your business with student feedback and analytics"
      ]
    },
    {
      title: "Platform Features Guide",
      description: "Master all the professional tools available",
      duration: "6 min read",
      icon: Star,
      steps: [
        "Navigate your personalized dashboard efficiently",
        "Use analytics to track performance and growth",
        "Manage payments and subscriptions securely",
        "Leverage our certification and credentialing system",
        "Access support and resources for success"
      ]
    }
  ];

  // Support contact options
  const supportOptions = [
    {
      method: "Live Chat Support",
      description: "Get immediate help from our support team",
      availability: "24/7 for all users",
      icon: MessageCircle,
      action: "Start Chat",
      primary: true
    },
    {
      method: "Email Support",
      description: "Send detailed questions or feedback",
      availability: "Response within 24 hours",
      icon: Mail,
      action: "Send Email",
      contact: "support@edufiliova.com"
    },
    {
      method: "WhatsApp Support",
      description: "Quick messaging support via WhatsApp",
      availability: "Fast response, 24/7",
      icon: MessageCircle,
      action: "Message Us",
      contact: "+15558754842",
      link: "https://wa.me/15558754842"
    }
  ];

  // Enhanced search with highlighting
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
        : part
    );
  };

  // Filter FAQs based on search and category
  const filteredResults = useMemo(() => {
    const results: Array<{
      category: typeof faqCategories[0];
      faqs: Array<{ faq: typeof faqCategories[0]['faqs'][0]; index: number }>;
    }> = [];

    faqCategories.forEach(category => {
      if (selectedCategory !== "all" && category.id !== selectedCategory) return;

      const matchingFaqs: Array<{ faq: typeof category.faqs[0]; index: number }> = [];
      
      category.faqs.forEach((faq, index) => {
        const searchLower = searchQuery.toLowerCase();
        const questionMatch = faq.question.toLowerCase().includes(searchLower);
        const answerMatch = faq.answer.toLowerCase().includes(searchLower);
        
        if (!searchQuery || questionMatch || answerMatch) {
          matchingFaqs.push({ faq, index });
        }
      });

      if (matchingFaqs.length > 0) {
        results.push({ category, faqs: matchingFaqs });
      }
    });

    return results;
  }, [searchQuery, selectedCategory]);

  const totalResults = filteredResults.reduce((sum, cat) => sum + cat.faqs.length, 0);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onNavigate={onNavigate} currentPage="help" />
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-center py-20 pt-32 bg-gradient-to-br from-primary/10 via-white to-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto text-gray-800">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Help Center
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Professional support for students, teachers, and freelancers - Find answers and maximize your success
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#2f5a4e' }} />
              <Input
                type="text"
                placeholder="Search for answers, guides, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white text-gray-800 border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-primary/50"
                data-testid="input-help-search"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full"
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  <XCircle className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                </Button>
              )}
            </div>
            
            {/* Search Results Count */}
            {searchQuery && (
              <p className="text-sm text-muted-foreground" data-testid="text-search-results">
                {totalResults} {totalResults === 1 ? 'result' : 'results'} found for "{searchQuery}"
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">

        {/* Quick Actions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Get Help Fast</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Intro Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Headphones className="h-8 w-8" style={{ color: '#2f5a4e' }} />
                </div>
                <CardTitle className="text-lg">We're Here to Help</CardTitle>
                <CardDescription>Multiple ways to reach our support team</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Choose the best contact method for you. We're available 24/7 to assist with any questions.
                </p>
              </CardContent>
            </Card>
            
            {supportOptions.map((option, index) => (
              <Card key={index} className={`hover-lift transition-all duration-200 ${option.primary ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    option.primary ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <option.icon className="h-8 w-8" style={{ color: '#2f5a4e' }} />
                  </div>
                  <CardTitle className="text-lg">{option.method}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4 inline mr-1" style={{ color: '#2f5a4e' }} />
                    {option.availability}
                  </div>
                  <Button 
                    className={`w-full ${option.primary ? 'bg-primary text-[#ffffff]' : 'variant-outline'}`}
                    onClick={() => {
                      if (option.method === "Live Chat Support") {
                        setIsChatOpen(true);
                      } else if (option.method === "Email Support") {
                        window.location.href = `mailto:${option.contact}`;
                      } else if (option.method === "WhatsApp Support" && option.link) {
                        window.open(option.link, '_blank', 'noopener,noreferrer');
                      } else {
                        onNavigate("contact");
                      }
                    }}
                    data-testid={`button-${option.method.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {option.action}
                  </Button>
                  {option.contact && (
                    <div className="text-sm text-muted-foreground mt-2">{option.contact}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Start Guides */}
        {!searchQuery && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Quick Start Guides</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {quickGuides.map((guide, index) => (
                <Card key={index} className="hover-lift">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <guide.icon className="h-6 w-6" style={{ color: '#2f5a4e' }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                          {guide.duration}
                        </div>
                      </div>
                    </div>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-foreground flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                            {stepIndex + 1}
                          </div>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
          </h2>
          
          {/* Category Filter */}
          {!searchQuery && (
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Button
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full ${selectedCategory === "all" ? 'bg-primary text-white' : 'bg-transparent text-foreground'}`}
                data-testid="button-category-all"
              >
                All Categories
              </Button>
              {faqCategories.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full ${selectedCategory === category.id ? 'bg-primary text-white' : 'bg-transparent text-foreground'}`}
                  data-testid={`button-category-${category.id}`}
                >
                  <category.icon className="h-4 w-4 mr-2" style={{ color: selectedCategory === category.id ? '#ffffff' : '#2f5a4e' }} />
                  {category.title}
                </Button>
              ))}
            </div>
          )}

          {/* FAQ Content with Highlighting */}
          <div className="max-w-4xl mx-auto">
            {totalResults === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <HelpCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#2f5a4e' }} />
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try different keywords or browse by category
                  </p>
                  <Button onClick={() => setSearchQuery("")} data-testid="button-clear-search-no-results">
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredResults.map(({ category, faqs }) => (
                <Card key={category.id} className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                        <category.icon className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                      </div>
                      {category.title}
                      <Badge variant="secondary">{faqs.length} {faqs.length === 1 ? 'question' : 'questions'}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {faqs.map(({ faq, index: faqIndex }) => (
                        <AccordionItem 
                          key={faqIndex} 
                          value={`${category.id}-${faqIndex}`} 
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-left hover:no-underline" transition-all duration-300 data-testid={`accordion-trigger-${category.id}-${faqIndex}`}>
                            {searchQuery ? highlightText(faq.question, searchQuery) : faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed">
                            {searchQuery ? highlightText(faq.answer, searchQuery) : faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Resources Section */}
        {!searchQuery && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3 flex items-center gap-2 justify-center">
                <BookOpen className="h-7 w-7" style={{ color: '#2f5a4e' }} />
                Legal & Policy Resources
              </h2>
              <p className="text-muted-foreground">Browse our complete collection of policies, terms, and guidelines</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Privacy & Security */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Privacy Policy</CardTitle>
                      <CardDescription className="text-xs">How we protect your data</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("privacy")} 
                    data-testid="button-resource-privacy"
                  >
                    View Policy
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* Terms of Service */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Terms of Service</CardTitle>
                      <CardDescription className="text-xs">General platform terms</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("terms")} 
                    data-testid="button-resource-terms"
                  >
                    View Terms
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* Student Terms */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Student Terms</CardTitle>
                      <CardDescription className="text-xs">For learners & students</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("student-terms")} 
                    data-testid="button-resource-student-terms"
                  >
                    View Terms
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* Teacher Terms */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Teacher Terms</CardTitle>
                      <CardDescription className="text-xs">For educators & instructors</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("teacher-terms")} 
                    data-testid="button-resource-teacher-terms"
                  >
                    View Terms
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* School/Institution Terms */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">School Terms</CardTitle>
                      <CardDescription className="text-xs">For institutions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("school-terms")} 
                    data-testid="button-resource-school-terms"
                  >
                    View Terms
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* Payment & Billing Policy */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Payment Policy</CardTitle>
                      <CardDescription className="text-xs">Billing & transactions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("payment-billing")} 
                    data-testid="button-resource-payment-policy"
                  >
                    View Policy
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* Refund Policy */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Refund Policy</CardTitle>
                      <CardDescription className="text-xs">Returns & refunds</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("refund-policy")} 
                    data-testid="button-resource-refund-policy"
                  >
                    View Policy
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* Cookies Policy */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <Eye className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Cookies Policy</CardTitle>
                      <CardDescription className="text-xs">Cookie usage & tracking</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("cookies-policy")} 
                    data-testid="button-resource-cookies-policy"
                  >
                    View Policy
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* WhatsApp Policy */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">WhatsApp Policy</CardTitle>
                      <CardDescription className="text-xs">Messaging guidelines</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("whatsapp-policy")} 
                    data-testid="button-resource-whatsapp-policy"
                  >
                    View Policy
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* Data Retention Policy */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Data Retention</CardTitle>
                      <CardDescription className="text-xs">How long we keep data</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("data-retention")} 
                    data-testid="button-resource-data-retention-policy"
                  >
                    View Policy
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>

              {/* Community Guidelines */}
              <Card className="hover-lift transition-all duration-200 border-primary/20 hover:border-primary/40" transition-all duration-300>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Community Guidelines</CardTitle>
                      <CardDescription className="text-xs">Behavior & conduct rules</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-sm h-9" 
                    onClick={() => onNavigate("community-guidelines")} 
                    data-testid="button-resource-community-guidelines"
                  >
                    View Guidelines
                    <ArrowRight className="h-4 w-4" style={{ color: '#2f5a4e' }} />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Additional Resources */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-xl font-semibold mb-4 text-center">Additional Resources</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  data-testid="button-resource-mobile"
                >
                  <Download className="h-6 w-6" style={{ color: '#2f5a4e' }} />
                  <span className="font-medium">Download Mobile App</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => onNavigate("contact")} 
                  data-testid="button-resource-contact"
                >
                  <MessageCircle className="h-6 w-6" style={{ color: '#2f5a4e' }} />
                  <span className="font-medium">Contact Form</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => onNavigate("about")} 
                  data-testid="button-resource-about"
                >
                  <BookOpen className="h-6 w-6" style={{ color: '#2f5a4e' }} />
                  <span className="font-medium">About Us</span>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Still Need Help */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto bg-white">
            <CardHeader>
              <CardTitle className="text-2xl">Still Need Help?</CardTitle>
              <CardDescription className="text-lg">
                Our support team is here to assist you with any questions or issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => onNavigate("contact")}
                  className="bg-primary text-[#ffffff]"
                  data-testid="button-contact-support"
                >
                  <MessageCircle className="h-5 w-5 mr-2" style={{color: "#ffffff"}} />
                  Contact Support
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open("mailto:support@edufiliova.com", "_blank")}
                  data-testid="button-email-support"
                >
                  <Mail className="h-5 w-5 mr-2" style={{ color: '#2f5a4e' }} />
                  Email Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default HelpCenter;
