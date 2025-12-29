const fs = require('fs');
const content = fs.readFileSync('server/routes.ts', 'utf8');
const oldBlock = `        // No WhatsApp opt-in: Send email verification only using new HTML template
        try {
          const { sendStudentVerificationEmail } = await import('./utils/email-templates.js');
          await sendStudentVerificationEmail(email, name, emailCode, 15);
          console.log('✅ Student verification email sent successfully to:', email);
        } catch (emailError) {
          console.error('❌ Failed to send student verification email:', emailError);
          return res.status(500).json({
            success: false,
            error: "Failed to send verification email. Please try again."
          });
        }`;
const newBlock = \`        // No WhatsApp opt-in: Send email verification only using new HTML template
        try {
          const { sendStudentVerificationEmail } = await import('./utils/email-templates.js');
          const result = await sendStudentVerificationEmail(email, name, emailCode, 15);
          if (!result) {
            throw new Error("Email service failed to send verification email");
          }
          console.log('✅ Student verification email sent successfully to:', email);
        } catch (emailError) {
          console.error('❌ Failed to send student verification email:', emailError);
          return res.status(500).json({
            success: false,
            error: "Failed to send verification email. Please try again."
          });
        }\`;

if (content.includes(oldBlock)) {
  const newContent = content.replace(oldBlock, newBlock);
  fs.writeFileSync('server/routes.ts', newContent);
  console.log('Successfully updated server/routes.ts');
} else {
  console.error('Could not find the target block in server/routes.ts');
  process.exit(1);
}
