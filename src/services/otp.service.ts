import { otpRepository } from '../repositories';
import { OTPGenerator } from '../utils';
import { emailService, SendEmailPayload } from '../services';
import { generateOTPEmailTemplate } from '../helpers';
import { envConfig, isDevelopment } from '../config';
import { twilioService } from '../services/twilio.service';


export type OTPChannel = 'email' | 'sms';
const DEV_STATIC_OTP = '123456';

export const otpService = {
    /**
     * Send OTP (used for both registration and login)
     */

    async sendOTP(
        identifier: string,
        type: 'registration' | 'login' | 'password_reset',
        channel: OTPChannel = 'email'
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Normalize identifier based on channel
            const normalizedIdentifier = channel === 'email'
                ? identifier.toLowerCase()
                : twilioService.formatPhoneNumber(identifier);

            // DEVELOPMENT MODE
            if (isDevelopment()) {
                console.log(`🧪 DEV OTP for ${normalizedIdentifier} (${type} via ${channel}): ${DEV_STATIC_OTP}`);
                return {
                    success: true,
                    message: `OTP sent via ${channel} (development mode)`,
                };
            }

            // Check for existing active OTP
            const existing = await otpRepository.findActiveOTP(normalizedIdentifier, type, channel);
            if (existing && !OTPGenerator.isExpired(existing.expires_at)) {
                throw new Error(`OTP already sent. Please check your ${channel} or wait.`);
            }

            // Clean up expired OTPs
            await otpRepository.cleanupExpired();

            // Generate OTP
            const otp_code = OTPGenerator.generate();
            const expires_at = OTPGenerator.getExpirationTime();

            console.log(`OTP for ${normalizedIdentifier} (${type} via ${channel}): ${otp_code}`);

            // Save to database
            await otpRepository.create({
                identifier: normalizedIdentifier,
                type,
                channel,
                otp_code,
                expires_at
            });

            // Send via appropriate channel
            if (channel === 'email') {
                await this.sendEmailOTP(normalizedIdentifier, otp_code, type);
            } else {
                await this.sendSMSOTP(normalizedIdentifier, otp_code);
            }

            return { success: true, message: `OTP sent successfully via ${channel}` };

        } catch (error: any) {
            throw new Error(error.message || `Failed to send OTP via ${channel}`);
        }
    },

    /**
   * Send OTP via email
   */
    async sendEmailOTP(email: string, otp_code: string, type: 'registration' | 'login' | 'password_reset'): Promise<void> {
        let subject: string;
        let html: string;

        switch (type) {
            case 'registration':
                subject = 'Your Registration Verification Code';
                html = generateOTPEmailTemplate(otp_code, type);
                break;
            case 'login':
                subject = 'Your Login Verification Code';
                html = generateOTPEmailTemplate(otp_code, type);
                break;
            case 'password_reset':
                subject = 'Password Reset Verification Code';
                html = generateOTPEmailTemplate(otp_code, type); // Use specific template for password reset
                break;
        }

        const emailPayload: SendEmailPayload = {
            to: email,
            subject,
            html,
            requireNewLead: false
        };

        const emailResult = await emailService.sendEmail(emailPayload);
        if (!emailResult.success) {
            throw new Error('Failed to send email');
        }
    },


    /**
  * Send OTP via SMS using Twilio
  */
    async sendSMSOTP(phoneNumber: string, otp_code: string): Promise<void> {
        try {
            // Using direct SMS (you generate OTP, Twilio sends it)
            const sent = await twilioService.sendDirectSMS(phoneNumber, otp_code);

            if (!sent) {
                throw new Error('Failed to send SMS');
            }

            // Alternative: Use Twilio Verify API (uncomment if you prefer)
            // await twilioService.sendOTPviaVerify(phoneNumber);

        } catch (error: any) {
            throw new Error(`SMS delivery failed: ${error.message}`);
        }
    },


    /**
   * Verify OTP
   */
    async verifyOTP(
        identifier: string,
        otp_code: string,
        type: 'registration' | 'login' | 'password_reset',
        channel?: OTPChannel
    ): Promise<boolean> {
        try {
            // Determine channel if not provided (based on identifier format)
            if (!channel) {
                channel = identifier.includes('@') ? 'email' : 'sms';
            }

            // Normalize identifier
            const normalizedIdentifier = channel === 'email'
                ? identifier.toLowerCase()
                : twilioService.formatPhoneNumber(identifier);

            // DEVELOPMENT MODE
            if (isDevelopment()) {
                return otp_code === DEV_STATIC_OTP;
            }

            // For SMS, we could use Twilio Verify API
            if (channel === 'sms') {
                // Option 1: Using Twilio Verify (recommended if you use Verify API)
                // return await twilioService.verifyOTPviaVerify(normalizedIdentifier, otp_code);

                // Option 2: Using database (if using direct SMS)
                const otp = await otpRepository.verify(normalizedIdentifier, otp_code, type, channel);

                if (otp.verified) {
                    await otpRepository.markAsVerified(normalizedIdentifier, type, channel);
                }

                return otp.verified;
            }

            // For email, use database verification
            const otp = await otpRepository.verify(normalizedIdentifier, otp_code, type, 'email');

            if (otp.verified) {
                await otpRepository.markAsVerified(normalizedIdentifier, type, 'email');
            }

            return otp.verified;

        } catch (error: any) {
            throw new Error(error.message || 'Invalid or expired OTP');
        }
    },



    /**
    * Verify OTP and return success with additional context for password reset
    */
    async verifyOTPForPasswordReset(
        identifier: string,
        otp_code: string,
        channel?: OTPChannel
    ): Promise<{
        success: boolean;
        resetToken?: string;
        message: string
    }> {
        try {
            const isValid = await this.verifyOTP(identifier, otp_code, 'password_reset', channel);

            if (!isValid) {
                return {
                    success: false,
                    message: 'Invalid or expired OTP'
                };
            }

            // Generate a temporary reset token (optional but more secure)
            const resetToken = OTPGenerator.generateTemporaryToken();

            // Store reset token in database or cache with short expiry
            await otpRepository.storeResetToken(identifier, resetToken);

            return {
                success: true,
                resetToken,
                message: 'OTP verified successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Verification failed'
            };
        }
    },


    /**
         * Resend OTP
         */
    async resendOTP(
        identifier: string,
        type: 'registration' | 'login' | 'password_reset',
        channel: OTPChannel = 'email'
    ): Promise<{ success: boolean; message: string }> {
        const normalizedIdentifier = channel === 'email'
            ? identifier.toLowerCase()
            : twilioService.formatPhoneNumber(identifier);

        // Delete existing unverified OTPs so sendOTP doesn't throw "already sent" error
        await otpRepository.deleteByIdentifierAndType(normalizedIdentifier, type, channel);

        return this.sendOTP(identifier, type, channel);
    }

};