import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool, db } from "./db";
import { supplierContacts } from "@shared/schema";
import * as sql from "drizzle-orm";

const app = express();
app.use(express.json());

const initializeDatabase = async () => {
  try {
    await pool.connect();
    console.log("Database connection successful");

    // Add notes column to supplier_contacts if it doesn't exist
    await db.execute(sql.sql`
      ALTER TABLE supplier_contacts 
      ADD COLUMN IF NOT EXISTS notes text;
    `);
    console.log("Supplier contacts migration completed");
    return true;
  } catch (err) {
    console.error("Database connection/migration error:", err);
    return false;
  }
};

app.use(express.urlencoded({ extended: false }));

// Create the server instance at the top level
const server = registerRoutes(app);

// Add logging middleware
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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

const startServer = async (port: number): Promise<boolean> => {
  try {
    // Initialize database first
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error("Database initialization failed");
    }

    // Close any existing server
    if (server.listening) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // Setup Vite or static serving based on environment
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    await new Promise<void>((resolve, reject) => {
      server.listen(port, "0.0.0.0", () => {
        log(`✨ Server running at http://0.0.0.0:${port}`);
        log(`🔒 API available at http://0.0.0.0:${port}/api`);
        resolve();
      }).on('error', (err: Error & { code?: string }) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(err);
        }
      });
    });

    return true;
  } catch (err) {
    if (err instanceof Error && err.message.includes('EADDRINUSE')) {
      return false;
    }
    console.error('Server startup error:', err);
    throw err;
  }
};

// Start server with auto port increment
const startWithPortIncrement = async (initialPort: number = 5000, maxPort: number = 5010) => {
  let currentPort = initialPort;

  while (currentPort <= maxPort) {
    try {
      // Force close any existing connections
      if (server.listening) {
        await new Promise((resolve) => server.close(resolve));
      }

      const success = await startServer(currentPort);
      if (success) {
        return;
      }

      currentPort++;
      console.log(`Port ${currentPort - 1} in use, trying ${currentPort}...`);
    } catch (err) {
      console.error(`Error starting server on port ${currentPort}:`, err);
      process.exit(1);
    }
  }

  console.error(`Failed to find available port between ${initialPort} and ${maxPort}`);
  process.exit(1);
};

// Start with port 5000 as specified in .replit
startWithPortIncrement().catch((err) => {
  console.error('Critical server error:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    log('HTTP server closed');
    pool.end();
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});