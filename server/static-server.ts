import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // Try multiple path resolution strategies for different deployment environments
  const possiblePaths = [
    // Strategy 1: Vite dist folder (most common)
    path.resolve(process.cwd(), "dist"),
    // Strategy 2: Relative to bundled file location (standard esbuild output)
    path.resolve(import.meta.dirname, "public"),
    // Strategy 3: Using fileURLToPath for ESM compatibility
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public"),
    // Strategy 4: Relative to current working directory (some platforms)
    path.resolve(process.cwd(), "dist/public"),
    // Strategy 5: Direct dist/public from cwd
    path.resolve(process.cwd(), "public"),
    // Strategy 6: App directory for containerized deployments
    path.resolve("/app/dist"),
    path.resolve("/app/dist/public"),
    path.resolve("/app/public"),
  ];
  
  let distPath: string | null = null;
  
  console.log('🔍 [STATIC] Searching for public directory...');
  console.log('🔍 [STATIC] import.meta.dirname:', import.meta.dirname);
  console.log('🔍 [STATIC] process.cwd():', process.cwd());
  
  for (const tryPath of possiblePaths) {
    console.log(`🔍 [STATIC] Checking: ${tryPath}`);
    if (fs.existsSync(tryPath)) {
      const indexPath = path.join(tryPath, "index.html");
      if (fs.existsSync(indexPath)) {
        distPath = tryPath;
        console.log(`✅ [STATIC] Found public directory: ${distPath}`);
        break;
      } else {
        console.log(`⚠️ [STATIC] Directory exists but no index.html: ${tryPath}`);
      }
    }
  }

  if (!distPath) {
    // Log warning but don't crash - server can continue in API-only mode
    console.warn('⚠️ [STATIC] Could not find public directory. Server running in API-only mode.');
    console.warn('⚠️ [STATIC] Static file serving is disabled. Frontend assets must be served separately or built.');
    return;
  }

  // Serve static files with proper caching headers
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    index: 'index.html'
  }));

  // SPA fallback - serve index.html for all non-API routes
  app.use("*", (req, res, next) => {
    // Skip API routes
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
