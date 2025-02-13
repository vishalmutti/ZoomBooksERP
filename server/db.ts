
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
neonConfig.connectionTimeoutMillis = 15000;
neonConfig.wsProxy = true;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const createPool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    maxRetries: 3,
    retryDelay: 1000
  });
};

// Create initial pool
export const pool = createPool();

// Create a function to reset the pool if needed
const resetPool = async () => {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error ending pool:', error);
  }
  Object.assign(pool, createPool());
};

// Handle pool errors and reconnection
pool.on('error', async (err) => {
  console.error('Pool error:', err);
  if (err.code === '57P01') {
    console.log('Connection terminated, reconnecting...');
    await resetPool();
  }
});

// Keep connection alive with periodic query
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Keep-alive query failed:', error);
    await resetPool();
  }
}, 30000);

export const db = drizzle(pool, { schema });
