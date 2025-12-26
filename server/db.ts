import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create postgres client with connection pooling to reduce egress overhead
const client = postgres(connectionString, {
  // Connection pooling configuration
  max: 10,                    // Maximum number of connections in pool
  idle_timeout: 20,           // Close idle connections after 20 seconds
  connect_timeout: 10,        // Connection timeout in seconds
  
  // Performance optimizations
  prepare: true,              // Use prepared statements for better performance
  
  // SSL configuration - required for all Neon databases (dev and prod)
  ssl: 'require',
  
  // Logging (disable in production for better performance)
  debug: process.env.NODE_ENV === 'development',
  
  // Transform options for better type handling
  transform: {
    undefined: null,          // Transform undefined to null for Postgres
  },
});

// Create drizzle instance with schema for query API
export const db = drizzle(client, { schema });

// Export postgres client for raw SQL queries
export const sql = client;

// Graceful shutdown for both SIGINT and SIGTERM
const shutdownDatabase = async (signal: string) => {
  console.log(`🔌 ${signal} received: Closing database connections...`);
  try {
    await client.end({ timeout: 5 });
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

// Note: Signal and error handlers are managed in server/index.ts
// DO NOT call process.exit() here - it will terminate the server
// The server should stay alive even after errors for debugging

process.on('SIGINT', async () => {
  console.log('🔌 SIGINT received: Database will close on next restart');
  // Don't exit - let the keep-alive keep the process running
});

process.on('SIGTERM', async () => {
  console.log('🔌 SIGTERM received: Database will close on next restart');
  // Don't exit - let the keep-alive keep the process running
});