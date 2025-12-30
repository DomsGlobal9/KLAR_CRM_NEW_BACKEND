import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';

export const roleMiddleware = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const user = await userService.getUserProfile(userId);

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    error: 'Access denied. Required roles: ' + allowedRoles.join(', ')
                });
            }

            next();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
};