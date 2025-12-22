import { Router } from "express";
import { db } from "../db";
import { receipts, profiles, users } from "@shared/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { receiptService, ReceiptService } from "../services/receipts";
import { emailService } from "../utils/email";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userReceipts = await db
      .select()
      .from(receipts)
      .where(
        or(
          eq(receipts.userId, req.user!.id),
          eq(receipts.payerEmail, req.user!.email)
        )
      )
      .orderBy(desc(receipts.issuedAt))
      .limit(100);

    res.json({ success: true, data: userReceipts });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch receipts" });
  }
});

router.get("/:receiptId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { receiptId } = req.params;

    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receipt) {
      return res.status(404).json({ success: false, error: "Receipt not found" });
    }

    if (receipt.userId !== req.user!.id && receipt.payerEmail !== req.user!.email && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({ success: false, error: "Failed to fetch receipt" });
  }
});

router.get("/:receiptId/download", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { receiptId } = req.params;

    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receipt) {
      return res.status(404).json({ success: false, error: "Receipt not found" });
    }

    if (receipt.userId !== req.user!.id && receipt.payerEmail !== req.user!.email && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const pdfBuffer = await receiptService.regeneratePDF(receiptId);
    if (!pdfBuffer) {
      return res.status(500).json({ success: false, error: "Failed to generate PDF" });
    }

    await db.update(receipts)
      .set({
        downloadCount: (receipt.downloadCount || 0) + 1,
        lastDownloadedAt: new Date(),
        deliveryStatus: 'downloaded',
      })
      .where(eq(receipts.id, receiptId));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=EduFiliova-Receipt-${receipt.receiptNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading receipt:", error);
    res.status(500).json({ success: false, error: "Failed to download receipt" });
  }
});

router.post("/:receiptId/resend", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { receiptId } = req.params;

    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receipt) {
      return res.status(404).json({ success: false, error: "Receipt not found" });
    }

    if (receipt.userId !== req.user!.id && receipt.payerEmail !== req.user!.email && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const pdfBuffer = await receiptService.regeneratePDF(receiptId);
    if (!pdfBuffer) {
      return res.status(500).json({ success: false, error: "Failed to generate PDF" });
    }

    const items = (receipt.items as any[]).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.unitPrice || item.totalPrice / item.quantity,
    }));

    const emailSent = await emailService.sendReceiptEmail(
      receipt.payerEmail,
      {
        receiptNumber: receipt.receiptNumber,
        receiptType: receipt.receiptType as any,
        customerName: receipt.payerName || 'Customer',
        totalAmount: parseFloat(receipt.amount),
        currency: receipt.currency,
        items,
        sourceId: receipt.sourceId,
        userRole: (receipt.metadata as any)?.userRole,
      },
      pdfBuffer
    );

    if (emailSent) {
      await db.update(receipts)
        .set({
          emailSentAt: new Date(),
          deliveryStatus: 'sent',
        })
        .where(eq(receipts.id, receiptId));
    }

    res.json({ 
      success: true, 
      message: emailSent ? 'Receipt sent successfully' : 'Failed to send email',
      emailSent 
    });
  } catch (error) {
    console.error("Error resending receipt:", error);
    res.status(500).json({ success: false, error: "Failed to resend receipt" });
  }
});

router.get("/by-source/:sourceType/:sourceId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { sourceType, sourceId } = req.params;

    const typeMap: Record<string, string> = {
      order: 'order',
      subscription: 'subscription',
      freelancer: 'freelancer_plan',
      banner: 'banner_payment',
      certificate: 'certificate',
    };

    const receiptType = typeMap[sourceType] || sourceType;

    const [receipt] = await db
      .select()
      .from(receipts)
      .where(and(
        eq(receipts.sourceId, sourceId),
        eq(receipts.receiptType, receiptType as any)
      ))
      .limit(1);

    if (!receipt) {
      return res.status(404).json({ success: false, error: "Receipt not found" });
    }

    if (receipt.userId !== req.user!.id && receipt.payerEmail !== req.user!.email && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error("Error fetching receipt by source:", error);
    res.status(500).json({ success: false, error: "Failed to fetch receipt" });
  }
});

