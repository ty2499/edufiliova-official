# 📧 Email Template Configuration Guide

## Overview
This guide explains how email templates are configured in EduFiliova, using the **Teacher Decline Template** as the primary example.

---

## 1. Teacher Decline Template Configuration

### File Location
```
attached_assets/email_declined_teacher_1766647033808.html
```

### How It Works

#### Step 1: Load HTML Template
```typescript
const htmlPath = path.resolve(process.cwd(), 'attached_assets/email_declined_teacher_1766647033808.html');
let html = fs.readFileSync(htmlPath, 'utf-8');
```

#### Step 2: Remove Preload Links
```typescript
html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
```
**Why?** Preload links reference local image paths that won't work in email clients. We replace them with Cloudinary URLs later.

#### Step 3: Add iPhone Font Stack
```typescript
const iphoneFontStack = `
<style>
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  body, p, h1, h2, h3, h4, span, div, td { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important; 
  }
</style>`;
html = html.replace('</head>', `${iphoneFontStack}</head>`);
```
**Why?** Ensures proper font rendering on Apple devices and prevents Apple Mail from reformatting the email.

#### Step 4: Bulletproof Name Replacement
```typescript
const fullName = data.fullName || 'Teacher';
html = this.forceReplaceName(html, fullName);
```
**Why?** Handles all variations: `{{fullName}}`, `{{FullName}}`, `{{FULLNAME}}`, broken spans, etc.

#### Step 5: Replace Image Paths with CIDs
```typescript
html = html.replaceAll('images/bbe5722d1ffd3c84888e18335965d5e5.png', 'cid:icon_db');
html = html.replaceAll('images/0ac9744033a7e26f12e08d761c703308.png', 'cid:logo');
html = html.replaceAll('images/d320764f7298e63f6b035289d4219bd8.png', 'cid:icon_pf');
html = html.replaceAll('images/4a834058470b14425c9b32ace711ef17.png', 'cid:footer_logo');
html = html.replaceAll('images/9f7291948d8486bdd26690d0c32796e0.png', 'cid:s_social');
html = html.replaceAll('images/917a6e905cf83da447efc0f5c2780aca.png', 'cid:teacher_img');
html = html.replaceAll('images/de497c5361453604d8a15c4fd9bde086.png', 'cid:rejection_icon');
html = html.replaceAll('images/e06e238bd6d74a3e48f94e5b0b81388d.png', 'cid:support_img');
html = html.replaceAll('images/7976503d64a3eef4169fe235111cdc57.png', 'cid:corner_graphic');
```
**Why?** CID (Content ID) references allow inline embedding of images. They're then processed by `processEmailImages()` to convert to Cloudinary URLs.

#### Step 6: Send with Processing
```typescript
return this.sendEmail({
  to: email,
  subject: 'Application Status Update - EduFiliova Teacher Application',
  html,
  from: `"EduFiliova Support" <support@edufiliova.com>`,
  attachments: [] // Images are handled via Cloudinary URLs
});
```

---

## 2. Image Processing Pipeline

### How Images Are Processed in sendEmail()

```typescript
private processEmailImages(html: string): string {
  // 1. Match absolute URLs - keep them as-is
  if (filename.startsWith('http') || filename.startsWith('https://res.cloudinary.com')) {
    return match; // No change needed
  }
  
  // 2. Check emailAssetMap for exact matches
  if (emailAssetMap[cleanFilename]) {
    return `src="${emailAssetMap[cleanFilename]}"`;
  }
  
  // 3. Try base name matching (logo.png vs logo_123.png)
  const baseName = cleanFilename.split('_')[0].split('.')[0].toLowerCase();
  for (const [key, url] of Object.entries(emailAssetMap)) {
    const keyBase = key.split('_')[0].split('.')[0].toLowerCase();
    if (keyBase === baseName) {
      return `src="${url}"`;
    }
  }
  
  // 4. Fallback - log warning if no mapping found
  console.warn(`⚠️ No mapping found for image: ${filename}`);
  return match;
}
```

### Image Map Configuration
Located in: `server/config/email-assets-map.json`

Example:
```json
{
  "logo.png": "https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png",
  "icon_db.png": "https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766506747370.png",
  "footer_logo.png": "https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908564/edufiliova/email-assets/4a834058470b14425c9b32ace711ef17_1766506747367.png"
}
```

