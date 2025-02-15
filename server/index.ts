import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool, db } from "./db";
import { alterSupplierContacts } from "@shared/schema";
import { createServer as createNetServer, type Server as NetServer } from "net";

const app = express();
app.use(express.json());

// Test database connection and run migrations asynchronously
const initializeDatabase = async () => {
  try {
    // Test connection
    await pool.connect();
    console.log("Database connection successful");

    // Run migrations
    await db.execute(alterSupplierContacts);
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

// Find an available port
const findAvailablePort = async (startPort: number, maxAttempts: number = 10): Promise<number> => {
  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = createNetServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          server.close();
          resolve(true);
        })
        .listen(port, '0.0.0.0');
    });
  };

  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`);
};

const startServer = async (port: number) => {
  try {
    // Force close any existing connections
    if (server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Initialize database first
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error("Database initialization failed");
    }

    // Setup Vite or static serving based on environment
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const availablePort = await findAvailablePort(port);

    return new Promise<void>((resolve, reject) => {
      server.listen(availablePort, "0.0.0.0", () => {
        log(`✨ Server running at http://0.0.0.0:${availablePort}`);
        log(`🔒 API available at http://0.0.0.0:${availablePort}/api`);
        resolve();
      }).on('error', (err: Error & { code?: string }) => {
        reject(err);
      });
    });
  } catch (err) {
    console.error('Server startup error:', err);
    throw err;
  }
};

// Start server with retries if needed
const startWithRetries = async (initialPort: number, maxRetries: number = 3) => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await startServer(initialPort);
      return; // Successfully started
    } catch (err) {
      lastError = err as Error;
      console.log(`Failed attempt ${attempt + 1}/${maxRetries}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
    }
  }

  console.error(`Failed to start server after ${maxRetries} attempts:`, lastError);
  process.exit(1);
};

// Start with initial port as specified in .replit
startWithRetries(5000).catch((err) => {
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