export async function generateAndSendOrderReceipt(
  order: { id: string; totalAmount: string; currency: string; paymentMethod: string | null; createdAt: Date },
  buyer: { name: string | null; email: string; userId?: string; role?: string },
  items: Array<{ name: string; quantity: number; price: string }>
): Promise<boolean> {
  try {
    const payload = ReceiptService.createOrderPayload(order, buyer, items);
    const { receipt, pdfBuffer } = await receiptService.createAndSaveReceipt(payload);
    
    const emailItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
    }));
    
    const emailSent = await emailService.sendReceiptEmail(
      buyer.email,
      {
        receiptNumber: receipt.receiptNumber,
        receiptType: 'order',
        customerName: buyer.name || 'Customer',
        totalAmount: parseFloat(order.totalAmount),
        currency: order.currency,
        items: emailItems,
        sourceId: order.id,
        userRole: buyer.role,
      },
      pdfBuffer
    );

    if (emailSent) {
      await receiptService.markAsEmailed(receipt.id);
    } else {
      await receiptService.markAsFailed(receipt.id);
    }

    console.log(`📧 Order receipt ${emailSent ? 'sent' : 'failed'} for order ${order.id}`);
    return emailSent;
  } catch (error) {
    console.error('Failed to generate and send order receipt:', error);
    return false;
  }
}

export async function generateAndSendSubscriptionReceipt(
  subscription: { id: string; planName: string; tier: string; amount: number; billingPeriod: string; currency?: string },
  buyer: { name: string | null; email: string; userId?: string; role?: string },
  paymentMethod: string
): Promise<boolean> {
  try {
    const payload = ReceiptService.createSubscriptionPayload(subscription, buyer, paymentMethod);
    const { receipt, pdfBuffer } = await receiptService.createAndSaveReceipt(payload);
    
    const emailSent = await emailService.sendReceiptEmail(
      buyer.email,
      {
        receiptNumber: receipt.receiptNumber,
        receiptType: 'subscription',
        customerName: buyer.name || 'Student',
        totalAmount: subscription.amount,
        currency: subscription.currency || 'USD',
        items: [{ name: `${subscription.planName} - ${subscription.tier}`, quantity: 1, price: subscription.amount }],
        sourceId: subscription.id,
        userRole: buyer.role || 'student',
      },
      pdfBuffer
    );

    if (emailSent) {
      await receiptService.markAsEmailed(receipt.id);
    } else {
      await receiptService.markAsFailed(receipt.id);
    }

    console.log(`📧 Subscription receipt ${emailSent ? 'sent' : 'failed'} for subscription ${subscription.id}`);
    return emailSent;
  } catch (error) {
    console.error('Failed to generate and send subscription receipt:', error);
    return false;
  }
}

export async function generateAndSendFreelancerPlanReceipt(
  plan: { id: string; planName: string; amount: number; billingPeriod: string; currency?: string },
  buyer: { name: string | null; email: string; userId?: string },
  paymentMethod: string
): Promise<boolean> {
  try {
    const payload = ReceiptService.createFreelancerPlanPayload(plan, buyer, paymentMethod);
    const { receipt, pdfBuffer } = await receiptService.createAndSaveReceipt(payload);
    
    const emailSent = await emailService.sendReceiptEmail(
      buyer.email,
      {
        receiptNumber: receipt.receiptNumber,
        receiptType: 'freelancer_plan',
        customerName: buyer.name || 'Freelancer',
        totalAmount: plan.amount,
        currency: plan.currency || 'USD',
        items: [{ name: `Freelancer ${plan.planName}`, quantity: 1, price: plan.amount }],
        sourceId: plan.id,
        userRole: 'freelancer',
      },
      pdfBuffer
    );

    if (emailSent) {
      await receiptService.markAsEmailed(receipt.id);
    } else {
      await receiptService.markAsFailed(receipt.id);
    }

    console.log(`📧 Freelancer plan receipt ${emailSent ? 'sent' : 'failed'} for plan ${plan.id}`);
    return emailSent;
  } catch (error) {
    console.error('Failed to generate and send freelancer plan receipt:', error);
    return false;
  }
}

export async function generateAndSendBannerPaymentReceipt(
  banner: { id: string; title: string; amount: number; currency?: string },
  buyer: { name: string | null; email: string; userId?: string; role?: string },
  paymentMethod: string
): Promise<boolean> {
  try {
    const payload = ReceiptService.createBannerPaymentPayload(banner, buyer, paymentMethod);
    const { receipt, pdfBuffer } = await receiptService.createAndSaveReceipt(payload);
    
    const emailSent = await emailService.sendReceiptEmail(
      buyer.email,
      {
        receiptNumber: receipt.receiptNumber,
        receiptType: 'banner_payment',
        customerName: buyer.name || 'Advertiser',
        totalAmount: banner.amount,
        currency: banner.currency || 'USD',
        items: [{ name: 'Banner Advertisement', quantity: 1, price: banner.amount }],
        sourceId: banner.id,
        userRole: buyer.role,
      },
      pdfBuffer
    );

    if (emailSent) {
      await receiptService.markAsEmailed(receipt.id);
    } else {
      await receiptService.markAsFailed(receipt.id);
    }

    console.log(`📧 Banner payment receipt ${emailSent ? 'sent' : 'failed'} for banner ${banner.id}`);
    return emailSent;
  } catch (error) {
    console.error('Failed to generate and send banner payment receipt:', error);
    return false;
  }
}

export default router;
