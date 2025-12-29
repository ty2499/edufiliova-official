import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface BrandedPDFOptions {
  title: string;
  content: string;
  recipientName?: string;
  includeDate?: boolean;
  footerText?: string;
}

export function generateBrandedPDF(options: BrandedPDFOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        bufferPages: true 
      });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      doc.rect(0, 0, pageWidth, 100).fillColor('#0c332c').fill();
      
      const whiteLogoPath = path.join(process.cwd(), 'public', 'edufiliova-white-logo.png');
      const fallbackLogoPath = path.join(process.cwd(), 'public', 'Edufiliova_Logo_Optimized.png');
      
      if (fs.existsSync(whiteLogoPath)) {
        doc.image(whiteLogoPath, (pageWidth - 160) / 2, 20, { width: 160 });
      } else if (fs.existsSync(fallbackLogoPath)) {
        doc.image(fallbackLogoPath, (pageWidth - 160) / 2, 20, { width: 160 });
      }
      
      doc.y = 120;
      doc.fontSize(24).fillColor('#1a1a1a').font('Helvetica-Bold')
        .text(options.title, 50, doc.y, {
          width: pageWidth - 100,
          align: 'center'
        });
      
      doc.moveDown(0.8);
      
      if (options.recipientName) {
        doc.fontSize(12).fillColor('#666666').font('Helvetica')
          .text(`Prepared for: ${options.recipientName}`, 50, doc.y, {
            width: pageWidth - 100,
            align: 'center'
          });
        doc.moveDown(0.3);
      }

      if (options.includeDate !== false) {
        doc.fontSize(10).fillColor('#999999')
          .text(`Date: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`, 50, doc.y, {
            width: pageWidth - 100,
            align: 'center'
          });
      }
      
      doc.moveDown(1.5);

      doc.rect(50, doc.y, pageWidth - 100, 1).fillColor('#e2e8f0').fill();
      doc.moveDown(1);

      doc.fontSize(11).fillColor('#333333').font('Helvetica');
      
      const lines = options.content.split('\n');
      lines.forEach(line => {
        if (doc.y > pageHeight - 100) {
          doc.addPage();
          doc.y = 50;
        }
        
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('##')) {
          doc.moveDown(0.5);
          doc.fontSize(14).font('Helvetica-Bold')
            .text(trimmedLine.replace(/^##\s*/, ''), 50, doc.y, {
              width: pageWidth - 100
            });
          doc.fontSize(11).font('Helvetica');
          doc.moveDown(0.3);
        } else if (trimmedLine.startsWith('#')) {
          doc.moveDown(0.5);
          doc.fontSize(16).font('Helvetica-Bold')
            .text(trimmedLine.replace(/^#\s*/, ''), 50, doc.y, {
              width: pageWidth - 100
            });
          doc.fontSize(11).font('Helvetica');
          doc.moveDown(0.3);
        } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          doc.text(`  • ${trimmedLine.replace(/^[-*]\s*/, '')}`, 50, doc.y, {
            width: pageWidth - 100
          });
        } else if (trimmedLine === '') {
          doc.moveDown(0.5);
        } else {
          doc.text(trimmedLine, 50, doc.y, {
            width: pageWidth - 100,
            align: 'left'
          });
        }
      });

      const footerY = pageHeight - 60;
      doc.rect(0, footerY - 10, pageWidth, 70).fillColor('#f8fafc').fill();
      doc.rect(0, footerY - 10, pageWidth, 1).fillColor('#e2e8f0').fill();
      
      doc.fontSize(9).fillColor('#64748b').font('Helvetica')
        .text(options.footerText || 'EduFiliova - Empowering global talent through education and opportunity.', 
          50, footerY, {
          width: pageWidth - 100,
          align: 'center'
        });
      
      doc.text('© 2025 EduFiliova. All rights reserved.', 50, footerY + 15, {
        width: pageWidth - 100,
        align: 'center'
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateSimplePDF(title: string, content: string): Promise<Buffer> {
  return generateBrandedPDF({
    title,
    content,
    includeDate: true
  });
}
