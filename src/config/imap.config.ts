import { envConfig } from "./env.config";

export const imapConfig = {
  host: envConfig.IMAP_HOST,
  port: envConfig.IMAP_PORT,
  secure: envConfig.IMAP_SECURE,

  auth: {
    user: envConfig.IMAP_USER,
    pass: envConfig.IMAP_PASS,
  },

  socketTimeout: 300000, 

  keepAlive: {
    interval: 15000,
    idleInterval: 300000,
    forceNoop: true,
  },
};