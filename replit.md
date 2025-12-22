## Overview
EduFiliova, by PA Creatives, is a global educational platform designed for personalized learning. It's a full-stack application utilizing React, Express, and PostgreSQL with Drizzle ORM, supporting multiple countries' educational systems. Key features include interactive lessons, teacher-student chat, tiered access, and certificate issuance. The platform targets students, teachers, and administrators, with a consistent bright green (#42fa76) brand. The vision is to become a leading global education platform, serving over 300K students and 100+ teachers across 60+ countries, with a revenue-focused monetization strategy.

## User Preferences

### Mathematics Content Organization
- **Always organize under Mathematics subject**: When user provides new math content/scripts, add them under the existing Mathematics subject in the system
- **Quiz naming convention**: Name quizzes clearly (e.g., "Quiz", "Chapter Quiz", "Lesson Quiz") under mathematics content
- **Content hierarchy**: All mathematics content must be properly structured as:
  - Subject: Mathematics
  - Chapters: Organized by topics
  - Lessons: Individual lessons within chapters  
  - Quizzes: Named quizzes associated with lessons/chapters
- **Integration approach**: Never create separate math components - always integrate into the existing Mathematics subject system

### Subject System Specifications (CRITICAL - NEVER FORGET)
**When adding ANY new subject content, follow this exact structure:**

1. **Subject Requirements:**
   - Subject name (e.g., Mathematics, English, Science, Social Studies)
   - Grade level (e.g., 7)
   - System (e.g., Cambridge, Zimbabwe, all)
   - JSON file containing lessons

2. **Dashboard Layout (EXACT REQUIREMENTS):**
   - **Top panel**: Subjects bar (only show subjects matching student grade/system)
   - **Left panel**: Chapters (scrollable vertical list, show title + lesson count)
   - **Center panel**: Lessons per chapter (scrollable, show title + brief description)
   - **Right/Bottom panel**: Lesson content viewer & quiz

3. **Lesson Content Structure:**
   - Title, content, examples
   - MediaUrl rendering (images/videos if exists)
   - "Take Quiz" button if quiz exists
   - One lesson = one quiz

4. **Quiz Functionality:**
   - Questions with button options
   - Highlight selected answers
   - Immediate feedback (correct/incorrect)
   - Save progress locally per student ID and lesson ID

5. **Filtering Rules:**
   - Only show lessons where grade matches logged-in student
   - Only show lessons where system matches logged-in student

6. **JSON Structure (MANDATORY FORMAT):**
   ```json
   {
     "id": "...",
     "subject": "...",
     "grade": ...,
     "system": "...",
     "lessonNumber": ...,
     "title": "...",
     "content": "...",
     "examples": [...],
     "mediaUrl": "...",
     "quiz": [...]
   }
   ```

7. **UI/UX Requirements:**
   - Clean typography, subtle shadows on lesson cards
   - Touch-friendly and mobile responsive
   - Semantic HTML with aria attributes
   - Keyboard focus styles
   - Local storage keyed by student ID and lesson ID

8. **Expandability:**
   - New JSON files for subjects/grades auto-appear if grade matches
   - Use real student session variables (student.id, student.grade, student.system)
Preferred communication style: Simple, everyday language.
Admin Dashboard: Use AdminPaymentDashboard as the primary admin dashboard (comprehensive payment-focused version with full admin functionality).

## System Architecture

### UI/UX Decisions
- **Branding**: Consistent bright green (#42fa76) and unified EduFiliova logo system. Favicon and email templates feature a professional graduation cap. Testimonials feature younger children.
- **Responsiveness**: Mobile-first design for all components.
- **Visual Design**: Modern aesthetic with glass morphism, gradient overlays, parallax scrolling, animated particles, enhanced scroll animations, and smooth page transitions. Custom SVG illustrations for background images.
- **Accessibility**: Improved color contrast.
- **Navigation**: Streamlined header navigation; integrated chat support; role-specific dashboards (Admin, Teacher, Learner).

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, Shadcn/UI (Radix UI), Tailwind CSS, TanStack Query, React Router.
- **Backend**: Express.js, TypeScript.
- **Database**: Full Supabase PostgreSQL integration using Supabase client and REST API. Drizzle ORM for database interaction.
- **Authentication**: Supabase Auth with JWT, custom hooks, role-based access, Bcrypt hashing, profile management, and dual verification (email/SMS).
- **Real-time**: WebSocket-powered features via Supabase real-time subscriptions.
- **Email System**: Comprehensive email templates with analytics, variable support, and multi-sender capability. Spaceship domain email configured.
- **File Upload System**: Multer for various file types.
- **AI Integration**: Multi-AI provider system (OpenAI, Anthropic Claude, Google Gemini) for course content generation, with modular architecture and fallbacks.

### Feature Specifications
- **Multi-country Support**: Complete global coverage with 197 countries, flexible grade mapping, and country-specific subjects. Countries must never be deleted from the database.
- **Smart Education System Detection**: Automatic detection and application of appropriate education systems based on country selection during registration.
- **Database Integrity**: All 197 countries must remain in the database; all countries must have their education systems configured to include "Other", "University", "College" options for all user types.
- **Registration Form Requirements**: All countries and education system selections must be available in all registration forms; grade options must include grade levels + "Other" + "University" + "College".
- **Interactive Learning**: Structured lessons, progress tracking, assessment system.
- **Communication**: Integrated chat, real-time notifications, chat history.
- **Teacher Management**: Full teacher registration flow, document upload, verification, pending dashboard, admin review, full CRUD for course management, AI-assisted course creation.
- **Course Management**: Comprehensive course creation with AI content generation, including freelancer course creation with admin approval workflow.
- **Admin Panel**: Comprehensive administrative interface via AdminPaymentDashboard, focusing on payment management, teacher earnings, financial analytics.
- **Payment System**: Complete Stripe Connect integration for teachers (payment management, earnings tracking, processing workflow).
- **Help Center**: AI Assistant, FAQ, guides, contact information.
- **Course Progress Tracking**: Lessons auto-complete on quiz pass (>=70% score). Certificates/diplomas issued upon course completion and meeting score criteria.
- **Email Marketing System**: Complete email marketing functionality using nodemailer with template library, campaign management, user preferences/opt-outs, smart segmentation by role/grade/subscription, and delivery tracking.

### Email Marketing System (November 2025)
The platform includes a comprehensive email marketing system with the following components:

**Database Tables:**
- `email_marketing_templates`: Reusable email templates with Handlebars variable support
- `email_campaigns`: Campaign management with scheduling and status tracking
- `email_preferences`: User opt-in/opt-out preferences by category
- `campaign_deliveries`: Individual email delivery tracking with analytics
- `campaign_segments`: Smart user segmentation with filters

**API Endpoints (Admin Only):**
- `GET/POST /api/email-marketing/templates` - Template management
- `GET/POST /api/email-marketing/campaigns` - Campaign management
- `POST /api/email-marketing/campaigns/:id/send` - Send campaign
- `GET/POST /api/email-marketing/segments` - Segment management
- `GET /api/email-marketing/status` - Check email service status

**User Preferences (Authenticated):**
- `GET/PUT /api/email-preferences` - Manage own email preferences
- `GET/POST /api/unsubscribe/:token` - One-click unsubscribe via email

**Template Features:**
- Full Handlebars support with helpers (eq, neq, gt, lt, capitalize, formatDate, etc.)
- Template caching for performance
- Preview before sending

**SMTP Configuration (Required for sending):**
Set these environment variables:
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (465 for SSL)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `EMAIL_FROM_EMAIL` - From email address (optional, defaults to SMTP_USER)
- `EMAIL_FROM_NAME` - From display name (optional, defaults to "Edufiliova")

### System Design Choices
- **Hybrid Architecture**: Supabase for OAuth authentication only, Neon PostgreSQL (Replit) for all database storage via Drizzle ORM, Cloudinary for file storage. Uses a pure unique ID system (e.g., "202508R3D").
- **Scalable Architecture**: Designed for global reach and diverse user roles.
- **Secure System**: Row Level Security, secure API key handling, robust authentication.

## External Dependencies

### Database & Storage
- **Neon PostgreSQL (Replit)**: Primary database via Drizzle ORM.
- **Cloudinary**: File and audio uploads.

### Authentication & Communication
- **Supabase Authentication Service**: User management and OAuth authentication only.
- **SendGrid**: Email delivery.
- **Vonage API**: SMS verification.
- **WebSocket**: Real-time chat and system updates.

### UI & Development Tools
- **Radix UI**: Primitives for accessible UI components.

### Payment Gateways
- **Stripe**: Payment gateway (payment intents, subscriptions, webhooks).
- **PayPal**: Payment gateway.

### AI Services
- **OpenAI API**: AI-powered course content generation.
- **Anthropic Claude**: AI-powered course content generation.
- **Google Gemini**: AI-powered course content generation.