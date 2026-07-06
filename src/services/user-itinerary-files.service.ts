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

            // Get existing record
            // const existingRecord = await userItineraryFilesRepository.getByLeadId(data.leadId);

            const finalMetadata = {
                ...data.metadata,
                attachment_urls: validFiles,
                total_files: Object.values(validFiles).flat().length,
                created_at: new Date().toISOString()
            };

            const finalFilesForDB = validFiles;

            // if (existingRecord.success && existingRecord.data) {
            //     // Get existing metadata
            //     const existingMetadata = existingRecord.data.metadata || {};

            //     // Get existing attachment_urls from metadata
            //     const existingAttachments = existingMetadata.attachment_urls || {};

            //     // MERGE attachment_urls (this is what frontend expects)
            //     const mergedAttachments = { ...existingAttachments };

            //     for (const [serviceType, files] of Object.entries(validFiles)) {
            //         if (mergedAttachments[serviceType]) {
            //             // Service exists - add new files, avoid duplicates
            //             const existingUrls = new Set(mergedAttachments[serviceType].map((f: any) => f.url));
            //             const newFiles = files.filter(f => !existingUrls.has(f.url));
            //             mergedAttachments[serviceType] = [...mergedAttachments[serviceType], ...newFiles];
            //         } else {
            //             // New service - add it
            //             mergedAttachments[serviceType] = files;
            //         }
            //     }

            //     // Merge metadata
            //     finalMetadata = {
            //         ...existingMetadata,
            //         ...data.metadata,
            //         attachment_urls: mergedAttachments,
            //         total_files: Object.values(mergedAttachments).flat().length,
            //         updated_at: new Date().toISOString()
            //     };

            //     // Also merge files column for backward compatibility
            //     const existingFiles = existingRecord.data.files || {};
            //     finalFilesForDB = { ...existingFiles };
            //     for (const [serviceType, files] of Object.entries(validFiles)) {
            //         if (finalFilesForDB[serviceType]) {
            //             const existingUrls = new Set(finalFilesForDB[serviceType].map((f: any) => f.url));
            //             const newFiles = files.filter(f => !existingUrls.has(f.url));
            //             finalFilesForDB[serviceType] = [...finalFilesForDB[serviceType], ...newFiles];
            //         } else {
            //             finalFilesForDB[serviceType] = files;
            //         }
            //     }
            // } else {
            //     // No existing record - create new metadata with attachment_urls
            //     finalMetadata = {
            //         ...data.metadata,
            //         attachment_urls: validFiles,
            //         total_files: Object.values(validFiles).flat().length,
            //         created_at: new Date().toISOString()
            //     };
            // }

            // Save to file-only table (store in BOTH files column and metadata.attachment_urls)
            const result = await userItineraryFilesRepository.saveOrUpdate({
                leadId: data.leadId,
                files: finalFilesForDB,  // Store in files column
                metadata: finalMetadata,  // Store attachment_urls in metadata
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
            console.error('Error in saveFileItinerary:', error);
            return { success: false, message: error.message };
        }
    },

    async getFileItinerary(leadId: string): Promise<{ success: boolean; data?: any; exists: boolean; message?: string }> {
        const result = await userItineraryFilesRepository.getByLeadId(leadId);

        // Transform data to include attachment_urls from metadata
        if (result.success && result.data) {
            // Ensure attachment_urls is always present in the response
            if (!result.data.metadata?.attachment_urls && result.data.files) {
                // Fallback: use files column if metadata.attachment_urls doesn't exist
                result.data.metadata = {
                    ...result.data.metadata,
                    attachment_urls: result.data.files
                };
            }
        }

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