import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Configure Neon connection
neonConfig.webSocketConstructor = ws;

// Configure database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

let isReconnecting = false;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000;

const createPool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    max: 5,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    allowExitOnIdle: false
  });
};

const handleReconnect = async () => {
  if (isReconnecting) return;
  isReconnecting = true;

  for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
    try {
      await resetPool();
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      isReconnecting = false;
      console.log('Database reconnection successful');
      return;
    } catch (error) {
      console.error(`Reconnection attempt ${attempt + 1} failed:`, error);
      if (attempt < MAX_RECONNECT_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, RECONNECT_INTERVAL));
      }
    }
  }

  console.error('Max reconnection attempts reached');
  isReconnecting = false;
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

// Add initial connection test with retries
const testInitialConnection = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        await resetPool();
      }
    }
  }
  return false;
};

testInitialConnection().catch(console.error);

// Handle pool errors and reconnection
pool.on('error', async (err: Error & { code?: string }) => {
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