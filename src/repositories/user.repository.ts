import { supabaseAdmin } from '../config';
import { User } from '../models/user.model';

export const userRepository = {

    /**
     * Update user metadata
     * @param userId 
     * @param metadata 
     * @returns 
     */
    async updateUserMetadata(userId: string, metadata: any) {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { user_metadata: metadata }
        );
        if (error) throw error;
        return data;
    },

    /**
     * List all users
     * @returns 
     */
    async listUsers() {
        return supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    },

    /**
     * Get user by ID
     * @param userId 
     * @returns
     */
    async getById(userId: string) {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (error) throw error;

        const user = data.user;
        // console.log("&&&&&&&&&& User data we get", user);

        let teamName: string | null = null;

        const teamId = user.user_metadata?.team_id;

        if (teamId) {
            const { data: team, error: teamError } =
                await supabaseAdmin
                    .from('teams')
                    .select('name')
                    .eq('id', teamId)
                    .single();

            if (teamError && teamError.code !== 'PGRST116') {
                throw teamError;
            }

            teamName = team?.name ?? null;
        }

        console.log("Team name", teamName);

        return {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role_name,
            username: user.user_metadata?.username,
            team_id: user.user_metadata?.team_id,
            team_name: teamName
        };
    },

    /**
     * Get all RMs under a specific TL
     */
    // async findRMsByTL(tlId: string) {
    //     console.log("Checking User Model:", User);
    //         return await User.find({
    //             teamLeadId: tlId,
    //             role: 'RM'
    //         });
    //     }




    // async findRMsByTL(tlId: string) {
    //     const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    //     console.log("86user.repository.ts", await supabaseAdmin.auth.admin.listUsers())
        
    //     if (error) throw error;

    //     return users.filter(user => 
    //         user.user_metadata?.role_name === 'rm' && 
    //         user.user_metadata?.assigned_under === tlId
    //     );
    // }





//     async findRMsByTL(tlId: string) {
//     const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
//     if (error) throw error;

//     console.log("Filtering for TL ID:", tlId);

//     const filtered = users.filter(user => {
//         const metadata = user.user_metadata || {};
        
//         // Based on your logs, we should check 'created_by' 
//         // because 'assigned_under' is undefined.
//         const isRM = metadata.role_name?.toLowerCase() === 'rm';
//         const isAssignedToTL = String(metadata.created_by) === String(tlId);

//         return isRM && isAssignedToTL;
//     });

//     // Map the data to a clean format before returning
//     return filtered.map(user => ({
//         id: user.id,
//         email: user.email,
//         username: user.user_metadata?.username,
//         full_name: user.user_metadata?.full_name,
//         role: user.user_metadata?.role_name,
//         team_id: user.user_metadata?.team_id
//     }));
// }





async findRMsByTL(tlId: string) {
    // 1. Get all users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    // 2. Find the Team Lead's own data to get their team_id
    const teamLead = users.find(u => u.id === tlId);
    const tlTeamId = teamLead?.user_metadata?.team_id;

    console.log(`TL ID: ${tlId} | Found Team ID: ${tlTeamId}`);

    // 3. Filter users who are RMs AND share the same team_id
    const filtered = users.filter(user => {
        const metadata = user.user_metadata || {};
        const isRM = metadata.role_name?.toLowerCase() === 'rm';
        // console.log("150user.repository.ts", filtered)
        
        // If the TL has a team_id, match by that. 
        // Otherwise, fall back to matching by 'created_by'.
        const matchesTeam = tlTeamId ? metadata.team_id === tlTeamId : false;
        const matchesCreator = String(metadata.created_by) === String(tlId);

        return isRM && (matchesTeam || matchesCreator);
    });

    return filtered.map(user => ({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username,
        full_name: user.user_metadata?.full_name,
        role: user.user_metadata?.role_name,
        team_id: user.user_metadata?.team_id
    }));
    
}


};

