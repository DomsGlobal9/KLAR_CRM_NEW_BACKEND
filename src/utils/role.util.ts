export const getAllowedRoles = (requesterRole?: string): string[] => {
    if (!requesterRole) return ['superadmin'];
    if (requesterRole === 'superadmin') return ['admin', 'rm'];
    if (requesterRole === 'admin') return ['rm'];
    return [];
};
