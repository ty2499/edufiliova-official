import os

routes_path = 'server/routes.ts'
with open(routes_path, 'r') as f:
    content = f.read()

# Update getEmailTemplate to include image mapping and CID logic
old_case = """    case 'password_reset_whatsapp':
      return data.htmlContent
        .replace(/\{\{fullName\}\}/g, data.fullName || 'User')
        .replace(/\{\{code\}\}/g, data.code)
        .replace(/\{\{expiresIn\}\}/g, data.expiresIn || '10');"""

new_case = """    case 'password_reset_whatsapp':
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
          path: path.join(process.cwd(), 'attached_assets', 'images', img),
          cid: img
        }))
      };"""

if old_case in content:
    content = content.replace(old_case, new_case)
else:
    # Try with single braces if double didn't match (though my previous write used double)
    old_case_alt = """    case 'password_reset_whatsapp':
      return data.htmlContent
        .replace(/{fullName}/g, data.fullName || 'User')
        .replace(/{code}/g, data.code)
        .replace(/{expiresIn}/g, data.expiresIn || '10');"""
    content = content.replace(old_case_alt, new_case)

# Update sendEmail to handle object return from getEmailTemplate
old_send_email = """      const mailOptions = {
        from: `"EduFiliova" <${fromAddress}>`,
        to,
        subject,
        html,
      };"""

new_send_email = """      const mailOptions: any = {
        from: `"EduFiliova" <${fromAddress}>`,
        to,
        subject,
      };

      if (typeof html === 'string') {
        mailOptions.html = html;
      } else {
        mailOptions.html = (html as any).html;
        mailOptions.attachments = (html as any).attachments;
      }"""

content = content.replace(old_send_email, new_send_email)

with open(routes_path, 'w') as f:
    f.write(content)
