import { userItineraryFilesRepository } from '../repositories/user-itinerary-files.repository';
import { leadRepository, stageRepository } from '../repositories';
import { envConfig } from '../config';

export const userItineraryFilesService = {

    async saveFileItinerary(data: {
        leadId: string;
        files: Record<string, { name: string; url: string }[]>;
        metadata?: Record<string, any>;
        userId?: string;
    }): Promise<{ success: boolean; data?: any; message?: string }> {
        try {
            // Check if lead exists
            const leadExists = await leadRepository.isLeadExists(data.leadId);
            if (!leadExists) {
                return { success: false, message: 'Lead not found' };
            }

            // Filter out blob URLs (keep only S3 URLs)
            const validFiles: Record<string, { name: string; url: string }[]> = {};
            for (const [serviceType, files] of Object.entries(data.files)) {
                validFiles[serviceType] = files.filter(file =>
                    file.url &&
                    (file.url.startsWith('https://') || file.url.startsWith('http://')) &&
                    !file.url.includes('blob:')
                );
            }

            if (Object.keys(validFiles).length === 0) {
                return { success: false, message: 'No valid files provided' };
            }

            // Save to file-only table
            const result = await userItineraryFilesRepository.saveOrUpdate({
                leadId: data.leadId,
                files: validFiles,
                metadata: {
                ...data.metadata,
                type: 'file',
            },
                userId: data.userId
            });

            if (!result.success) {
                return { success: false, message: result.error };
            }

            const stageName = await stageRepository.getStageNameById(envConfig.ITIENARY_STAGE);
            if (stageName) {
                await leadRepository.updateLeadStageOnly(data.leadId, stageName);
            }

            return {
                success: true,
                data: result.data,
                message: 'File-only itinerary created successfully'
            };

        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    async getFileItinerary(leadId: string): Promise<{ success: boolean; data?: any; exists: boolean; message?: string }> {
        const result = await userItineraryFilesRepository.getByLeadId(leadId);
        return {
            success: result.success,
            data: result.data,
            exists: !!result.data,
            message: result.error || (result.data ? 'Found' : 'No file itinerary found')
        };
    },

    async hasFileItinerary(leadId: string): Promise<boolean> {
        return userItineraryFilesRepository.exists(leadId);
    },

    async deleteFileItinerary(leadId: string): Promise<{ success: boolean; message?: string }> {
        const result = await userItineraryFilesRepository.deleteByLeadId(leadId);
        if (result.success) {
            return { success: true, message: 'File itinerary deleted successfully' };
        }
        return { success: false, message: result.error };
    }
};