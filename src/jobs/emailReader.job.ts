import { emailReaderService } from '../services/emailReader.service';



export const startEmailReaderJob = async () => {
    try {
        console.log('Starting Email Reader Job...');
        await emailReaderService.start();
    } catch (err) {
        console.error('Email Reader failed:', err);
    }
};

// export const startEmailReaderJob = async () => {
//     try {
//         console.log('Starting Email Reader Job...');

//         const POLL_INTERVAL = 30000;

//         const pollEmails = async () => {
//             try {
//                 if (!emailReaderService['isConnected']) {
//                     console.log('🔄 Reconnecting to IMAP...');
//                     await emailReaderService.connect();
//                 }
//                 await emailReaderService.readEmails();
//             } catch (err) {
//                 console.error('Email reader error:', err);
//                 emailReaderService['isConnected'] = false;
//             } finally {
//                 setTimeout(pollEmails, POLL_INTERVAL);
//             }
//         };

//         await emailReaderService.connect();
//         pollEmails();

//         console.log(`Email polling started (every ${POLL_INTERVAL / 1000} sec)`);

//     } catch (error) {
//         console.error('Failed to start email reader job:', error);
//     }
// };