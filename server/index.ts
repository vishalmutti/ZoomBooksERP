import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool, db } from "./db";
import { alterSupplierContacts } from "@shared/schema";

const app = express();
app.use(express.json());

// Run migrations
(async () => {
  try {
    await db.execute(alterSupplierContacts);
    console.log("Supplier contacts migration completed");
  } catch (err) {
    console.error("Migration error:", err);
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


(async () => {
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try a single port (5000)
  const PORT = 5000;

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