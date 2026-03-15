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
        try {
            const users = await teamMemberService.getAllTeamMembers(req.user);

            if (!users || users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No team members found'
                });
            }

            return res.status(200).json({
                success: true,
                data: users
            });
        } catch (error: any) {
            console.error('Error fetching team members:', error);

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch team members',
                error: error.message
            });
        }
    },


    async getByTeam(req: AuthRequest, res: Response) {
        const users = await teamMemberService.getMembersByTeam(req.params.teamId as string);
        res.json(users);
    },

    async getUnassigned(req: AuthRequest, res: Response) {
        const users = await teamMemberService.getUnassignedMembers();
        res.json(users);
    },

    async update(req: AuthRequest, res: Response) {
        try {
            const { memberId } = req.params;

            if (!memberId) {
                return res.status(400).json({
                    success: false,
                    message: 'Member ID is required'
                });
            }

            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Update data is required'
                });
            }

            const user = await teamMemberService.updateTeamMember(
                memberId as string,
                req.body
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Team member not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error: any) {
            console.error('Error updating team member:', error);

            return res.status(500).json({
                success: false,
                message: 'Failed to update team member',
                error: error.message
            });
        }
    },

    /**
     * Update team member status (activate/deactivate)
     */
    async updateStatus(req: AuthRequest, res: Response) {
        try {
            const { memberId } = req.params;
            const { is_active } = req.body;

            if (typeof is_active !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    error: 'is_active must be a boolean value'
                });
            }

            const user = await teamMemberService.updateTeamMemberStatus(memberId as string, is_active);

            // Create audit log for status change
            await createAuditLog({
                user_id: req.user?.id,
                action: is_active ? 'TEAM_MEMBER_ACTIVATED' : 'TEAM_MEMBER_DEACTIVATED',
                entity_type: 'user',
                entity_id: memberId,
                details: `User ${is_active ? 'activated' : 'deactivated'} by ${req.user?.email}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            return res.status(200).json({
                success: true,
                message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
                data: user
            });
        } catch (error: any) {
            console.error('Error updating team member status:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to update user status'
            });
        }
    },

    async remove(req: AuthRequest, res: Response) {
        const role = req.user?.role;
        if (role != 'superadmin') {
            return res.status(400).json({ success: false, message: 'You are not authorized' })
        }

        await teamMemberService.removeTeamMember(req.params.memberId as string);
        res.json({ message: 'Member removed', success: true });
    },

    /**
     * Step 1: Send OTP to add a new team member (Superadmin only)
     */
    async sendAddMemberOTP(req: AuthRequest, res: Response) {
        try {


            const { email, role_id, team_id } = req.body;

            if (!email || !role_id) {
                return res.status(400).json({ error: 'Email and role_id are required' });
            }

            const result = await teamMemberService.sendAddMemberOTP({
                email: email.toLowerCase(),
                role_id,
                team_id: team_id || null,
                requested_by: req.user?.id as string
            });

            res.json(result);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    },

    /**
     * Step 2: Verify OTP and create the team member
     */
    async verifyOTPAndCreateMember(req: AuthRequest, res: Response) {
        try {

            const owner = req.user;

            console.log("The frontend data we get", req.body);
            const { email, password, otp_code, username, full_name, phone } = req.body;

            if (!email || !otp_code || !username || !password) {
                return res.status(400).json({ error: 'Email, Password, OTP, and username are required' });
            }

            const user = await teamMemberService.verifyOTPAndCreateMember({
                email: email.toLowerCase(),
                password,
                otp_code,
                username,
                full_name,
                phone: phone || null,
                created_by: req.user?.id as string
            });

            await createAuditLog({
                user_id: req.user?.id,
                action: 'TEAM_MEMBER_ADDED',
                entity_type: 'user',
                entity_id: user.id,
                details: `Team member created via OTP: ${email}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.status(201).json({
                success: true,
                message: 'Team member created successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.user_metadata.username,
                    role_name: user.user_metadata.role_name,
                    team_id: user.user_metadata.team_id
                }
            });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    },
};
