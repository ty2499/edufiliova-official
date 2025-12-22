import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { receipts, type ReceiptPayload, type ReceiptItem } from "@shared/schema";
import { eq } from "drizzle-orm";

const LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'Edufiliova_Logo_Optimized.png');
const BRAND_COLORS = {
  primary: '#4169E1',
  accent: '#FF5734',
  dark: '#111827',
  muted: '#6B7280',
  light: '#F9FAFB',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EF-${timestamp}-${random}`;
}

function getReceiptTypeTitle(type: string): string {
  const titles: Record<string, string> = {
    order: 'ORDER RECEIPT',
    subscription: 'SUBSCRIPTION RECEIPT',
    freelancer_plan: 'FREELANCER PLAN RECEIPT',
    banner_payment: 'ADVERTISEMENT RECEIPT',
    certificate: 'CERTIFICATE PURCHASE RECEIPT',
  };
  return titles[type] || 'PURCHASE RECEIPT';
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZAR: 'R' };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
}

export class ReceiptService {
  async generatePDF(payload: ReceiptPayload): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 0, size: 'A4' });

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.renderPDF(doc, payload);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private renderPDF(doc: typeof PDFDocument.prototype, payload: ReceiptPayload): void {
    const pageWidth = 612;

    doc.rect(0, 0, pageWidth, 120).fillAndStroke(BRAND_COLORS.white, BRAND_COLORS.border);
    
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 50, 25, { width: 150, height: 50, fit: [150, 50] });
    } else {
      doc.fontSize(24).fillColor(BRAND_COLORS.primary).font('Helvetica-Bold');
      doc.text('edufiliova', 50, 35);
    }
    
    doc.fontSize(9).fillColor(BRAND_COLORS.muted).font('Helvetica');
    doc.text('Edufiliova — Creativity, Learning, and Growth in One Place.', 50, 82);

    doc.fontSize(28).fillColor(BRAND_COLORS.dark).font('Helvetica-Bold');
    doc.text(getReceiptTypeTitle(payload.receiptType), 300, 30, { align: 'right', width: 260 });
    doc.fontSize(9).fillColor(BRAND_COLORS.muted).font('Helvetica');
    doc.text('Official Payment Receipt', 300, 68, { align: 'right', width: 260 });
    
    if (payload.metadata?.userRole) {
      const roleBadge = payload.metadata.userRole.charAt(0).toUpperCase() + payload.metadata.userRole.slice(1);
      doc.fontSize(8).fillColor(BRAND_COLORS.primary);
      doc.text(`${roleBadge} Account`, 300, 85, { align: 'right', width: 260 });
    }

    doc.fillColor(BRAND_COLORS.dark).fontSize(8).font('Helvetica-Bold');
    doc.text('RECEIPT DETAILS', 50, 150);
    doc.font('Helvetica').fontSize(7).fillColor(BRAND_COLORS.muted);
    doc.text('Receipt Number', 50, 170);
    doc.fillColor(BRAND_COLORS.dark).fontSize(9).font('Helvetica-Bold');
    doc.text(payload.receiptNumber, 50, 182);

    doc.font('Helvetica').fontSize(7).fillColor(BRAND_COLORS.muted);
    doc.text('Date Issued', 50, 200);
    doc.fillColor(BRAND_COLORS.dark).fontSize(9).font('Helvetica');
    doc.text(payload.issuedAt.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }), 50, 212);

    doc.font('Helvetica').fontSize(7).fillColor(BRAND_COLORS.muted);
    doc.text('Status', 50, 230);
    doc.fillColor('#059669').fontSize(9).font('Helvetica-Bold');
    doc.text('PAID', 50, 242);

    doc.fillColor(BRAND_COLORS.dark).fontSize(8).font('Helvetica-Bold');
    doc.text('BILLED TO', 200, 150);
    doc.font('Helvetica').fontSize(7).fillColor(BRAND_COLORS.muted);
    doc.text('Customer', 200, 170);
    doc.fillColor(BRAND_COLORS.dark).fontSize(9).font('Helvetica-Bold');
    doc.text(payload.payerName || 'Customer', 200, 182);
    doc.font('Helvetica').fontSize(8).fillColor(BRAND_COLORS.muted);
    doc.text(payload.payerEmail, 200, 196);

    doc.fillColor(BRAND_COLORS.dark).fontSize(8).font('Helvetica-Bold');
    doc.text('PAYMENT INFO', 380, 150);
    doc.font('Helvetica').fontSize(7).fillColor(BRAND_COLORS.muted);
    doc.text('Payment Method', 380, 170);
    doc.fillColor(BRAND_COLORS.dark).fontSize(9).font('Helvetica');
    doc.text(this.formatPaymentMethod(payload.paymentMethod), 380, 182);

    doc.font('Helvetica').fontSize(7).fillColor(BRAND_COLORS.muted);
    doc.text('Currency', 380, 200);
    doc.fillColor(BRAND_COLORS.dark).fontSize(9).font('Helvetica');
    doc.text(payload.currency, 380, 212);

    if (payload.metadata?.subscriptionTier) {
      doc.font('Helvetica').fontSize(7).fillColor(BRAND_COLORS.muted);
      doc.text('Plan', 380, 230);
      doc.fillColor(BRAND_COLORS.dark).fontSize(9).font('Helvetica');
      doc.text(`${payload.metadata.subscriptionTier} (${payload.metadata.billingPeriod || 'monthly'})`, 380, 242);
    }

    doc.fillColor(BRAND_COLORS.dark).fontSize(8).font('Helvetica-Bold');
    doc.text('ITEMS PURCHASED', 50, 280);

    const tableTop = 300;
    doc.rect(50, tableTop, 512, 25).fillAndStroke(BRAND_COLORS.light, BRAND_COLORS.border);
    
    doc.fontSize(7).fillColor(BRAND_COLORS.dark).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 60, tableTop + 10);
    doc.text('QTY', 320, tableTop + 10, { align: 'center', width: 40 });
    doc.text('UNIT PRICE', 370, tableTop + 10, { align: 'right', width: 70 });
    doc.text('AMOUNT', 460, tableTop + 10, { align: 'right', width: 90 });

    let currentY = tableTop + 30;
    payload.items.forEach((item: ReceiptItem, index: number) => {
      if (index > 0) {
        doc.moveTo(50, currentY - 5).lineTo(562, currentY - 5).stroke(BRAND_COLORS.border);
      }
      
      doc.fontSize(9).fillColor(BRAND_COLORS.dark).font('Helvetica');
      doc.text(item.name, 60, currentY, { width: 240 });
      
      if (item.description) {
        doc.fontSize(7).fillColor(BRAND_COLORS.muted);
        doc.text(item.description, 60, currentY + 14, { width: 240 });
        currentY += 12;
      }
      
      doc.fontSize(9).fillColor(BRAND_COLORS.dark);
      doc.text(item.quantity.toString(), 320, currentY, { align: 'center', width: 40 });
      doc.text(formatCurrency(item.unitPrice, payload.currency), 370, currentY, { align: 'right', width: 70 });
      doc.fillColor(BRAND_COLORS.dark).font('Helvetica-Bold');
      doc.text(formatCurrency(item.totalPrice, payload.currency), 460, currentY, { align: 'right', width: 90 });
      
      currentY += 28;
    });

    currentY += 15;
    doc.moveTo(350, currentY).lineTo(562, currentY).stroke(BRAND_COLORS.border);
    currentY += 15;

    doc.fontSize(9).fillColor(BRAND_COLORS.muted).font('Helvetica');
    doc.text('Subtotal', 380, currentY, { align: 'right', width: 60 });
    doc.fillColor(BRAND_COLORS.dark).font('Helvetica');
    doc.text(formatCurrency(payload.subtotal, payload.currency), 460, currentY, { align: 'right', width: 90 });

    currentY += 18;
    doc.fillColor(BRAND_COLORS.muted);
    doc.text('Tax (0%)', 380, currentY, { align: 'right', width: 60 });
    doc.fillColor(BRAND_COLORS.dark);
    doc.text(formatCurrency(payload.tax, payload.currency), 460, currentY, { align: 'right', width: 90 });

    currentY += 25;
    doc.rect(350, currentY - 5, 212, 35).fill(BRAND_COLORS.light);
    doc.fontSize(11).fillColor(BRAND_COLORS.dark).font('Helvetica-Bold');
    doc.text('TOTAL PAID', 370, currentY + 5, { align: 'right', width: 70 });
    doc.fontSize(16).fillColor(BRAND_COLORS.accent);
    doc.text(formatCurrency(payload.total, payload.currency), 460, currentY + 3, { align: 'right', width: 90 });

    const footerY = 720;
    doc.rect(0, footerY, pageWidth, 122).fill(BRAND_COLORS.primary);
    
    doc.fontSize(8).fillColor(BRAND_COLORS.white).font('Helvetica-Bold');
    doc.text('Contact Us', 50, footerY + 20);
    doc.fontSize(7).font('Helvetica');
    doc.text('Support: support@edufiliova.com', 50, footerY + 38);
    doc.text('Orders: orders@edufiliova.com', 50, footerY + 52);

    doc.fontSize(8).fillColor(BRAND_COLORS.white).font('Helvetica-Bold');
    doc.text('Website', 250, footerY + 20);
    doc.fontSize(7).font('Helvetica');
    doc.text('www.edufiliova.com', 250, footerY + 38);

    doc.fontSize(8).fillColor(BRAND_COLORS.white).font('Helvetica-Bold');
    doc.text('Thank You!', 430, footerY + 20);
    doc.fontSize(7).font('Helvetica');
    doc.text('We appreciate your purchase and', 430, footerY + 38);
    doc.text('look forward to serving you again.', 430, footerY + 52);

    doc.fontSize(6).fillColor(BRAND_COLORS.white).font('Helvetica');
    doc.text('This is an official receipt from EduFiliova. Keep this for your records. For questions, contact support@edufiliova.com', 50, footerY + 90, { 
      align: 'center', 
      width: 512 
    });
  }

  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      stripe: 'Credit/Debit Card (Stripe)',
      paypal: 'PayPal',
      wallet: 'EduFiliova Wallet',
      bank_transfer: 'Bank Transfer',
    };
    return methods[method?.toLowerCase()] || method || 'Card Payment';
  }

  async createAndSaveReceipt(payload: ReceiptPayload): Promise<{ receipt: typeof receipts.$inferSelect; pdfBuffer: Buffer }> {
    const pdfBuffer = await this.generatePDF(payload);
    
    const [receipt] = await db.insert(receipts).values({
      userId: payload.userId || null,
      payerEmail: payload.payerEmail,
      payerName: payload.payerName,
      receiptType: payload.receiptType,
      sourceId: payload.sourceId,
      receiptNumber: payload.receiptNumber,
      amount: payload.total.toString(),
      currency: payload.currency,
      paymentMethod: payload.paymentMethod,
      items: payload.items,
      metadata: payload.metadata || {},
      deliveryStatus: 'pending',
    }).returning();

    return { receipt, pdfBuffer };
  }

  async getReceiptById(receiptId: string): Promise<typeof receipts.$inferSelect | null> {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, receiptId)).limit(1);
    return receipt || null;
  }

  async regeneratePDF(receiptId: string): Promise<Buffer | null> {
    const receipt = await this.getReceiptById(receiptId);
    if (!receipt) return null;

    const payload: ReceiptPayload = {
      receiptNumber: receipt.receiptNumber,
      receiptType: receipt.receiptType as ReceiptPayload['receiptType'],
      payerName: receipt.payerName || 'Customer',
      payerEmail: receipt.payerEmail,
      userId: receipt.userId || undefined,
      items: receipt.items as ReceiptItem[],
      subtotal: parseFloat(receipt.amount),
      tax: 0,
      total: parseFloat(receipt.amount),
      currency: receipt.currency,
      paymentMethod: receipt.paymentMethod || 'card',
      issuedAt: receipt.issuedAt,
      sourceId: receipt.sourceId,
      metadata: receipt.metadata as ReceiptPayload['metadata'],
    };

    return this.generatePDF(payload);
  }

  async markAsDownloaded(receiptId: string): Promise<void> {
    await db.update(receipts)
      .set({
        downloadCount: receipts.downloadCount,
        lastDownloadedAt: new Date(),
        deliveryStatus: 'downloaded',
      })
      .where(eq(receipts.id, receiptId));
  }

  async markAsEmailed(receiptId: string): Promise<void> {
    await db.update(receipts)
      .set({
        emailSentAt: new Date(),
        deliveryStatus: 'sent',
      })
      .where(eq(receipts.id, receiptId));
  }

  async markAsFailed(receiptId: string): Promise<void> {
    await db.update(receipts)
      .set({
        deliveryStatus: 'failed',
      })
      .where(eq(receipts.id, receiptId));
  }

  static createOrderPayload(
    order: { id: string; totalAmount: string; currency: string; paymentMethod: string | null; createdAt: Date },
    buyer: { name: string | null; email: string; userId?: string; role?: string },
    items: Array<{ name: string; quantity: number; price: string }>
  ): ReceiptPayload {
    const receiptItems: ReceiptItem[] = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.price),
      totalPrice: parseFloat(item.price) * item.quantity,
    }));

    const total = parseFloat(order.totalAmount);
    
    return {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'order',
      payerName: buyer.name || 'Customer',
      payerEmail: buyer.email,
      userId: buyer.userId,
      items: receiptItems,
      subtotal: total,
      tax: 0,
      total: total,
      currency: order.currency || 'USD',
      paymentMethod: order.paymentMethod || 'stripe',
      issuedAt: order.createdAt || new Date(),
      sourceId: order.id,
      metadata: {
        orderId: order.id,
        userRole: buyer.role,
      },
    };
  }

  static createSubscriptionPayload(
    subscription: { id: string; planName: string; tier: string; amount: number; billingPeriod: string; currency?: string },
    buyer: { name: string | null; email: string; userId?: string; role?: string },
    paymentMethod: string
  ): ReceiptPayload {
    const receiptItems: ReceiptItem[] = [{
      name: `${subscription.planName} - ${subscription.tier}`,
      description: `${subscription.billingPeriod} subscription`,
      quantity: 1,
      unitPrice: subscription.amount,
      totalPrice: subscription.amount,
    }];

    return {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'subscription',
      payerName: buyer.name || 'Student',
      payerEmail: buyer.email,
      userId: buyer.userId,
      items: receiptItems,
      subtotal: subscription.amount,
      tax: 0,
      total: subscription.amount,
      currency: subscription.currency || 'USD',
      paymentMethod: paymentMethod,
      issuedAt: new Date(),
      sourceId: subscription.id,
      metadata: {
        subscriptionTier: subscription.tier,
        billingPeriod: subscription.billingPeriod,
        planName: subscription.planName,
        userRole: buyer.role || 'student',
      },
    };
  }

  static createFreelancerPlanPayload(
    plan: { id: string; planName: string; amount: number; billingPeriod: string; currency?: string },
    buyer: { name: string | null; email: string; userId?: string },
    paymentMethod: string
  ): ReceiptPayload {
    const receiptItems: ReceiptItem[] = [{
      name: `Freelancer ${plan.planName}`,
      description: `Professional freelancer plan - ${plan.billingPeriod}`,
      quantity: 1,
      unitPrice: plan.amount,
      totalPrice: plan.amount,
    }];

    return {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'freelancer_plan',
      payerName: buyer.name || 'Freelancer',
      payerEmail: buyer.email,
      userId: buyer.userId,
      items: receiptItems,
      subtotal: plan.amount,
      tax: 0,
      total: plan.amount,
      currency: plan.currency || 'USD',
      paymentMethod: paymentMethod,
      issuedAt: new Date(),
      sourceId: plan.id,
      metadata: {
        planName: plan.planName,
        billingPeriod: plan.billingPeriod,
        userRole: 'freelancer',
      },
    };
  }

  static createBannerPaymentPayload(
    banner: { id: string; title: string; amount: number; currency?: string },
    buyer: { name: string | null; email: string; userId?: string; role?: string },
    paymentMethod: string
  ): ReceiptPayload {
    const receiptItems: ReceiptItem[] = [{
      name: 'Banner Advertisement',
      description: banner.title,
      quantity: 1,
      unitPrice: banner.amount,
      totalPrice: banner.amount,
    }];

    return {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'banner_payment',
      payerName: buyer.name || 'Advertiser',
      payerEmail: buyer.email,
      userId: buyer.userId,
      items: receiptItems,
      subtotal: banner.amount,
      tax: 0,
      total: banner.amount,
      currency: banner.currency || 'USD',
      paymentMethod: paymentMethod,
      issuedAt: new Date(),
      sourceId: banner.id,
      metadata: {
        bannerTitle: banner.title,
        userRole: buyer.role,
      },
    };
  }

  static async generateAndSendOrderReceipt(params: {
    orderId: string;
    userId: string | null;
    userEmail: string;
    userName?: string;
    items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
  }): Promise<void> {
    const { emailService } = await import('../utils/email.js');
    
    const receiptItems: ReceiptItem[] = params.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    const payload: ReceiptPayload = {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'order',
      payerName: params.userName || 'Customer',
      payerEmail: params.userEmail,
      userId: params.userId || undefined,
      items: receiptItems,
      subtotal: params.totalAmount,
      tax: 0,
      total: params.totalAmount,
      currency: params.currency || 'USD',
      paymentMethod: params.paymentMethod || 'stripe',
      issuedAt: new Date(),
      sourceId: params.orderId,
      metadata: { orderId: params.orderId },
    };

    const service = new ReceiptService();
    const { receipt, pdfBuffer } = await service.createAndSaveReceipt(payload);

    await emailService.sendEmailWithReceipt(params.userEmail, {
      subject: `Your EduFiliova Order Receipt - ${payload.receiptNumber}`,
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Your order has been confirmed. Please find your receipt attached.</p>
        <p><strong>Receipt Number:</strong> ${payload.receiptNumber}</p>
        <p><strong>Order ID:</strong> ${params.orderId}</p>
        <p><strong>Total:</strong> ${formatCurrency(params.totalAmount, params.currency)}</p>
        <p>If you have any questions, please contact our support team.</p>
      `,
      pdfBuffer,
      receiptNumber: payload.receiptNumber,
    });

    await service.markAsEmailed(receipt.id);
  }

  static async generateAndSendSubscriptionReceipt(params: {
    subscriptionId: string;
    userId: string;
    userEmail: string;
    userName?: string;
    planName: string;
    planType: string;
    amount: number;
    currency: string;
    billingCycle: string;
    planExpiry: Date;
  }): Promise<void> {
    const { emailService } = await import('../utils/email.js');

    const receiptItems: ReceiptItem[] = [{
      name: `${params.planName} Subscription`,
      description: `${params.billingCycle} plan`,
      quantity: 1,
      unitPrice: params.amount,
      totalPrice: params.amount,
    }];

    const payload: ReceiptPayload = {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'subscription',
      payerName: params.userName || 'Subscriber',
      payerEmail: params.userEmail,
      userId: params.userId,
      items: receiptItems,
      subtotal: params.amount,
      tax: 0,
      total: params.amount,
      currency: params.currency || 'USD',
      paymentMethod: 'stripe',
      issuedAt: new Date(),
      sourceId: params.subscriptionId,
      metadata: {
        subscriptionTier: params.planType,
        billingPeriod: params.billingCycle,
        planName: params.planName,
        userRole: 'student',
        planExpiry: params.planExpiry.toISOString(),
      },
    };

    const service = new ReceiptService();
    const { receipt, pdfBuffer } = await service.createAndSaveReceipt(payload);

    await emailService.sendEmailWithReceipt(params.userEmail, {
      subject: `Your EduFiliova Subscription Receipt - ${payload.receiptNumber}`,
      html: `
        <h2>Subscription Confirmed!</h2>
        <p>Thank you for subscribing to ${params.planName}. Please find your receipt attached.</p>
        <p><strong>Receipt Number:</strong> ${payload.receiptNumber}</p>
        <p><strong>Plan:</strong> ${params.planName} (${params.billingCycle})</p>
        <p><strong>Amount:</strong> ${formatCurrency(params.amount, params.currency)}</p>
        <p><strong>Valid Until:</strong> ${params.planExpiry.toLocaleDateString()}</p>
        <p>If you have any questions, please contact our support team.</p>
      `,
      pdfBuffer,
      receiptNumber: payload.receiptNumber,
    });

    await service.markAsEmailed(receipt.id);
  }

  static async generateAndSendFreelancerPlanReceipt(params: {
    planId: string;
    userId: string;
    userEmail: string;
    userName?: string;
    planName: string;
    amount: number;
    currency: string;
    billingCycle: string;
    planExpiry: Date;
  }): Promise<void> {
    const { emailService } = await import('../utils/email.js');

    const receiptItems: ReceiptItem[] = [{
      name: `Freelancer ${params.planName} Plan`,
      description: `Professional freelancer plan - ${params.billingCycle}`,
      quantity: 1,
      unitPrice: params.amount,
      totalPrice: params.amount,
    }];

    const payload: ReceiptPayload = {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'freelancer_plan',
      payerName: params.userName || 'Freelancer',
      payerEmail: params.userEmail,
      userId: params.userId,
      items: receiptItems,
      subtotal: params.amount,
      tax: 0,
      total: params.amount,
      currency: params.currency || 'USD',
      paymentMethod: 'stripe',
      issuedAt: new Date(),
      sourceId: params.planId,
      metadata: {
        planName: params.planName,
        billingPeriod: params.billingCycle,
        userRole: 'freelancer',
        planExpiry: params.planExpiry.toISOString(),
      },
    };

    const service = new ReceiptService();
    const { receipt, pdfBuffer } = await service.createAndSaveReceipt(payload);

    await emailService.sendEmailWithReceipt(params.userEmail, {
      subject: `Your EduFiliova Freelancer Plan Receipt - ${payload.receiptNumber}`,
      html: `
        <h2>Freelancer Plan Activated!</h2>
        <p>Thank you for upgrading to ${params.planName}. Please find your receipt attached.</p>
        <p><strong>Receipt Number:</strong> ${payload.receiptNumber}</p>
        <p><strong>Plan:</strong> Freelancer ${params.planName} (${params.billingCycle})</p>
        <p><strong>Amount:</strong> ${formatCurrency(params.amount, params.currency)}</p>
        <p><strong>Valid Until:</strong> ${params.planExpiry.toLocaleDateString()}</p>
        <p>Enjoy your enhanced freelancer features!</p>
      `,
      pdfBuffer,
      receiptNumber: payload.receiptNumber,
    });

    await service.markAsEmailed(receipt.id);
  }

  static async generateAndSendBannerPaymentReceipt(params: {
    bannerId: string;
    userId: string | null;
    userEmail: string;
    userName?: string;
    bannerTitle: string;
    placement: string;
    durationDays: number;
    amount: number;
    currency: string;
    paymentMethod: string;
  }): Promise<void> {
    const { emailService } = await import('../utils/email.js');

    const receiptItems: ReceiptItem[] = [{
      name: 'Banner Advertisement',
      description: `${params.bannerTitle} - ${params.durationDays} days on ${params.placement}`,
      quantity: 1,
      unitPrice: params.amount,
      totalPrice: params.amount,
    }];

    const payload: ReceiptPayload = {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'banner_payment',
      payerName: params.userName || 'Advertiser',
      payerEmail: params.userEmail,
      userId: params.userId || undefined,
      items: receiptItems,
      subtotal: params.amount,
      tax: 0,
      total: params.amount,
      currency: params.currency || 'USD',
      paymentMethod: params.paymentMethod,
      issuedAt: new Date(),
      sourceId: params.bannerId,
      metadata: {
        bannerTitle: params.bannerTitle,
        placement: params.placement,
        durationDays: params.durationDays,
        userRole: 'advertiser',
      },
    };

    const service = new ReceiptService();
    const { receipt, pdfBuffer } = await service.createAndSaveReceipt(payload);

    await emailService.sendEmailWithReceipt(params.userEmail, {
      subject: `Your EduFiliova Advertisement Receipt - ${payload.receiptNumber}`,
      html: `
        <h2>Banner Ad Purchase Confirmed!</h2>
        <p>Thank you for advertising with EduFiliova. Please find your receipt attached.</p>
        <p><strong>Receipt Number:</strong> ${payload.receiptNumber}</p>
        <p><strong>Ad Title:</strong> ${params.bannerTitle}</p>
        <p><strong>Duration:</strong> ${params.durationDays} days</p>
        <p><strong>Placement:</strong> ${params.placement}</p>
        <p><strong>Amount:</strong> ${formatCurrency(params.amount, params.currency)}</p>
        <p>Your ad is pending admin approval. We'll notify you once it's live!</p>
      `,
      pdfBuffer,
      receiptNumber: payload.receiptNumber,
    });

    await service.markAsEmailed(receipt.id);
  }

  static async generateAndSendCertificateReceipt(params: {
    purchaseId: string;
    userId: string;
    userEmail: string;
    userName?: string;
    courseTitle: string;
    certificateType: 'soft_copy' | 'hard_copy';
    amount: number;
    currency?: string;
    paymentMethod?: string;
  }): Promise<void> {
    const formatDescription = params.certificateType === 'soft_copy' ? 'Digital' : 'Physical';
    
    const receiptItems = [
      {
        description: `${formatDescription} Certificate`,
        details: params.courseTitle,
        quantity: 1,
        unitPrice: params.amount,
        total: params.amount,
      },
    ];

    const payload: ReceiptPayload = {
      receiptNumber: generateReceiptNumber(),
      receiptType: 'certificate',
      payerName: params.userName || 'Student',
      payerEmail: params.userEmail,
      userId: params.userId,
      items: receiptItems,
      subtotal: params.amount,
      tax: 0,
      total: params.amount,
      currency: params.currency || 'USD',
      paymentMethod: params.paymentMethod,
      issuedAt: new Date(),
      sourceId: params.purchaseId,
      metadata: {
        courseTitle: params.courseTitle,
        certificateType: params.certificateType,
        userRole: 'student',
      },
    };

    const service = new ReceiptService();
    const { receipt, pdfBuffer } = await service.createAndSaveReceipt(payload);

    await emailService.sendEmailWithReceipt(params.userEmail, {
      subject: `Your EduFiliova Certificate Receipt - ${payload.receiptNumber}`,
      html: `
        <h2>Certificate Purchase Confirmed!</h2>
        <p>Thank you for purchasing your ${formatDescription.toLowerCase()} certificate. Please find your receipt attached.</p>
        <p><strong>Receipt Number:</strong> ${payload.receiptNumber}</p>
        <p><strong>Course:</strong> ${params.courseTitle}</p>
        <p><strong>Certificate Format:</strong> ${formatDescription}</p>
        <p><strong>Amount:</strong> ${formatCurrency(params.amount, params.currency)}</p>
        ${params.certificateType === 'hard_copy' ? '<p>Your physical certificate will be printed and shipped to your address shortly.</p>' : '<p>Your digital certificate is now available for download in your dashboard.</p>'}
      `,
      pdfBuffer,
      receiptNumber: payload.receiptNumber,
    });

    await service.markAsEmailed(receipt.id);
  }
}

export const receiptService = new ReceiptService();
