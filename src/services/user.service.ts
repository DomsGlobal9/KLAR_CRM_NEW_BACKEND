import { userRepository } from '../repositories/user.repository';
import { UpdateSelfPayload } from '../interfaces/user.interface';



export const userService = {

    /**
     * Get self user details
     * @param userId 
     * @returns 
     */
    async getMe(userId: string) {
        return userRepository.getById(userId);
    },

    /**
     * Update self user metadata
     * @param userId 
     * @param payload 
     * @returns 
     */
    async updateSelf(userId: string, payload: UpdateSelfPayload) {

        const { data } = await userRepository.listUsers();

        if (
            payload.username &&
            data.users.some(
                u =>
                    u.id !== userId &&
                    u.user_metadata?.username === payload.username
            )
        ) {
            throw new Error('Username already taken');
        }

        const user = data.users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        const updatedMetadata = {
            ...user.user_metadata,
            username: payload.username ?? user.user_metadata?.username,
            full_name: payload.full_name ?? user.user_metadata?.full_name,
            phone: payload.phone ?? user.user_metadata?.phone,
            department: payload.department ?? user.user_metadata?.department,
            notes: payload.notes ?? user.user_metadata?.notes
        };

        return userRepository.updateUserMetadata(userId, updatedMetadata);
    },
};








