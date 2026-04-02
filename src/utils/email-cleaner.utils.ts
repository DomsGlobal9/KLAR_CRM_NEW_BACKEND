export class EmailCleanerService {
    
    static cleanEmailBody(rawBody: string): string {
        if (!rawBody) return '';
        
        let cleaned = rawBody;
        
        cleaned = cleaned.replace(/On.*(wrote|said):\s*\n>.*/gs, '');
        
        cleaned = cleaned.replace(/-----Original Message-----[\s\S]*/i, '');
        
        cleaned = cleaned.replace(/From:.*\nSent:.*\nTo:.*\nSubject:.*\n/gi, '');
        
        cleaned = cleaned.replace(/^>.*$/gm, '');
        
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        cleaned = cleaned.trim();
        
        return cleaned;
    }
    
    static extractNewMessage(rawBody: string): string {
        if (!rawBody) return '';
        
        const patterns = [
            /(On.*wrote:)/,
            /(From:.*Sent:)/,
            /(-----Original Message-----)/,
            /(>)/gm
        ];
        
        let newMessage = rawBody;
        
        for (const pattern of patterns) {
            const match = newMessage.match(pattern);
            if (match) {
                newMessage = newMessage.split(pattern)[0];
                break;
            }
        }
        
        newMessage = newMessage.split('\n')
            .filter(line => !line.trim().startsWith('>'))
            .join('\n');
        
        return newMessage.trim();
    }
    
    static formatEmailThread(originalEmail: any, replies: any[]): any[] {
        const thread = [];
        
        if (originalEmail) {
            thread.push({
                type: 'outbound',
                from: 'KLAR-CRM',
                to: originalEmail.to_email,
                subject: originalEmail.subject,
                body: originalEmail.body || originalEmail.html_body,
                timestamp: originalEmail.created_at,
                isOriginal: true
            });
        }
        
        for (const reply of replies) {
            thread.push({
                type: 'inbound',
                from: reply.from_email,
                to: reply.to_email,
                subject: reply.subject,
                body: EmailCleanerService.cleanEmailBody(reply.body || ''),
                fullBody: reply.body,
                timestamp: reply.created_at,
                isOriginal: false
            });
        }
        
        return thread;
    }
}