interface VerificationAnimationProps {
  method: 'email' | 'sms' | 'whatsapp';
  contactInfo: string;
  isVisible?: boolean;
}

export default function VerificationAnimation({ 
  method, 
  contactInfo,
  isVisible = true
}: VerificationAnimationProps) {
  const getMethodText = () => {
    switch (method) {
      case 'email':
        return 'Email Verification';
      case 'sms':
        return 'SMS Verification';
      case 'whatsapp':
        return 'WhatsApp Verification';
      default:
        return 'Verification';
    }
  };

  const getMaskedContact = () => {
    if (method === 'email') {
      const [local, domain] = contactInfo.split('@');
      if (local && domain) {
        const maskedLocal = local.length > 3 
          ? local.substring(0, 2) + '***' + local.slice(-1)
          : local.substring(0, 1) + '***';
        return `${maskedLocal}@${domain}`;
      }
    } else {
      // Phone number masking
      if (contactInfo.length > 6) {
        return contactInfo.substring(0, 3) + '***' + contactInfo.slice(-4);
      }
    }
    return contactInfo;
  };

  if (!isVisible) return null;

  return (
    <div className="w-full mb-8">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {getMethodText()}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Code sent to {getMaskedContact()}
          </p>
        </div>
      </div>
    </div>
  );
}
