import dotenv from 'dotenv';
import app from './app';
import cronService from './services';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

/**
 * Graceful shutdown
 */
const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing gracefully...');

    /**
     * Stop all cron jobs first
     */
    cronService.stopAllJobs();

    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });

    /**
     * Force close after 10 seconds
     */
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);