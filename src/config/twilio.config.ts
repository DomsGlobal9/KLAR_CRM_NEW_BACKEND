// config/twilio.config.ts
import { Twilio } from 'twilio';
import { envConfig } from './index';

// Initialize Twilio client
export const twilioClient = new Twilio(
    envConfig.TWILIO_ACCOUNT_SID,
    envConfig.TWILIO_AUTH_TOKEN
);

export const twilioVerifyServiceSid = envConfig.TWILIO_VERIFY_SERVICE_SID;

// Add to your .env file:
// TWILIO_ACCOUNT_SID=your_account_sid
// TWILIO_AUTH_TOKEN=your_auth_token
// TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
// TWILIO_PHONE_NUMBER=+1234567890 (optional - for direct SMS)