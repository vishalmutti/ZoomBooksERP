
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create connection pool with explicit SSL configuration and better error handling
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
  max: 20,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: true
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });
