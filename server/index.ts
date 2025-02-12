import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
// Add database import here.  Adapt to your database library.
import { Pool } from 'pg'; // Example for PostgreSQL

const app = express();
app.use(express.json());
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

// Database setup (adapt to your database)
const pool = new Pool({
  // ...your database connection details...
});

const alterSupplierContacts = `ALTER TABLE supplier_contacts ADD COLUMN notes TEXT;`;

(async () => {
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try a single port (5000)
  const PORT = 5000;

  // Apply database migrations
  try {
    await pool.query(alterSupplierContacts);
    console.log('Database migration successful.');
  } catch (error) {
    console.error('Database migration failed:', error);
    // Handle the error appropriately (e.g., exit the process)
  }

  server.listen(PORT, "0.0.0.0", () => {
    log(`✨ Server running at http://0.0.0.0:${PORT}`);
    log(`🔒 API available at http://0.0.0.0:${PORT}/api`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Error: Port ${PORT} is already in use`);
    } else {
      log(`Error starting server: ${err.message}`);
    }
    process.exit(1);
  });
})();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    log('HTTP server closed');
    pool.end(); // Close the database connection
    process.exit(0);
  });
});