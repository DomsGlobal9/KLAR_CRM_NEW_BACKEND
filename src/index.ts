import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "0.0.0.0"]);

import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {

});

const gracefulShutdown = () => {


    // cronService.stopAllJobs();

    server.close(() => {

        process.exit(0);
    });

    setTimeout(() => {

        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);