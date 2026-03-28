import { emailReaderService } from '../services/emailReader.service';

export const startEmailReaderJob = async () => {
    try {
        console.log('Starting Email Reader Job...');

        await emailReaderService.connect();

        const POLL_INTERVAL = 30000;

        const pollEmails = async () => {
            try {
                await emailReaderService.readEmails();
            } catch (err) {
                console.error('Email reader error:', err);
            } finally {
                setTimeout(pollEmails, POLL_INTERVAL);
            }
        };

        pollEmails();

        console.log(`Email polling started (every ${POLL_INTERVAL / 1000} sec)`);

    } catch (error) {
        console.error('Failed to start email reader job:', error);
    }
};