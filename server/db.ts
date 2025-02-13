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

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const createConnection = async (retryCount = 0) => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    // Test the connection
    await pool.connect();
    return pool;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Database connection attempt ${retryCount + 1} failed, retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createConnection(retryCount + 1);
    }
    throw error;
  }
};

export const pool = await createConnection();
export const db = drizzle(pool, { schema });

// Handle pool errors
pool.on('error', async (err) => {
  console.error('Unexpected database error:', err);
  try {
    await pool.end();
    const newPool = await createConnection();
    Object.assign(pool, newPool);
  } catch (error) {
    console.error('Failed to reconnect to database:', error);
  }
});