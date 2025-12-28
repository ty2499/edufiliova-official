import fs from 'fs';
import path from 'path';
import glob from 'glob';

const NEW_HEADER_COLOR = '#a0fab2';
const LOGO_URL = 'https://res.cloudinary.com/dl2lomrhp/image/upload/f_auto,q_auto:eco,v1763935567/edufiliova/edufiliova-white-logo.png';

async function updateTemplates() {
  const files = glob.sync('public/email-assets/**/template.html');
  console.log(`🔍 Found ${files.length} templates to update.`);

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;

    // Update header background color
    if (content.includes('.header { background-color: #0c332c;')) {
      content = content.replace(/\.header \{ background-color: #0c332c;/g, `.header { background-color: ${NEW_HEADER_COLOR};`);
      changed = true;
    } else if (content.includes('background-color: #0c332c;')) {
        // Fallback for inline or other occurrences of the old brand color in backgrounds
        content = content.replace(/background-color: #0c332c;/g, `background-color: ${NEW_HEADER_COLOR};`);
        changed = true;
    }

    // Add logo to header if missing
    if (content.includes('<div class="header">') && !content.includes(LOGO_URL)) {
      const logoHtml = `\n            <img src="${LOGO_URL}" alt="EduFiliova Logo" style="max-height: 50px; width: auto; display: block; margin: 0 auto;">`;
      content = content.replace('<div class="header">', `<div class="header">${logoHtml}`);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`✅ Updated ${file}`);
    } else {
      console.log(`ℹ️ No changes needed for ${file}`);
    }
  });
}

updateTemplates();
