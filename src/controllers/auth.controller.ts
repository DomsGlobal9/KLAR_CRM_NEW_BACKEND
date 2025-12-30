import { Request, Response } from 'express';
import { userService } from '../services';
import { userRepository } from '../repositories';
import { CreateUserInput } from '../models';
import { supabase } from '../config';

export const authController = {
    
    /**
     * Register first superadmin (no authentication required)
     * @param req 
     * @param res 
     * @returns 
     */
    async registerSuperAdmin(req: Request, res: Response) {
        console.log("Enter into function  to create superadmin");
        
        try {

            /**
             * Requesting repository to get superadmin count
             */
            const superadminCount = await userRepository.getSuperadminCount();
            console.log("The superadmin count", superadminCount);

            if (superadminCount >= 2) {
                return res.status(403).json({
                    error: 'Superadmin already exists.'
                });
            }

            const userData = req.body;

            console.log("THe user data", userData);

            if (!userData.username || !userData.email || !userData.password) {
                return res.status(400).json({ error: 'Missing required fields - 1' });
            }

            userData.role = 'superadmin';

            const user = await userService.createUser(userData);

            const { password_hash, ...userWithoutPassword } = user;

            res.status(201).json({
                message: 'Superadmin created successfully',
                user: userWithoutPassword
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    /**
     * Login with Supabase Auth
     * @param req 
     * @param res 
     * @returns 
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            const userProfile = await userRepository.getUserByEmail(email);
            if (!userProfile) {
                throw new Error('User not found in database');
            }

            await userService.updateLastLogin(userProfile.id);

            await userRepository.createAuditLog({
                user_id: userProfile.id,
                action: 'USER_LOGIN',
                entity_type: 'user',
                entity_id: userProfile.id,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({
                message: 'Login successful',
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: data.session.expires_at
                },
                user: {
                    id: userProfile.id,
                    username: userProfile.username,
                    email: userProfile.email,
                    role: userProfile.role,
                    full_name: userProfile.full_name,
                    status: userProfile.status
                }
            });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    },

    /**
     * Logout
     * @param req 
     * @param res 
     */
    async logout(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { all } = req.body;

            if (userId) {
                await userRepository.createAuditLog({
                    user_id: userId,
                    action: 'USER_LOGOUT',
                    entity_type: 'user',
                    entity_id: userId
                });
            }

            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            res.json({ message: 'Logout successful' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Refresh token
     * @param req 
     * @param res 
     * @returns 
     */
    async refreshToken(req: Request, res: Response) {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }

            const { data, error } = await supabase.auth.refreshSession({
                refresh_token
            });

            if (error) throw error;

            res.json({
                message: 'Token refreshed successfully',
                session: {
                    access_token: data.session?.access_token,
                    refresh_token: data.session?.refresh_token,
                    expires_at: data.session?.expires_at
                }
            });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    },

    /**
     * Verify session
     * @param req 
     * @param res 
     * @returns 
     */
    async verifySession(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userProfile = await userService.getUserProfile(userId);

            const { password_hash, ...userWithoutPassword } = userProfile;

            res.json({
                message: 'Session is valid',
                user: userWithoutPassword
            });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    
};