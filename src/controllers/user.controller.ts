import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { userService } from '../services/user.service';
import { createAuditLog } from '../helpers';

export const userController = {

    /**
     * Update self user profile
     * @param req 
     * @param res 
     * @returns 
     */
    async updateMe(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized 1234' });
            }

            await userService.updateSelf(userId, req.body);

            await createAuditLog({
                user_id: userId,
                action: 'USER_UPDATED_SELF',
                entity_type: 'user',
                entity_id: userId
            });

            res.json({ message: 'Profile updated successfully' });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    },

    async getMe(req: AuthRequest, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized 9876' });
        }

        const user = await userService.getMe(userId);
        res.json({ user });
    }

};
