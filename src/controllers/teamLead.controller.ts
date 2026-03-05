import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { teamLeadService } from '../services/teamLead.service';

export const teamLeadController = {
    /**
     * GET /api/v1/team-lead/rms/:tlId
     * Get RMs by Team Lead ID
     */
    async getRMsByTLId(req: AuthRequest, res: Response) {
        try {
            const { tlId } = req.params;
            const rms = await teamLeadService.getRMsUnderTL(tlId);
            
            return res.status(200).json({
                success: true,
                data: rms
            });
        } catch (error: any) {
            return res.status(400).json({ 
                success: false, 
                message: error.message || 'Failed to fetch RMs' 
            });
        }
    }
};