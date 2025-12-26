const fs = require('fs');
const path = require('path');
const routesPath = 'server/routes.ts';
let content = fs.readFileSync(routesPath, 'utf8');

// The template has HTML tags inside the placeholders like {{</span><span>fullName</span><span>}}
// We need a more aggressive replacement strategy.

const whatsappCaseRegex = /case 'password_reset_whatsapp':[\s\S]*?const imageAssets = \[([\s\S]*?)\];[\s\S]*?let rendered = data\.htmlContent;([\s\S]*?)return \{[\s\S]*?html: rendered,[\s\S]*?attachments: imageAssets\.map[\s\S]*?\};/;
const match = content.match(whatsappCaseRegex);

if (match) {
    const fixedCase = \`    case 'password_reset_whatsapp':
      const imageAssets = [
        \${match[1].trim()}
      ];
      
      let rendered = data.htmlContent;
      
      // Advanced replacement to handle HTML tags split across placeholders
      const replacePlaceholder = (html, key, value) => {
        // Handle common variations of split placeholders in HTML exporters
        const escapedValue = String(value);
        
        // 1. Direct replacement
        html = html.split('{{' + key + '}}').join(escapedValue);
        html = html.split('{' + key + '}').join(escapedValue);
        
        // 2. Handle HTML tags inside double braces: {{</span><span>key</span><span>}}
        // This regex looks for '{{', followed by any number of tags, then the key, any tags, then '}}'
        const regex = new RegExp('\\\\{\\\\{[^>}]*?' + key + '[^<{]*?\\\\}\\\\}', 'g');
        html = html.replace(regex, escapedValue);
        
        // 3. Even more aggressive: look for parts of the placeholder split by tags
        // This specifically targets the pattern seen in the grep output
        const specificRegex = new RegExp('<span[^>]*>\\\\{\\\\{<\\\\/span><span[^>]*>' + key + '<\\\\/span><span[^>]*>\\\\}\\\\}<\\\\/span>', 'g');
        html = html.replace(specificRegex, escapedValue);

        // 4. Handle just the key wrapped in spans if it's the only way
        // Pattern: <span ...>fullName</span>
        const fallbackRegex = new RegExp('<span[^>]*>' + key + '<\\\\/span>', 'g');
        html = html.replace(fallbackRegex, escapedValue);
        
        return html;
      };

      rendered = replacePlaceholder(rendered, 'fullName', data.fullName || 'User');
      rendered = replacePlaceholder(rendered, 'code', data.code);
      rendered = replacePlaceholder(rendered, 'expiresIn', data.expiresIn || '10');
      
      return {
        html: rendered,
        attachments: imageAssets.map(img => ({
          filename: img,
          path: path.join(process.cwd(), 'attached_assets', img),
          cid: img.split('_')[0] + '.png'
        }))
      };\`;
    
    content = content.replace(match[0], fixedCase);
    fs.writeFileSync(routesPath, content);
    console.log('Fixed dynamic placeholders with advanced replacement');
} else {
    console.log('Could not find password_reset_whatsapp case in routes.ts');
}
