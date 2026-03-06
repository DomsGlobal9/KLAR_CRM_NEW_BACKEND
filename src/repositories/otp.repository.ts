import { supabaseAdmin } from '../config';
import { OTP, CreateOTPPayload } from '../interfaces/otp.interface';
import { OTPGenerator } from '../utils';
import { envConfig } from '../config';

export const otpRepository = {
    /**
     * Create a new OTP record
     */
    async create(payload: CreateOTPPayload & { otp_code: string; expires_at: Date }): Promise<OTP> {
        const { data, error } = await supabaseAdmin
            .from('otps')
            .insert({
                email: payload.email.toLowerCase(),
                otp_code: payload.otp_code,
                type: payload.type,
                expires_at: payload.expires_at.toISOString(),
                verified: false,
                attempts: 0
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create OTP: ${error.message}`);
        return data;
    },

    /**
     * Find OTP by email and type
     */
    async findByEmailAndType(email: string, type: OTP['type']): Promise<OTP | null> {
        const { data, error } = await supabaseAdmin
            .from('otps')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('type', type)
            .eq('verified', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },

    /**
     * Verify OTP with configurable max attempts
     */
    async verify(email: string, otp_code: string, type: OTP['type']): Promise<OTP> {

        const otp = await this.findByEmailAndType(email, type);

        if (!otp) {
            throw new Error('OTP not found or already verified');
        }

        // Check if expired
        if (new Date() > new Date(otp.expires_at)) {
            throw new Error('OTP has expired');
        }

        // Check if too many attempts (using config)
        if (otp.attempts >= envConfig.OTP.MAX_VERIFICATION_ATTEMPTS) {
            throw new Error('Too many failed attempts. Please request a new OTP.');
        }

        // Check if OTP matches
        if (otp.otp_code !== otp_code.toUpperCase()) {
            await supabaseAdmin
                .from('otps')
                .update({ attempts: otp.attempts + 1 })
                .eq('id', otp.id);

            throw new Error('Invalid OTP code');
        }

        // Mark as verified
        const { data, error } = await supabaseAdmin
            .from('otps')
            .update({
                verified: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', otp.id)
            .select()
            .single();

        if (error) throw new Error(`Failed to verify OTP: ${error.message}`);
        return data;
    },

    /**
     * Delete OTP by ID
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('otps')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Clean up expired OTPs
     */
    async cleanupExpired(): Promise<void> {
        const { error } = await supabaseAdmin
            .from('otps')
            .delete()
            .lt('expires_at', new Date().toISOString());

        if (error) throw error;
    },

    /**
     * Delete all unverified OTPs for email and type
     */
    async deleteByEmailAndType(email: string, type: OTP['type']): Promise<void> {
        const { error } = await supabaseAdmin
            .from('otps')
            .delete()
            .eq('email', email.toLowerCase())
            .eq('type', type)
            .eq('verified', false);

        if (error) throw error;
    },

    /**
     * Check if user can request new OTP based on last request time
     */
    async canResendOTP(
        email: string,
        type: OTP['type'],
        cooldownSeconds: number = envConfig.OTP.RESEND_COOLDOWN_SECONDS
    ): Promise<{ canResend: boolean; waitTimeSeconds: number }> {
        const { data, error } = await supabaseAdmin
            .from('otps')
            .select('created_at')
            .eq('email', email.toLowerCase())
            .eq('type', type)
            .eq('verified', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data) {
            return { canResend: true, waitTimeSeconds: 0 };
        }

        const lastOTPTime = new Date(data.created_at).getTime();
        const currentTime = new Date().getTime();
        const timeDiffSeconds = Math.floor((currentTime - lastOTPTime) / 1000);

        if (timeDiffSeconds < cooldownSeconds) {
            const waitTime = cooldownSeconds - timeDiffSeconds;
            return { canResend: false, waitTimeSeconds: waitTime };
        }

        return { canResend: true, waitTimeSeconds: 0 };
    },

    /**
     * Get remaining time before can resend
     */
    async getResendCooldown(email: string, type: OTP['type']): Promise<number> {
        const { canResend, waitTimeSeconds } = await this.canResendOTP(email, type);
        return canResend ? 0 : waitTimeSeconds;
    },

    /**
     * Find recent OTP within minutes (for rate limiting)
     */
    async findRecentByEmail(email: string, type: OTP['type'], minutes: number): Promise<OTP | null> {
        const timeAgo = new Date();
        timeAgo.setMinutes(timeAgo.getMinutes() - minutes);

        const { data, error } = await supabaseAdmin
            .from('otps')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('type', type)
            .eq('verified', false)
            .gte('created_at', timeAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },

    /**
     * Resend OTP (invalidate old and create new) - kept for backward compatibility
     */
    async resend(email: string, type: OTP['type']): Promise<OTP> {
        await this.deleteByEmailAndType(email, type);

        const otp_code = OTPGenerator.generate(envConfig.OTP.LENGTH);
        const expires_at = OTPGenerator.getExpirationTime(envConfig.OTP.EXPIRY_MINUTES);

        return this.create({ email, type, otp_code, expires_at });
    }
};