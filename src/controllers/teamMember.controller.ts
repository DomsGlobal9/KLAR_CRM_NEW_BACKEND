import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { teamMemberService } from '../services';
import { createAuditLog } from '../helpers';

export const teamMemberController = {

    /**
     * Add a new team member
     * @param req 
     * @param res 
     */
    async addMember(req: AuthRequest, res: Response) {
        try {
            const user = await teamMemberService.addTeamMember(req.body);

            console.log("THe user details got", req.user);

            await createAuditLog({
                user_id: req.user?.id,
                action: 'TEAM_MEMBER_ADDED',
                entity_type: 'user',
                entity_id: user.id
            });

            res.status(201).json({ message: 'Member added', user });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    },

    async getAll(req: AuthRequest, res: Response) {
        const users = await teamMemberService.getAllTeamMembers();
        res.json(users);
    },

    async getByTeam(req: AuthRequest, res: Response) {
        const users = await teamMemberService.getMembersByTeam(req.params.teamId);
        res.json(users);
    },

    async getUnassigned(req: AuthRequest, res: Response) {
        const users = await teamMemberService.getUnassignedMembers();
        res.json(users);
    },

    async update(req: AuthRequest, res: Response) {
        const user = await teamMemberService.updateTeamMember(
            req.params.memberId,
            req.body
        );
        res.json(user);
    },

    async remove(req: AuthRequest, res: Response) {
        await teamMemberService.removeTeamMember(req.params.memberId);
        res.json({ message: 'Member removed' });
    }
};
