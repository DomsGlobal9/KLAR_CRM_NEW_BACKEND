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
            const { refresh_token } = req.body
            if (!refresh_token) {
                return res.status(400).json({ error: 'Refresh token required' })
            }

            const { data, error } = await AuthService.refresh(refresh_token)
            if (error) throw error

            const session = data.session

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

            if (!user) {
                return res.status(404).json({ error: 'Email not registered' });
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

};