---

## 3. Standard Template Structure

All email templates should follow this pattern:

### 1. **HTML Template File** (in `attached_assets/` or `server/templates/`)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  
  <!-- Preload images (will be removed by processing) -->
  <link rel="preload" as="image" href="images/logo.png">
  <link rel="preload" as="image" href="images/icon.png">
  
  <style>
    /* Inline CSS for email client compatibility */
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    /* ... more styles ... */
  </style>
</head>
<body>
  <!-- Email content -->
  <img src="images/logo.png" alt="Logo">
  <h1>Hello {{fullName}}</h1>
  <p>{{message}}</p>
  
  {{#if conditionalContent}}
    <p>This content is conditional</p>
  {{/if}}
</body>
</html>
```

### 2. **TypeScript Function** (in `server/utils/email.ts`)
```typescript
async sendTemplateEmail(
  email: string, 
  data: { fullName: string; message?: string }
): Promise<boolean> {
  const baseUrl = this.getBaseUrl();
  const htmlPath = path.resolve(process.cwd(), 'attached_assets/template.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Step 1: Remove preloads
  html = html.replace(/<link rel="preload" as="image" href="images\/.*?">/g, '');
  
  // Step 2: Add iPhone font stack
  const iphoneFontStack = `
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body, p, h1, h2, h3, h4, span, div, td { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; 
    }
  </style>`;
  html = html.replace('</head>', `${iphoneFontStack}</head>`);

  // Step 3: Replace variables
  const fullName = data.fullName || 'User';
  html = this.forceReplaceName(html, fullName);
  html = html.replace(/\{\{message\}\}/gi, data.message || '');
  html = html.replace(/\{\{baseUrl\}\}/gi, baseUrl);

  // Step 4: Replace image paths with CIDs (if using inline images)
  html = html.replaceAll('images/logo.png', 'cid:logo');
  html = html.replaceAll('images/icon.png', 'cid:icon');

  // Step 5: Handle conditional blocks
  html = html.replace(/\{\{#if conditionalContent\}\}[\s\S]*?\{\{\/if\}\}/gi, 
    data.conditionalContent ? 'content' : '');

  // Step 6: Send email
  return this.sendEmail({
    to: email,
    subject: 'Email Subject',
    html,
    from: '"Support" <support@edufiliova.com>',
    attachments: [] // Images handled via Cloudinary
  });
}
```

---

## 4. Image Handling Methods

### **Method 1: Cloudinary URLs (Recommended)**
Direct URL in HTML:
```html
<img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/logo.png" alt="Logo">
```
✅ **Pros:** Works everywhere, no processing needed  
❌ **Cons:** Must manage URLs manually

### **Method 2: CID References (Inline Embedding)**
In HTML:
```html
<img src="cid:logo" alt="Logo">
```
Processing:
```typescript
html = html.replaceAll('images/logo.png', 'cid:logo');
```
Then in sendEmail():
```typescript
// processEmailImages() converts cid:logo to Cloudinary URL
```
✅ **Pros:** Images embedded inline, no external references needed  
❌ **Cons:** Requires proper mapping

### **Method 3: Local Image Paths**
```html
<img src="images/logo.png" alt="Logo">
```
Automatically converted to Cloudinary via emailAssetMap.json  
✅ **Pros:** Clean template HTML  
❌ **Cons:** Requires email-assets-map.json to be updated

---

## 5. Best Practices for All Templates

### ✅ DO:
1. **Use Responsive Design**
   - Include viewport meta tag
   - Use table-based layouts for email compatibility
   - Test at 600px max width

2. **Optimize for Mobile**
   - Include media queries for < 480px
   - Use mobile-friendly font sizes
   - Ensure buttons are touch-friendly (44px minimum)

3. **Ensure Cross-Client Compatibility**
   - Include iPhone font stack
   - Add -webkit-text-size-adjust
   - Test in Gmail, Outlook, Apple Mail, Yahoo

4. **Manage Images Properly**
   - Use one of the three methods consistently
   - Always include alt text
   - Optimize image sizes (< 150KB per image)
   - Use Cloudinary for CDN delivery

5. **Variable Replacement**
   - Use consistent naming: `{{fullName}}`, `{{email}}`, etc.
   - Test replacement logic
   - Handle missing variables gracefully

6. **Accessibility**
   - Use semantic HTML (tables for email)
   - Include alt text on all images
   - Use sufficient color contrast
   - Don't rely on color alone

### ❌ DON'T:
1. Use CSS positioning or floats (email clients don't support them well)
2. Use background images (many clients block them)
3. Use JavaScript (not supported in email)
4. Use complex CSS (inline styles only)
5. Use external fonts (stick to system fonts)
6. Forget to test on actual email clients
7. Use large images (compress before uploading)
8. Mix image handling methods in one template

---

## 6. Template Variables Reference

Common variables supported across all templates:

```
// User Information
{{fullName}}          - Full name of recipient
{{displayName}}       - Display/first name
{{email}}            - Email address
{{firstName}}        - First name only

// Application Data
{{courseName}}       - Course title
{{orderId}}          - Order/transaction ID
{{price}}            - Price amount
{{verificationCode}} - 6-digit code
{{verificationLink}} - Email verification link

// System Variables
{{baseUrl}}          - Application base URL (https://edufiliova.com)
{{currentYear}}      - Current year (for copyright)
{{unsubscribeLink}}  - Unsubscribe link
{{logoUrl}}          - Logo image URL
{{dashboardUrl}}     - Dashboard link
{{supportEmail}}     - Support email address

// Template Conditionals
{{#if condition}}    - Conditional block start
{{/if}}              - Conditional block end

// Application-specific
{{appType}}          - 'teacher' or 'freelancer'
{{reason}}           - Rejection/approval reason
{{violations}}       - List of violations
{{features[]}}       - Feature list items
```

---

## 7. Troubleshooting

### Images Not Showing
1. Check if image path is in `email-assets-map.json`
2. Verify Cloudinary URL is accessible
3. Ensure CID replacement happened correctly
4. Check email client image blocking settings

### Names Not Replaced
1. Check for typos in template: `{{fullName}}` vs `{{FullName}}`
2. Verify `forceReplaceName()` is called
3. Look for split HTML spans: `<span>{{full</span><span>Name}}</span>`
4. Check for hardcoded placeholder text

### Font Issues
1. Ensure iPhone font stack is added to `<head>`
2. Use system fonts only (Arial, Helvetica, Verdana)
3. Test in Apple Mail specifically
4. Check for font imports (not supported in email)

### Layout Issues
1. Use tables instead of divs
2. Set explicit widths (no percentages for outer container)
3. Keep max-width at 600px
4. Test on mobile devices

---

## 8. Email Asset Map Configuration

### Location
`server/config/email-assets-map.json`

### Format
```json
{
  "filename.png": "https://cloudinary-url.com/image.png",
  "icon_db.png": "https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/...",
  "footer_logo.png": "https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908564/..."
}
```

### How It's Used
When `processEmailImages()` encounters:
- `src="images/filename.png"` → Replaced with Cloudinary URL
- `src="cid:filename"` → Replaced with Cloudinary URL
- `src="https://..."` → Kept as-is

---

## 9. Production Checklist

Before deploying any email template:

- [ ] HTML validates (W3C validator)
- [ ] All images have Cloudinary URLs or CID mappings
- [ ] Variable replacements tested with sample data
- [ ] Tested in Gmail, Outlook, Apple Mail, Yahoo
- [ ] Mobile-responsive (tested at 320px, 480px, 600px)
- [ ] Alt text on all images
- [ ] Links are HTTPS
- [ ] No external CSS or fonts
- [ ] Preload links removed before sending
- [ ] iPhone font stack injected
- [ ] File size < 100KB
- [ ] Color contrast meets WCAG AA standards
- [ ] CTA buttons are obvious and functional

---

## Summary

The **Teacher Decline Template Configuration** demonstrates the complete email template system:

1. **Load** HTML from file
2. **Clean** by removing preload links
3. **Optimize** with iPhone font stack
4. **Replace** variables and image paths
5. **Handle** conditionals and fallbacks
6. **Send** with Cloudinary image URLs

All other templates should follow this same pattern for consistency and reliability.

---

**Last Updated:** December 28, 2025  
**Status:** ✅ Production Ready
