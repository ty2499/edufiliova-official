import { Router } from "express";
import { db } from "../db";
import { contactSubmissions } from "../../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { z } from "zod";
import { emailService } from "../utils/email";

const router = Router();

// Validation schemas
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const designTeamFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  projectType: z.string().min(1, "Project type is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  company: z.string().optional(),
  phone: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  fileUrl: z.string().optional(),
});

// Public endpoint: Submit general contact form
router.post("/contact", async (req, res) => {
  try {
    const validatedData = contactFormSchema.parse(req.body);

    // Save to database
    const [submission] = await db.insert(contactSubmissions).values({
      formType: 'contact',
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
    }).returning();

    // Try to send email notification (non-blocking)
    const emailContent = `
<h2>New Contact Form Submission</h2>

<p><strong>Contact Information:</strong></p>
<ul>
  <li>Name: ${validatedData.name}</li>
  <li>Email: ${validatedData.email}</li>
  <li>Subject: ${validatedData.subject}</li>
</ul>

<p><strong>Message:</strong></p>
<p>${validatedData.message}</p>

<p><small>Received: ${new Date().toLocaleString()}</small></p>
    `;

    emailService.sendEmail({
      to: 'support@edufiliova.com',
      subject: `Contact Form: ${validatedData.subject}`,
      html: emailContent
    }).catch((err: any) => {
      console.error('Email send error:', err);
    });

    res.json({ 
      success: true, 
      message: 'Thank you for contacting us! We will get back to you soon.',
      submissionId: submission.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Failed to send message. Please try again later.' 
    });
  }
});

// Public endpoint: Submit design team contact form
router.post("/design-team-contact", async (req, res) => {
  try {
    const validatedData = designTeamFormSchema.parse(req.body);

    // Save to database
    const [submission] = await db.insert(contactSubmissions).values({
      formType: 'design-team',
      name: validatedData.name,
      email: validatedData.email,
      company: validatedData.company || null,
      phone: validatedData.phone || null,
      projectType: validatedData.projectType,
      budget: validatedData.budget || null,
      timeline: validatedData.timeline || null,
      message: validatedData.message,
      fileUrl: validatedData.fileUrl || null,
    }).returning();

    // Try to send email notification (non-blocking)
    const emailContent = `
<h2>New Design Team Inquiry</h2>

<p><strong>Contact Information:</strong></p>
<ul>
  <li>Name: ${validatedData.name}</li>
  <li>Email: ${validatedData.email}</li>
  ${validatedData.company ? `<li>Company: ${validatedData.company}</li>` : ''}
  ${validatedData.phone ? `<li>Phone: ${validatedData.phone}</li>` : ''}
</ul>

<p><strong>Project Details:</strong></p>
<ul>
  <li>Type: ${validatedData.projectType}</li>
  ${validatedData.budget ? `<li>Budget: ${validatedData.budget}</li>` : ''}
  ${validatedData.timeline ? `<li>Timeline: ${validatedData.timeline}</li>` : ''}
</ul>

<p><strong>Message:</strong></p>
<p>${validatedData.message}</p>

${validatedData.fileUrl ? `<p><strong>Attached File:</strong> <a href="${validatedData.fileUrl}">${validatedData.fileUrl}</a></p>` : ''}

<p><small>Received: ${new Date().toLocaleString()}</small></p>
    `;

    emailService.sendEmail({
      to: 'design@edufiliova.com',
      subject: `New Design Team Inquiry from ${validatedData.name}`,
      html: emailContent
    }).catch((err: any) => {
      console.error('Email send error:', err);
    });

    res.json({ 
      success: true, 
      message: 'Your inquiry has been sent to our design team. We will contact you within 24 hours.',
      submissionId: submission.id
    });

  } catch (error) {
    console.error('Design team contact error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Failed to send inquiry. Please try again later.' 
    });
  }
});

// Admin endpoint: Get all contact submissions
router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { formType, status, isRead } = req.query;
    
    const conditions = [];
    if (formType) conditions.push(eq(contactSubmissions.formType, formType as string));
    if (status) conditions.push(eq(contactSubmissions.status, status as string));
    if (isRead !== undefined) conditions.push(eq(contactSubmissions.isRead, isRead === 'true'));
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const submissions = await db
      .select()
      .from(contactSubmissions)
      .where(whereClause)
      .orderBy(desc(contactSubmissions.createdAt));
    
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Get contact submissions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contact submissions' });
  }
});

// Admin endpoint: Update contact submission
router.patch("/admin/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead, status, adminNotes } = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    if (isRead !== undefined) updateData.isRead = isRead;
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    
    const [updated] = await db
      .update(contactSubmissions)
      .set(updateData)
      .where(eq(contactSubmissions.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update contact submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to update submission' });
  }
});

// Admin endpoint: Delete contact submission
router.delete("/admin/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db
      .delete(contactSubmissions)
      .where(eq(contactSubmissions.id, id));
    
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete contact submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete submission' });
  }
});

// Admin endpoint: Get submission statistics
router.get("/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const allSubmissions = await db.select().from(contactSubmissions);
    
    const stats = {
      total: allSubmissions.length,
      unread: allSubmissions.filter(s => !s.isRead).length,
      byFormType: {
        contact: allSubmissions.filter(s => s.formType === 'contact').length,
        designTeam: allSubmissions.filter(s => s.formType === 'design-team').length,
      },
      byStatus: {
        new: allSubmissions.filter(s => s.status === 'new').length,
        inProgress: allSubmissions.filter(s => s.status === 'in-progress').length,
        resolved: allSubmissions.filter(s => s.status === 'resolved').length,
      }
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

export default router;
