import { Request, Response } from 'express';
import { screenPermissionsRepository } from '../repositories/screen-permissions.repository';

export const screenPermissionsController = {
  async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await screenPermissionsRepository.getAllPermissions();
      res.json({
        success: true,
        message: 'Screen permissions fetched successfully',
        permissions,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async savePermissions(req: Request, res: Response) {
    try {
      const { permissions } = req.body;
      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ success: false, error: 'Permissions object is required' });
      }

      const saved = await screenPermissionsRepository.savePermissions(permissions);
      res.json({
        success: true,
        message: 'Screen permissions saved successfully',
        permissions: saved,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
