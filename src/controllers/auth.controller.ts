import { Request, Response } from 'express';
import { AuthRequest } from '../middleware';
import { AuthService } from '../services';
import { createAuditLog } from '../helpers';
import { roleRepository } from '../repositories';

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
    }

};
