import { emailReaderService } from '../services/emailReader.service';



export const startEmailReaderJob = async () => {
    try {
        console.log('Starting Email Reader Job...');
        await emailReaderService.start();
    } catch (err) {
        console.error('Email Reader failed:', err);
    }
};