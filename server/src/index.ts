import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { getDb } from './db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust localtunnel proxy headers
app.set('trust proxy', 1);

// Maximum Security: 1. Setup CORS policy (strictly limit origins or configure default safe origins)
app.use(cors({
  origin: '*', // For demo/development ease; in strict environments, lock this to the client's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
}));

// Maximum Security: 2. Configure security HTTP headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Required to allow download/image requests
}));

// Maximum Security: 3. Setup global rate limiter to prevent denial of service (DoS) and brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

// Specific stricter rate limiter for Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 1000, // Max 1000 attempts in development
  message: { error: 'Too many authentication attempts, please try again later' }
});

// JSON and URL-encoded payload size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload folders exist and serve static files securely
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Router Imports
import authRouter from './routes/auth';
import servicesRouter from './routes/services';
import documentsRouter from './routes/documents';
import messagesRouter from './routes/messages';
import adminRouter from './routes/admin';
import complianceRouter from './routes/compliance';

// API Routing
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/compliance', complianceRouter);

// Base route for connectivity checks
app.get('/health', (req, res) => {
   res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

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

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  PrimeFlow API Server started on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Support class declarations in this scope for multer errors check
import multer from 'multer';

startServer();
export default app;
