import axios from 'axios';
import FormData from 'form-data';
import { envConfig } from '../config/env.config';
import { userRepository } from '../repositories/user.repository';
import { UpdateSelfPayload } from '../interfaces/user.interface';

export const userService = {

    /**
     * Upload image to S3
     */
    async uploadImageToS3(imageBuffer: Buffer, fileName: string): Promise<string> {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

        if (!allowedExtensions.includes(ext)) {
            throw new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
        }

        const form = new FormData();
        form.append('file', imageBuffer, {
            filename: fileName,
            contentType: `image/${ext.substring(1)}`,
        });

        const S3_SERVER_URL = `${envConfig.S3_SERVER_URL}/upload-image`;

        const response = await axios.post(S3_SERVER_URL, form, {
            headers: {
                ...form.getHeaders(),
            },
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
        });

        if (response.data.status === 'success') {
            return response.data.data.public_url;
        }

        throw new Error('Upload failed: ' + response.data.message);
    },

    /**
     * Get self user details
     */
    async getMe(userId: string) {
        return userRepository.getById(userId);
    },

    /**
     * Update self user metadata with image upload
     * Dynamically updates any fields sent from frontend
     */
    async updateSelf(
        userId: string,
        payload: UpdateSelfPayload,
        imageBuffer?: Buffer,
        originalName?: string
    ) {
        const { data } = await userRepository.listUsers();

        if (payload.username) {
            const existingUser = data.users.find(
                u => u.id !== userId && u.user_metadata?.username === payload.username
            );
            if (existingUser) {
                throw new Error('Username already taken');
            }
        }

        if (payload.email) {
            const existingUser = data.users.find(
                u => u.id !== userId && u.email === payload.email
            );
            if (existingUser) {
                throw new Error('Email already taken');
            }
        }

        const user = data.users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        const currentMetadata = user.user_metadata || {};
        const updates: any = {};
        let hasChanges = false;

        const reservedFields = ['email', 'image'];

        for (const [key, value] of Object.entries(payload)) {
            if (key === 'email') {
                continue;
            }

            if (key === 'image' && !imageBuffer) {
                if (value !== undefined && value !== currentMetadata[key]) {
                    updates[key] = value;
                    hasChanges = true;
                }
                continue;
            }

            if (!reservedFields.includes(key) && value !== undefined && value !== null) {
                if (value !== currentMetadata[key]) {
                    updates[key] = value;
                    hasChanges = true;
                }
            }
        }

        let imageUrl: string | undefined;
        if (imageBuffer && originalName) {
            const ext = originalName.substring(originalName.lastIndexOf('.'));
            const fileName = `profile-${userId}-${Date.now()}${ext}`;
            imageUrl = await this.uploadImageToS3(imageBuffer, fileName);

            if (imageUrl !== currentMetadata.image) {
                updates.image = imageUrl;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            const updatedMetadata = {
                ...currentMetadata,
                ...updates
            };

            await userRepository.updateUserMetadata(userId, updatedMetadata);
        }

        let emailUpdated = false;
        if (payload.email !== undefined && payload.email !== user.email) {
            await userRepository.updateUserEmail(userId, payload.email);
            emailUpdated = true;
        }

        const updatedUser = await userRepository.getById(userId);

        const updatedFields: any = {};
        for (const key of Object.keys(updates)) {
            updatedFields[key] = updates[key];
        }
        if (emailUpdated) {
            updatedFields.email = payload.email;
        }

        return {
            user: updatedUser,
            updated_fields: updatedFields
        };
    }
};