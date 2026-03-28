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
     * Only updates fields that have changed
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


        if (payload.username !== undefined && payload.username !== currentMetadata.username) {
            updates.username = payload.username;
            hasChanges = true;
        }

        if (payload.full_name !== undefined && payload.full_name !== currentMetadata.full_name) {
            updates.full_name = payload.full_name;
            hasChanges = true;
        }

        if (payload.phone !== undefined && payload.phone !== currentMetadata.phone) {
            updates.phone = payload.phone;
            hasChanges = true;
        }

        if (payload.department !== undefined && payload.department !== currentMetadata.department) {
            updates.department = payload.department;
            hasChanges = true;
        }

        if (payload.notes !== undefined && payload.notes !== currentMetadata.notes) {
            updates.notes = payload.notes;
            hasChanges = true;
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
        } else if (payload.image !== undefined && payload.image !== currentMetadata.image) {
            updates.image = payload.image;
            hasChanges = true;
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

        return {
            user: updatedUser,
            updated_fields: {
                ...updates,
                email: emailUpdated ? payload.email : undefined
            }
        };
    }
};