import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { envConfig, corsOptions } from './config';


const app = express();

/**
 * Global middleware
 */
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Use your custom CORS with logging already inside the origin function
app.use(cors(corsOptions));

// Optional: Add extra request logging for origin (in case of preflight or non-credential requests)
app.use((req, res, next) => {
  const origin = req.get('Origin') || req.get('origin') || 'no-origin';
  if (origin !== 'no-origin') {
    console.log(`Incoming request from origin: ${origin} | Method: ${req.method} | Path: ${req.path}`);
  }
  next();
});

/**
 * Routes (API included inside)
 */
app.use('/api/v1', routes);

/**
 * Health check
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: envConfig.NODE_ENV,
  });
});

export default app;