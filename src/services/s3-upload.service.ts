import axios from 'axios';
import FormData from 'form-data';
import { envConfig } from '../config';

export const s3UploadService = {
    async uploadToS3(pdfBuffer: Buffer, fileName: string): Promise<string> {
        try {
            const form = new FormData();
            // We append the buffer as a file named 'file' to match your Postman screenshot
            form.append('file', pdfBuffer, {
                filename: fileName,
                contentType: 'application/pdf',
            });

            // Replace with your actual S3 Server URL
            const S3_SERVER_URL = `${envConfig.S3_SERVER_URL}/upload-pdf`; 

            const response = await axios.post(S3_SERVER_URL, form, {
                headers: {
                    ...form.getHeaders(),
                    // Include Authorization if your S3 server requires the same token
                }
            });

            if (response.data.status === 'success') {
                return response.data.data.public_url;
            }
            
            throw new Error('Upload failed: ' + response.data.message);
        } catch (error: any) {
            console.error('S3 Upload Error:', error.message);
            throw new Error('Could not upload PDF to S3');
        }
    }
};
