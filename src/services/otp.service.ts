import { OTP, CreateOTPPayload, VerifyOTPPayload } from '../interfaces';
import { otpRepository } from '../repositories';
import { OTPGenerator } from '../utils';
import { emailService, SendEmailPayload } from '../services';
import { generateOTPEmailTemplate, getOTPEmailSubject } from '../helpers';

export const otpService = {
    /**
     * Generate and send OTP for registration
     */
    async sendRegistrationOTP(email: string): Promise<{ success: boolean; message: string }> {
        try {

            const otp_code = OTPGenerator.generate();
            const expires_at = OTPGenerator.getExpirationTime();

            

            // Clean up old OTPs
            await otpRepository.cleanupExpired();

            // Create OTP record
            await otpRepository.create({
                email,
                type: 'registration',
                otp_code,
                expires_at
            });

            // Send email using your EmailService
            const emailPayload: SendEmailPayload = {
                to: email,
                subject: 'Your Registration Verification Code',
                html: generateOTPEmailTemplate(otp_code),
                requireNewLead: false
            };

            const emailResult = await emailService.sendEmail(emailPayload);

            if (!emailResult.success) {
                throw new Error(`Failed to send OTP email: ${emailResult.error}`);
            }

            return {
                success: true,
                message: 'OTP sent successfully to your email'
            };
        } catch (error: any) {
            console.error('Error sending registration OTP:', error);
            throw new Error(`Failed to send OTP: ${error.message}`);
        }
    },

    /**
     * Verify registration OTP
     */
    async verifyRegistrationOTP(email: string, otp_code: string): Promise<boolean> {
        try {
            const otp = await otpRepository.verify(email, otp_code, 'registration');
            return otp.verified;
        } catch (error: any) {
            throw new Error(`OTP verification failed: ${error.message}`);
        }
    },

    /**
     * Resend OTP
     */
    async resendOTP(email: string, type: OTP['type']): Promise<{ success: boolean; message: string }> {
        try {
            // Resend OTP
            const otp = await otpRepository.resend(email, type);

            // Send email using your EmailService
            const emailPayload: SendEmailPayload = {
                to: email,
                subject: getOTPEmailSubject(type),
                html: generateOTPEmailTemplate(otp.otp_code, type),
                requireNewLead: false
            };

            const emailResult = await emailService.sendEmail(emailPayload);

            if (!emailResult.success) {
                throw new Error(`Failed to resend OTP email: ${emailResult.error}`);
            }

            return {
                success: true,
                message: 'OTP resent successfully'
            };
        } catch (error: any) {
            console.error('Error resending OTP:', error);
            throw new Error(`Failed to resend OTP: ${error.message}`);
        }
    },

    /**
     * Validate OTP without marking as verified
     */
    async validateOTP(email: string, otp_code: string, type: OTP['type']): Promise<boolean> {
        const otp = await otpRepository.findByEmailAndType(email, type);

        if (!otp) return false;
        if (otp.verified) return false;
        if (OTPGenerator.isExpired(otp.expires_at)) return false;
        if (otp.attempts >= 5) return false;

        return otp.otp_code === otp_code.toUpperCase();
    },

    /**
     * Check if user has pending OTP
     */
    async hasPendingOTP(email: string, type: OTP['type']): Promise<boolean> {
        const otp = await otpRepository.findByEmailAndType(email, type);
        if (!otp) return false;
        return !OTPGenerator.isExpired(otp.expires_at) && otp.attempts < 5;
    },

    /**
     * Send password reset OTP
     */
    async sendPasswordResetOTP(email: string): Promise<{ success: boolean; message: string }> {
        try {
            // Generate OTP
            const otp_code = OTPGenerator.generate();
            const expires_at = OTPGenerator.getExpirationTime();

            // Clean up old OTPs
            await otpRepository.cleanupExpired();

            // Create OTP record
            await otpRepository.create({
                email,
                type: 'password_reset',
                otp_code,
                expires_at
            });

            // Send email
            const emailPayload: SendEmailPayload = {
                to: email,
                subject: getOTPEmailSubject('password_reset'),
                html: generateOTPEmailTemplate(otp_code, 'password_reset'),
                requireNewLead: false
            };

            const emailResult = await emailService.sendEmail(emailPayload);

            if (!emailResult.success) {
                throw new Error(`Failed to send password reset OTP email: ${emailResult.error}`);
            }

            return {
                success: true,
                message: 'Password reset OTP sent successfully'
            };
        } catch (error: any) {
            console.error('Error sending password reset OTP:', error);
            throw new Error(`Failed to send password reset OTP: ${error.message}`);
        }
    },

    /**
     * Verify password reset OTP
     */
    async verifyPasswordResetOTP(email: string, otp_code: string): Promise<boolean> {
        try {
            const otp = await otpRepository.verify(email, otp_code, 'password_reset');
            return otp.verified;
        } catch (error: any) {
            throw new Error(`Password reset OTP verification failed: ${error.message}`);
        }
    }
};