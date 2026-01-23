import { otpRepository } from '../repositories';
import { OTPGenerator } from '../utils';
import { emailService, SendEmailPayload } from '../services';
import { generateOTPEmailTemplate } from '../helpers';
import { envConfig, isDevelopment } from '../config';

const DEV_STATIC_OTP = '123456';

export const otpService = {
    /**
     * Send OTP (used for both registration and login)
     */
    async sendOTP(email: string, type: 'registration' | 'login'): Promise<{ success: boolean; message: string }> {
        try {
            email = email.toLowerCase();

            // if (isDevelopment()) {
            //     console.log(`🧪 DEV OTP for ${email} (${type}): ${DEV_STATIC_OTP}`);
            //     return {
            //         success: true,
            //         message: 'OTP sent (development mode)',
            //     };
            // }


            const existing = await otpRepository.findByEmailAndType(email, type);
            if (existing && !OTPGenerator.isExpired(existing.expires_at)) {
                throw new Error('OTP already sent. Please check your email or wait.');
            }


            await otpRepository.cleanupExpired();

            const otp_code = OTPGenerator.generate();
            const expires_at = OTPGenerator.getExpirationTime();

            console.log(`OTP for ${email} (${type}): ${otp_code}`);

            await otpRepository.create({
                email,
                type,
                otp_code,
                expires_at
            });

            const emailPayload: SendEmailPayload = {
                to: email,
                subject: type === 'registration'
                    ? 'Your Registration Verification Code'
                    : 'Your Login Verification Code',
                html: generateOTPEmailTemplate(otp_code, type),
                requireNewLead: false
            };

            const emailResult = await emailService.sendEmail(emailPayload);
            if (!emailResult.success) {
                throw new Error('Failed to send email');
            }

            return { success: true, message: 'OTP sent successfully' };
        } catch (error: any) {
            throw new Error(error.message || 'Failed to send OTP');
        }
    },

    /**
     * Verify OTP
     */
    async verifyOTP(email: string, otp_code: string, type: 'registration' | 'login'): Promise<boolean> {
        try {

            /**
             * 🧪 DEVELOPMENT MODE → Static OTP
             */
            // if (isDevelopment()) {
            //     return otp_code === DEV_STATIC_OTP;
            // }
            const otp = await otpRepository.verify(email.toLowerCase(), otp_code, type);
            return otp.verified;
        } catch (error: any) {
            throw new Error(error.message || 'Invalid or expired OTP');
        }
    },

    /**
     * Resend OTP (convenience wrapper)
     */
    async resendOTP(email: string, type: 'registration' | 'login'): Promise<{ success: boolean; message: string }> {
        await otpRepository.resend(email.toLowerCase(), type);
        return this.sendOTP(email, type);
    }
};