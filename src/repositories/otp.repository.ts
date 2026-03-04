import { supabaseAdmin } from '../config';
import { OTP } from '../interfaces/otp.interface';
import { OTPGenerator } from '../utils';

// Define OTP channel type
export type OTPChannel = 'email' | 'sms';

export const otpRepository = {
    /**
     * Create a new OTP record (supports both email and phone)
     */
    async create(payload: {
        identifier: string;
        type: OTP['type'];
        channel: OTPChannel;
        otp_code: string;
        expires_at: Date;
        email?: string;  // Make email optional
    }): Promise<OTP> {

        const { data, error } = await supabaseAdmin
            .from('otps')
            .insert({
                identifier: payload.identifier.toLowerCase(),
                email: payload.email || payload.identifier.toLowerCase(), // Use identifier as email if email not provided
                otp_code: payload.otp_code,
                type: payload.type,
                channel: payload.channel,
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
     * Get user by phone number
     */
    async getUserByPhone(phone: string): Promise<{ user: any } | null> {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const normalizedPhone = phone.replace(/\D/g, '');
        
        const user = userList.users.find((u: any) => 
            u.phone && u.phone.replace(/\D/g, '') === normalizedPhone
        );
        
        return user ? { user } : null;
    },

      /**
     * Get user by email or phone
     */
    async getUserByIdentifier(identifier: string): Promise<{ user: any } | null> {
        const isEmail = identifier.includes('@');
        
        if (isEmail) {
            return this.getUserByEmail(identifier.toLowerCase());
        } else {
            return this.getUserByPhone(identifier);
        }
    },


    /**
     * Find active OTP by identifier, type, and channel
     * This is the new method that supports both email and phone
     */
    async findActiveOTP(
        identifier: string,
        type: OTP['type'],
        channel: OTPChannel = 'email'
    ): Promise<OTP | null> {
        const { data, error } = await supabaseAdmin
            .from('otps')
            .select('*')
            .eq('identifier', identifier.toLowerCase())
            .eq('type', type)
            .eq('channel', channel)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    /**
     * Find OTP by email and type (legacy method - kept for backward compatibility)
     */
    async findByEmailAndType(email: string, type: OTP['type']): Promise<OTP | null> {
        const { data, error } = await supabaseAdmin
            .from('otps')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('type', type)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    /**
     * Verify OTP (supports both email and phone)
     */
    async verify(
        identifier: string,
        otp_code: string,
        type: OTP['type'],
        channel: OTPChannel = 'email'
    ): Promise<{ verified: boolean; otp?: OTP }> {
        try {
            const otp = await this.findActiveOTP(identifier, type, channel);

            if (!otp) {
                return { verified: false };
            }

            if (new Date() > new Date(otp.expires_at)) {
                return { verified: false };
            }

            if (otp.attempts >= 5) {
                throw new Error('Too many failed attempts. Please request a new OTP.');
            }

            if (otp.otp_code !== otp_code.toUpperCase()) {
                await supabaseAdmin
                    .from('otps')
                    .update({ attempts: otp.attempts + 1 })
                    .eq('id', otp.id);

                return { verified: false };
            }

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

            return { verified: true, otp: data };

        } catch (error: any) {
            throw new Error(error.message || 'Verification failed');
        }
    },

    // Update resend method
    async resend(
        identifier: string,
        type: OTP['type'],
        channel: OTPChannel = 'email'
    ): Promise<OTP> {
        await supabaseAdmin
            .from('otps')
            .delete()
            .eq('identifier', identifier.toLowerCase())
            .eq('type', type)
            .eq('channel', channel)
            .eq('verified', false);

        const otp_code = OTPGenerator.generate();
        const expires_at = OTPGenerator.getExpirationTime();

        return this.create({
            identifier,
            type,
            channel,
            otp_code,
            expires_at,
            email: channel === 'email' ? identifier : undefined // Set email only for email channel
        });
    },

    /**
     * Mark OTP as verified
     */
    async markAsVerified(
        identifier: string,
        type: OTP['type'],
        channel: OTPChannel = 'email'
    ): Promise<void> {
        const { error } = await supabaseAdmin
            .from('otps')
            .update({
                verified: true,
                updated_at: new Date().toISOString()
            })
            .eq('identifier', identifier.toLowerCase())
            .eq('type', type)
            .eq('channel', channel)
            .eq('verified', false);

        if (error) throw error;
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
     * Delete OTPs by identifier and type
     */
    async deleteByIdentifierAndType(
        identifier: string,
        type: OTP['type'],
        channel?: OTPChannel
    ): Promise<void> {
        let query = supabaseAdmin
            .from('otps')
            .delete()
            .eq('identifier', identifier.toLowerCase())
            .eq('type', type);

        if (channel) {
            query = query.eq('channel', channel);
        }

        const { error } = await query;
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
     * Store reset token for password reset
     */
    async storeResetToken(identifier: string, token: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('password_resets')
            .insert({
                identifier: identifier.toLowerCase(),
                token,
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
                used: false
            });

        if (error) throw error;
    },

    /**
     * Verify reset token
     */
    async verifyResetToken(identifier: string, token: string): Promise<boolean> {
        const { data, error } = await supabaseAdmin
            .from('password_resets')
            .select('*')
            .eq('identifier', identifier.toLowerCase())
            .eq('token', token)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Mark as used
            await supabaseAdmin
                .from('password_resets')
                .update({ used: true })
                .eq('id', data.id);
            return true;
        }

        return false;
    }
};