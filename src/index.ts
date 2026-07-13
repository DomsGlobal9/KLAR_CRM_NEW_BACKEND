import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "0.0.0.0"]);

import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing gracefully...');

    // cronService.stopAllJobs();

    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);