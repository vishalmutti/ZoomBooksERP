import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool, db } from "./db";
import { alterSupplierContacts } from "@shared/schema";

const app = express();
app.use(express.json());

// Test database connection and run migrations
(async () => {
  try {
    // Test connection
    await pool.connect();
    console.log("Database connection successful");
    
    // Run migrations
    await db.execute(alterSupplierContacts);
    console.log("Supplier contacts migration completed");
  } catch (err) {
    console.error("Database connection/migration error:", err);
    process.exit(1);
  }
})();

app.use(express.urlencoded({ extended: false }));

// Create the server instance at the top level
const server = registerRoutes(app);

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

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// Try multiple ports starting from 3000
const startServer = async (initialPort: number) => {
  const maxAttempts = 10;
  let currentPort = initialPort;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }

      return new Promise<void>((resolve, reject) => {
        server.listen(currentPort, "0.0.0.0", () => {
          log(`✨ Server running at http://0.0.0.0:${currentPort}`);
          log(`🔒 API available at http://0.0.0.0:${currentPort}/api`);
          resolve();
        }).on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            currentPort++;
            if (attempt === maxAttempts - 1) {
              log(`Error: Unable to find an available port after ${maxAttempts} attempts`);
              reject(err);
            }
          } else {
            log(`Error starting server: ${err.message}`);
            reject(err);
          }
        });
      });
    } catch (err) {
      if (attempt === maxAttempts - 1) {
        throw err;
      }
    }
  }
};

// Start the server with initial port 5000
startServer(5000).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    log('HTTP server closed');
    pool.end(); // Close the database connection
    process.exit(0);
  });
});