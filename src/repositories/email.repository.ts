import { supabaseAdmin } from '../config';

export const emailRepository = {

    /**
     * Create email log (when sending email)
     */
    async createEmailLog(payload: {
        tracking_id: string;
        lead_id?: string | null;
        message_id?: string | null;
        to_email: string[];
        subject: string;
        status?: string;
    }) {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .insert({
                tracking_id: payload.tracking_id,
                lead_id: payload.lead_id || null,
                message_id: payload.message_id || null,
                to_email: payload.to_email,
                subject: payload.subject,
                status: payload.status || 'sent',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create email log: ${error.message}`);
        }

        return data;
    },

    /**
     * Get email log by tracking_id
     */
    async getByTrackingId(trackingId: string) {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .select('*')
            .eq('tracking_id', trackingId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to fetch email log: ${error.message}`);
        }

        return data;
    },

    /**
     * Get email log by message_id (for threading)
     */
    async getByMessageId(messageId: string) {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .select('*')
            .eq('message_id', messageId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to fetch email log by message_id: ${error.message}`);
        }

        return data;
    },

    /**
     * Store incoming email (IMAP)
     */
    async createEmailReply(payload: {
        tracking_id?: string | null;
        lead_id?: string | null;
        from_email: string;
        to_email?: string[];
        subject?: string;
        body?: string;
        html_body?: string;
        message_id?: string;
        in_reply_to?: string;
        raw_headers?: any;
    }) {
        const { data, error } = await supabaseAdmin
            .from('email_replies')
            .insert({
                tracking_id: payload.tracking_id || null,
                lead_id: payload.lead_id || null,
                from_email: payload.from_email,
                to_email: payload.to_email || null,
                subject: payload.subject || null,
                body: payload.body || null,
                html_body: payload.html_body || null,
                message_id: payload.message_id || null,
                in_reply_to: payload.in_reply_to || null,
                raw_headers: payload.raw_headers || null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to store email reply: ${error.message}`);
        }

        return data;
    },

    /**
     * Resolve lead_id using tracking_id
     */
    async resolveLeadByTrackingId(trackingId: string): Promise<string | null> {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .select('lead_id')
            .eq('tracking_id', trackingId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to resolve lead by tracking_id: ${error.message}`);
        }

        return data?.lead_id || null;
    },

    /**
     * Resolve lead_id using message_id (reply threading)
     */
    async resolveLeadByMessageId(messageId: string): Promise<string | null> {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .select('lead_id')
            .eq('message_id', messageId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to resolve lead by message_id: ${error.message}`);
        }

        return data?.lead_id || null;
    },

    async createIncomingEmail(payload: {
        tracking_id?: string | null;
        from_email: string;
        subject: string;
        body_text?: string;
        body_html?: string;
    }): Promise<void> {
        const { error } = await supabaseAdmin
            .from('email_replies')
            .insert({
                tracking_id: payload.tracking_id || null,
                from_email: payload.from_email,
                subject: payload.subject || null,
                body: payload.body_text || null,
                html_body: payload.body_html || null,
                created_at: new Date().toISOString()
            });

        if (error) {
            throw new Error(`Failed to store incoming email: ${error.message}`);
        }
    },

};