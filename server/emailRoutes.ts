import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { emailService } from "./emailService";
import { insertEmailAccountSchema, insertEmailReplySchema, type EmailReply } from "@shared/schema";
import { requireAuth, requireAdminOrModerator, type AuthenticatedRequest } from "./middleware/auth";
import { upload } from "./upload";
import { cloudinaryStorage } from "./cloudinary-storage";

export function registerEmailRoutes(app: Express) {
  // Email Accounts Management
  
  // Get all email accounts
  app.get("/api/email/accounts", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const accounts = await storage.getEmailAccounts();
      // Don't send passwords to frontend
      const sanitizedAccounts = accounts.map(acc => ({
        ...acc,
        imapPassword: '***',
        smtpPassword: '***'
      }));
      res.json(sanitizedAccounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email accounts" });
    }
  });

  // Get email account by ID
  app.get("/api/email/accounts/:id", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const account = await storage.getEmailAccountById(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      // Don't send passwords to frontend
      res.json({
        ...account,
        imapPassword: '***',
        smtpPassword: '***'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email account" });
    }
  });

  // Create new email account
  app.post("/api/email/accounts", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertEmailAccountSchema.parse(req.body);
      const newAccount = await storage.createEmailAccount(validated);
      
      // Test the connection
      const testResult = await emailService.testEmailAccount(newAccount);
      
      if (!testResult.imap || !testResult.smtp) {
        // Delete the account if test failed
        await storage.deleteEmailAccount(newAccount.id);
        return res.status(400).json({ 
          message: "Email account connection test failed", 
          errors: testResult.errors 
        });
      }
      
      res.json({
        ...newAccount,
        imapPassword: '***',
        smtpPassword: '***'
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create email account" });
    }
  });

  // Update email account
  app.patch("/api/email/accounts/:id", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      // Validate partial updates using Zod's partial schema
      const updates = insertEmailAccountSchema.partial().parse(req.body);
      const updated = await storage.updateEmailAccount(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Email account not found" });
      }
      res.json({
        ...updated,
        imapPassword: '***',
        smtpPassword: '***'
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to update email account" });
    }
  });

  // Delete email account
  app.delete("/api/email/accounts/:id", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.deleteEmailAccount(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Email account not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  // Test email account connection
  app.post("/api/email/accounts/:id/test", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const account = await storage.getEmailAccountById(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      const testResult = await emailService.testEmailAccount(account);
      res.json(testResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to test email account" });
    }
  });

  // Sync/Fetch emails from account
  app.post("/api/email/accounts/:id/sync", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const account = await storage.getEmailAccountById(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      // Fetch emails in background (don't wait for completion)
      emailService.fetchEmailsFromAccount(account, 100).catch(err => {
        console.error('Error fetching emails:', err);
      });
      
      res.json({ message: "Email sync started", status: "syncing" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start email sync" });
    }
  });

  // Email Messages Management
  
  // Get all email messages (optimized - single query for all replies)
  app.get("/api/email/messages", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const { accountId, limit, offset, unreadOnly } = req.query;
      const messages = await storage.getEmailMessages({
        accountId: accountId as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        unreadOnly: unreadOnly === 'true'
      });
      
      if (messages.length === 0) {
        return res.json([]);
      }
      
      // Fetch ALL replies for ALL messages in a single efficient query
      const messageIds = messages.map(m => m.id);
      const allReplies = await storage.getEmailRepliesBatch(messageIds);
      
      // Group replies by message ID for O(1) lookup
      const repliesByMessageId = new Map<string, EmailReply[]>();
      allReplies.forEach(reply => {
        if (!repliesByMessageId.has(reply.emailMessageId)) {
          repliesByMessageId.set(reply.emailMessageId, []);
        }
        repliesByMessageId.get(reply.emailMessageId)!.push(reply);
      });
      
      // Attach replies to messages
      const messagesWithReplies = messages.map(message => ({
        ...message,
        replies: repliesByMessageId.get(message.id) || []
      }));
      
      console.log(`📧 Returning ${messagesWithReplies.length} messages with replies (optimized)`);
      res.json(messagesWithReplies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email messages" });
    }
  });

  // Get email message by ID with account info
  app.get("/api/email/messages/:id", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const message = await storage.getEmailMessageById(req.params.id);
      if (!message) {
        return res.status(404).json({ message: "Email message not found" });
      }
      
      // Get associated account
      const account = await storage.getEmailAccountById(message.emailAccountId);
      
      // Get replies
      const replies = await storage.getEmailReplies(message.id);
      
      res.json({
        ...message,
        account: account ? {
          id: account.id,
          email: account.email,
          displayName: account.displayName
        } : null,
        replies
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email message" });
    }
  });

  // Mark email as read/unread
  app.patch("/api/email/messages/:id/read", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const markReadSchema = z.object({ isRead: z.boolean() });
      const { isRead } = markReadSchema.parse(req.body);
      const updated = await storage.markEmailAsRead(req.params.id, isRead);
      if (!updated) {
        return res.status(404).json({ message: "Email message not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update email message" });
    }
  });

  // Mark email as spam/not spam
  app.patch("/api/email/messages/:id/spam", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const markSpamSchema = z.object({ isSpam: z.boolean() });
      const { isSpam } = markSpamSchema.parse(req.body);
      const updated = await storage.markEmailAsSpam(req.params.id, isSpam);
      if (!updated) {
        return res.status(404).json({ message: "Email message not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update email message" });
    }
  });

  // Mark email as archived/unarchived
  app.patch("/api/email/messages/:id/archive", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const markArchivedSchema = z.object({ isArchived: z.boolean() });
      const { isArchived } = markArchivedSchema.parse(req.body);
      const updated = await storage.markEmailAsArchived(req.params.id, isArchived);
      if (!updated) {
        return res.status(404).json({ message: "Email message not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update email message" });
    }
  });

  // Mark email as trashed/untrashed
  app.patch("/api/email/messages/:id/trash", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const markTrashedSchema = z.object({ isTrashed: z.boolean() });
      const { isTrashed } = markTrashedSchema.parse(req.body);
      const updated = await storage.markEmailAsTrashed(req.params.id, isTrashed);
      if (!updated) {
        return res.status(404).json({ message: "Email message not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update email message" });
    }
  });

  // Delete email message (actually marks as trashed to prevent re-import from IMAP)
  app.delete("/api/email/messages/:id", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      // Mark message as trashed instead of deleting (prevents re-import from IMAP)
      const updated = await storage.markEmailAsTrashed(req.params.id, true);
      if (!updated) {
        return res.status(404).json({ message: "Email message not found" });
      }
      
      // Also delete replies to clean up
      await storage.deleteEmailReplies(req.params.id);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email message:', error);
      res.status(500).json({ message: "Failed to delete email message" });
    }
  });

  // Upload email attachment (photos, documents)
  app.post("/api/email/attachments/upload", requireAuth, requireAdminOrModerator, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to Cloudinary with correct parameters
      const result = await cloudinaryStorage.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'email-attachments'
      );
      
      // Check if upload was successful
      if (!result.success || !result.url) {
        return res.status(500).json({ 
          message: result.error || "Failed to upload file to cloud storage" 
        });
      }
      
      res.json({
        url: result.url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'document'
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to upload file" });
    }
  });

  // Send email reply (chat-style message)
  app.post("/api/email/messages/:id/reply", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const message = await storage.getEmailMessageById(req.params.id);
      if (!message) {
        return res.status(404).json({ message: "Email message not found" });
      }
      
      const account = await storage.getEmailAccountById(message.emailAccountId);
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      // Validate reply payload with minimal required fields
      const replySchema = z.object({
        textBody: z.string().min(1),
        htmlBody: z.string().optional(),
        attachments: z.array(z.object({
          url: z.string(),
          fileName: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          type: z.enum(['image', 'document'])
        })).optional(),
        to: z.string().optional(),
        cc: z.string().optional(),
        subject: z.string().optional()
      });
      
      const { to, cc, subject, textBody, htmlBody, attachments } = replySchema.parse(req.body);
      
      // Send the reply using SMTP with attachments
      await emailService.sendEmailReply(
        account,
        to || message.from,
        subject || `Re: ${message.subject}`,
        textBody || '',
        htmlBody || undefined,
        cc || undefined,
        message.messageId,
        message.references || message.messageId,
        attachments || undefined
      );
      
      // Save reply to database with attachments
      const reply = await storage.createEmailReply({
        emailMessageId: message.id,
        emailAccountId: account.id,
        to: to || message.from,
        cc: cc || null,
        subject: subject || `Re: ${message.subject}`,
        textBody,
        htmlBody: htmlBody || null,
        attachments: attachments || null,
        sentBy: (req as any).user?.id || '',
        sentAt: new Date(),
        sendStatus: 'sent'
      });
      
      // Mark original message as replied
      await storage.markEmailAsReplied(message.id);
      
      // Broadcast new reply to all admins via WebSocket for instant updates
      try {
        const wss = (global as any).wss;
        if (wss && wss.adminConnections) {
          const replyNotification = {
            type: 'new_email_reply',
            reply: reply,
            messageId: message.id,
            timestamp: new Date().toISOString()
          };
          
          wss.adminConnections.forEach((ws: any) => {
            if (ws.readyState === 1) { // WebSocket.OPEN
              ws.send(JSON.stringify(replyNotification));
            }
          });
          
          console.log(`💬 Broadcasted new reply to ${wss.adminConnections.size} admin(s)`);
        }
      } catch (error) {
        console.error('Error broadcasting reply:', error);
      }
      
      res.json(reply);
    } catch (error) {
      console.error('Error sending reply:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to send email reply" });
    }
  });

  // Send new email (not a reply)
  app.post("/api/email/send", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const sendSchema = z.object({
        to: z.string().min(1), // Accept both email and group identifiers
        subject: z.string().min(1),
        textBody: z.string().min(1),
        htmlBody: z.string().optional(),
        cc: z.string().optional(),
        accountId: z.string().optional(),
        attachments: z.array(z.object({
          url: z.string(),
          fileName: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          type: z.enum(['image', 'document'])
        })).optional()
      });
      
      const { to, subject, textBody, htmlBody, cc, accountId, attachments } = sendSchema.parse(req.body);
      
      // Get the specified email account or fall back to the first available one
      let account;
      if (accountId) {
        account = await storage.getEmailAccountById(accountId);
        if (!account) {
          return res.status(400).json({ message: "Specified email account not found" });
        }
      } else {
        const accounts = await storage.getEmailAccounts();
        if (accounts.length === 0) {
          return res.status(400).json({ message: "No email account configured" });
        }
        account = accounts[0];
      }
      
      // Check if 'to' is a group identifier or individual email
      const groupMappings: Record<string, string> = {
        'all_students': 'student',
        'all_teachers': 'teacher',
        'all_freelancers': 'freelancer',
        'all_customers': 'general'
      };
      
      let recipients: string[] = [];
      if (groupMappings[to]) {
        // It's a group - fetch all users with that role
        const role = groupMappings[to];
        const users = await storage.getUsersByRole(role);
        recipients = users.map(u => u.email);
        
        if (recipients.length === 0) {
          return res.status(400).json({ message: `No ${role}s found in the system` });
        }
        
        console.log(`📧 Sending group email to ${recipients.length} ${role}(s)`);
      } else {
        // Validate it's a proper email address
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
          return res.status(400).json({ message: "Invalid email address" });
        }
        recipients = [to];
      }
      
      // Send emails to all recipients
      let successCount = 0;
      let failureCount = 0;
      
      for (const recipient of recipients) {
        try {
          // Send the email using SMTP
          await emailService.sendEmailReply(
            account,
            recipient,
            subject,
            textBody,
            htmlBody,
            cc,
            undefined,
            undefined,
            attachments
          );
          
          // Create an email message in the database to show as a conversation thread
          const messageId = `sent-${Date.now()}-${recipient}@${account.email}`;
          await storage.createEmailMessage({
            emailAccountId: account.id,
            messageId: messageId,
            from: account.email,
            to: recipient,
            cc: cc || null,
            bcc: null,
            subject: subject,
            textBody: textBody,
            htmlBody: htmlBody || null,
            isRead: true, // Mark as read since we sent it
            isReplied: false,
            isStarred: false,
            inReplyTo: null,
            references: null,
            attachments: attachments || null,
            receivedAt: new Date()
          });
          
          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          failureCount++;
        }
      }
      
      res.json({ 
        success: true, 
        message: recipients.length > 1 
          ? `Emails sent: ${successCount} successful, ${failureCount} failed`
          : "Email sent successfully",
        sentTo: recipients.length,
        successCount,
        failureCount
      });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to send email" });
    }
  });

  // Get unread email count
  app.get("/api/email/unread-count", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const { accountId } = req.query;
      const count = await storage.getUnreadEmailCount(accountId as string | undefined);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Test endpoint to send all email templates
  app.post("/api/email/test-templates", requireAuth, requireAdminOrModerator, async (req: AuthenticatedRequest, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address required" });
      }

      const emailUtil = await import('./utils/email');
      const voucherEmail = await import('./email');
      const results = [];

      // 1. Test Ad Purchase Email
      try {
        await emailUtil.default.sendAdPurchaseEmail(email, {
          adTitle: "Premium Homepage Banner",
          placement: "Homepage Hero Section",
          duration: 30,
          price: 299.99,
          orderId: "test-ad-" + Date.now(),
          customerName: "Test Customer"
        });
        results.push({ template: "Ad Purchase", status: "sent" });
      } catch (error) {
        results.push({ template: "Ad Purchase", status: "failed", error: (error as Error).message });
      }

      // 2. Test Course Purchase Email
      try {
        await emailUtil.default.sendCoursePurchaseEmail(email, {
          courseName: "Advanced JavaScript & TypeScript Mastery",
          price: 149.99,
          orderId: "test-course-" + Date.now(),
          customerName: "Test Customer",
          accessUrl: "https://edufiliova.com/courses/js-typescript"
        });
        results.push({ template: "Course Purchase", status: "sent" });
      } catch (error) {
        results.push({ template: "Course Purchase", status: "failed", error: (error as Error).message });
      }

      // 3. Test Subscription Email
      try {
        await emailUtil.default.sendSubscriptionEmail(email, {
          planName: "Premium Plus Membership",
          price: 29.99,
          billingCycle: "Monthly",
          orderId: "test-sub-" + Date.now(),
          customerName: "Test Customer",
          features: [
            "Unlimited access to all courses",
            "Priority customer support",
            "Exclusive community access",
            "Monthly live workshops",
            "Downloadable resources"
          ]
        });
        results.push({ template: "Subscription", status: "sent" });
      } catch (error) {
        results.push({ template: "Subscription", status: "failed", error: (error as Error).message });
      }

      // 4. Test Digital Product Purchase Email
      try {
        await emailUtil.default.sendDigitalProductPurchaseEmail(email, {
          orderId: "test-digital-" + Date.now(),
          customerName: "Test Customer",
          totalPrice: 79.99,
          items: [
            {
              name: "UI/UX Design Templates Pack",
              downloadToken: "test-token-123",
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            },
            {
              name: "Premium Icon Set (500+ Icons)",
              downloadToken: "test-token-456",
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          ]
        });
        results.push({ template: "Digital Product Purchase", status: "sent" });
      } catch (error) {
        results.push({ template: "Digital Product Purchase", status: "failed", error: (error as Error).message });
      }

      // 5. Test Gift Voucher Email
      try {
        await voucherEmail.sendVoucherEmail(
          email,
          "Test Customer",
          "GIFT2025-" + Date.now().toString().slice(-6),
          50.00,
          "Welcome Gift Voucher",
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        );
        results.push({ template: "Gift Voucher", status: "sent" });
      } catch (error) {
        results.push({ template: "Gift Voucher", status: "failed", error: (error as Error).message });
      }

      res.json({ 
        success: true, 
        message: `Sent ${results.filter(r => r.status === "sent").length} out of ${results.length} test emails to ${email}`,
        results 
      });
    } catch (error) {
      console.error('Error sending test emails:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to send test emails" });
    }
  });
}
