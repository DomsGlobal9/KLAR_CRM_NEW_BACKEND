import { envConfig } from './env.config';

export const imapConfig = {
    host: envConfig.IMAP_HOST,
    port: envConfig.IMAP_PORT,
    secure: envConfig.IMAP_SECURE,
    auth: {
        user: envConfig.IMAP_USER,
        pass: envConfig.IMAP_PASS,
    },
    logger: {
        debug: () => { }, 
        info: console.log,
        warn: console.warn,
        error: console.error,
    },
    socketTimeout: 60000,
    connectionTimeout: 60000,
};