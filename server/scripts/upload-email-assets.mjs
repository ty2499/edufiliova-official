import cloudinary from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const v2 = cloudinary.v2;
v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dl2lomrhp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const emailAssetsDir = path.resolve(process.cwd(), 'public/email-assets');
const imageMap = {};
let uploadCount = 0;

const files = fs.readdirSync(emailAssetsDir);

for (const file of files) {
  const filePath = path.join(emailAssetsDir, file);
  const stat = fs.statSync(filePath);
  
  if (stat.isDirectory() || !/\.(png|jpg|jpeg|gif)$/i.test(file)) continue;
  
  try {
    const result = await v2.uploader.upload(filePath, {
      folder: 'edufiliova/email-assets',
      public_id: file.replace(/\.[^.]+$/, ''),
      overwrite: false,
      resource_type: 'auto',
    });
    imageMap[file] = result.secure_url;
    uploadCount++;
    console.log(`✅ ${file}`);
  } catch (err) {
    console.warn(`⚠️ ${file}: ${err.message}`);
  }
}

const mappingDir = path.resolve(process.cwd(), 'server/config');
if (!fs.existsSync(mappingDir)) fs.mkdirSync(mappingDir, { recursive: true });
fs.writeFileSync(path.join(mappingDir, 'email-assets-map.json'), JSON.stringify(imageMap, null, 2));

console.log(`\n✅ Uploaded ${uploadCount} images`);
