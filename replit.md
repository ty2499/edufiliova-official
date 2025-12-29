# EduFiliova Project Status

## Overview
EduFiliova is an education platform featuring a comprehensive content moderation system designed to detect and remove personal information, prevent unsafe content, and enforce platform policies. It includes professional email notifications for various events. The platform also incorporates a robust freelancer marketplace with an order tracking system, similar to Upwork/Fiverr, covering the full buyer-freelancer workflow from payment to delivery and escrow management. Recent updates include a redesigned landing page hero section, an enhanced mega menu navigation system, and a wallet-based payment system for marketplace services.

## User Preferences
I want iterative development.
Ask me before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
### UI/UX Decisions
- **BentoHero Component**: Landing page hero features tab navigation for Students, Teachers, Freelancers, and Creators with animated content transitions, social proof, elegant serif headlines, and bento-style cards displaying stats, dashboard previews, and hero images.
- **Mega Menu Navigation**: Redesigned mega menu with a header, categorized grid layout with icons and descriptions, promotional images, and CTA buttons.
- **Mobile Navigation**: New `MobileNavMenu.tsx` with an accordion-style design, simple text links, categorized sections, and a consistent dark green color scheme, optimized for touch.
- **Freelancer Marketplace Frontend**: Fiverr-like UX with lazy-loaded pages, `shadcn/ui` components, React Query for data fetching, and a status stepper for order tracking.

### Technical Implementations
- **Order Lifecycle Management**: Comprehensive system managing freelancer orders through states like `pending_payment`, `awaiting_requirements`, `in_progress`, `delivered`, `revision_requested`, and `completed`. Includes database tables for `order_requirements` and `order_events`.
- **Wallet-Based Payment System**: For marketplace services, payments are wallet-based with an escrow system. A 15% platform fee is calculated, and funds are held until order completion or auto-release.
- **Content Moderation**: Utilizes `server/utils/moderation.ts` for detecting and removing personal information (emails, phone numbers, social media handles), and identifying unsafe content (NSFW images via OpenAI Vision, dating content via OpenAI GPT, profanity).
- **Protected Endpoints**: Moderation is integrated into messaging, course creation, and product creation endpoints.
- **User Actions on Violation**: Violations lead to immediate content rejection, session invalidation (auto-logout), clear error messages, and admin notifications.
- **Professional Email Notifications**: Standardized, professional email templates for account suspensions and admin alerts, ensuring clear communication without emojis and with proper HTML formatting.
- **Escrow Release System**: Freelancers deliver work, setting an `autoReleaseAt` countdown (3 days). Clients can approve, or the system auto-releases escrow, crediting the freelancer and platform.
- **Image CDN**: Email asset images are migrated to Cloudinary for smaller email sizes and faster delivery.

### Feature Specifications
- **Freelancer Dashboard Routes**: `/dashboard/freelancer/services` (list/manage), `/dashboard/freelancer/services/new` (create), `/dashboard/freelancer/services/:id/edit` (edit), `/dashboard/freelancer/orders` (manage orders).
- **Marketplace Routes**: `/marketplace/services` (browse/filter), `/marketplace/services/:id` (service detail), `/checkout/service/:id` (checkout), `/orders/:id` (order tracker).
- **API Endpoints**: Comprehensive set of API endpoints for managing freelancer orders, including fetching orders, requesting/submitting requirements, starting work, delivering, and requesting revisions.

## External Dependencies
- **OpenAI Vision**: Used for detecting nude/NSFW images in content moderation.
- **OpenAI GPT**: Used for detecting dating/romantic content in moderation.
- **Cloudinary**: Used as a CDN for email asset images.
- **React Query**: Used for data fetching in the frontend.
- **shadcn/ui**: Component library used for consistent UI throughout the application.