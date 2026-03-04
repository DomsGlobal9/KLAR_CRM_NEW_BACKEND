// config/twilio.config.ts
import { Twilio } from 'twilio';
import { envConfig } from './index';

// Initialize Twilio client
export const twilioClient = new Twilio(
    envConfig.TWILIO_ACCOUNT_SID,
    envConfig.TWILIO_AUTH_TOKEN
);

export const twilioVerifyServiceSid = envConfig.TWILIO_VERIFY_SERVICE_SID;

