import { emailReaderService } from '../services/emailReader.service';



export const startEmailReaderJob = async () => {
    try {

        await emailReaderService.start();
    } catch (err) {

    }
};