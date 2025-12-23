import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Facebook, Twitter, Linkedin, Mail, Link2, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Certificate {
  id: string;
  courseTitle: string;
  verificationCode: string;
}

interface ShareCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate;
}

export function ShareCertificateDialog({ open, onOpenChange, certificate }: ShareCertificateDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.verificationCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const tweetText = `I just completed ${certificate.courseTitle}! 🎓`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(verificationUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(verificationUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = `Check out my certificate for ${certificate.courseTitle}`;
    const body = `I'm excited to share that I've completed ${certificate.courseTitle}!\n\nYou can verify my certificate here: ${verificationUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-share-certificate">
        <DialogHeader>
          <DialogTitle data-testid="heading-share-certificate">Share Your Certificate</DialogTitle>
          <DialogDescription data-testid="text-share-description">
            Share your achievement with the world!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Social Media Sharing */}
          <div className="space-y-2">
            <Label>Share on social media</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={shareToLinkedIn}
                className="w-full"
                data-testid="button-share-linkedin"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={shareToTwitter}
                className="w-full"
                data-testid="button-share-twitter"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={shareToFacebook}
                className="w-full"
                data-testid="button-share-facebook"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={shareViaEmail}
                className="w-full"
                data-testid="button-share-email"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <Label htmlFor="certificate-link">Certificate verification link</Label>
            <div className="flex gap-2">
              <Input
                id="certificate-link"
                value={verificationUrl}
                readOnly
                className={`flex-1 ${copied ? 'border-green-500 dark:border-green-500' : ''} ${copyError ? 'border-primary dark:border-primary' : ''}`}
                data-testid="input-certificate-link"
              />
              <Button
                type="button"
                variant={copied ? 'default' : 'outline'}
                onClick={copyToClipboard}
                className={copied ? 'bg-green-600 hover:bg-green-700' : ''}
                data-testid="button-copy-link"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : copyError ? (
                  <AlertCircle className="w-4 h-4 text-primary" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium animate-in fade-in slide-in-from-top-1">
                ✓ Link copied to clipboard!
              </p>
            )}
            {copyError && (
              <p className="text-xs text-primary dark:text-red-400 font-medium animate-in fade-in slide-in-from-top-1">
                Failed to copy. Please copy the link manually.
              </p>
            )}
            {!copied && !copyError && (
              <p className="text-xs text-muted-foreground">
                Share this link to let others verify your certificate
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
