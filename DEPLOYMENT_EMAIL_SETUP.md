# Email Setup for Deployed Applications

## Problem
Emails don't work when deployed because SMTP credentials aren't passed to the production environment.

## Solution

Your app checks for SMTP credentials in this order:
1. **Database** (email accounts configured in Admin Dashboard)
2. **Environment Variables** (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)

### To Make Emails Work When Deployed:

#### Option A: Set Production Environment Variables (Fast)
Set these secrets in your Replit production deployment:
```
SMTP_HOST = mail.spacemail.com
SMTP_PORT = 465
SMTP_USER = orders@edufiliova.com
SMTP_PASS = Your email password
```

#### Option B: Configure via Admin Dashboard (Persistent)
1. Deploy your app
2. Login as admin
3. Go to Admin Settings → Email Configuration
4. Add your email account:
   - Email: orders@edufiliova.com
   - SMTP Host: mail.spacemail.com
   - SMTP Port: 465
   - Username: orders@edufiliova.com
   - Password: Your password
5. Mark as Active → Save

This saves to the database and works permanently.

## Current Local SMTP Config
```
SMTP_HOST: mail.spacemail.com
SMTP_PORT: 465
SMTP_USER: orders@edufiliova.com
SMTP_PASS: [set in secrets]
```

## Troubleshooting

**If emails still don't work:**
1. Check server logs for error messages
2. Verify SMTP credentials are correct
3. Ensure port 465 is accessible (secure SMTP)
4. Check if your email provider allows external apps

**Common Issues:**
- Port blocked: Try 587 (TLS) instead of 465
- Auth failed: Wrong email/password combination
- Host unreachable: Wrong SMTP server address
