import express, {Application} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { envConfig, corsOptions, cronJobConfigs } from './config';
import { startEmailReaderJob } from './jobs/emailReader.job';
import cronService from './services';
import connectDB from './config/mongodbDatabase.config';

const app = express();

/**
 * Required for correct client IPs when running behind nginx, a load balancer,
 * or any reverse proxy. Without it every request appears to originate from the
 * proxy, which would make IP-based rate limiting a single shared bucket.
 *
 * Set TRUST_PROXY to the number of proxies in front of the app (usually 1), or
 * leave unset when the app is directly exposed.
 */
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(hops) ? process.env.TRUST_PROXY : hops);
}

app.use(helmet());
// app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.get('Origin') || req.get('origin') || 'no-origin';
  next();
});

app.use('/api/v1', apiLimiter, routes);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: envConfig.NODE_ENV,
  });
});

if (envConfig.NODE_ENV !== 'test') {
  
}

app.get('/api/v1/cron/status', (_req, res) => {
  const activeJobs = cronJobConfigs
    .filter(config => cronService.getJobStatus(config.name))
    .map(config => ({
      name: config.name,
      schedule: config.schedule,
      description: config.description,
      enabled: config.enabled
    }));

  res.json({
    activeJobs,
    totalJobs: cronJobConfigs.length,
    environment: envConfig.NODE_ENV
  });
});

connectDB();

export default app;