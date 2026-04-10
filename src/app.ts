import express, {Application} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { envConfig, corsOptions, cronJobConfigs } from './config';
import { emailReaderService } from './services/emailReader.service';
import cronService from './services';
// import connectDB from './config/mongodbDatabase.config';
import { connectFlightDB, connectAuthDB } from './config/mongodbDatabase.config';


const app = express();

/**
 * Global middleware
 */
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(cors(corsOptions));


app.use((req, res, next) => {
  const origin = req.get('Origin') || req.get('origin') || 'no-origin';
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

/**
 * Initialize cron jobs
 * This will start automatically when the app loads
 */
if (envConfig.NODE_ENV !== 'test') {
  // cronService.initializeJobs();
}

/**
 * Added a route to manage cron jobs (for admin purposes)
 */
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


/**
 * Start Email Reader Polling
 */
if (envConfig.NODE_ENV !== 'test') {

  const POLL_INTERVAL = 30000;

  const pollEmails = async () => {
    try {
      await emailReaderService.readEmails();
    } catch (error) {
      console.error('❌ Email polling error:', error);
    } finally {
      setTimeout(pollEmails, POLL_INTERVAL);
    }
  };
  pollEmails();

  console.log(`📥 Email polling started (every ${POLL_INTERVAL / 1000} sec)`);
}

// connectDB()
connectFlightDB();
connectAuthDB()

export default app;