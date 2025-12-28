const fs = require('fs');
const path = require('path');

// Map all broken image references to Cloudinary URLs
// Based on what we successfully found
const urlMap = {
  '3d94f798ad2bd582f8c3afe175798088': 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908556/edufiliova/email-assets/3d94f798ad2bd582f8c3afe175798088_1766616088922.png',
  '83faf7f361d9ba8dfdc904427b5b6423': 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908559/edufiliova/email-assets/83faf7f361d9ba8dfdc904427b5b6423_1766616088930.png',
  '9f7291948d8486bdd26690d0c32796e0': 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908563/edufiliova/email-assets/9f7291948d8486bdd26690d0c32796e0_1766647041190.png',
  'db561a55b2cf0bc6e877bb934b39b700': 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908569/edufiliova/email-assets/db561a55b2cf0bc6e877bb934b39b700_1766616088938.png',
  '41506b29d7f0bbde9fcb0d4afb720c70': 'https://res.cloudinary.com/dl2lomrhp/image/upload/v1766908557/edufiliova/email-assets/41506b29d7f0bbde9fcb0d4afb720c70_1766616088932.png',
};

const templates = [
  'course-purchase/template.html',
  'new-course-announcement/template.html',
  'new-device-login/template.html',
  'plan-upgrade/template.html',
  'restriction/template.html',
  'student-verification/template.html',
  'student-welcome/template.html',
  'suspension/template.html',
  'voucher/template.html'
];

let totalFixed = 0;
for (const template of templates) {
  const filePath = path.join(process.cwd(), 'public/email-assets', template);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  for (const [hash, url] of Object.entries(urlMap)) {
    const pattern = new RegExp(`src="images/${hash}_\\d+\\.png"`, 'g');
    if (pattern.test(content)) {
      content = content.replace(pattern, `src="${url}"`);
      totalFixed++;
      console.log(`✅ Fixed ${hash} in ${path.dirname(template)}`);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log(`\n✅ Total image references fixed: ${totalFixed}`);
