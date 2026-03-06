import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

class WhatsAppService {
    private client: Client;
    private isReady: boolean = false;

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
            puppeteer: { headless: true, args: ['--no-sandbox'] }
        });

        this.client.on('qr', (qr) => {
            console.log('Scan QR code with WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('WhatsApp client ready');
            this.isReady = true;
        });

        this.client.initialize();
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
        if (!this.isReady) return false;
        try {
            const chatId = `${phoneNumber.replace(/\D/g, '')}@c.us`;
            await this.client.sendMessage(chatId, message);
            return true;
        } catch (error) {
            console.error('WhatsApp send failed:', error);
            return false;
        }
    }
}

export default new WhatsAppService();