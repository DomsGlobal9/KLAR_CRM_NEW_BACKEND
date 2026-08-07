import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "0.0.0.0"]);

import dotenv from 'dotenv';
import app from './app';
import { registerProcessHandlers } from './lifecycle';
import { client as postgresClient } from './db/drizzle';
import { closeDB } from './config/mongodbDatabase.config';
import { closeBrowser } from './services/pdf-browser.service';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    const instance = process.env.NODE_APP_INSTANCE;

    console.log(
        `[startup] listening on ${PORT}` +
        ` (pid ${process.pid}${instance !== undefined ? `, instance ${instance}` : ''})`
    );
});

/**
 * Wire signal handling, crash handling, and ordered resource cleanup.
 *
 * Replaces the previous gracefulShutdown(), whose body was empty — it closed
 * the HTTP server but released no database, Mongo, or Chromium handles, and
 * there was no uncaughtException or unhandledRejection handler at all.
 */
registerProcessHandlers({
    closeServer: () =>
        new Promise<void>((resolve, reject) => {
            server.close(err => (err ? reject(err) : resolve()));
        }),

    closeBrowser,

    closePostgres: () => postgresClient.end({ timeout: 5 }),

    closeMongo: closeDB,
});
