import axios from 'axios';
import FormData from 'form-data';
import { envConfig } from '../config';

export const s3UploadService = {
    async uploadToS3(fileBuffer: Buffer, fileName: string): Promise<string> {
        try {
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
        } catch (error: any) {
            console.error('S3 Upload Error:', error.message);
            throw new Error('Could not upload file to S3');
        }
    }
};