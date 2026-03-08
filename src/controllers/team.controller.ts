import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { teamService } from '../services/team.service';
import { createAuditLog } from '../helpers';
import { supabaseAdmin } from '../config';


export const teamController = {

    /**
     * Create a new team
     * @param req 
     * @param res 
     */
    async create(req: AuthRequest, res: Response) {
        try {
            console.log("Requesting data we get", req.body);
            const team = await teamService.createTeam(req.body);

            await createAuditLog({
                user_id: req.user?.id,
                action: 'TEAM_CREATED',
                entity_type: 'team',
                entity_id: team.id
            });

            res.status(201).json({
                success: true,
                message: 'Team created successfully'
            });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * List all teams
     * @param req 
     * @param res 
     */
    async list(req: AuthRequest, res: Response) {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        try {
            if (userRole === 'superadmin' || userRole === 'admin') {
                const teams = await teamService.listTeams();

                if (!teams || teams.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'No teams found'
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: teams
                });
            }

            return res.status(200).json({
                success: true,
                data: []
            });

        } catch (error: any) {
            console.error('Error fetching teams:', error);

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch teams',
                error: error.message
            });
        }
    },

    /**
     * Update a team
     * @param req 
     * @param res 
     */
    async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, is_active } = req.body;
            const team = await teamService.updateTeam(id as string, {
                name,
                description,
                is_active
            });

            await createAuditLog({
                user_id: req.user?.id,
                action: 'TEAM_UPDATED',
                entity_type: 'team',
                entity_id: id
            });

            res.json({ message: 'Team updated successfully', team, success: true });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * Delete a team
     * @param req 
     * @param res 
     */
    async delete(req: AuthRequest, res: Response) {
        const role = req.user?.role;
        if (role != 'superadmin') {
            return res.status(400).json({ success: false, message: 'You are not authorized' })
        }
        try {
            const { id } = req.params;
            await teamService.deleteTeam(id as string, req.user);

            await createAuditLog({
                user_id: req.user?.id,
                action: 'TEAM_DELETED',
                entity_type: 'team',
                entity_id: id
            });

            res.json({ message: 'Team deleted successfully' });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
};
