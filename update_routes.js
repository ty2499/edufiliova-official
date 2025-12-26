const fs = require('fs');
const path = require('path');

const routesPath = 'server/routes.ts';
let content = fs.readFileSync(routesPath, 'utf8');

const oldCase = `    case 'password_reset_whatsapp':
      return data.htmlContent
        .replace(/\\{\\{fullName\\}\\}/g, data.fullName || 'User')
        .replace(/\\{\\{code\\}\\}/g, data.code)
        .replace(/\\{\\{expiresIn\\}\\}/g, data.expiresIn || '10');`;

const newCase = `    case 'password_reset_whatsapp':
      const images = [
        'db561a55b2cf0bc6e877bb934b39b700.png',
        '41506b29d7f0bbde9fcb0d4afb720c70.png',
        '83faf7f361d9ba8dfdc904427b5b6423.png',
        '3d94f798ad2bd582f8c3afe175798088.png',
        'afa2a8b912b8da2c69e49d9de4a30768.png',
        '9f7291948d8486bdd26690d0c32796e0.png'
      ];
      return {
        html: data.htmlContent
          .replace(/\\{\\{fullName\\}\\}/g, data.fullName || 'User')
          .replace(/\\{\\{code\\}\\}/g, data.code)
          .replace(/\\{\\{expiresIn\\}\\}/g, data.expiresIn || '10'),
        attachments: images.map(img => ({
          filename: img,
          path: path.join(process.cwd(), 'attached_assets', img),
          cid: img
        }))
      };`;

if (content.includes(oldCase)) {
    content = content.replace(oldCase, newCase);
} else {
    console.log('Old case not found exactly, trying alternate match...');
}

const oldSendEmail = `      const mailOptions = {
        from: \`"EduFiliova" <\${fromAddress}>\`,
        to,
        subject,
        html,
      };`;

const newSendEmail = `      const mailOptions = {
        from: \`"EduFiliova" <\${fromAddress}>\`,
        to,
        subject,
        html: typeof html === 'string' ? html : (html).html,
        attachments: typeof html === 'string' ? undefined : (html).attachments,
      };`;

content = content.replace(oldSendEmail, newSendEmail);

fs.writeFileSync(routesPath, content);
console.log('Successfully updated routes.ts');
