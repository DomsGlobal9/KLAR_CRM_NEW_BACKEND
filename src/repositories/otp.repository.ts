import { supabaseAdmin } from '../config';
import { OTP, CreateOTPPayload } from '../interfaces/otp.interface';

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
     * Verify OTP
     */
    async verify(email: string, otp_code: string, type: OTP['type']): Promise<OTP> {
        
        // First find the OTP
        const otp = await this.findByEmailAndType(email, type);

        if (!otp) {
            throw new Error('OTP not found or already verified');
        }

        // Check if expired
        if (new Date() > new Date(otp.expires_at)) {
            throw new Error('OTP has expired');
        }

        // Check if too many attempts
        if (otp.attempts >= 5) {
            throw new Error('Too many failed attempts. Please request a new OTP.');
        }

        // Check if OTP matches
        if (otp.otp_code !== otp_code.toUpperCase()) {
            
            // Increment attempts
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
     * Resend OTP (invalidate old and create new)
     */
    async resend(email: string, type: OTP['type']): Promise<OTP> {
        
        // Delete any existing unverified OTPs for this email
        await supabaseAdmin
            .from('otps')
            .delete()
            .eq('email', email.toLowerCase())
            .eq('type', type)
            .eq('verified', false);

        // Create new OTP
        const otp_code = require('../utils/otp.generator').OTPGenerator.generate();
        const expires_at = require('../utils/otp.generator').OTPGenerator.getExpirationTime();

        return this.create({ email, type, otp_code, expires_at });
    }
};