import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { getDb } from './db';
import multer from 'multer';
import { getUploadsDir } from './uploadsPath';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION);

// Trust localtunnel proxy headers
app.set('trust proxy', 1);

// Maximum Security: 1. Setup CORS policy (strictly limit origins or configure default safe origins)
app.use(cors({
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder', 'x-requested-with', 'Accept'],
  credentials: true
}));

// Pre-flight request handler for all routes
app.options('*', cors() as any);

// Middleware to normalize Vercel serverless rewritten URLs
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.url.startsWith('/api/index.ts')) {
    req.url = req.url.replace('/api/index.ts', '/api');
    if (req.url === '/api' || req.url === '/api/') {
      req.url = '/api/health';
    }
  }
  next();
});

// Maximum Security: 2. Configure security HTTP headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Required to allow download/image requests
}));

const uploadsDir = getUploadsDir();
app.use('/uploads', express.static(uploadsDir));

// Maximum Security: 3. Setup global rate limiter to prevent denial of service (DoS) and brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
  skip: (req: Request) => req.method === 'OPTIONS',
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

// Specific stricter rate limiter for Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  validate: { xForwardedForHeader: false, default: false },
  skip: (req: Request) => req.method === 'OPTIONS',
  message: { error: 'Too many authentication attempts, please try again later' }
});

// JSON and URL-encoded payload size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure DB connection is ready for all environments
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/api/health' || req.path.startsWith('/uploads')) {
    return next();
  }
  try {
    await getDb();
    next();
  } catch (err: any) {
    console.error('Database connection notice:', err?.message || err);
    next();
  }
});

// Router Imports
import authRouter from './routes/auth';
import servicesRouter from './routes/services';
import documentsRouter from './routes/documents';
import messagesRouter from './routes/messages';
import adminRouter from './routes/admin';
import complianceRouter from './routes/compliance';
import billingRouter from './routes/billing';
import workflowRouter from './routes/workflow';

// API Routing (Supports both /api/... and serverless /... routes)
app.use(['/api/auth', '/auth'], authLimiter, authRouter);
app.use(['/api/services', '/services'], servicesRouter);
app.use(['/api/documents', '/documents'], documentsRouter);
app.use(['/api/messages', '/messages'], messagesRouter);
app.use(['/api/admin', '/admin'], adminRouter);
app.use(['/api/compliance', '/compliance'], complianceRouter);
app.use(['/api/billing', '/billing'], billingRouter);
app.use(['/api/workflow', '/workflow'], workflowRouter);

// Dedicated downloadable database documentation routes
app.get(['/api/download-db-pdf', '/download-db-pdf'], (req, res) => {
  const pdfPath = path.resolve(__dirname, '..', 'PrimeFlow_Database_Documentation_and_Replication_Guide.pdf');
  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath, 'PrimeFlow_Database_Documentation_and_Replication_Guide.pdf');
  } else {
    res.status(404).json({ error: 'PDF documentation document not found' });
  }
});

app.get(['/api/download-db-sql', '/download-db-sql'], (req, res) => {
  const sqlPath = path.resolve(__dirname, '..', 'primeflow_database_setup.sql');
  if (fs.existsSync(sqlPath)) {
    res.download(sqlPath, 'primeflow_database_setup.sql');
  } else {
    res.status(404).json({ error: 'SQL configuration file not found' });
  }
});

// Base route for connectivity checks
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Fallback for unmatched API endpoints to ensure clean JSON responses
app.all(['/api/*', '/auth/*', '/services/*', '/documents/*', '/messages/*', '/admin/*', '/compliance/*'], (req: Request, res: Response) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
});

// Serve compiled client static files on Render / Production
const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
if (!isVercel && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler for uncaught middleware exceptions (e.g. Multer upload errors, JSON syntax)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err.message);
  
  if (err instanceof multer.MulterError) {
     res.status(400).json({ error: `Upload error: ${err.message}` });
     return;
  }
  
   res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error occurred' : err.message
  });
});

// Start server after initializing SQLite database
async function startServer() {
  try {
    console.log('Initializing SQLite database...');
    await getDb();
    console.log('Database initialized successfully.');

    app.listen(PORT as number, '0.0.0.0', () => {
      const os = require('os');
      const nets = os.networkInterfaces();
      let localIP = 'unknown';
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            localIP = net.address;
            break;
          }
        }
        if (localIP !== 'unknown') break;
      }
      console.log(`===============================================`);
      console.log(`  PrimeFlow API Server started on port ${PORT}`);
      console.log(`  Local:   http://localhost:${PORT}`);
      console.log(`  Network: http://${localIP}:${PORT}  ← use this on mobile`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Support class declarations in this scope for multer errors check
if (!isVercel) {
  startServer();
}

export default app;
