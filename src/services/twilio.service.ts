// services/twilio.service.ts
import { twilioClient, twilioVerifyServiceSid } from '../config/twilio.config';
import { isDevelopment } from '../config';

const DEV_STATIC_OTP = '123456';

export const twilioService = {
    /**
     * Send OTP via SMS using Twilio Verify API (recommended)
     * This handles OTP generation and verification automatically
     */
    async sendOTPviaVerify(phoneNumber: string): Promise<{ success: boolean; message: string }> {
        try {
            // Format phone number to E.164 format (e.g., +1234567890)
            const formattedPhone = this.formatPhoneNumber(phoneNumber);

            if (isDevelopment()) {
                console.log(`🧪 DEV MODE: SMS OTP for ${formattedPhone}: ${DEV_STATIC_OTP}`);
                return {
                    success: true,
                    message: 'OTP sent successfully',
                };
            }

            // Use Twilio Verify API
            const verification = await twilioClient.verify.v2
                .services(twilioVerifyServiceSid)
                .verifications.create({
                    to: formattedPhone,
                    channel: 'sms'
                });

            console.log(`Twilio verification sent: ${verification.sid}`);
            
            return {
                success: true,
                message: 'OTP sent via SMS'
            };
        } catch (error: any) {
            console.error('Twilio SMS error:', error);
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    },

    /**
     * Verify OTP received via SMS
     */
    async verifyOTPviaVerify(phoneNumber: string, code: string): Promise<boolean> {
        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);

            if (isDevelopment()) {
                return code === DEV_STATIC_OTP;
            }

            const verificationCheck = await twilioClient.verify.v2
                .services(twilioVerifyServiceSid)
                .verificationChecks.create({
                    to: formattedPhone,
                    code: code
                });

            return verificationCheck.status === 'approved';
        } catch (error: any) {
            console.error('Twilio verification error:', error);
            return false;
        }
    },

    /**
     * Alternative: Send OTP directly (without Verify API)
     * You generate OTP, Twilio just sends it
     */
    async sendDirectSMS(phoneNumber: string, otpCode: string): Promise<boolean> {
        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            await twilioClient.messages.create({
                body: `Your verification code is: ${otpCode}. Valid for 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
                to: formattedPhone
            });
            
            return true;
        } catch (error) {
            console.error('Direct SMS error:', error);
            return false;
        }
    },

    /**
     * Format phone number to E.164 format
     */
    formatPhoneNumber(phoneNumber: string): string {
        // Remove all non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // Ensure it starts with '+'
        if (!phoneNumber.startsWith('+')) {
            // Assuming default country code (e.g., +1 for US)
            // You might want to make this configurable
            return `+1${cleaned}`;
        }
        return phoneNumber;
    },

    /**
     * Resend OTP (Verify API handles this automatically)
     */
    async resendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
        // Just call send again - Twilio will handle rate limiting
        return this.sendOTPviaVerify(phoneNumber);
    }
};