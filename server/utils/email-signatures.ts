export interface EmailSignature {
  html: string;
  text: string;
}

const baseUrl = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : 'https://edufiliova.com';

export function getEmailSignature(emailAccount: string): EmailSignature {
  const signatureStyles = {
    container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #4a5568; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;',
    name: 'font-weight: 600; color: #1a1a1a; font-size: 16px; margin: 0;',
    title: 'color: #64748b; font-size: 14px; margin: 5px 0;',
    company: 'color: #0C332C; font-weight: 600; font-size: 15px; margin: 10px 0;',
    contact: 'font-size: 13px; color: #64748b; margin: 3px 0;',
    link: 'color: #2d5ddd; text-decoration: none;',
    disclaimer: 'font-size: 11px; color: #94a3b8; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;'
  };

  const signatures: Record<string, EmailSignature> = {
    'verify@edufiliova.com': {
      html: `
        <div style="${signatureStyles.container}">
          <p style="${signatureStyles.name}">EduFiliova Verification Team</p>
          <p style="${signatureStyles.company}">EduFiliova</p>
          <p style="${signatureStyles.contact}">Email: <a href="mailto:verify@edufiliova.com" style="${signatureStyles.link}">verify@edufiliova.com</a></p>
          <p style="${signatureStyles.contact}">Website: <a href="${baseUrl}" style="${signatureStyles.link}">${baseUrl}</a></p>
          <p style="${signatureStyles.contact}">Support: <a href="mailto:support@edufiliova.com" style="${signatureStyles.link}">support@edufiliova.com</a></p>
          <p style="${signatureStyles.disclaimer}">
            This is an automated message from EduFiliova account verification system. 
            Please do not reply directly to this email. For assistance, contact our support team.
          </p>
        </div>
      `,
      text: `
──────────────────────────────
EduFiliova Verification Team
EduFiliova

Email: verify@edufiliova.com
Website: ${baseUrl}
Support: support@edufiliova.com

This is an automated message from EduFiliova account verification system.
Please do not reply directly to this email. For assistance, contact our support team.
      `
    },

    'orders@edufiliova.com': {
      html: `
        <div style="${signatureStyles.container}">
          <p style="${signatureStyles.name}">Orders & Billing Department</p>
          <p style="${signatureStyles.company}">EduFiliova</p>
          <p style="${signatureStyles.contact}">Email: <a href="mailto:orders@edufiliova.com" style="${signatureStyles.link}">orders@edufiliova.com</a></p>
          <p style="${signatureStyles.contact}">Website: <a href="${baseUrl}" style="${signatureStyles.link}">${baseUrl}</a></p>
          <p style="${signatureStyles.contact}">Customer Support: <a href="mailto:support@edufiliova.com" style="${signatureStyles.link}">support@edufiliova.com</a></p>
          <p style="${signatureStyles.disclaimer}">
            Thank you for your purchase. This email confirms your order details and payment. 
            For order inquiries or billing questions, please contact our support team.
          </p>
        </div>
      `,
      text: `
──────────────────────────────
Orders & Billing Department
EduFiliova

Email: orders@edufiliova.com
Website: ${baseUrl}
Customer Support: support@edufiliova.com

Thank you for your purchase. This email confirms your order details and payment.
For order inquiries or billing questions, please contact our support team.
      `
    },

    'design@edufiliova.com': {
      html: `
        <div style="${signatureStyles.container}">
          <p style="${signatureStyles.name}">Design & Customer Relations Team</p>
          <p style="${signatureStyles.company}">EduFiliova</p>
          <p style="${signatureStyles.contact}">Email: <a href="mailto:design@edufiliova.com" style="${signatureStyles.link}">design@edufiliova.com</a></p>
          <p style="${signatureStyles.contact}">Website: <a href="${baseUrl}" style="${signatureStyles.link}">${baseUrl}</a></p>
          <p style="${signatureStyles.contact}">Phone: Available upon request</p>
          <p style="${signatureStyles.disclaimer}">
            We appreciate your inquiry. Our team strives to respond within 24-48 business hours. 
            For urgent matters, please contact support@edufiliova.com.
          </p>
        </div>
      `,
      text: `
──────────────────────────────
Design & Customer Relations Team
EduFiliova

Email: design@edufiliova.com
Website: ${baseUrl}
Phone: Available upon request

We appreciate your inquiry. Our team strives to respond within 24-48 business hours.
For urgent matters, please contact support@edufiliova.com.
      `
    },

    'support@edufiliova.com': {
      html: `
        <div style="${signatureStyles.container}">
          <p style="${signatureStyles.name}">Customer Support Team</p>
          <p style="${signatureStyles.company}">EduFiliova</p>
          <p style="${signatureStyles.contact}">Email: <a href="mailto:support@edufiliova.com" style="${signatureStyles.link}">support@edufiliova.com</a></p>
          <p style="${signatureStyles.contact}">Website: <a href="${baseUrl}" style="${signatureStyles.link}">${baseUrl}</a></p>
          <p style="${signatureStyles.contact}">Help Center: <a href="${baseUrl}/help" style="${signatureStyles.link}">${baseUrl}/help</a></p>
          <p style="${signatureStyles.disclaimer}">
            Our support team is here to help you. We aim to respond to all inquiries within 24 business hours. 
            For immediate assistance, visit our Help Center.
          </p>
        </div>
      `,
      text: `
──────────────────────────────
Customer Support Team
EduFiliova

Email: support@edufiliova.com
Website: ${baseUrl}
Help Center: ${baseUrl}/help

Our support team is here to help you. We aim to respond to all inquiries within 24 business hours.
For immediate assistance, visit our Help Center.
      `
    },

    'noreply@edufiliova.com': {
      html: `
        <div style="${signatureStyles.container}">
          <p style="${signatureStyles.name}">EduFiliova Notifications</p>
          <p style="${signatureStyles.company}">EduFiliova</p>
          <p style="${signatureStyles.contact}">Website: <a href="${baseUrl}" style="${signatureStyles.link}">${baseUrl}</a></p>
          <p style="${signatureStyles.disclaimer}">
            This is an automated notification from EduFiliova. Please do not reply to this email.
            If you need assistance, please contact support@edufiliova.com.
          </p>
        </div>
      `,
      text: `
──────────────────────────────
EduFiliova Notifications
EduFiliova

Website: ${baseUrl}

This is an automated notification from EduFiliova. Please do not reply to this email.
If you need assistance, please contact support@edufiliova.com.
      `
    }
  };

  return signatures[emailAccount] || signatures['support@edufiliova.com'];
}

export function appendSignatureToEmail(htmlBody: string, textBody: string, fromEmail: string): { html: string; text: string } {
  const signature = getEmailSignature(fromEmail);
  
  return {
    html: htmlBody + signature.html,
    text: textBody + '\n\n' + signature.text
  };
}

export function createAutoReplyTemplate(fromEmail: string): EmailSignature {
  const signature = getEmailSignature(fromEmail);
  
  if (fromEmail === 'design@edufiliova.com') {
    return {
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            Thank you for contacting EduFiliova.
          </p>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
            We have received your email and our team will review it shortly. 
            We strive to respond to all inquiries within 24-48 business hours.
          </p>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
            If your matter is urgent, please feel free to contact our support team at 
            <a href="mailto:support@edufiliova.com" style="color: #2d5ddd; text-decoration: none;">support@edufiliova.com</a>.
          </p>
          ${signature.html}
        </div>
      `,
      text: `Thank you for contacting EduFiliova.

We have received your email and our team will review it shortly. We strive to respond to all inquiries within 24-48 business hours.

If your matter is urgent, please feel free to contact our support team at support@edufiliova.com.

${signature.text}`
    };
  }
  
  return signature;
}
