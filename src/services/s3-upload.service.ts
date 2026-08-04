import axios from 'axios';
import FormData from 'form-data';
import { envConfig } from '../config';

export const s3UploadService = {
    async uploadToS3(fileBuffer: Buffer, fileName: string): Promise<string> {
        try {
            console.log(`[s3UploadService] S3 upload commented out for testing. Direct email mode active for file: ${fileName}`);

            /*
            // =======================================================
            // S3 Upload logic commented down for testing direct email sending
            // =======================================================
            const form = new FormData();

            const isPdf = fileName.endsWith('.pdf');

            // Content type mapping
            const contentTypes: Record<string, string> = {
                '.pdf': 'application/pdf',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
            };

            const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
            const contentType = contentTypes[extension] || 'image/jpeg';

            form.append('file', fileBuffer, {
                filename: fileName,
                contentType: contentType,
            });

            const S3_SERVER_URL = `${envConfig.S3_SERVER_URL}${isPdf ? '/upload-pdf' : '/upload-image'}`;

            const response = await axios.post(S3_SERVER_URL, form, {
                headers: {
                    ...form.getHeaders(),
                }
            });

            if (response.data.status === 'success') {
                return response.data.data.public_url;
            }

            throw new Error('Upload failed: ' + response.data.message);
            */

            // Return safe placeholder URL for direct email sending test
            return `https://direct-email-mode.local/${encodeURIComponent(fileName)}`;
        } catch (error: any) {
            console.error('[s3UploadService] Error:', error.message);
            throw new Error('Could not upload file to S3');
        }
    }
};