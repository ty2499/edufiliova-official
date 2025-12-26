import fs from 'fs';
import path from 'path';
import { cloudflareR2Storage } from './cloudflare-r2-storage';
import { db } from './db';
import { 
  freelancerApplications, 
  users, 
  products, 
  courses,
  lessons 
} from '@shared/schema';
import { eq, or, like, sql } from 'drizzle-orm';

interface MigrationResult {
  oldPath: string;
  newUrl: string;
  size: number;
}

interface MigrationStats {
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  totalSize: number;
  results: MigrationResult[];
  errors: Array<{ file: string; error: string }>;
}

async function getContentType(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

function getFolderPath(relativeFilePath: string): string {
  if (relativeFilePath.includes('portfolio-samples')) {
    return 'uploads/portfolio-samples';
  }
  if (relativeFilePath.includes('avatars')) {
    return 'uploads/avatars';
  }
  if (relativeFilePath.includes('documents')) {
    return 'uploads/documents';
  }
  if (relativeFilePath.includes('images')) {
    return 'uploads/images';
  }
  return 'uploads/general';
}

async function getAllFiles(dirPath: string, baseDir: string = dirPath): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

async function migrateFile(filePath: string): Promise<MigrationResult | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    const originalName = path.basename(filePath);
    const contentType = await getContentType(filePath);
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const urlPath = '/' + relativePath;
    const folderPath = getFolderPath(relativePath);
    
    console.log(`📤 Uploading: ${relativePath} (${(stats.size / 1024).toFixed(2)} KB)`);
    
    const uploadResult = await cloudflareR2Storage.uploadFile(
      fileBuffer,
      originalName,
      contentType,
      folderPath
    );
    
    if (uploadResult.success && uploadResult.url) {
      console.log(`✅ Uploaded: ${uploadResult.url}`);
      return {
        oldPath: urlPath,
        newUrl: uploadResult.url,
        size: stats.size
      };
    } else {
      console.error(`❌ Upload failed for ${filePath}:`, uploadResult.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return null;
  }
}

async function updateDatabaseReferences(mappings: MigrationResult[]): Promise<void> {
  console.log('\n📊 Updating database references...\n');
  
  const pathMappings = new Map(
    mappings.map(m => [m.oldPath, m.newUrl])
  );
  
  let updatedCount = 0;
  
  for (const [oldPath, newUrl] of pathMappings.entries()) {
    const searchPath = oldPath.replace('uploads/', '/uploads/');
    
    try {
      const applications = await db
        .select()
        .from(freelancerApplications)
        .where(
          sql`${freelancerApplications.portfolioSamples}::text LIKE ${`%${searchPath}%`}`
        );
      
      for (const app of applications) {
        if (app.portfolioSamples) {
          const updated = JSON.parse(JSON.stringify(app.portfolioSamples))
            .map((sample: any) => {
              if (sample.files) {
                sample.files = sample.files.map((file: string) => 
                  file === searchPath ? newUrl : file
                );
              }
              return sample;
            });
          
          await db
            .update(freelancerApplications)
            .set({ portfolioSamples: updated })
            .where(eq(freelancerApplications.id, app.id));
          
          updatedCount++;
          console.log(`✅ Updated freelancer application: ${app.id}`);
        }
      }
    } catch (error) {
      console.error(`Error updating freelancer applications for ${oldPath}:`, error);
    }
    
    try {
      const usersWithAvatar = await db
        .select()
        .from(users)
        .where(like(users.profilePicture, `%${searchPath}%`));
      
      for (const user of usersWithAvatar) {
        await db
          .update(users)
          .set({ profilePicture: newUrl })
          .where(eq(users.id, user.id));
        
        updatedCount++;
        console.log(`✅ Updated user avatar: ${user.id}`);
      }
    } catch (error) {
      console.error(`Error updating user avatars for ${oldPath}:`, error);
    }
    
    try {
      const productsWithFile = await db
        .select()
        .from(products)
        .where(
          or(
            like(products.imageUrl, `%${searchPath}%`),
            like(products.fileUrl, `%${searchPath}%`)
          )
        );
      
      for (const product of productsWithFile) {
        const updates: any = {};
        if (product.imageUrl?.includes(searchPath)) {
          updates.imageUrl = newUrl;
        }
        if (product.fileUrl?.includes(searchPath)) {
          updates.fileUrl = newUrl;
        }
        
        if (Object.keys(updates).length > 0) {
          await db
            .update(products)
            .set(updates)
            .where(eq(products.id, product.id));
          
          updatedCount++;
          console.log(`✅ Updated product: ${product.id}`);
        }
      }
    } catch (error) {
      console.error(`Error updating products for ${oldPath}:`, error);
    }
  }
  
  console.log(`\n✅ Updated ${updatedCount} database records\n`);
}

export async function runMigration(): Promise<MigrationStats> {
  console.log('🚀 Starting migration to Cloudflare R2...\n');
  
  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('Cloudflare R2 is not configured. Please check your environment variables.');
  }
  
  const testResult = await cloudflareR2Storage.testConnection();
  if (!testResult.success) {
    throw new Error(`Cloudflare R2 connection failed: ${testResult.error}`);
  }
  
  console.log('✅ Cloudflare R2 connection verified\n');
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('⚠️ No uploads directory found. Nothing to migrate.');
    return {
      totalFiles: 0,
      successfulUploads: 0,
      failedUploads: 0,
      totalSize: 0,
      results: [],
      errors: []
    };
  }
  
  const allFiles = await getAllFiles(uploadsDir);
  console.log(`📁 Found ${allFiles.length} files to migrate\n`);
  
  const stats: MigrationStats = {
    totalFiles: allFiles.length,
    successfulUploads: 0,
    failedUploads: 0,
    totalSize: 0,
    results: [],
    errors: []
  };
  
  for (const file of allFiles) {
    const result = await migrateFile(file);
    
    if (result) {
      stats.successfulUploads++;
      stats.totalSize += result.size;
      stats.results.push(result);
    } else {
      stats.failedUploads++;
      stats.errors.push({
        file,
        error: 'Upload failed'
      });
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`Total files: ${stats.totalFiles}`);
  console.log(`Successful: ${stats.successfulUploads}`);
  console.log(`Failed: ${stats.failedUploads}`);
  console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  
  if (stats.successfulUploads > 0) {
    await updateDatabaseReferences(stats.results);
  }
  
  const mappingFile = path.join(process.cwd(), 'migration-mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(stats, null, 2));
  console.log(`✅ Migration mapping saved to: ${mappingFile}\n`);
  
  return stats;
}

// Note: Do NOT run this at module level - it will exit the process
// Call runMigration() directly when needed
