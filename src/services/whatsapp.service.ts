import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';

type ConnectionStatus = 'initializing' | 'waiting_qr' | 'ready' | 'disconnected';

class WhatsAppService {
    private client: Client;
    private isReady: boolean = false;
    private currentQrString: string | null = null;
    private connectionStatus: ConnectionStatus = 'initializing';

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './whatsapp-session'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
            }
        });

        this.client.on('qr', (qr) => {
            this.currentQrString = qr;
            this.connectionStatus = 'waiting_qr';
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log(`⏳ Loading WhatsApp: ${percent}% — ${message}`);
        });

        this.client.on('authenticated', () => {
            console.log('🔐 WhatsApp authenticated');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('🔐 Auth failed:', msg);
            this.isReady = false;
            this.connectionStatus = 'disconnected';
            this.restartClient();
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp client ready');
            this.isReady = true;
            this.currentQrString = null;
            this.connectionStatus = 'ready';
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp disconnected:', reason);
            this.isReady = false;
            this.currentQrString = null;
            this.connectionStatus = 'disconnected';
            this.restartClient();
        });

        this.initializeClient();
    }

    private initializeClient() {
        try {
            this.connectionStatus = 'initializing';
            this.client.initialize();
        } catch (err) {
            console.error('Failed to initialize WhatsApp client:', err);
            this.connectionStatus = 'disconnected';
        }
    }

    private restartClient() {
        console.log('🔄 Restarting WhatsApp client in 5s...');
        setTimeout(() => {
            this.client.destroy()
                .then(() => this.initializeClient())
                .catch((err) => {
                    console.error('Error destroying client:', err);
                    this.initializeClient();
                });
        }, 5000);
    }

    public async getQrDataUrl(): Promise<string | null> {
        if (!this.currentQrString) return null;
        try {
            return await QRCode.toDataURL(this.currentQrString, { width: 300, margin: 2 });
        } catch {
            return null;
        }
    }

    public getQrString(): string | null {
        return this.currentQrString;
    }

    public getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    private isValidPhoneNumber(phoneNumber: string): boolean {
        if (!phoneNumber) return false;
        const cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length < 10) return false;
        if (phoneNumber.startsWith('+') || cleaned.length >= 12) return true;
        if (cleaned.length === 10) return true;
        return false;
    }

    private formatPhoneNumber(phoneNumber: string): string | null {
        if (!this.isValidPhoneNumber(phoneNumber)) {
            console.log(`⚠️ Invalid phone number format: ${phoneNumber}`);
            return null;
        }
        let cleaned = phoneNumber.replace(/\D/g, '');
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