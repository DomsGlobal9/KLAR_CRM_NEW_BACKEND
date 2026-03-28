import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { userService } from '../services/user.service';
import { createAuditLog } from '../helpers';

export const userController = {

    /**
     * Update self user profile
     */
    async updateMe(req: AuthRequest, res: Response) {
    try {
        console.log('[DEBUG] updateMe - Starting profile update');
        
        const userId = req.user?.id;
        if (!userId) {
            console.log('[DEBUG] updateMe - No user ID found, unauthorized');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        console.log('[DEBUG] updateMe - User ID:', userId);
        console.log('[DEBUG] updateMe - Request body:', JSON.stringify(req.body, null, 2));
        console.log('[DEBUG] updateMe - File info:', req.file ? {
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            hasBuffer: !!req.file.buffer
        } : 'No file uploaded');

        const imageBuffer = req.file?.buffer;
        const originalName = req.file?.originalname;

        console.log('[DEBUG] updateMe - Calling userService.updateSelf...');
        const result = await userService.updateSelf(
            userId,
            req.body,
            imageBuffer,
            originalName
        );

        await createAuditLog({
            user_id: userId,
            action: 'USER_UPDATED_SELF',
            entity_type: 'user',
            entity_id: userId,
            metadata: {
                updated_fields: result.updated_fields
            }
        });
        
        console.log('[DEBUG] updateMe - Audit log created successfully');

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result.user,
            updated_fields: result.updated_fields
        });
    } catch (err: any) {
        console.error('[DEBUG] updateMe - Error occurred:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to update profile'
        });
    }
},

    /**
     * Get logged-in user profile
     */
    async getMe(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const user = await userService.getMe(userId);

            return res.json({
                success: true,
                user
            });
        } catch (err: any) {
            return res.status(400).json({
                success: false,
                error: err.message || 'Failed to fetch user'
            });
        }
    }
};