export const getAllowedRoles = (requesterRole?: string): string[] => {
    if (!requesterRole) return ['SUPERADMIN'];
    if (requesterRole === 'SUPERADMIN') return ['admin', 'rm'];
    if (requesterRole === 'admin') return ['rm'];
    return [];
};
