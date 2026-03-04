import { Request, Response } from 'express';
import { AuthRequest } from '../middleware';
import { AuthService, otpService } from '../services';
import { createAuditLog } from '../helpers';
import { AuthRepository, roleRepository } from '../repositories';
import { supabase, supabaseAdmin } from '../config';
import { OTPChannel } from '../interfaces/auth.interface';

export const authController = {

    /**
     * Register a new user
     * @param req 
     * @param res 
     */
    async register(req: AuthRequest, res: Response) {
        try {
            const result = await AuthService.register(req.body);
            console.log("im in");
            console.log(req.body);
            console.log(result);

            await createAuditLog({
                user_id: req.user?.id || result.data.user?.id,
                action: 'USER_CREATED',
                entity_type: 'user',
                entity_id: result.data.user?.id,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                details: 'Initial superadmin created',
            });

            res.status(201).json({
                message: 'User created successfully',
            });

        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * Login user
     * @param req 
     * @param res 
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password required' });
            }

            const { data, error } = await AuthService.login(email, password);
            if (error) throw error;

            const user = data.user;
            const session = data.session;
            const metadata = user.user_metadata || {};

            /**
             * Send ONLY tokens to UI
             */
            res.json({
                session_details: {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_at: session.expires_at,
                }
            });

        } catch (err: any) {
            res.status(401).json({ error: err.message });
        }
    },


    /**
     * Refresh token
     * @param req 
     * @param res 
     */
    async refreshToken(req: Request, res: Response) {
        try {
            const { refresh_token } = req.body
            if (!refresh_token) {
                return res.status(400).json({ error: 'Refresh token required' })
            }

            const { data, error } = await AuthService.refresh(refresh_token)
            if (error) {
                console.error('Supabase refresh session error:', error);
                throw error;
            }

            const session = data.session
            console.log('Supabase refresh session success, session:', session ? 'Found' : 'Not Found');

            res.json({
                success: true,
                session_details: {
                    access_token: session?.access_token,
                    refresh_token: session?.refresh_token,
                    expires_at: session?.expires_at
                }
            })
        } catch (err: any) {
            console.error('Token refresh failed:', err)
            res.status(401).json({ success: false, error: 'Invalid or expired refresh token' })
        }
    },

    /**
     * Logout user
     * @param req 
     * @param res 
     * @returns 
     */
    async logout(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            await AuthService.logout(userId);

            await createAuditLog({
                user_id: userId,
                action: 'USER_LOGOUT',
                entity_type: 'user',
                entity_id: userId,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.json({ message: 'Logout successful' });

        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },


     /**
     * forgot Password - Supports both Email and SMS
     * POST /api/auth/forgot-password
     */
    async forgotPassword(req: Request, res: Response) {
        try {
            const { identifier, channel } = req.body; // Changed from 'email' to 'identifier'

            if (!identifier || typeof identifier !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Valid email or phone number is required'
                });
            }

            // Determine channel if not provided
            const deliveryChannel: OTPChannel = channel || (identifier.includes('@') ? 'email' : 'sms');
            
            // Normalize based on channel
            const normalizedIdentifier = deliveryChannel === 'email' 
                ? identifier.toLowerCase() 
                : identifier; // Phone numbers will be formatted in service

            // Check if user exists (you'll need to update this to search by email OR phone)
            const { data: userList } = await AuthRepository.listUsers();
            
            let user;
            if (deliveryChannel === 'email') {
                user = userList.users.find((u: any) => u.email?.toLowerCase() === normalizedIdentifier);
            } else {
                // Search by phone number (you'll need to add phone field to users table)
                user = userList.users.find((u: any) => 
                    u.phone && u.phone.replace(/\D/g, '') === normalizedIdentifier.replace(/\D/g, '')
                );
            }

            // Security best practice: Don't reveal if user exists or not
            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: `If the ${deliveryChannel} exists in our system, you will receive a reset code`
                });
            }

            // Check if user is active
            if (user.user_metadata?.status !== "active") {
                return res.status(200).json({
                    success: true,
                    message: `If the ${deliveryChannel} exists in our system, you will receive a reset code`
                });
            }

            // Send password reset OTP via specified channel
            const result = await otpService.sendOTP(
                normalizedIdentifier, 
                'password_reset',
                deliveryChannel
            );

            // Create audit log
            await createAuditLog({
                user_id: user.id,
                action: 'PASSWORD_RESET_REQUESTED',
                entity_type: 'user',
                entity_id: user.id,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                details: `Password reset OTP requested via ${deliveryChannel}`
            });

            return res.status(200).json({
                success: true,
                message: `Reset code sent to your ${deliveryChannel}`,
                channel: deliveryChannel
            });

        } catch (err: any) {
            console.error('Forgot password failed:', err);
            // Return success even on error for security
            return res.status(200).json({
                success: true,
                message: 'If the contact method exists, you will receive a reset code'
            });
        }
    },

    // ===== OTP Based Authentication Methods begins from here =====

    /**
     * Step 1: Send OTP for superadmin registration
     */
    async sendRegistrationOTP(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email || typeof email !== 'string') {
                return res.status(400).json({ error: 'Valid email is required' });
            }

            const result = await otpService.sendOTP(email.toLowerCase(), 'registration');
            res.json(result);
        } catch (err: any) {
            console.error('Send registration OTP failed:', err);
            res.status(400).json({ error: err.message || 'Failed to send OTP' });
        }
    },

    /**
     * Resend registration OTP
     */
    async resendRegistrationOTP(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email || typeof email !== 'string') {
                return res.status(400).json({ error: 'Valid email is required' });
            }

            const { data: userList } = await AuthRepository.listUsers();
            const existingUser = userList.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

            if (existingUser) {
                return res.status(400).json({
                    error: 'User already registered. Please login instead.'
                });
            }

            const result = await otpService.resendOTP(email.toLowerCase(), 'registration');
            res.json(result);
        } catch (err: any) {
            console.error('Resend registration OTP failed:', err);
            res.status(400).json({ error: err.message || 'Failed to resend OTP' });
        }
    },

    /**
     * Step 2: Verify OTP and create superadmin
     */
    async verifyAndRegister(req: Request, res: Response) {
        try {
            const { email, otp_code, password, username, full_name, phone } = req.body;

            if (!email || !otp_code || !password || !username) {
                return res.status(400).json({ error: 'Email, OTP, password, and username are required' });
            }

            // Verify OTP
            const isValid = await otpService.verifyOTP(email.toLowerCase(), otp_code, 'registration');
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid or expired OTP' });
            }

            // Register superadmin
            const payload = { email: email.toLowerCase(), password, username, full_name, phone };
            const result = await AuthService.register(payload);

            const userId = result.data.user?.id;
            if (!userId) {
                throw new Error('User creation succeeded but no user ID returned');
            }

            await createAuditLog({
                user_id: userId,
                action: 'USER_CREATED',
                entity_type: 'user',
                entity_id: userId,
                details: 'Initial superadmin created via OTP verification',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.status(201).json({
                message: 'Superadmin registered successfully. You can now log in with OTP.',
            });
        } catch (err: any) {
            console.error('Superadmin registration failed:', err);
            res.status(400).json({ error: err.message || 'Registration failed' });
        }
    },

    /**
     * Step 1: Send login OTP to registered user
     */
    async sendLoginOTP(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || typeof email !== 'string' || !password) {
                return res.status(400).json({ error: 'Valid email and password are required' });
            }

            const normalizedEmail = email.toLowerCase();

            const { data: userList } = await AuthRepository.listUsers();

            const user = userList.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);

            console.log("############### The users we get", user);


            if (!user) {
                return res.status(404).json({ error: 'Email not registered' });
            }

            if (user.user_metadata.status !== "active") {
                return res.status(403).json({
                    error: `Account is not active. Please contact your admin.`
                });
            }

            const { data: authData, error: authError } = await AuthService.login(normalizedEmail, password);

            if (authError) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const result = await otpService.sendOTP(normalizedEmail, 'login');

            res.json({ success: true, message: 'Login OTP sent to your email' });
        } catch (err: any) {
            console.error('Send login OTP failed:', err);
            res.status(400).json({ error: err.message || 'Failed to send login OTP' });
        }
    },

    /**
     * Resend login OTP
     */
    async resendLoginOTP(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || typeof email !== 'string' || !password) {
                return res.status(400).json({ error: 'Valid email and password are required' });
            }

            const normalizedEmail = email.toLowerCase();


            const { data: userList } = await AuthRepository.listUsers();
            const user = userList.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);

            if (!user) {
                return res.status(404).json({ error: 'Email not registered' });
            }

            const { data: authData, error: authError } = await AuthService.login(normalizedEmail, password);
            if (authError) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const result = await otpService.resendOTP(normalizedEmail, 'login');
            res.json(result);
        } catch (err: any) {
            console.error('Resend login OTP failed:', err);
            res.status(400).json({ error: err.message || 'Failed to resend OTP' });
        }
    },

    /**
     * Step 2: Verify custom OTP and let Supabase create the session
     */
    async verifyLoginOTP(req: Request, res: Response) {
        try {
            const { email, password, otp_code } = req.body;

            if (!email || !otp_code || !password) {
                return res.status(400).json({ error: 'Email, password, and OTP code are required' });
            }

            const normalizedEmail = email.toLowerCase();

            const isValid = await otpService.verifyOTP(normalizedEmail, otp_code, 'login');
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid or expired OTP' });
            }

            const { data, error } = await AuthService.login(email, password);
            if (error) throw error;

            const user = data.user;
            const session = data.session;
            const metadata = user.user_metadata || {};

            /**
             * Send ONLY tokens to UI
             */
            res.json({
                success: true,
                session_details: {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_at: session.expires_at,
                }
            });

            if (error) {
                console.error('Supabase signInWithOtp failed:', error);
                return res.status(500).json({ error: 'Failed to create session' });
            }

            if (!data.session) {
                return res.status(500).json({ error: 'No session returned after OTP login' });
            }

            await createAuditLog({
                user_id: user.id,
                action: 'USER_LOGIN',
                entity_type: 'user',
                entity_id: user.id,
                details: 'Login via custom OTP verification',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });
        } catch (err: any) {
            console.error('Login OTP verification failed:', err);
            res.status(401).json({
                success: false,
                error: err.message || 'Login failed'
            });
        }
    },



    /**
     * Resend password reset OTP - Supports both Email and SMS
     * POST /api/auth/resend-password-otp
     */
    async resendPasswordResetOTP(req: Request, res: Response) {
        try {
            const { identifier, channel } = req.body;

            if (!identifier || typeof identifier !== 'string') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Valid email or phone number is required' 
                });
            }

            // Determine channel if not provided
            const deliveryChannel: OTPChannel = channel || (identifier.includes('@') ? 'email' : 'sms');
            
            const normalizedIdentifier = deliveryChannel === 'email' 
                ? identifier.toLowerCase() 
                : identifier;

            // Check if user exists
            const { data: userList } = await AuthRepository.listUsers();
            
            let user;
            if (deliveryChannel === 'email') {
                user = userList.users.find((u: any) => u.email?.toLowerCase() === normalizedIdentifier);
            } else {
                user = userList.users.find((u: any) => 
                    u.phone && u.phone.replace(/\D/g, '') === normalizedIdentifier.replace(/\D/g, '')
                );
            }

            if (!user) {
                return res.status(200).json({ 
                    success: true, 
                    message: `If the ${deliveryChannel} exists, you will receive a reset code` 
                });
            }

            // Resend OTP
            const result = await otpService.resendOTP(
                normalizedIdentifier, 
                'password_reset',
                deliveryChannel
            );

            // Create audit log
            await createAuditLog({
                user_id: user.id,
                action: 'PASSWORD_RESET_OTP_RESENT',
                entity_type: 'user',
                entity_id: user.id,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                details: `Password reset OTP resent via ${deliveryChannel}`
            });

            return res.status(200).json({ 
                success: true, 
                message: `Reset code resent to your ${deliveryChannel}` 
            });

        } catch (err: any) {
            console.error('Resend password OTP failed:', err);
            return res.status(400).json({ 
                success: false, 
                error: err.message || 'Failed to resend OTP' 
            });
        }
    },

    /**
     * Step 2: Verify OTP and prepare for password reset - Supports both Email and SMS
     * POST /api/auth/verify-password-otp
     */
    async verifyPasswordResetOTP(req: Request, res: Response) {
        try {
            const { identifier, otp_code, channel } = req.body;

            if (!identifier || !otp_code) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Identifier and OTP code are required' 
                });
            }

            // Determine channel if not provided
            const deliveryChannel: OTPChannel = channel || (identifier.includes('@') ? 'email' : 'sms');
            
            const normalizedIdentifier = deliveryChannel === 'email' 
                ? identifier.toLowerCase() 
                : identifier;

            // Check if user exists
            const { data: userList } = await AuthRepository.listUsers();
            
            let user;
            if (deliveryChannel === 'email') {
                user = userList.users.find((u: any) => u.email?.toLowerCase() === normalizedIdentifier);
            } else {
                user = userList.users.find((u: any) => 
                    u.phone && u.phone.replace(/\D/g, '') === normalizedIdentifier.replace(/\D/g, '')
                );
            }

            if (!user) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }

            // Verify OTP
            const isValid = await otpService.verifyOTP(
                normalizedIdentifier, 
                otp_code, 
                'password_reset',
                deliveryChannel
            );
            
            if (!isValid) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid or expired OTP' 
                });
            }

            // Generate a temporary reset token (optional but more secure)
            const resetToken = Math.random().toString(36).substring(2, 15) + 
                              Math.random().toString(36).substring(2, 15);
            
            // Store reset token (you can implement this in your repository)
            // await otpRepository.storeResetToken(normalizedIdentifier, resetToken);

            // Create audit log
            await createAuditLog({
                user_id: user.id,
                action: 'PASSWORD_RESET_OTP_VERIFIED',
                entity_type: 'user',
                entity_id: user.id,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                details: `Password reset OTP verified successfully via ${deliveryChannel}`
            });

            // OTP verified - ready to show password reset form
            return res.status(200).json({
                success: true,
                message: 'OTP verified successfully',
                resetToken, // Send this if you implement token storage
                identifier: deliveryChannel === 'email' ? user.email : user.phone // Return identifier for next step
            });

        } catch (err: any) {
            console.error('Verify password OTP failed:', err);
            return res.status(400).json({ 
                success: false, 
                error: err.message || 'OTP verification failed' 
            });
        }
    },

    /**
     * Step 3: Reset password (after OTP verification) - Supports both Email and SMS
     * POST /api/auth/reset-password
     */
    async resetPassword(req: Request, res: Response) {
        try {
            const { identifier, newPassword, resetToken } = req.body;
            console.log("Resetting password for:", identifier, newPassword);

            if (!identifier || !newPassword) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Identifier and new password are required' 
                });
            }

            // Determine if identifier is email or phone
            const isEmail = identifier.includes('@');
            
            // Find user by email or phone
            let user;
            if (isEmail) {
                const result = await AuthRepository.getUserByEmail(identifier.toLowerCase());
                user = result.user;
            } else {
                // You'll need to implement getUserByPhone in your repository
                const result = await AuthRepository.getUserByPhone(identifier);
                user = result?.user;
            }

            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    error: `User not found` 
                });
            }

            // Validate password strength
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters long'
                });
            }

        
            // Update password using Supabase Admin API
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { password: newPassword }
            );

            if (updateError) {
                console.error('Password update failed:', updateError);
                throw new Error('Failed to update password');
            }

            // Create audit log
            await createAuditLog({
                user_id: user.id,
                action: 'PASSWORD_RESET_COMPLETED',
                entity_type: 'user',
                entity_id: user.id,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                details: 'Password reset completed successfully'
            });

            return res.status(200).json({
                success: true,
                message: 'Password reset successfully. You can now login with your new password.'
            });

        } catch (err: any) {
            console.error('Reset password failed:', err);
            return res.status(400).json({ 
                success: false, 
                error: err.message || 'Failed to reset password' 
            });
        }
    },
};