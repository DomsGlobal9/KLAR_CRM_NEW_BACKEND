import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

class WhatsAppService {
    private client: Client;
    private isReady: boolean = false;

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './whatsapp-session'
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.client.on('qr', (qr) => {
            // console.log('\n🔴 SCAN QR CODE WITH WHATSAPP:');
            // qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp client ready');
            this.isReady = true;
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp disconnected:', reason);
            this.isReady = false;
        });

        this.client.initialize();
    }

    private isValidPhoneNumber(phoneNumber: string): boolean {
        if (!phoneNumber) return false;

        // Remove all non-numeric characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // Must have at least 10 digits (with or without country code)
        if (cleaned.length < 10) return false;

        // If it has country code (starts with + or has 12+ digits), accept it
        if (phoneNumber.startsWith('+') || cleaned.length >= 12) {
            return true;
        }

        // If it's exactly 10 digits without +, it's valid (we'll add 91 later)
        if (cleaned.length === 10) {
            return true;
        }

        return false;
    }

    private formatPhoneNumber(phoneNumber: string): string | null {
        if (!this.isValidPhoneNumber(phoneNumber)) {
            console.log(`⚠️ Invalid phone number format: ${phoneNumber}`);
            return null;
        }

        // Remove all non-numeric characters
        let cleaned = phoneNumber.replace(/\D/g, '');

        // If it's 10 digits, add India country code
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned;
        }

        return cleaned;
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
        if (!this.isReady) {
            console.log('⏳ WhatsApp client not ready');
            return false;
        }

        const formattedNumber = this.formatPhoneNumber(phoneNumber);

        if (!formattedNumber) {
            console.log(`❌ Skipping invalid number: ${phoneNumber}`);
            return false;
        }

        try {
            const chatId = `${formattedNumber}@c.us`;
            console.log(`📤 Sending to ${formattedNumber}...`);

            await this.client.sendMessage(chatId, message);
            console.log(`✅ Sent to ${formattedNumber}`);
            return true;

        } catch (error: any) {
            console.log(`❌ Failed to send to ${phoneNumber}: ${error.message || 'Unknown error'}`);
            return false;
        }
    }

    public getStatus(): boolean {
        return this.isReady;
    }
}

export default new WhatsAppService();