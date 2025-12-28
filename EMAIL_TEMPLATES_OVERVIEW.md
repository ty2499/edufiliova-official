# 📧 EduFiliova Email Templates Configuration

## System Overview

All email templates are configured in the EduFiliova system with professional designs, responsive layouts, and dynamic variable support.

### Email Service Configuration
- **Service**: NodeMailer with multi-account SMTP support
- **Location**: `/server/utils/email.ts`
- **Templates**: `/server/templates/` directory
- **Image Handling**: Cloudinary URL mapping
- **Database**: PostgreSQL for account & campaign tracking

---

## 📋 Available Email Templates

### 1. **Verification Emails**
- **Teacher Verification Code** (`sendTeacherVerificationEmail`)
  - Variables: `fullName`, `verificationCode`
  - Purpose: Verify teacher account during registration
  
- **Freelancer Verification Code** (`sendFreelancerVerificationEmail`)
  - Variables: `fullName`, `verificationCode`
  - Purpose: Verify freelancer account during registration

- **Shop Customer Verification** (`sendShopVerificationEmail`)
  - Variables: `fullName`, `verificationCode`
  - Purpose: Legacy verification code system

- **Shop Verification Link** (`sendShopVerificationLinkEmail`)
  - Variables: `fullName`, `verificationLink`, `expiresIn`
  - Purpose: Modern link-based verification

### 2. **Purchase & Transaction Emails**
- **Course Purchase** (`sendCoursePurchaseEmail`)
  - Variables: `courseName`, `price`, `orderId`, `customerName`, `accessUrl`
  - Purpose: Confirm course purchase and provide access

- **Digital Product Purchase** (`sendDigitalProductPurchaseEmail`)
  - Variables: `orderId`, `customerName`, `totalPrice`, `items[]`
  - Purpose: Provide download tokens for digital products

- **Advertisement Purchase** (`sendAdPurchaseEmail`)
  - Variables: `customerName`, `adTitle`, `placement`, `price`, `duration`, `orderId`
  - Purpose: Confirm ad placement purchase

- **Subscription Email** (`sendSubscriptionEmail`)
  - Variables: `planName`, `price`, `billingCycle`, `orderId`, `customerName`, `features[]`
  - Purpose: Welcome subscriber and outline features

### 3. **Approval & Status Emails**
- **Teacher Approval** (`sendTeacherApprovalEmail`)
  - Variables: `fullName`, `displayName`
  - Purpose: Notify approved teacher applications
  - File: `/server/templates/teacher_approval_template/email.html`

- **Teacher Rejection** (`sendTeacherRejectionEmail`)
  - Variables: `fullName`, `displayName`, `reason`
  - Purpose: Notify rejected applications with reason
  - File: `/attached_assets/email_declined_teacher_*.html`

- **Application Resubmission** (`sendApplicationResubmittedEmail`)
  - Variables: `fullName`, `applicationType` (teacher/freelancer)
  - Purpose: Confirm resubmission received

### 4. **Account & Security Emails**
- **Password Reset** (Template: `/server/templates/password_reset_template/`)
  - Purpose: Secure account recovery
  - Format: HTML + Text

- **Account Banned** (`sendAccountBannedEmail`)
  - Variables: `fullName`, `violations[]`
  - Purpose: Notify account suspension with details

- **Mobile Account Linked** (Template: `/server/templates/mobile_linked_template/`)
  - Purpose: Confirm mobile app connection

### 5. **Marketing & Engagement Emails**
Located in `/server/templates/notifications/email-templates.ts`:

- **Welcome Day 0** - Initial welcome email
- **Welcome Day 2** - Feature discovery tips
- **Welcome Day 5** - Upgrade prompts and resources
- **Incomplete Registration (1h)** - Recover abandoned signups
- **Incomplete Registration (24h)** - Urgent completion reminder
- **Learning Inactivity (3d)** - Re-engagement prompt
- **Course Not Started (3d)** - Course enrollment reminder
- **Download Reminder (24h)** - Product download reminder
- **Teacher No Content (3d)** - Course creation encouragement
- **Freelancer No Content (5d)** - Portfolio setup encouragement

---

## ⚙️ Configuration Features

### Template Variables
All templates support dynamic variable replacement:
```
{{fullName}}          - User's full name
{{displayName}}       - Display/first name
{{email}}            - Email address
{{baseUrl}}          - Base application URL
{{courseName}}       - Course name
{{orderId}}          - Order/transaction ID
{{price}}            - Price amount
{{verificationCode}} - 6-digit verification code
{{verificationLink}} - Email verification link
{{appType}}          - Application type
{{reason}}           - Rejection reason
{{logoUrl}}          - Logo URL
{{unsubscribeLink}}  - Unsubscribe link
```

