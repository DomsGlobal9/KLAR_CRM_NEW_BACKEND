import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/cors.config';
import { validateEnv } from './config/env.config';
import emailRoutes from './routes/emailRoutes';

const app = express();

// Validate environment variables
try {
  validateEnv();
  console.log('✅ Environment variables validated successfully');
} catch (error: any) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS configuration
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api', emailRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Email Service API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/email/health',
      status: 'GET /api/email/status',
      send: 'POST /api/email/send',
      sendBulk: 'POST /api/email/send-bulk',
      sendTest: 'POST /api/email/send-test',
      validate: 'POST /api/email/validate',
    },
    documentation: 'See README.md for API documentation',
  });
});

// 404 handler
app.use('/', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

export default app;