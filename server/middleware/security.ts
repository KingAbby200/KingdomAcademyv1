import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { sanitizeInput, validateInput } from './validation';
import type { Express, Request, Response, NextFunction } from 'express';

const MemoryStore = createMemoryStore(session);

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

// General rate limiter with very lenient limits
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 1000, // Allow 1000 requests per hour
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for authenticated admins
    return req.session?.isAdmin === true || 
           req.path.startsWith('/admin') || // Skip for admin routes
           req.path.startsWith('/api/admin'); // Skip for admin API routes
  }
});

// API specific rate limiter with adjusted limits
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 500, // Allow 500 API requests per hour
  message: 'Too many API requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return req.session?.isAdmin === true || // Skip for admins
           req.path.startsWith('/api/admin'); // Skip for admin API routes
  }
});

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Admin authentication middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Input sanitization middleware
export const sanitizer = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

// Setup security middleware
export function setupSecurity(app: Express) {
  // Enable rate limiting
  app.use('/api/', apiLimiter);
  app.use(limiter);

  // Set security headers using helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Enable CORS with specific options
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });

  // Add input sanitization
  app.use(sanitizer);

  // Setup session store with enhanced security
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  // Add session security with validated secret
  app.use(session({
    secret: process.env.SESSION_SECRET,
    name: 'sessionId', // Don't use default connect.sid
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    resave: false,
    saveUninitialized: false
  }));

  // Add request validation middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    try {
      validateInput(req);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });
}
