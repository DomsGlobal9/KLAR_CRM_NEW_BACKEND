import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { teamService } from '../services/team.service';
import { createAuditLog } from '../helpers';


export const teamController = {

    /**
     * Create a new team
     * @param req 
     * @param res 
     */
    async create(req: AuthRequest, res: Response) {
        try {
            console.log("Requester for team creating", req.user);
            console.log("Requesting data we get", req.body);
            const team = await teamService.createTeam(req.body, req.user);

            await createAuditLog({
                user_id: req.user?.id,
                action: 'TEAM_CREATED',
                entity_type: 'team',
                entity_id: team.id
            });

            res.status(201).json({ message: 'Team created successfully', team });
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
        try {
            const teams = await teamService.listTeams();
            res.json({ teams });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
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
            const team = await teamService.updateTeam(id, req.body, req.user);

            await createAuditLog({
                user_id: req.user?.id,
                action: 'TEAM_UPDATED',
                entity_type: 'team',
                entity_id: id
            });

            res.json({ message: 'Team updated successfully', team });
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
        try {
            const { id } = req.params;
            await teamService.deleteTeam(id, req.user);

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
