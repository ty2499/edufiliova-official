# Edufiliova Educational Platform

## Project Overview
Educational platform with course management, user authentication, payment processing, and real-time collaboration features.

## Recent Changes (December 26, 2025)

### Password Reset Functionality Fixed
**Issue:** The `/api/auth/verify-reset-code` endpoint was being blocked by authentication middleware, returning "Invalid or expired session" error.

**Root Cause:** The endpoint definition was nested inside another endpoint (`/api/course-creator/confirm-dodopay-purchase`) that required authentication, causing the auth middleware to protect the password reset endpoint incorrectly.

**Solution:** 
- Fixed the endpoint structure in `server/routes.ts` (lines 3084-3135)
- Moved `verify-reset-code` endpoint outside of the requireAuth-protected dodopay endpoint
- Endpoint now properly accepts POST requests without authentication
- Password reset flow now works: forgot-password → email with 6-digit code → verify-reset-code updates password → user can login with new password

### Current Password Reset Flow
1. User clicks "Forgot password?" on login page
2. Form accepts email and sends verification code via email (10-minute expiry)
3. User navigates to reset form with reset code field
4. Form accepts: Reset Code (6-digit), New Password, Confirm Password
5. Backend verifies code and updates password hash in database
6. Verification code is deleted after use
7. User can login with new password

## Architecture Notes
- Password reset endpoints (`/api/auth/forgot-password`, `/api/auth/verify-reset-code`) do NOT require authentication
- Verification codes stored in `verification_codes` table with 10-minute expiry
- Password hashing uses bcrypt with 10 salt rounds
- UI styled with #a0fab2 buttons and #0c332c icons

## Key Files
- `server/routes.ts` - Backend API endpoints
- `client/src/pages/AuthModern.tsx` - Login/auth UI components
- `server/middleware/auth.ts` - Authentication middleware

## Technology Stack
- Frontend: React + TypeScript + Vite
- Backend: Express.js + Drizzle ORM
- Database: PostgreSQL (Neon)
- Email: Nodemailer (custom email accounts)
- Authentication: Session-based with JWT option
- Payments: Stripe, PayPal integration