### Multi-Account SMTP Support
- Multiple email accounts can be configured
- Automatic transporter selection based on sender
- Fallback to first available transporter
- Connection testing (IMAP/SMTP verification)

### Image Handling
- Automatic Cloudinary URL conversion
- CID (Content ID) replacement for embedded images
- Base name matching for flexible image references
- Support for absolute URLs and local file paths

### Responsive Design
- Mobile-first design approach
- Cross-client compatibility (Gmail, Outlook, Apple Mail, etc.)
- iPhone font stack for better rendering
- Proper viewport meta tags
- Inline CSS styling for maximum compatibility

---

## 📨 Sending Methods

### 1. **Direct Email Sending**
```typescript
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Your Email Subject',
  html: emailContent,
  from: '"App Name" <support@example.com>'
});
```

### 2. **API Endpoints**
```
POST /api/email/send               - Send new email
POST /api/email/messages/:id/reply - Send email reply
POST /api/email/test-templates     - Test all templates
```

### 3. **Marketing Campaigns**
- Create templates via `/api/email-marketing/templates`
- Schedule campaigns with segment targeting
- Track opens, clicks, and conversions
- Manage campaigns via `/api/email-marketing/campaigns`

### 4. **Group Email Sending**
Supported group identifiers:
- `all_students` - Send to all students
- `all_teachers` - Send to all teachers
- `all_freelancers` - Send to all freelancers
- `all_customers` - Send to all shop customers

---

## 🔧 Email Account Management

### SMTP Configuration Required
```typescript
{
  host: string;              // SMTP server host
  port: number;              // SMTP server port
  secure: boolean;           // TLS/SSL (port 465 = secure)
  username: string;          // SMTP username
  password: string;          // SMTP password
  email: string;             // From email address
  displayName: string;       // Display name
}
```

### IMAP Configuration (Optional, for email inbox)
```typescript
{
  host: string;              // IMAP server host
  port: number;              // IMAP server port
  secure: boolean;           // TLS/SSL
  username: string;          // IMAP username
  password: string;          // IMAP password
}
```

### Testing Connections
- `POST /api/email/accounts/:id/test` - Test IMAP & SMTP connectivity
- Validates credentials before saving
- Auto-deletes failed accounts

---

## 📊 Email Marketing Features

### Campaign Management
- Create campaigns with templates
- Target specific user segments
- Schedule send times
- Track delivery status
- Monitor engagement metrics

### Segment Filtering
- Filter by user role
- Filter by registration date
- Filter by activity status
- Custom filters via `SegmentFilters`

### Template Preview
- Preview templates with sample variables
- Test variable replacement
- Check rendering before sending

---

## 🚀 Key Enhancements

✅ **Bulletproof Name Replacement**
- Handles {{fullName}}, {{FullName}}, {{FULLNAME}} variations
- Manages split HTML spans causing breakage
- Multiple matching strategies for edge cases

✅ **Cross-Client Compatibility**
- iPhone font stack for Apple devices
- Proper HTML meta tags
- Inline CSS for maximum support
- Tests for Gmail, Outlook, Yahoo, Apple Mail

✅ **Image Optimization**
- Cloudinary CDN integration
- Automatic URL conversion
- CID placeholder replacement
- Base name matching for flexibility

✅ **Email Account Management**
- IMAP sync with configurable interval
- SMTP connection testing
- Multiple account support
- Email conversation threading

✅ **Attachment Support**
- File upload via `/api/email/attachments/upload`
- Cloudinary storage integration
- Support for images and documents
- Proper MIME type handling

---

## 📌 Summary

The EduFiliova email system is a production-ready email management platform with:
- **16+ professional email templates**
- **Multi-account SMTP support**
- **Marketing automation and campaigns**
- **Real-time email sync via IMAP**
- **Cloudinary image optimization**
- **Database-backed email history**
- **WebSocket real-time admin updates**
- **API-first design**

All templates are responsive, branded, and tested across major email clients.

---

## 🔗 Quick Links

**API Documentation:**
- POST /api/email/send - Send new email
- POST /api/email/test-templates - Test templates
- POST /api/email/messages/:id/reply - Send reply
- GET /api/email/accounts - List accounts
- POST /api/email-marketing/templates - Create template
- GET /api/email-marketing/campaigns - List campaigns

**File Locations:**
- Email Service: `/server/utils/email.ts`
- Email Routes: `/server/emailRoutes.ts`
- Templates: `/server/templates/`
- Marketing: `/server/routes/email-marketing.ts`
- Schema: `/shared/schema.ts`

---

**Last Updated**: December 28, 2025
**Status**: ✅ Production Ready
