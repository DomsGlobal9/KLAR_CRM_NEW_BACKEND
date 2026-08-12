import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';

// Intercept and suppress noisy third-party library logs (e.g. libsignal's hardcoded console.info("Closing session:", ...))
const silencePatterns = ['Closing session', 'SessionEntry'];

const originalConsoleInfo = console.info;
console.info = function (...args: any[]) {
    if (typeof args[0] === 'string' && silencePatterns.some(p => args[0].includes(p))) {
        return;
    }
    originalConsoleInfo.apply(console, args);
};

const originalConsoleLog = console.log;
console.log = function (...args: any[]) {
    if (typeof args[0] === 'string' && silencePatterns.some(p => args[0].includes(p))) {
        return;
    }
    originalConsoleLog.apply(console, args);
};

type ConnectionStatus = 'initializing' | 'waiting_qr' | 'ready' | 'disconnected';

class WhatsAppService {
    private sock: any = null;
    private isReady: boolean = false;
    private currentQrString: string | null = null;
    private connectionStatus: ConnectionStatus = 'initializing';

    constructor() {
        this.initializeClient();
    }

    private async initializeClient() {
        try {
            this.connectionStatus = 'initializing';
            const { state, saveCreds } = await useMultiFileAuthState('./whatsapp-session');

            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: 'silent' }),
            });

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('connection.update', (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.currentQrString = qr;
                    this.connectionStatus = 'waiting_qr';
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

                    this.isReady = false;
                    this.currentQrString = null;

                    if (isLoggedOut) {
                        try {
                            fs.rmSync('./whatsapp-session', { recursive: true, force: true });
                        } catch {}
                    }

                    this.connectionStatus = 'initializing';
                    setTimeout(() => this.initializeClient(), 2000);
                } else if (connection === 'open') {
                    this.isReady = true;
                    this.currentQrString = null;
                    this.connectionStatus = 'ready';
                }
            });
        } catch (err) {
            this.connectionStatus = 'disconnected';
        }
    }

    public async resetSession(): Promise<void> {
        this.isReady = false;
        this.currentQrString = null;
        this.connectionStatus = 'initializing';
        try {
            if (this.sock) {
                this.sock.end(undefined);
            }
        } catch {}
        try {
            fs.rmSync('./whatsapp-session', { recursive: true, force: true });
        } catch {}
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.initializeClient();
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
            return null;
        }
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned;
        }
        return cleaned;
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
        if (!this.isReady || !this.sock) {
            return false;
        }

        const formattedNumber = this.formatPhoneNumber(phoneNumber);
        if (!formattedNumber) {
            return false;
        }

        try {
            const jid = `${formattedNumber}@s.whatsapp.net`;
            await this.sock.sendMessage(jid, { text: message });
            return true;
        } catch (error: any) {
            return false;
        }
    }

    public getStatus(): boolean {
        return this.isReady;
    }
}

let whatsappInstance: WhatsAppService | null = null;

export default function getWhatsAppService() {
    if (!whatsappInstance) {
        whatsappInstance = new WhatsAppService();
    }
    return whatsappInstance;
}