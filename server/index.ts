import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

(async () => {
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try ports starting from 5000 until we find an available one
  const tryPort = (port: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      const cleanupAndRetry = () => {
        server.close(() => {
          tryPort(port + 1).then(resolve).catch(reject);
        });
      };

      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`Port ${port} in use, trying ${port + 1}`);
          cleanupAndRetry();
        } else {
          reject(err);
        }
      });

      server.listen(port, "0.0.0.0", () => {
        log(`✨ Server running at http://0.0.0.0:${port}`);
        log(`🔒 API available at http://0.0.0.0:${port}/api`);
        resolve(port);
      });
    });
  };

  try {
    await tryPort(5000);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    log('HTTP server closed');
    process.exit(0);
  });
});