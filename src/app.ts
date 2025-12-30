import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes';
import { envConfig } from './config';

const app = express();

/**
 * Global middleware
 */
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

/**
 * Routes (API included inside)
 */
app.use('/api/v1', routes);

/**
 * Health check (infra-level)
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: envConfig.NODE_ENV,
  });
});

export default app;
