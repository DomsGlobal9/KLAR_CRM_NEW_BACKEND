import axios from 'axios';
import FormData from 'form-data';
import { envConfig } from '../config';
import { supabaseAdmin } from '../config/supabase.config';

export const s3UploadService = {
    async uploadToS3(fileBuffer: Buffer, fileName: string): Promise<string> {
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
        const contentType = contentTypes[extension] || 'application/octet-stream';

        // 1. Try external S3 upload server
        if (envConfig.S3_SERVER_URL) {
            try {
                const form = new FormData();
                form.append('file', fileBuffer, {
                    filename: fileName,
                    contentType: contentType,
                });

                const S3_SERVER_URL = `${envConfig.S3_SERVER_URL}${isPdf ? '/upload-pdf' : '/upload-image'}`;

                const response = await axios.post(S3_SERVER_URL, form, {
                    headers: {
                        ...form.getHeaders(),
                    },
                    timeout: 8000
                });

                if (response.data && (response.data.status === 'success' || response.data.success)) {
                    const publicUrl = response.data.data?.public_url || response.data.public_url || response.data.url;
                    if (publicUrl) return publicUrl;
                }
                console.warn('[s3UploadService] S3 microservice returned non-success, falling back to Supabase:', response.data?.message || response.data);
            } catch (s3Error: any) {
                console.warn('[s3UploadService] S3 microservice error, falling back to Supabase:', s3Error.response?.data || s3Error.message);
            }
        }

        // 2. Fallback to Supabase Storage bucket 'itineraries'
        try {
            const sanitizedPath = fileName.replace(/[^a-zA-Z0-9./_-]/g, '_');
            const { data, error } = await supabaseAdmin.storage
                .from('itineraries')
                .upload(sanitizedPath, fileBuffer, {
                    contentType,
                    upsert: true
                });

            if (error) {
                console.error('[s3UploadService] Supabase storage upload error:', error.message);
                throw new Error(`Supabase upload failed: ${error.message}`);
            }

            const { data: urlData } = supabaseAdmin.storage
                .from('itineraries')
                .getPublicUrl(sanitizedPath);

            if (urlData?.publicUrl) {
                return urlData.publicUrl;
            }

            throw new Error('Failed to generate public URL from Supabase storage');
        } catch (fallbackError: any) {
            console.error('[s3UploadService] Fallback error:', fallbackError.message);
            throw new Error(fallbackError.message || 'Could not upload file to storage');
        }
    }
};