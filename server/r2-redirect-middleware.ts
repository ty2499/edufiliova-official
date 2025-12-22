import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface MigrationMapping {
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  totalSize: number;
  results: Array<{
    oldPath: string;
    newUrl: string;
    size: number;
  }>;
}

let migrationMap: Map<string, string> | null = null;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

function loadMigrationMapping(): void {
  if (migrationMap) {
    return;
  }

  try {
    const mappingPath = path.join(process.cwd(), 'migration-mapping.json');
    
    if (fs.existsSync(mappingPath)) {
      const data = fs.readFileSync(mappingPath, 'utf-8');
      const mapping: MigrationMapping = JSON.parse(data);
      
      migrationMap = new Map();
      
      for (const result of mapping.results) {
        let normalizedPath = result.oldPath.replace(/\\/g, '/');
        
        if (!normalizedPath.startsWith('/')) {
          normalizedPath = '/' + normalizedPath;
        }
        
        migrationMap.set(normalizedPath, result.newUrl);
        
        console.log(`📍 Mapped: ${normalizedPath} -> ${result.newUrl}`);
      }
      
      console.log(`✅ Loaded ${mapping.results.length} file redirects from migration mapping`);
    } else {
      console.warn('⚠️ No migration mapping found. Old upload URLs may not work.');
      migrationMap = new Map();
    }
  } catch (error) {
    console.error('❌ Error loading migration mapping:', error);
    migrationMap = new Map();
  }
}

export function r2RedirectMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.startsWith('/uploads')) {
    return next();
  }

  if (!migrationMap) {
    loadMigrationMapping();
  }

  if (!R2_PUBLIC_URL) {
    console.warn('⚠️ CLOUDFLARE_R2_PUBLIC_URL not set, serving files locally');
    return next();
  }

  const requestedPath = req.path;
  const r2Url = migrationMap?.get(requestedPath);

  if (r2Url) {
    console.log(`🔀 Redirecting ${requestedPath} -> ${r2Url}`);
    return res.redirect(302, r2Url);
  }

  const fileName = path.basename(requestedPath);
  const dirPath = path.dirname(requestedPath).replace(/^\//, '');
  
  const possibleR2Url = `${R2_PUBLIC_URL}/${dirPath}/${fileName}`;
  
  console.log(`🔀 Redirecting (constructed) ${requestedPath} -> ${possibleR2Url}`);
  res.redirect(302, possibleR2Url);
}
