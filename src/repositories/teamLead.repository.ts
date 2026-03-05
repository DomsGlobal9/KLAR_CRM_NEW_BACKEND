// import { supabaseAdmin } from '../config';

// export const teamLeadRepository = {
//     /**
//      * Get all RMs that share the same team_id as the Team Lead or were created by them
//      */
//     async findRMsByTL(tlId: string) {
//         const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
//         if (error) throw error;

//         // Find the Team Lead's own data to get their team_id
//         const teamLead = users.find(u => u.id === tlId);
//         console.log("The team lead we get", teamLead);

//         const tlTeamId = teamLead?.user_metadata?.team_id;
//         // console.log("The team lead we get", teamLead);

//         return users.filter(user => {
//             const metadata = user.user_metadata || {};
//             const isRM = metadata.role_name?.toLowerCase() === 'rm';
            
//             // Match by shared team_id or the created_by field
//             const matchesTeam = tlTeamId ? metadata.team_id === tlTeamId : false;
//             const matchesCreator = String(metadata.created_by) === String(tlId);

//             return isRM && (matchesTeam || matchesCreator);
//         }).map(user => ({
//             id: user.id,
//             email: user.email,
//             username: user.user_metadata?.username,
//             full_name: user.user_metadata?.full_name,
//             role: user.user_metadata?.role_name,
//             team_id: user.user_metadata?.team_id
//         }));
//     }
// };








// import { supabaseAdmin } from '../config';

// export const teamLeadRepository = {
//     /**
//      * Step 1: Find the Team Lead's profile using tlId to get their teamId
//      * Step 2: Find all users with role 'rm' that have that same teamId
//      */
//     async findRMsByTL(tlId: string) {
//         // Fetch all users from Supabase Auth
//         const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
//         if (error) throw error;

//         // 1. Get the Team Lead's data
//         const teamLead = users.find(u => u.id === tlId);
        
//         if (!teamLead) {
//             console.error(`No Team Lead found with ID: ${tlId}`);
//             return [];
//         }

//         const tlTeamId = teamLead.user_metadata?.team_id;
//         console.log(`66teamLead.repository.ts, teamLead.repository.ts, Found Team Lead: ${teamLead.email} | Team ID: ${tlTeamId}`);

//         if (!tlTeamId) {
//             console.warn("This Team Lead does not have a team_id assigned in metadata.");
//             // Optional: You could still return users where created_by === tlId if team_id is missing
//         }

//         // 2. Filter for all RMs belonging to that specific Team ID
//         const teamRMs = users.filter(user => {
//             const metadata = user.user_metadata || {};
//             const isRM = metadata.role_name?.toLowerCase() === 'rm';
            
//             // Logic: Must be an RM AND match the Team ID
//             // We use String() to ensure we aren't failing due to type mismatches
//             const matchesTeam = tlTeamId && String(metadata.team_id) === String(tlTeamId);

//             return isRM && matchesTeam;
//         });

//         console.log(`85teamLead.repository.ts, teamLead.repository.ts, Found ${teamRMs.length} RMs for Team ID: ${tlTeamId}`);

//         return teamRMs.map(user => ({
//             id: user.id,
//             email: user.email,
//             username: user.user_metadata?.username,
//             full_name: user.user_metadata?.full_name,
//             role: user.user_metadata?.role_name,
//             team_id: user.user_metadata?.team_id
//         }));
//     }
// };











// import { supabaseAdmin } from '../config';

// export const teamLeadRepository = {
//     /**
//      * Finds all users matching the Team ID of the provided TL ID
//      */
//     async findRMsByTL(tlId: string) {
//         // 1. Fetch all users from Supabase Auth
//         const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
//         if (error) throw error;

//         // 2. Find the person acting as the Team Lead in the list
//         const teamLead = users.find(u => u.id === tlId);
        
//         if (!teamLead) {
//             console.log("Error: No user found with ID:", tlId);
//             return [];
//         }

//         const tlTeamId = teamLead.user_metadata?.team_id;
//         console.log(`Targeting Team ID: ${tlTeamId} (Extracted from TL: ${teamLead.email})`);

//         if (!tlTeamId) {
//             console.log("Warning: This TL has no team_id in their metadata.");
//             return [];
//         }

//         // 3. Filter: Return EVERYONE who matches the team_id
//         // We remove the 'rm' role check temporarily to see if the data appears
//         const teamMembers = users.filter(user => {
//             const memberTeamId = user.user_metadata?.team_id;
            
//             // Log every user's team ID to the console so you can see the mismatch
//             console.log(`User: ${user.email} | TeamID: ${memberTeamId}`);

//             return String(memberTeamId) === String(tlTeamId) && user.id !== tlId;
//         });

//         console.log(`Total members found in team: ${teamMembers.length}`);

//         return teamMembers.map(user => ({
//             id: user.id,
//             email: user.email,
//             username: user.user_metadata?.username,
//             full_name: user.user_metadata?.full_name,
//             role: user.user_metadata?.role_name,
//             team_id: user.user_metadata?.team_id
//         }));
//     }
// };









import { supabaseAdmin } from '../config';

export const teamLeadRepository = {
    /**
     * Finds all users matching the Team ID of the provided TL ID
     */
    async findRMsByTL(tlId: string) {
        // 1. Fetch all users from Supabase Auth
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;

        // 2. Find the person acting as the Team Lead in the list
        const teamLead = users.find(u => u.id === tlId);
        
        if (!teamLead) {
            console.log("Error: No user found with ID:", tlId);
            return [];
        }

        // Helper function to extract team_id from potentially nested user_metadata
        const extractTeamId = (user: any) => {
            // Try to get from first level
            let teamId = user.user_metadata?.team_id;
            
            // If not found, try to get from nested user_metadata
            if (!teamId && user.user_metadata?.user_metadata) {
                teamId = user.user_metadata.user_metadata.team_id;
            }
            
            return teamId;
        };

        const tlTeamId = extractTeamId(teamLead);
        console.log(`Targeting Team ID: ${tlTeamId} (Extracted from TL: ${teamLead.email})`);

        if (!tlTeamId) {
            console.log("Warning: This TL has no team_id in their metadata.");
            return [];
        }

        // 3. Filter: Return EVERYONE who matches the team_id
        const teamMembers = users.filter(user => {
            if (user.id === tlId) return false; // Skip the TL themselves
            
            const memberTeamId = extractTeamId(user);
            
            // Log every user's team ID to the console so you can see the match
            console.log(`User: ${user.email} | TeamID: ${memberTeamId} | Match: ${memberTeamId === tlTeamId}`);

            return String(memberTeamId) === String(tlTeamId);
        });

        console.log(`Total members found in team: ${teamMembers.length}`);

        return teamMembers.map(user => {
            const teamId = extractTeamId(user);
            
            return {
                id: user.id,
                email: user.email,
                username: user.user_metadata?.username || user.user_metadata?.user_metadata?.username,
                full_name: user.user_metadata?.full_name || user.user_metadata?.user_metadata?.full_name,
                role: user.user_metadata?.role_name || user.user_metadata?.user_metadata?.role_name,
                team_id: teamId
            };
        });
    }
};


















