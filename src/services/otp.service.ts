import { otpRepository } from '../repositories';
import { OTPGenerator } from '../utils';
import { emailService, SendEmailPayload } from '../services';
import { generateOTPEmailTemplate } from '../helpers';
import { envConfig, isDevelopment, supabaseAdmin } from '../config';

export const otpService = {
    /**
     * Send OTP (used for both registration and login)
     * For login: Always allows new OTP (invalidates old ones)
     * For registration: Blocks if unexpired OTP exists (to prevent spam)
     */
    async sendOTP(email: string, type: 'registration' | 'login' | 'password_reset'): Promise<{ success: boolean; message: string }> {
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

            // Check for existing OTPs
            const existing = await otpRepository.findByEmailAndType(email, type);

            // Different behavior based on type
            if (type === 'registration') {
                // For registration: Block if unexpired OTP exists
                if (existing && !OTPGenerator.isExpired(existing.expires_at)) {
                    throw new Error('OTP already sent. Please check your email or wait.');
                }
            } else {
                // For login: Always allow new OTP, but clean up old ones first
                if (existing) {
                    console.log(`🧹 Cleaning up existing OTP for ${email} (new login device request)`);
                    await otpRepository.deleteByEmailAndType(email, type);
                }
            }

            // Clean up expired OTPs (maintenance)
            await otpRepository.cleanupExpired();

            // Generate and store new OTP
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

            // Add a note in response for login type
            const message = type === 'login' && existing
                ? 'New OTP sent successfully (previous OTP invalidated)'
                : 'OTP sent successfully';

            return { success: true, message };
        } catch (error: any) {
            throw new Error(error.message || 'Failed to resend OTP');
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

            // Rate limiting checks (apply to both types)
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

            // Clean up and generate new OTP
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
    async verifyOTP(email: string, otp_code: string, type: 'registration' | 'login' | 'password_reset'): Promise<boolean> {
        try {
            // Development mode bypass
            if (isDevelopment() && envConfig.OTP.BYPASS_IN_DEV) {
                return otp_code === envConfig.OTP.DEV_STATIC_CODE;
            }

            const otp = await otpRepository.verify(email.toLowerCase(), otp_code, type);

            // After successful verification, clean up used OTP
            if (otp.verified) {
                await otpRepository.deleteByEmailAndType(email, type);
            }

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
    },

    /**
     * New method: Force send new OTP (useful for device switching)
     */
    async forceSendNewOTP(email: string, type: 'registration' | 'login'): Promise<{ success: boolean; message: string }> {
        try {
            email = email.toLowerCase();

            // Delete any existing OTPs
            await otpRepository.deleteByEmailAndType(email, type);

            // Generate and send new OTP
            const otp_code = OTPGenerator.generate(envConfig.OTP.LENGTH);
            const expires_at = OTPGenerator.getExpirationTime(envConfig.OTP.EXPIRY_MINUTES);

            await otpRepository.create({
                email,
                type,
                otp_code,
                expires_at
            });

            // Send email
            const emailPayload: SendEmailPayload = {
                to: email,
                subject: type === 'registration'
                    ? 'Your New Registration Verification Code'
                    : 'Your New Login Verification Code',
                html: generateOTPEmailTemplate(otp_code, type),
                requireNewLead: false
            };

            await emailService.sendEmail(emailPayload);

            return {
                success: true,
                message: 'New OTP sent successfully. Previous OTP has been invalidated.'
            };
        } catch (error: any) {
            throw new Error(error.message || 'Failed to send new OTP');
        }
    }

};