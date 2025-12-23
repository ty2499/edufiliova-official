import { Express, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { emailMarketingService } from '../services/email-marketing';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { 
  insertEmailMarketingTemplateSchema,
  insertEmailCampaignSchema,
  insertCampaignSegmentSchema,
  SegmentFilters
} from '@shared/schema';

export function registerEmailMarketingRoutes(app: Express) {
  
  // =====================================================
  // EMAIL MARKETING TEMPLATES
  // =====================================================
  
  app.get('/api/email-marketing/templates', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { category, activeOnly } = req.query;
      const templates = await storage.getEmailMarketingTemplates({
        category: category as string | undefined,
        activeOnly: activeOnly === 'true',
      });
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  app.get('/api/email-marketing/templates/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const template = await storage.getEmailMarketingTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  });

  app.post('/api/email-marketing/templates', requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertEmailMarketingTemplateSchema.parse(req.body);
      const authReq = req as AuthenticatedRequest;
      const template = await storage.createEmailMarketingTemplate({
        ...validatedData,
        createdBy: authReq.user?.userId,
      });
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  app.put('/api/email-marketing/templates/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const template = await storage.updateEmailMarketingTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  app.delete('/api/email-marketing/templates/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteEmailMarketingTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  app.post('/api/email-marketing/templates/:id/preview', requireAuth, requireAdmin, async (req, res) => {
    try {
      const preview = await emailMarketingService.getTemplatePreview(
        req.params.id,
        req.body.variables
      );
      if (!preview) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(preview);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  });

  // =====================================================
  // EMAIL CAMPAIGNS
  // =====================================================

  app.get('/api/email-marketing/campaigns', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, limit, offset } = req.query;
      const campaigns = await storage.getEmailCampaigns({
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  app.get('/api/email-marketing/campaigns/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  });

  app.post('/api/email-marketing/campaigns', requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertEmailCampaignSchema.parse(req.body);
      const authReq = req as AuthenticatedRequest;
      const campaign = await storage.createEmailCampaign({
        ...validatedData,
        createdBy: authReq.user?.userId,
      });
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  });

  app.put('/api/email-marketing/campaigns/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      if (campaign.status === 'sending' || campaign.status === 'completed') {
        return res.status(400).json({ error: 'Cannot edit a campaign that is sending or completed' });
      }
      const updated = await storage.updateEmailCampaign(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  });

  app.delete('/api/email-marketing/campaigns/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      if (campaign.status === 'sending') {
        return res.status(400).json({ error: 'Cannot delete a campaign that is currently sending' });
      }
      const success = await storage.deleteEmailCampaign(req.params.id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  });

  app.post('/api/email-marketing/campaigns/:id/send', requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!emailMarketingService.isConfigured()) {
        return res.status(503).json({ 
          error: 'Email service not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.' 
        });
      }

      const result = await emailMarketingService.sendCampaign(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/email-marketing/campaigns/:id/test', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email address required' });
      }

      const campaign = await storage.getEmailCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const result = await emailMarketingService.sendTestEmail(
        email,
        campaign.subject,
        campaign.htmlContent,
        campaign.textContent || undefined
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to send test email' });
    }
  });

  app.get('/api/email-marketing/campaigns/:id/deliveries', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, limit, offset } = req.query;
      const deliveries = await storage.getCampaignDeliveries(req.params.id, {
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
  });

  // =====================================================
  // CAMPAIGN SEGMENTS
  // =====================================================

  app.get('/api/email-marketing/segments', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { activeOnly } = req.query;
      const segments = await storage.getCampaignSegments(activeOnly === 'true');
      res.json(segments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch segments' });
    }
  });

  app.get('/api/email-marketing/segments/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const segment = await storage.getCampaignSegmentById(req.params.id);
      if (!segment) {
        return res.status(404).json({ error: 'Segment not found' });
      }
      res.json(segment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch segment' });
    }
  });

  app.post('/api/email-marketing/segments', requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCampaignSegmentSchema.parse(req.body);
      const authReq = req as AuthenticatedRequest;
      
      const estimatedSize = await storage.getSegmentEstimatedSize(
        validatedData.filters as SegmentFilters
      );
      
      const segment = await storage.createCampaignSegment({
        ...validatedData,
        estimatedSize,
        createdBy: authReq.user?.userId,
      });
      res.status(201).json(segment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create segment' });
    }
  });

  app.put('/api/email-marketing/segments/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const segment = await storage.updateCampaignSegment(req.params.id, req.body);
      if (!segment) {
        return res.status(404).json({ error: 'Segment not found' });
      }
      res.json(segment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update segment' });
    }
  });

  app.delete('/api/email-marketing/segments/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCampaignSegment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Segment not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete segment' });
    }
  });

  app.post('/api/email-marketing/segments/estimate', requireAuth, requireAdmin, async (req, res) => {
    try {
      const filters = req.body as SegmentFilters;
      const size = await storage.getSegmentEstimatedSize(filters);
      res.json({ estimatedSize: size });
    } catch (error) {
      res.status(500).json({ error: 'Failed to estimate segment size' });
    }
  });

  // =====================================================
  // USER EMAIL PREFERENCES (Public routes for unsubscribe)
  // =====================================================

  app.get('/api/email-preferences', requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const preference = await storage.getEmailPreferenceByUserId(userId);
      res.json(preference || {
        marketingOptIn: true,
        newsletterOptIn: true,
        productUpdatesOptIn: true,
        promotionsOptIn: true,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  app.put('/api/email-preferences', requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { marketingOptIn, newsletterOptIn, productUpdatesOptIn, promotionsOptIn } = req.body;
      
      const existing = await storage.getEmailPreferenceByUserId(userId);
      
      if (existing) {
        const updated = await storage.updateEmailPreference(existing.id, {
          marketingOptIn,
          newsletterOptIn,
          productUpdatesOptIn,
          promotionsOptIn,
        });
        return res.json(updated);
      }

      const newPref = await storage.createOrUpdateEmailPreference({
        userId,
        email: authReq.user?.email || '',
        unsubscribeToken: crypto.randomUUID(),
        marketingOptIn: marketingOptIn ?? true,
        newsletterOptIn: newsletterOptIn ?? true,
        productUpdatesOptIn: productUpdatesOptIn ?? true,
        promotionsOptIn: promotionsOptIn ?? true,
      });
      
      res.json(newPref);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  app.get('/api/unsubscribe/:token', async (req, res) => {
    try {
      const preference = await storage.getEmailPreferenceByToken(req.params.token);
      if (!preference) {
        return res.status(404).json({ error: 'Invalid unsubscribe link' });
      }
      res.json({
        email: preference.email,
        alreadyUnsubscribed: preference.unsubscribedAt !== null,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify unsubscribe token' });
    }
  });

  app.post('/api/unsubscribe/:token', async (req, res) => {
    try {
      const { reason } = req.body;
      const updated = await storage.unsubscribeByToken(req.params.token, reason);
      
      if (!updated) {
        return res.status(404).json({ error: 'Invalid unsubscribe link' });
      }
      
      res.json({ success: true, message: 'Successfully unsubscribed from marketing emails' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  });

  // =====================================================
  // EMAIL SERVICE STATUS
  // =====================================================

  app.get('/api/email-marketing/status', requireAuth, requireAdmin, async (req, res) => {
    try {
      await emailMarketingService.ensureInitialized();
      const configured = emailMarketingService.isConfigured();
      console.log('📧 Status check - configured:', configured);
      
      if (!configured) {
        return res.json({
          configured: false,
          message: 'Email service not configured. Configure email accounts in the database or set SMTP environment variables.',
        });
      }

      const testResult = await emailMarketingService.testConnection();
      
      res.json({
        configured: true,
        connectionValid: testResult.success,
        error: testResult.error,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check email status' });
    }
  });

  // =====================================================
  // TEST ALL SYSTEM EMAILS (Admin only)
  // =====================================================

  app.post('/api/email-marketing/test-all-emails', requireAuth, requireAdmin, async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address required' });
    }

    console.log(`📧 [TEST] Sending all system email tests to: ${email}`);
    
    const { emailService } = await import('../utils/email');
    
    const results: { name: string; success: boolean; error?: string }[] = [];
    const testOrderId = 'test-' + Date.now().toString(36);
    const testName = 'Test User';

    try {
      // 1. Welcome Email
      try {
        const success = await emailService.sendWelcomeEmail(email, { userName: testName, accountType: 'student' });
        results.push({ name: 'Welcome Email', success });
      } catch (e) { results.push({ name: 'Welcome Email', success: false, error: (e as Error).message }); }

      // 2. Student Verification
      try {
        const success = await emailService.sendStudentVerificationEmail(email, { fullName: testName, verificationCode: '123456' });
        results.push({ name: 'Student Verification', success });
      } catch (e) { results.push({ name: 'Student Verification', success: false, error: (e as Error).message }); }

      // 3. Teacher Verification
      try {
        const success = await emailService.sendTeacherVerificationEmail(email, { fullName: testName, verificationCode: '654321' });
        results.push({ name: 'Teacher Verification', success });
      } catch (e) { results.push({ name: 'Teacher Verification', success: false, error: (e as Error).message }); }

      // 4. Freelancer Verification
      try {
        const success = await emailService.sendFreelancerVerificationEmail(email, { fullName: testName, verificationCode: '789012' });
        results.push({ name: 'Freelancer Verification', success });
      } catch (e) { results.push({ name: 'Freelancer Verification', success: false, error: (e as Error).message }); }

      // 5. Shop Verification
      try {
        const success = await emailService.sendShopVerificationEmail(email, { fullName: testName, verificationCode: '345678' });
        results.push({ name: 'Shop Verification', success });
      } catch (e) { results.push({ name: 'Shop Verification', success: false, error: (e as Error).message }); }

      // 6. Password Reset
      try {
        const success = await emailService.sendPasswordResetEmail(email, { userName: testName, resetToken: 'test-token-123', expiresIn: 60 });
        results.push({ name: 'Password Reset', success });
      } catch (e) { results.push({ name: 'Password Reset', success: false, error: (e as Error).message }); }

      // 7. New Device Login
      try {
        const success = await emailService.sendNewDeviceLoginEmail(email, {
          userName: testName,
          deviceName: 'Chrome on Windows',
          location: 'Harare, Zimbabwe',
          ipAddress: '192.168.1.1',
          loginTime: new Date(),
          browser: 'Chrome',
          os: 'Windows'
        });
        results.push({ name: 'New Device Login', success });
      } catch (e) { results.push({ name: 'New Device Login', success: false, error: (e as Error).message }); }

      // 8. Teacher Approval
      try {
        const success = await emailService.sendTeacherApprovalEmail(email, { fullName: testName, displayName: testName });
        results.push({ name: 'Teacher Approval', success });
      } catch (e) { results.push({ name: 'Teacher Approval', success: false, error: (e as Error).message }); }

      // 9. Freelancer Application Status
      try {
        const success = await emailService.sendFreelancerApplicationStatusEmail(email, { fullName: testName, status: 'approved', reason: 'Congratulations!' });
        results.push({ name: 'Freelancer Application Status', success });
      } catch (e) { results.push({ name: 'Freelancer Application Status', success: false, error: (e as Error).message }); }

      // 10. Product Purchase / Order Confirmation
      try {
        const success = await emailService.sendProductPurchaseEmail(email, {
          orderId: testOrderId,
          customerName: testName,
          productName: 'Test Product Bundle',
          quantity: 2,
          price: 59.98,
          items: [{ name: 'Test Product 1', quantity: 1, price: 29.99 }, { name: 'Test Product 2', quantity: 1, price: 29.99 }]
        });
        results.push({ name: 'Product Purchase / Order', success });
      } catch (e) { results.push({ name: 'Product Purchase / Order', success: false, error: (e as Error).message }); }

      // 11. Digital Products Ready
      try {
        const success = await emailService.sendDigitalProductPurchaseEmail(email, {
          orderId: testOrderId,
          customerName: testName,
          totalPrice: 49.99,
          items: [{ name: 'Test Digital Product', downloadToken: 'test-token', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }]
        });
        results.push({ name: 'Digital Products Ready', success });
      } catch (e) { results.push({ name: 'Digital Products Ready', success: false, error: (e as Error).message }); }

      // 12. Order Shipped
      try {
        const success = await emailService.sendOrderShippedEmail(email, {
          orderId: testOrderId,
          customerName: testName,
          trackingNumber: 'TRACK123456',
          carrier: 'DHL',
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        });
        results.push({ name: 'Order Shipped', success });
      } catch (e) { results.push({ name: 'Order Shipped', success: false, error: (e as Error).message }); }

      // 13. Payment Failed
      try {
        const success = await emailService.sendPaymentFailedEmail(email, {
          orderId: testOrderId,
          customerName: testName,
          amount: 29.99,
          reason: 'Card declined',
          retryUrl: 'https://edufiliova.com/retry-payment'
        });
        results.push({ name: 'Payment Failed', success });
      } catch (e) { results.push({ name: 'Payment Failed', success: false, error: (e as Error).message }); }

      // 14. Advertisement Confirmation
      try {
        const success = await emailService.sendAdPurchaseEmail(email, {
          orderId: testOrderId,
          customerName: testName,
          adTitle: 'Test Banner Ad',
          placement: 'Homepage',
          duration: 30,
          price: 99.99
        });
        results.push({ name: 'Advertisement Confirmation', success });
      } catch (e) { results.push({ name: 'Advertisement Confirmation', success: false, error: (e as Error).message }); }

      // 15. Course Purchase
      try {
        const success = await emailService.sendCoursePurchaseEmail(email, {
          orderId: testOrderId,
          customerName: testName,
          courseName: 'Test Course: Learn Something New',
          price: 49.99
        });
        results.push({ name: 'Course Purchase', success });
      } catch (e) { results.push({ name: 'Course Purchase', success: false, error: (e as Error).message }); }

      // 16. Subscription Activated
      try {
        const success = await emailService.sendSubscriptionEmail(email, {
          orderId: testOrderId,
          customerName: testName,
          planName: 'Premium Plan',
          price: 19.99,
          billingCycle: 'Monthly',
          features: ['Unlimited access', 'Priority support', 'Exclusive content']
        });
        results.push({ name: 'Subscription Activated', success });
      } catch (e) { results.push({ name: 'Subscription Activated', success: false, error: (e as Error).message }); }

      // 17. Certificate Ready
      try {
        const success = await emailService.sendCertificateEmail(email, {
          studentName: testName,
          courseTitle: 'Test Course Certificate',
          certificateUrl: 'https://edufiliova.com/certificates/test',
          completionDate: new Date(),
          verificationCode: 'CERT-TEST-001',
          finalScore: 95
        });
        results.push({ name: 'Certificate Ready', success });
      } catch (e) { results.push({ name: 'Certificate Ready', success: false, error: (e as Error).message }); }

      // 18. Meeting Reminder
      try {
        const success = await emailService.sendMeetingReminderEmail(email, {
          studentName: testName,
          teacherName: 'Mr. Test Teacher',
          meetingTime: new Date(Date.now() + 15 * 60 * 1000),
          meetingLink: 'https://edufiliova.com/meeting/test'
        });
        results.push({ name: 'Meeting Reminder', success });
      } catch (e) { results.push({ name: 'Meeting Reminder', success: false, error: (e as Error).message }); }

      // 19. Contact Form Notification
      try {
        const success = await emailService.sendContactFormNotificationEmail({
          senderName: testName,
          senderEmail: email,
          subject: 'Test Contact Form',
          message: 'This is a test message from the contact form.',
          submittedAt: new Date()
        });
        results.push({ name: 'Contact Form Notification', success });
      } catch (e) { results.push({ name: 'Contact Form Notification', success: false, error: (e as Error).message }); }

      // 20. Simple Email Test (using sendEmail directly)
      try {
        const success = await emailService.sendEmail({
          to: email,
          subject: '[TEST] Receipt Email Test',
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2 style="color: #0C332C;">Receipt Test Email</h2><p>This is a test of the receipt email functionality.</p><p><strong>Receipt #:</strong> REC-TEST-001</p><p><strong>Amount:</strong> $29.99</p></div>`
        });
        results.push({ name: 'Receipt Email', success });
      } catch (e) { results.push({ name: 'Receipt Email', success: false, error: (e as Error).message }); }

      const sent = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`📧 [TEST] Complete: ${sent} sent, ${failed} failed`);
      
      res.json({
        success: true,
        email,
        total: results.length,
        sent,
        failed,
        results
      });

    } catch (error) {
      console.error('📧 [TEST] Error:', error);
      res.status(500).json({ error: 'Failed to send test emails', details: (error as Error).message });
    }
  });

  console.log('📧 Email marketing routes registered');
}
