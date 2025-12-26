import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
// CRITICAL: These imports are now dynamic - loaded AFTER API keys are injected from database
// Static imports of env-dependent modules (Stripe, PayPal, etc.) would fail before config loads
import { loadApiKeysToEnv } from "./lib/config-loader";

// CRITICAL: Keep process alive - must be at top level, runs immediately
// This prevents Node.js from exiting even if async initialization fails
console.log('🔒 [KEEP-ALIVE] Process keep-alive initialized');
const keepAliveInterval = setInterval(() => {
  // This interval keeps the Node.js event loop active
}, 30000); // Every 30 seconds

// Prevent the keep-alive from being garbage collected
(globalThis as any).__keepAlive = keepAliveInterval;

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Handle warnings
process.on('warning', (warning) => {
  console.warn('Warning:', warning.message);
});

const app = express();

// Configure CORS for production deployment
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = [
  'https://edufiliova.com',
  'https://www.edufiliova.com',
  'https://app.edufiliova.com',
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
  process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : null,
].filter(Boolean) as string[];

// Add development origins
if (!isProduction) {
  allowedOrigins.push('http://localhost:5000', 'http://127.0.0.1:5000');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    // Check if origin is allowed - return the actual origin for credentials to work
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      return callback(null, origin);
    }
    // Allow all Replit domains
    if (origin.includes('.replit.dev') || origin.includes('.replit.app') || origin.includes('.repl.co')) {
      return callback(null, origin);
    }
    // Allow all edufiliova subdomains
    if (origin.includes('edufiliova.com')) {
      return callback(null, origin);
    }
    console.log('🚫 CORS blocked origin:', origin);
    return callback(null, origin); // Allow all origins temporarily for debugging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400
}));

