import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import nodemailer from 'nodemailer';
import { storage } from './storage';
import type { EmailAccount, InsertEmailMessage } from '@shared/schema';
import { appendSignatureToEmail } from './utils/email-signatures';

export class EmailService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds for balanced email updates
  // Fetch emails from an account using IMAP
  async fetchEmailsFromAccount(account: EmailAccount, limit: number = 50): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Update sync status
        storage.updateEmailAccountSyncStatus(account.id, 'syncing');

        const imap = new Imap({
          user: account.imapUsername,
          password: account.imapPassword,
          host: account.imapHost,
          port: account.imapPort,
          tls: account.imapSecure,
          tlsOptions: { rejectUnauthorized: false }
        });

        imap.once('ready', () => {
          imap.openBox('INBOX', true, (err, box) => {
            if (err) {
              storage.updateEmailAccountSyncStatus(account.id, 'error', err.message);
              reject(err);
              return;
            }

            // Fetch the last N emails
            const totalMessages = box.messages.total;
            if (totalMessages === 0) {
              imap.end();
              storage.updateEmailAccountSyncStatus(account.id, 'idle');
              resolve();
              return;
            }

            const start = Math.max(1, totalMessages - limit + 1);
            const end = totalMessages;

            const fetch = imap.seq.fetch(`${start}:${end}`, {
              bodies: '',
              struct: true
            });

            const emailPromises: Promise<void>[] = [];
            const fetchedMessageIds: string[] = [];

            fetch.on('message', (msg, seqno) => {
              const emailPromise = new Promise<void>((resolveEmail, rejectEmail) => {
                let buffer = '';

                msg.on('body', (stream) => {
                  stream.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                  });
                });

                msg.once('end', async () => {
                  try {
                    const parsed: ParsedMail = await simpleParser(buffer);
                    
                    // Check if email already exists
                    const messageId = parsed.messageId || `${Date.now()}-${seqno}`;
                    fetchedMessageIds.push(messageId);
                    
                    let existing;
                    try {
                      existing = await storage.getEmailMessageByMessageId(messageId);
                    } catch (error) {
                      console.error('Error checking for existing email:', error);
                      existing = null;
                    }
                    
                    if (!existing) {
                      // Create new email message
                      const emailMessage: InsertEmailMessage = {
                        emailAccountId: account.id,
                        messageId: messageId,
                        from: Array.isArray(parsed.from) ? parsed.from[0]?.text || '' : parsed.from?.text || '',
                        to: Array.isArray(parsed.to) ? parsed.to[0]?.text || '' : parsed.to?.text || '',
                        cc: Array.isArray(parsed.cc) ? parsed.cc[0]?.text || null : parsed.cc?.text || null,
                        bcc: Array.isArray(parsed.bcc) ? parsed.bcc[0]?.text || null : parsed.bcc?.text || null,
                        subject: parsed.subject || '(No Subject)',
                        textBody: parsed.text || null,
                        htmlBody: parsed.html || null,
                        isRead: false,
                        isReplied: false,
                        isStarred: false,
                        inReplyTo: parsed.inReplyTo || null,
                        references: Array.isArray(parsed.references) ? parsed.references.join(', ') : (parsed.references || null),
                        attachments: parsed.attachments ? JSON.parse(JSON.stringify(
                          parsed.attachments.map((att: any) => ({
                            filename: att.filename,
                            contentType: att.contentType,
                            size: att.size
                          }))
                        )) : null,
                        receivedAt: parsed.date || new Date()
                      };

                      try {
                        const createdEmail = await storage.createEmailMessage(emailMessage);
                        this.broadcastNewEmailToAdmins(createdEmail);
                      } catch (error: any) {
                        // Ignore duplicate key errors (email already exists from concurrent sync)
                        if (error.code !== '23505') {
                          throw error;
                        }
                      }
                    } else if (existing.isTrashed) {
                      // Restore message if it was trashed but still exists on server
                      await storage.markEmailAsTrashed(existing.id, false);
                    }
                    
                    resolveEmail();
                  } catch (error) {
                    console.error('Error parsing email:', error);
                    rejectEmail(error);
                  }
                });
              });

              emailPromises.push(emailPromise);
            });

            fetch.once('error', (err) => {
              storage.updateEmailAccountSyncStatus(account.id, 'error', err.message);
              reject(err);
            });

            fetch.once('end', async () => {
              try {
                await Promise.all(emailPromises);
                
                // Check for deleted messages - compare fetched messages with database
                const allDbMessages = await storage.getEmailMessages({ accountId: account.id, limit: 1000 });
                const deletedCount = 0;
                
                for (const dbMessage of allDbMessages) {
                  // If message is not in fetched list and not already trashed, mark as trashed
                  if (!fetchedMessageIds.includes(dbMessage.messageId) && !dbMessage.isTrashed) {
                    await storage.markEmailAsTrashed(dbMessage.id, true);
                    console.log(`🗑️ Marked message as trashed: ${dbMessage.subject}`);
                  }
                }
                
                imap.end();
                await storage.updateEmailAccountSyncStatus(account.id, 'idle');
                resolve();
              } catch (error) {
                imap.end();
                await storage.updateEmailAccountSyncStatus(account.id, 'error', (error as Error).message);
                reject(error);
              }
            });
          });
        });

        imap.once('error', (err: Error) => {
          storage.updateEmailAccountSyncStatus(account.id, 'error', err.message);
          reject(err);
        });

        imap.once('end', () => {
          console.log('IMAP connection ended');
        });

        imap.connect();
      } catch (error) {
        storage.updateEmailAccountSyncStatus(account.id, 'error', (error as Error).message);
        reject(error);
      }
    });
  }

  // Send email reply using SMTP
  async sendEmailReply(
    account: EmailAccount,
    to: string,
    subject: string,
    textBody: string,
    htmlBody?: string,
    cc?: string,
    inReplyTo?: string,
    references?: string,
    attachments?: Array<{
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      type: 'image' | 'document';
    }>
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      auth: {
        user: account.smtpUsername,
        pass: account.smtpPassword,
      },
    });

    // Append professional signature to email body
    const emailWithSignature = appendSignatureToEmail(
      htmlBody || `<div style="white-space: pre-wrap;">${textBody}</div>`,
      textBody,
      account.email
    );

    // Convert attachments to nodemailer format
    const nodemailerAttachments = attachments?.map(att => ({
      filename: att.fileName,
      path: att.url,
      contentType: att.mimeType
    })) || [];

    const mailOptions = {
      from: `${account.displayName} <${account.email}>`,
      to,
      cc,
      subject,
      text: emailWithSignature.text,
      html: emailWithSignature.html,
      inReplyTo,
      references,
      attachments: nodemailerAttachments.length > 0 ? nodemailerAttachments : undefined,
    };

    await transporter.sendMail(mailOptions);
  }

  // Test email account connection
  async testEmailAccount(account: EmailAccount): Promise<{ imap: boolean; smtp: boolean; errors: { imap?: string; smtp?: string } }> {
    const result = { imap: false, smtp: false, errors: {} as { imap?: string; smtp?: string } };

    // Test IMAP connection
    try {
      await new Promise((resolve, reject) => {
        const imap = new Imap({
          user: account.imapUsername,
          password: account.imapPassword,
          host: account.imapHost,
          port: account.imapPort,
          tls: account.imapSecure,
          tlsOptions: { rejectUnauthorized: false }
        });

        imap.once('ready', () => {
          result.imap = true;
          imap.end();
          resolve(true);
        });

        imap.once('error', (err: Error) => {
          result.errors.imap = err.message;
          reject(err);
        });

        imap.connect();
      });
    } catch (error) {
      result.errors.imap = (error as Error).message;
    }

    // Test SMTP connection
    try {
      const transporter = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        auth: {
          user: account.smtpUsername,
          pass: account.smtpPassword,
        },
      });

      await transporter.verify();
      result.smtp = true;
    } catch (error) {
      result.errors.smtp = (error as Error).message;
    }

    return result;
  }

  async syncAllAccounts(): Promise<void> {
    try {
      const accounts = await storage.getEmailAccounts();
      
      if (accounts.length === 0) {
        console.log('📧 No email accounts configured for auto-sync');
        return;
      }

      console.log(`📧 Auto-syncing ${accounts.length} email account(s)...`);
      
      for (const account of accounts) {
        try {
          const newEmailsCount = await this.fetchEmailsFromAccount(account, 20);
          console.log(`✅ Synced account: ${account.email}`);
        } catch (error) {
          console.error(`❌ Failed to sync account ${account.email}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in syncAllAccounts:', error);
    }
  }

  startAutoSync(): void {
    if (this.syncInterval) {
      console.log('📧 Email auto-sync already running');
      return;
    }

    console.log(`📧 Starting email auto-sync (interval: ${this.SYNC_INTERVAL_MS / 1000}s)`);
    
    this.syncAllAccounts();
    
    this.syncInterval = setInterval(() => {
      this.syncAllAccounts();
    }, this.SYNC_INTERVAL_MS);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('📧 Email auto-sync stopped');
    }
  }

  broadcastNewEmailToAdmins(emailMessage: any): void {
    try {
      const wss = (global as any).wss;
      if (!wss || !wss.adminConnections) {
        return;
      }

      const notification = {
        type: 'new_email',
        email: emailMessage,
        timestamp: new Date().toISOString()
      };

      wss.adminConnections.forEach((ws: any) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(notification));
        }
      });
      
      console.log(`📧 Broadcasted new email to ${wss.adminConnections.size} admin(s)`);
    } catch (error) {
      console.error('Error broadcasting new email:', error);
    }
  }
}

export const emailService = new EmailService();
