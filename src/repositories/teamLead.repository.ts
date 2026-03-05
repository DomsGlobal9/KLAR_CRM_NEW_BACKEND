import { supabaseAdmin } from '../config';

export const teamLeadRepository = {
    /**
     * Get all RMs that share the same team_id as the Team Lead or were created by them
     */
    async findRMsByTL(tlId: string) {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;

        // Find the Team Lead's own data to get their team_id
        const teamLead = users.find(u => u.id === tlId);
        const tlTeamId = teamLead?.user_metadata?.team_id;

        return users.filter(user => {
            const metadata = user.user_metadata || {};
            const isRM = metadata.role_name?.toLowerCase() === 'rm';
            
            // Match by shared team_id or the created_by field
            const matchesTeam = tlTeamId ? metadata.team_id === tlTeamId : false;
            const matchesCreator = String(metadata.created_by) === String(tlId);

            return isRM && (matchesTeam || matchesCreator);
        }).map(user => ({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username,
            full_name: user.user_metadata?.full_name,
            role: user.user_metadata?.role_name,
            team_id: user.user_metadata?.team_id
        }));
    }
};