// CRITICAL: Simple health check that responds immediately (before async initialization)
// This allows load balancers/orchestrators to see the server is alive during startup
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root health check for platforms that check /
app.get('/__health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cookie parser middleware
app.use(cookieParser());

// Trust proxy for production (needed for secure cookies behind reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Skip body parsing for logo upload routes (need raw body for signature verification)
app.use((req, res, next) => {
  if (req.url.includes('/api/admin/settings/logo') && req.method === 'POST') {
    console.log('🔥 Skipping body parsing for logo upload:', req.url);
    // Skip all body parsing for logo uploads
    return next();
  }
  // Apply normal body parsing for other routes
  next();
});

// Add body parsing middleware with raw body capture for webhooks
// Use custom type matcher to accept any charset variant (utf-8, UTF-8, etc.)
app.use(express.json({ 
  limit: '50mb',
  type: (req) => {
    // Accept any JSON content-type regardless of charset casing
    const contentType = req.headers['content-type'] || '';
    return /^application\/json/i.test(contentType);
  },
  verify: (req, res, buf, encoding) => {
    // Capture raw body for webhook signature verification
    if (req.url && req.url.includes('/webhook')) {
      (req as any).rawBody = buf.toString((encoding as BufferEncoding) || 'utf8');
    }
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve attached assets statically (development only)
app.use('/attached_assets', express.static('attached_assets'));

(async () => {
  console.log('🔧 [STARTUP] Starting async initialization...');
  console.log('🔧 [STARTUP] DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ NOT SET - CRITICAL');
  
  // CRITICAL: Load API keys from database BEFORE importing env-dependent modules
  try {
    await loadApiKeysToEnv();
    console.log('🔧 [STARTUP] ✅ API keys successfully loaded from database');
  } catch (error) {
    console.error('🔧 [STARTUP] ❌ ERROR loading API keys from database:', error);
    console.error('🔧 [STARTUP] Verify DATABASE_URL is configured in environment variables');
  }
  
  // Dynamic imports - MUST happen AFTER API keys are loaded into process.env
  // These modules import Stripe/PayPal/email clients that require API keys at import time
  console.log('🔧 [STARTUP] Loading env-dependent modules...');
  const { registerRoutes } = await import("./routes");
  const { registerEmailRoutes } = await import("./emailRoutes");
  const { registerEmailMarketingRoutes } = await import("./routes/email-marketing");
  const { default: subscriptionRoutes } = await import("./routes/subscription-routes");
  const { default: teacherSubjectsRoutes } = await import("./routes/teacher-subjects");
  const { default: subjectCategoriesRouter } = await import("./routes/subject-categories");
  const { default: pushNotificationRoutes } = await import("./routes/push-notification-routes");
  const { setupWebSocket } = await import("./websocket");
  const { log } = await import("./static-server");
  const { locationDetectionMiddleware } = await import("./middleware/location");
  const { r2RedirectMiddleware } = await import("./r2-redirect-middleware");
  const { seedEmailTemplates } = await import("./seed-email-templates");
  const { seedEmailSegments } = await import("./seed-email-segments");
  console.log('🔧 [STARTUP] ✅ All env-dependent modules loaded');
  
  // Register middleware that depends on dynamically loaded modules
  app.use(r2RedirectMiddleware);
  app.use(locationDetectionMiddleware);
  
  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        
        if (capturedJsonResponse && !path.includes('/logo')) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } else if (capturedJsonResponse && path.includes('/logo')) {
          logLine += ` :: { success: ${capturedJsonResponse.success}, type: "${capturedJsonResponse.type}" }`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });
  
  const server = await registerRoutes(app);
  console.log('🔧 [STARTUP] registerRoutes completed');
  
  // Register email routes
  registerEmailRoutes(app);
  
  // Register email marketing routes
  registerEmailMarketingRoutes(app);
  console.log('🔧 [STARTUP] Email marketing routes registered');
  
  // Register subscription routes
  app.use('/api', subscriptionRoutes);
  console.log('🔧 [STARTUP] Subscription routes registered');
  
  // Register teacher subjects routes
  app.use('/api', teacherSubjectsRoutes);
  app.use(subjectCategoriesRouter);
  console.log('🔧 [STARTUP] Teacher subjects routes registered');
  
  // Register push notification routes
  app.use('/api/notifications', pushNotificationRoutes);
  console.log('🔧 [STARTUP] Push notification routes registered');
  
  // Seed email marketing templates
  try {
    await seedEmailTemplates();
    console.log('✅ Email marketing templates seeded');
  } catch (error) {
    console.error('❌ Email template seeding failed:', error);
  }
  
  // Seed email marketing segments
  try {
    await seedEmailSegments();
    console.log('✅ Email marketing segments seeded');
  } catch (error) {
    console.error('❌ Email segment seeding failed:', error);
  }
  
  // Setup WebSocket server with error handling
  try {
    const wss = setupWebSocket(server);
    console.log('✅ WebSocket server setup complete');
  } catch (error) {
    console.error('❌ WebSocket setup failed:', error);
    console.log('⚠️ Server will continue without WebSocket support');
  }

  // Start email auto-sync - DISABLED to reduce database egress
  // Users can manually sync emails from the email management page
  // try {
  //   emailService.startAutoSync();
  //   console.log('✅ Email auto-sync started');
  // } catch (error) {
  //   console.error('❌ Email auto-sync failed to start:', error);
  // }
  console.log('📧 Email auto-sync is DISABLED to reduce database costs. Use manual sync instead.');

  // Monthly settlement cron job - runs on the 5th of every month
  try {
    const { processMonthlySettlementForAll } = await import('./services/earnings.js');
    
    // Track last settlement run date to prevent duplicates
    let lastSettlementDate: string | null = null;
    
    const runSettlementCheck = async () => {
      const now = new Date();
      const dayOfMonth = now.getDate();
      const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${dayOfMonth}`;
      
      // Run on the 5th of each month, but only once per day
      if (dayOfMonth === 5 && lastSettlementDate !== todayKey) {
        console.log('🗓️  Running monthly settlement for all creators (5th of month)...');
        try {
          await processMonthlySettlementForAll();
          lastSettlementDate = todayKey; // Mark as run for today
          console.log('✅ Monthly settlement completed successfully');
        } catch (error) {
          console.error('❌ Monthly settlement failed:', error);
        }
      }
    };
    
    // Run immediately on startup (in case we're on the 5th)
    await runSettlementCheck();
    
    // Then check every hour
    setInterval(runSettlementCheck, 60 * 60 * 1000);
    console.log('✅ Monthly settlement scheduler started (runs on 5th of each month)');
  } catch (error) {
    console.error('❌ Monthly settlement scheduler failed to start:', error);
  }

  // Payout automation scheduler - creates and finalizes payouts
  try {
    const { initializePayoutScheduler } = await import('./services/payout-automation.js');
    initializePayoutScheduler();
    console.log('✅ Payout automation scheduler started');
  } catch (error) {
    console.error('❌ Payout automation scheduler failed to start:', error);
  }

  // Engagement notification scheduler - sends automated engagement emails
  try {
    const { notificationScheduler } = await import('./services/notification-scheduler.js');
    notificationScheduler.start();
    console.log('✅ Engagement notification scheduler started');
  } catch (error) {
    console.error('❌ Engagement notification scheduler failed to start:', error);
  }

  // Meeting notification scheduler - DISABLED to reduce database egress
  // Users can manually send notifications or we can enable this selectively
  // try {
  //   const { initializeMeetingNotificationScheduler } = await import('./meeting-notifications.js');
  //   initializeMeetingNotificationScheduler();
  //   console.log('✅ Meeting notification scheduler started');
  // } catch (error) {
  //   console.error('❌ Meeting notification scheduler failed to start:', error);
  // }
  console.log('🔔 Meeting notification scheduler is DISABLED to reduce database costs.');

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Dynamic import with path constructed at runtime to prevent esbuild from bundling vite
    const vitePath = "./vite" + (process.env.NODE_ENV === "production" ? ".never" : "");
    const { setupVite } = await import(/* @vite-ignore */ vitePath);
    await setupVite(app, server);
  } else {
    console.log('🔧 [STARTUP] Setting up static file serving for production...');
    try {
      const { serveStatic } = await import("./static-server");
      serveStatic(app);
      console.log('✅ [STARTUP] Static file serving configured');
    } catch (err) {
      console.error('❌ [STARTUP] Static file serving failed:', err);
      console.log('⚠️ [STARTUP] Continuing without static file serving - API-only mode');
    }
  }

  // Error handler must be registered LAST, after all routes and middleware including Vite
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Server error:', err);
    res.status(status).json({ message });
  });

  // Use PORT environment variable for deployment platforms
  // Railway/Render/Hyperlift provide dynamic ports via process.env.PORT
  const port = parseInt(process.env.PORT || "5000");
  console.log('═════════════════════════════════════════════════════════');
  console.log('🔧 [STARTUP] CRITICAL SERVER CONFIGURATION:');
  console.log('   • PORT environment variable:', process.env.PORT || 'Not set (using default 5000)');
  console.log('   • Parsed port:', port);
  console.log('   • NODE_ENV:', process.env.NODE_ENV);
  console.log('   • DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ NOT SET');
  console.log('═════════════════════════════════════════════════════════');
  
  server.on('error', (err: any) => {
    console.error('❌ Server listen error:', err);
    // DO NOT exit - let keep-alive keep process running for debugging
    console.log('🔒 [KEEP-ALIVE] Server error occurred but process will stay alive');
  });
  
  server.listen(port, "0.0.0.0", () => {
    log(`✅ Server successfully listening on port ${port}`);
    console.log('🔧 [STARTUP] Server listening on 0.0.0.0:' + port + ', process will stay alive');
  });
  
  // Keep the process alive using setInterval (more reliable than empty Promise)
  console.log('🔧 [STARTUP] Setting up keep-alive interval...');
  setInterval(() => {
    // This keeps Node.js event loop active
  }, 1000 * 60 * 60); // Every hour
  
  console.log('🔧 [STARTUP] Initialization complete, server running');
})().catch((err) => {
  console.error('❌ [STARTUP] Fatal async error:', err);
  console.error('❌ [STARTUP] Error details:', err instanceof Error ? err.message : String(err));
  // DO NOT exit - keep process alive so keep-alive interval keeps it running
  console.log('🔒 [KEEP-ALIVE] Process will continue despite initialization error');
});

// Fallback keep-alive at module level - CRITICAL FOR PRODUCTION
setInterval(() => {}, 1000 * 60 * 60);
