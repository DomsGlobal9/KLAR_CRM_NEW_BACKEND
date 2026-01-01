import { Request, Response } from 'express';
import { AuthRequest } from '../middleware';
import { AuthService, otpService } from '../services';
import { createAuditLog } from '../helpers';
import { AuthRepository, roleRepository } from '../repositories';
import { supabase, supabaseAdmin } from '../config';

export const authController = {

    /**
     * Register a new user
     * @param req 
     * @param res 
     */
    async register(req: AuthRequest, res: Response) {
        try {
            const result = await AuthService.register(req.body);

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
            const { refresh_token } = req.body;
            const { data, error } = await AuthService.refresh(refresh_token);
            if (error) throw error;

            res.json({ session: data.session });

        } catch (err: any) {
            res.status(401).json({ error: err.message });
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

    // ===== OTP Based Authentication Methods begins from here =====

    /**
     * Step 1: Send OTP for superadmin registration
     */
    async sendRegistrationOTP(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const result = await otpService.sendRegistrationOTP(email);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * Step 2: Verify OTP and create superadmin
     */
    async verifyAndRegister(req: Request, res: Response) {
        try {
            const { email, otp_code, password, username, full_name, phone } = req.body;

            if (!email || !otp_code || !password || !username) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            /**
             * Verify OTP first
             */
            const isValid = await otpService.verifyRegistrationOTP(email, otp_code);
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid or expired OTP' });
            }

            /**
             * Now register superadmin
             */
            const payload = { email, password, username, full_name, phone };
            const result = await AuthService.register(payload);

            await createAuditLog({
                user_id: result.data.user?.id,
                action: 'USER_CREATED',
                entity_type: 'user',
                entity_id: result.data.user?.id,
                details: 'Initial superadmin created via OTP',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.status(201).json({
                message: 'Superadmin registered successfully. You can now log in.',
            });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * Step 1: Send login OTP
     */
    async sendLoginOTP(req: Request, res: Response) {
        console.log("Enter into SEnd login otp controller function");
        try {
            const { email } = req.body;
            console.log("Email get from postman", email); 
            if (!email) return res.status(400).json({ error: 'Email is required' });

            /**
             * Check if user exists
             */
            const { data: users } = await AuthRepository.listUsers();
            const user = users.users.find((u: any) => u.email === email);
            if (!user) {
                return res.status(400).json({ error: 'Email not registered' });
            }

            /**
             * Send OTP (we'll use password_reset type or create 'login' type)
             */
            const result = await otpService.sendPasswordResetOTP(email);
            res.json({ success: true, message: 'Login OTP sent to your email' });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * Step 2: Verify login OTP and issue session
     */
    async verifyLoginOTP(req: Request, res: Response) {
        try {
            const { email, otp_code } = req.body;
            if (!email || !otp_code) {
                return res.status(400).json({ error: 'Email and OTP are required' });
            }

            /**
             * Verify OTP first
             */
            const isValid = await otpService.verifyPasswordResetOTP(email, otp_code);
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid or expired OTP' });
            }

            /**
             * Get user details
             */
            const { data: users } = await AuthRepository.listUsers();
            const user = users.users.find((u: any) => u.email === email);
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }

            /**
             * Sign in user (Supabase will create session)
             */
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: 'dummy-password-not-used',
            });

            if (error) {

                const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email,
                });

                if (sessionError) throw sessionError;

                throw new Error('Session creation failed');
            }

            res.json({
                session_details: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: data.session.expires_at,
                }
            });
        } catch (err: any) {
            res.status(401).json({ error: err.message });
        }
    },

    /**
     * Verify OTP and send magic link (recommended)
     */
    // async verifyLoginOTP(req: Request, res: Response) {
    //     try {
    //         const { email, otp_code } = req.body;
    //         if (!email || !otp_code) {
    //             return res.status(400).json({ error: 'Email and OTP required' });
    //         }

    //         const isValid = await otpService.verifyPasswordResetOTP(email, otp_code);
    //         if (!isValid) {
    //             return res.status(400).json({ error: 'Invalid or expired OTP' });
    //         }

    //         // Generate magic link
    //         const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    //             type: 'magiclink',
    //             email,
    //         });

    //         if (error) throw error;

    //         // In real app, send this link via email
    //         // For now, return it (only for dev!)
    //         res.json({
    //             message: 'OTP verified. Magic link generated.',
    //             magic_link: data.properties.action_link, // ONLY FOR TESTING
    //             warning: 'Do not expose magic links in production!'
    //         });
    //     } catch (err: any) {
    //         res.status(400).json({ error: err.message });
    //     }
    // },

};
