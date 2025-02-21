import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { Server } from 'http';
import { initializeSocketIO } from './socket';
import { setupSecurity } from './middleware/security';

const app = express();

// Apply security middleware first
setupSecurity(app);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
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

let currentServer: Server | null = null;

async function cleanup() {
  if (currentServer?.listening) {
    await new Promise<void>((resolve) => {
      currentServer?.close(() => {
        log('Previous server instance closed');
        resolve();
      });
    });
    currentServer = null;
  }
}

(async () => {
  try {
    // Clean up any existing server
    await cleanup();

    // Create and configure the server
    const port = Number(process.env.PORT) || 5000;
    const server = await registerRoutes(app);
    currentServer = server;

    // Initialize Socket.IO with security options
    initializeSocketIO(server);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      // Don't expose internal error details in production
      const response = process.env.NODE_ENV === 'production' 
        ? { message: 'Internal Server Error' }
        : { message, stack: err.stack };
      res.status(status).json(response);
      console.error('Server error:', err);
    });

    // Setup Vite or static serving based on environment
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server with external access
    await new Promise<void>((resolve) => {
      server.listen(port, "0.0.0.0", () => {
        log(`Server successfully started on port ${port}`);
        resolve();
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();