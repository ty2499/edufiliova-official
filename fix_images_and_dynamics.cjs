const fs = require('fs');
const path = require('path');
const routesPath = 'server/routes.ts';
let content = fs.readFileSync(routesPath, 'utf8');

const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
const allFiles = fs.readdirSync(attachedAssetsDir);

const imageBaseNames = [
  'db561a55b2cf0bc6e877bb934b39b700',
  '41506b29d7f0bbde9fcb0d4afb720c70',
  '83faf7f361d9ba8dfdc904427b5b6423',
  '3d94f798ad2bd582f8c3afe175798088',
  'afa2a8b912b8da2c69e49d9de4a30768',
  '9f7291948d8486bdd26690d0c32796e0'
];

const imageMapping = {};
imageBaseNames.forEach(base => {
  const match = allFiles.find(f => f.startsWith(base) && f.endsWith('.png'));
  if (match) {
    imageMapping[base] = match;
  }
});

// Update the case in routes.ts
const whatsappCaseRegex = /case 'password_reset_whatsapp':[\s\S]*?const imageAssets = \[([\s\S]*?)\];[\s\S]*?let rendered = data\.htmlContent;([\s\S]*?)return \{[\s\S]*?html: rendered,[\s\S]*?attachments: imageAssets\.map[\s\S]*?\};/;
const match = content.match(whatsappCaseRegex);

if (match) {
    const newImageAssets = Object.values(imageMapping).map(name => `'${name}'`).join(',\n        ');
    
    // Improved dynamics: template uses {{fullName}}, {{code}}, {{expiresIn}}
    // We must ensure the replacement is globally applied and handles the format exactly as it is in the HTML
    
    const fixedCase = `    case 'password_reset_whatsapp':
      const imageAssets = [
        ${newImageAssets}
      ];
      
      let rendered = data.htmlContent;
      // Handle dynamics with absolute certainty
      rendered = rendered.replace(/\\{\\{fullName\\}\\}/g, data.fullName || 'User');
      rendered = rendered.replace(/\\{\\{code\\}\\}/g, data.code);
      rendered = rendered.replace(/\\{\\{expiresIn\\}\\}/g, data.expiresIn || '10');
      
      // Also handle images by replacing the CID placeholders or the original paths
      // The template currently has src="cid:filename.png" or similar
      // We need to make sure the CID in the HTML matches the CID in the attachments
      
      return {
        html: rendered,
        attachments: imageAssets.map(img => ({
          filename: img,
          path: path.join(process.cwd(), 'attached_assets', img),
          cid: img.split('_')[0] + '.png' // Using the base name as CID for consistency in HTML
        }))
      };`;
    
    content = content.replace(match[0], fixedCase);
    
    // Also update the HTML template to use the new CIDs
    const templatePath = 'server/templates/password_reset_whatsapp.html';
    let html = fs.readFileSync(templatePath, 'utf8');
    imageBaseNames.forEach(base => {
       const regex = new RegExp(`src="cid:${base}[^"]*"`, 'g');
       html = html.replace(regex, \`src="cid:\${base}.png"\`);
       // Also handle original paths if they exist
       const pathRegex = new RegExp(\`src="images/${base}[^"]*"\`, 'g');
       html = html.replace(pathRegex, \`src="cid:\${base}.png"\`);
    });
    fs.writeFileSync(templatePath, html);
}

fs.writeFileSync(routesPath, content);
console.log('Fixed image mappings and dynamics');
