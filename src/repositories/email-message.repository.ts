import { supabaseAdmin } from '../config';
import { EmailCleanerService } from '../utils/email-cleaner.utils';

export const emailMessageRepository = {
    
    async createEmailMessage(payload: {
        tracking_id: string;
        parent_tracking_id: string | null;
        message_id: string | null;
        in_reply_to: string | null;
        direction: 'incoming' | 'outgoing';
        from_email: string;
        to_email: string[];
        cc_email: string[] | null;
        bcc_email: string[] | null;
        subject: string;
        body: string | null;
        html_body: string | null;
        status: string;
        lead_id: string | null;
        raw_headers: any | null;
        error: string | null;
    }) {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .insert({
                tracking_id: payload.tracking_id,
                parent_tracking_id: payload.parent_tracking_id,
                message_id: payload.message_id,
                in_reply_to: payload.in_reply_to,
                direction: payload.direction,
                from_email: payload.from_email,
                to_email: payload.to_email,
                cc_email: payload.cc_email,
                bcc_email: payload.bcc_email,
                subject: payload.subject,
                body: payload.body,
                html_body: payload.html_body,
                status: payload.status,
                lead_id: payload.lead_id,
                raw_headers: payload.raw_headers,
                error: payload.error,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create email message: ${error.message}`);
        }

        return data;
    },

    async getByTrackingId(trackingId: string) {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('tracking_id', trackingId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to fetch email message: ${error.message}`);
        }

        return data;
    },

    async getByMessageId(messageId: string) {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('message_id', messageId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to fetch email message by message_id: ${error.message}`);
        }

        return data;
    },

    async getByParentTrackingId(parentTrackingId: string) {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('parent_tracking_id', parentTrackingId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch email messages by parent_tracking_id: ${error.message}`);
        }

        return data;
    },

    async getByLeadId(leadId: string) {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch email messages by lead_id: ${error.message}`);
        }

        return data;
    },

    async resolveLeadByTrackingId(trackingId: string): Promise<string | null> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('lead_id')
            .eq('tracking_id', trackingId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to resolve lead by tracking_id: ${error.message}`);
        }

        return data?.lead_id || null;
    },

    async getByInReplyTo(messageId: string) {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('in_reply_to', messageId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to fetch email message by in_reply_to: ${error.message}`);
        }

        return data;
    },

    async getThreadByTrackingId(trackingId: string) {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch email thread: ${error.message}`);
        }

        return data;
    },

    async updateEmailMessage(id: string, payload: {
        status?: string;
        lead_id?: string | null;
        error?: string | null;
        body?: string | null;
        html_body?: string | null;
    }) {
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (payload.status !== undefined) updateData.status = payload.status;
        if (payload.lead_id !== undefined) updateData.lead_id = payload.lead_id;
        if (payload.error !== undefined) updateData.error = payload.error;
        if (payload.body !== undefined) updateData.body = EmailCleanerService.cleanEmailBody(payload.body as any);
        if (payload.html_body !== undefined) updateData.html_body = payload.html_body;

        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update email message: ${error.message}`);
        }

        return data;
    },

    async createIncomingEmail(payload: {
        tracking_id: string;
        parent_tracking_id: string | null;
        message_id: string | null;
        in_reply_to: string | null;
        from_email: string;
        to_email: string[];
        cc_email: string[] | null;
        bcc_email: string[] | null;
        subject: string;
        body: string | null;
        html_body: string | null;
        raw_headers: any | null;
        lead_id: string | null;
    }) {
        const cleanedBody = EmailCleanerService.cleanEmailBody(payload.body || '');

        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .insert({
                tracking_id: payload.tracking_id,
                parent_tracking_id: payload.parent_tracking_id,
                message_id: payload.message_id,
                in_reply_to: payload.in_reply_to,
                direction: 'incoming',
                from_email: payload.from_email,
                to_email: payload.to_email,
                cc_email: payload.cc_email,
                bcc_email: payload.bcc_email,
                subject: payload.subject,
                body: cleanedBody,
                html_body: payload.html_body,
                status: 'received',
                lead_id: payload.lead_id,
                raw_headers: payload.raw_headers,
                error: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to store incoming email: ${error.message}`);
        }

        return data;
    },

    async getByTrackingIdAndDirection(trackingId: string, direction: 'incoming' | 'outgoing') {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('tracking_id', trackingId)
            .eq('direction', direction)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            return null;
        }

        return data;
    },
};