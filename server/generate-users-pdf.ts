import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { db } from "./db";
import { profiles, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function generateUsersPDF(outputPath: string = "users-list.pdf"): Promise<string> {
  try {
    // Fetch all users with their profiles
    const allUsers = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        email: profiles.email,
        role: profiles.role,
        status: profiles.status,
        userCode: users.userId,
        authEmail: users.email,
        createdAt: users.createdAt,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .orderBy(profiles.role, profiles.name);

    // Group users by role
    type UserRecord = typeof allUsers[0];
    const usersByRole = allUsers.reduce((acc: Record<string, UserRecord[]>, user: UserRecord) => {
      const role = user.role || 'unassigned';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(user);
      return acc;
    }, {} as Record<string, UserRecord[]>);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const fullPath = path.resolve(outputPath);
    const writeStream = fs.createWriteStream(fullPath);
    doc.pipe(writeStream);

    // Add header
    doc.fontSize(24).font('Helvetica-Bold').text('System Users Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.fontSize(10).text(`Total Users: ${allUsers.length}`, { align: 'center' });
    doc.moveDown(2);

    // Add users by role
    const roleOrder = ['admin', 'customer_service', 'teacher', 'freelancer', 'student', 'general'];
    const roleColors: Record<string, string> = {
      admin: '#DC2626',
      customer_service: '#059669',
      teacher: '#7C3AED',
      freelancer: '#2563EB',
      student: '#EA580C',
      general: '#6B7280',
    };

    for (const role of roleOrder) {
      const roleUsers = usersByRole[role];
      if (!roleUsers || roleUsers.length === 0) continue;

      // Role header
      doc.fontSize(16).font('Helvetica-Bold')
        .fillColor(roleColors[role] || '#000000')
        .text(`${role.toUpperCase().replace('_', ' ')} (${roleUsers.length})`, { underline: true });
      doc.moveDown(0.5);
      doc.fillColor('#000000');

      // User list for this role
      roleUsers.forEach((user: UserRecord, index: number) => {
        const yPosition = doc.y;
        
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
        }

        doc.fontSize(11).font('Helvetica-Bold')
          .text(`${index + 1}. ${user.name || 'Unnamed'}`, { continued: false });
        
        doc.fontSize(9).font('Helvetica')
          .text(`   Email: ${user.email || user.authEmail}`, { indent: 15 });
        
        doc.text(`   User Code: ${user.userCode}`, { indent: 15 });
        doc.text(`   Status: ${user.status}`, { indent: 15 });
        doc.text(`   Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`, { indent: 15 });
        doc.moveDown(0.5);
      });

      doc.moveDown(1);
    }

    // Add summary at the end
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000')
      .text('Summary', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    for (const role of roleOrder) {
      const count = usersByRole[role]?.length || 0;
      if (count > 0) {
        doc.fillColor(roleColors[role] || '#000000')
          .text(`${role.toUpperCase().replace('_', ' ')}: ${count} users`);
      }
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor('#6B7280')
      .text('End of Report', { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for the file to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    console.log(`✅ PDF generated successfully: ${fullPath}`);
    return fullPath;
  } catch (error) {
    console.error('Error generating users PDF:', error);
    throw error;
  }
}

// Note: Do NOT run this at module level - it will exit the process
// Call generateUsersPDF() directly when needed
