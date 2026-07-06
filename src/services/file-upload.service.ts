import { s3UploadService } from './s3-upload.service';
import { leadRepository } from '../repositories/lead.repository';

export interface FileUploadResult {
    success: boolean;
    fileUrl?: string;
    fileName?: string;
    message?: string;
    error?: string;
}

export const fileUploadService = {

    validateFile(file: Express.Multer.File, allowedTypes: string[], maxSizeMB: number = 5): { valid: boolean; error?: string } {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }
        if (!allowedTypes.includes(file.mimetype)) {
            return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
        }
        return { valid: true };
    },

    generateFileName(leadId: string, serviceType: string, originalName: string): string {
        const timestamp = Date.now();
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `leads/${leadId}/${serviceType}/${timestamp}_${sanitizedName}`;
    },

    async uploadPdf(file: Express.Multer.File, leadId: string, serviceType: string): Promise<FileUploadResult> {
        try {
            const validation = this.validateFile(file, ['application/pdf'], 5);
            if (!validation.valid) return { success: false, error: validation.error };

            const leadExists = await leadRepository.isLeadExists(leadId);
            if (!leadExists) return { success: false, error: 'Lead not found' };

            const fileName = this.generateFileName(leadId, serviceType, file.originalname);
            // This will call your existing s3UploadService.uploadToS3
            const fileUrl = await s3UploadService.uploadToS3(file.buffer, fileName);

            return { success: true, fileUrl, fileName, message: 'PDF uploaded successfully' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to upload PDF' };
        }
    },

    async uploadImage(file: Express.Multer.File, leadId: string, serviceType: string): Promise<FileUploadResult> {
        try {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const validation = this.validateFile(file, allowedTypes, 5);
            if (!validation.valid) return { success: false, error: validation.error };

            const leadExists = await leadRepository.isLeadExists(leadId);
            if (!leadExists) return { success: false, error: 'Lead not found' };

            const fileName = this.generateFileName(leadId, serviceType, file.originalname);
            // Your s3UploadService currently only handles PDF. You need to handle images.
            // Option 1: Add an uploadImage method to s3UploadService
            // Option 2: Send to different endpoint
            const fileUrl = await s3UploadService.uploadToS3(file.buffer, fileName);

            return { success: true, fileUrl, fileName, message: 'Image uploaded successfully' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to upload image' };
        }
    },
};