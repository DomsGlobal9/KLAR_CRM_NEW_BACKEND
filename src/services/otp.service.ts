import { otpRepository } from '../repositories';
import { OTPGenerator } from '../utils';
import { emailService, SendEmailPayload } from '../services';
import { generateOTPEmailTemplate } from '../helpers';
import { envConfig, isDevelopment, supabaseAdmin } from '../config';

export const otpService = {
    /**
     * Send OTP (used for both registration and login)
     */
    async sendOTP(email: string, type: 'registration' | 'login'): Promise<{ success: boolean; message: string }> {
        try {
            email = email.toLowerCase();

            // Development mode bypass
            if (isDevelopment() && envConfig.OTP.BYPASS_IN_DEV) {
                console.log(`🧪 DEV OTP for ${email} (${type}): ${envConfig.OTP.DEV_STATIC_CODE}`);
                return {
                    success: true,
                    message: 'OTP sent (development mode)',
                };
            }

            const existing = await otpRepository.findByEmailAndType(email, type);

            if (existing && !OTPGenerator.isExpired(existing.expires_at)) {
                throw new Error('OTP already sent. Please check your email or wait.');
            }

            await otpRepository.cleanupExpired();

            const otp_code = OTPGenerator.generate(envConfig.OTP.LENGTH);
            const expires_at = OTPGenerator.getExpirationTime(envConfig.OTP.EXPIRY_MINUTES);

            console.log(`OTP for ${email} (${type}): ${otp_code}`);

            const isOtpStored = await otpRepository.create({
                email,
                type,
                otp_code,
                expires_at
            });
            if (!isOtpStored) {
                throw new Error('Failed to store OTP');
            }

            // Send email
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
     * Resend OTP with rate limiting
     */
    async resendOTP(email: string, type: 'registration' | 'login'): Promise<{
        success: boolean;
        message: string;
        waitTimeSeconds?: number;
        remainingAttempts?: number;
    }> {
        try {
            email = email.toLowerCase();

            // Development mode bypass
            if (isDevelopment() && envConfig.OTP.BYPASS_IN_DEV) {
                console.log(`🧪 DEV Resend OTP for ${email} (${type}): ${envConfig.OTP.DEV_STATIC_CODE}`);
                return {
                    success: true,
                    message: 'OTP resent (development mode)',
                };
            }

            const cooldownCheck = await otpRepository.canResendOTP(
                email,
                type,
                envConfig.OTP.RESEND_COOLDOWN_SECONDS
            );

            if (!cooldownCheck.canResend) {
                return {
                    success: false,
                    message: `Please wait ${cooldownCheck.waitTimeSeconds} seconds before requesting another OTP`,
                    waitTimeSeconds: cooldownCheck.waitTimeSeconds
                };
            }

            const resendCount = await this.countRecentResends(email, type, envConfig.OTP.RESEND_WINDOW_MINUTES);
            if (resendCount >= envConfig.OTP.MAX_RESEND_ATTEMPTS) {
                return {
                    success: false,
                    message: `Maximum resend attempts reached. Please try again after ${envConfig.OTP.RESEND_WINDOW_MINUTES} minutes.`,
                    remainingAttempts: 0
                };
            }

            await otpRepository.cleanupExpired();

            await otpRepository.deleteByEmailAndType(email, type);

            const otp_code = OTPGenerator.generate(envConfig.OTP.LENGTH);

            const expires_at = OTPGenerator.getExpirationTime(envConfig.OTP.EXPIRY_MINUTES);

            const isOtpStored = await otpRepository.create({
                email,
                type,
                otp_code,
                expires_at
            });

            if (!isOtpStored) {
                throw new Error("Failed to store otp at resend otp");
            }

            // Send email
            const emailPayload: SendEmailPayload = {
                to: email,
                subject: type === 'registration'
                    ? 'Your New Registration Verification Code'
                    : 'Your New Login Verification Code',
                html: generateOTPEmailTemplate(otp_code, type),
                requireNewLead: false
            };

            const emailResult = await emailService.sendEmail(emailPayload);
            if (!emailResult.success) {
                throw new Error('Failed to send email');
            }

            return {
                success: true,
                message: 'OTP resent successfully',
                remainingAttempts: envConfig.OTP.MAX_RESEND_ATTEMPTS - (resendCount + 1)
            };
        } catch (error: any) {
            throw new Error(error.message || 'Failed to resend OTP');
        }
    },


    /**
     * Verify OTP
     */
    async verifyOTP(email: string, otp_code: string, type: 'registration' | 'login'): Promise<boolean> {
        try {
            // Development mode bypass
            if (isDevelopment() && envConfig.OTP.BYPASS_IN_DEV) {
                return otp_code === envConfig.OTP.DEV_STATIC_CODE;
            }

            const otp = await otpRepository.verify(email.toLowerCase(), otp_code, type);
            return otp.verified;
        } catch (error: any) {
            throw new Error(error.message || 'Invalid or expired OTP');
        }
    },


    /**
     * Count recent resend attempts
     */
    async countRecentResends(email: string, type: string, minutes: number): Promise<number> {
        const timeAgo = new Date();
        timeAgo.setMinutes(timeAgo.getMinutes() - minutes);

        const { count, error } = await supabaseAdmin
            .from('otps')
            .select('*', { count: 'exact', head: true })
            .eq('email', email.toLowerCase())
            .eq('type', type)
            .eq('verified', false)
            .gte('created_at', timeAgo.toISOString());

        if (error) throw error;
        return count || 0;
    }
};