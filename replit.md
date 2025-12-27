# EduFiliova Project Status

## Overview
Education platform with comprehensive teacher application system, user account management, email notifications, and compliance enforcement. Recently added content moderation system for platform safety.

## Recent Changes (Dec 27, 2025)

### ✅ Account Reactivation Email (Complete)
- Enhanced unsuspended email template with prominent policy links
- Includes Terms of Service, Community Guidelines, Code of Conduct, Privacy Policy links
- Warning section about future violations → permanent termination
- Uses support@edufiliova.com as sender

### ✅ Content Moderation System - Phase 1 (Complete)
**New Service:** `server/utils/moderation.ts`
- **Phone Number Detection**: Regex patterns for US, UK, Australia, China, India formats
- **Nude/NSFW Image Detection**: Uses OpenAI Vision API
- **Dating Content Detection**: Uses OpenAI GPT analysis
- **Admin Notification**: Sends detailed alerts to support@edufiliova.com with user info and violation details

**Integrated Endpoints:**
1. ✅ **Messaging** (`POST /user-chats/:userId`) - Messages with violations rejected + admin notified
   - Checks latest message before saving
   - Returns 403 with "Message rejected" error
   - Admin receives full violation report

## Currently In Progress (Fast Mode - Step by Step)

### Next Integration Points:
2. **Course Creation** - Check descriptions for phone/dating content + image uploads for nudity
3. **Freelancer Projects** - Same checks on project descriptions and images
4. **Product Listings** - Check product descriptions and images
5. **Student Posts** - Monitor user posts for violations

## Technical Stack
- **Backend**: Express, Node.js, TypeScript
- **Database**: PostgreSQL (Drizzle ORM)
- **AI Services**: OpenAI (primary for moderation)
- **Email**: Nodemailer with support@edufiliova.com
- **Frontend**: React + Vite

## Email Configuration
- **Primary Sender**: support@edufiliova.com (active and configured)
- **Templates**: Professional EduFiliova branding
- **Notification Email**: support@edufiliova.com receives all moderation alerts

## User Preferences
- Remove all emojis from UI (teacher signup form completed)
- OpenAI as primary AI service (over Anthropic)
- Admin notifications instead of auto-bans (allows review of edge cases)
- Fast mode development (one endpoint at a time)

## Important Notes
- Moderation checks are text-based and AI-powered - may have false positives, so admin review is important
- Phone number detection includes global patterns but regex can't catch every format
- Image moderation via OpenAI Vision - requires valid image URL
- All violations logged and reported to support team

## Next Steps
To continue building moderation across other endpoints:
- Option A: Continue in Fast mode - integrate into ONE endpoint per turn (slower but focused)
- Option B: Switch to Autonomous mode - integrate into all remaining endpoints in one go (faster, more comprehensive)
