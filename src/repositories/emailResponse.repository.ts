import { supabaseAdmin } from '../config';

export interface EmailMessage {
    id: string;
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
    created_at: string;
    updated_at: string;
}

export const emailResponseRepository = {
    async getEmailMessages(params: {
        limit: number;
        offset: number;
        leadId?: string;
        status?: string;
        trackingId?: string;
        direction?: 'incoming' | 'outgoing';
        startDate?: string;
        endDate?: string;
    }) {
        let query = supabaseAdmin
            .from('email_messages')
            .select('*', { count: 'exact', head: false });

        if (params.leadId) {
            query = query.eq('lead_id', params.leadId);
        }
        if (params.status) {
            query = query.eq('status', params.status);
        }
        if (params.trackingId) {
            query = query.eq('tracking_id', params.trackingId);
        }
        if (params.direction) {
            query = query.eq('direction', params.direction);
        }
        if (params.startDate) {
            query = query.gte('created_at', params.startDate);
        }
        if (params.endDate) {
            query = query.lte('created_at', params.endDate);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as EmailMessage[], total: count || 0 };
    },

    async getIncomingEmails(params: {
        limit: number;
        offset: number;
        leadId?: string;
        trackingId?: string;
        startDate?: string;
        endDate?: string;
        unreadOnly?: boolean;
    }) {
        let query = supabaseAdmin
            .from('email_messages')
            .select('*', { count: 'exact', head: false })
            .eq('direction', 'incoming');

        if (params.leadId) {
            query = query.eq('lead_id', params.leadId);
        }
        if (params.trackingId) {
            query = query.eq('tracking_id', params.trackingId);
        }
        if (params.startDate) {
            query = query.gte('created_at', params.startDate);
        }
        if (params.endDate) {
            query = query.lte('created_at', params.endDate);
        }
        if (params.unreadOnly) {
            query = query.eq('status', 'received');
        }

        query = query
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as EmailMessage[], total: count || 0 };
    },

    async getOutgoingEmails(params: {
        limit: number;
        offset: number;
        leadId?: string;
        trackingId?: string;
        startDate?: string;
        endDate?: string;
    }) {
        let query = supabaseAdmin
            .from('email_messages')
            .select('*', { count: 'exact', head: false })
            .eq('direction', 'outgoing');

        if (params.leadId) {
            query = query.eq('lead_id', params.leadId);
        }
        if (params.trackingId) {
            query = query.eq('tracking_id', params.trackingId);
        }
        if (params.startDate) {
            query = query.gte('created_at', params.startDate);
        }
        if (params.endDate) {
            query = query.lte('created_at', params.endDate);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as EmailMessage[], total: count || 0 };
    },

    async getEmailMessagesByTrackingId(trackingId: string): Promise<EmailMessage[]> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as EmailMessage[];
    },

    async getEmailThreadByTrackingId(trackingId: string): Promise<EmailMessage[]> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as EmailMessage[];
    },

    async getEmailMessagesByLeadId(leadId: string, limit: number, offset: number): Promise<EmailMessage[]> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data as EmailMessage[];
    },

    async getRecentIncomingEmails(limit: number, since: string): Promise<EmailMessage[]> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('direction', 'incoming')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as EmailMessage[];
    },

    async markEmailAsRead(messageId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('email_messages')
            .update({ status: 'read' })
            .eq('id', messageId);

        if (error) throw error;
    },

    async getEmailByMessageId(messageId: string): Promise<EmailMessage | null> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('message_id', messageId)
            .maybeSingle();

        if (error) throw error;
        return data as EmailMessage | null;
    },

    async getEmailsByParentTrackingId(parentTrackingId: string): Promise<EmailMessage[]> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('parent_tracking_id', parentTrackingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as EmailMessage[];
    },

    async getEmailConversation(trackingId: string): Promise<{
        messages: EmailMessage[];
        total: number;
    }> {
        const { data, error, count } = await supabaseAdmin
            .from('email_messages')
            .select('*', { count: 'exact', head: false })
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { messages: data as EmailMessage[], total: count || 0 };
    },

    async getLatestEmailByTrackingId(trackingId: string): Promise<EmailMessage | null> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data as EmailMessage | null;
    },

    async getEmailStatsByLeadId(leadId: string): Promise<{
        total: number;
        incoming: number;
        outgoing: number;
        lastMessageAt: string | null;
    }> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('direction, created_at', { count: 'exact' })
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const incoming = data?.filter(msg => msg.direction === 'incoming').length || 0;
        const outgoing = data?.filter(msg => msg.direction === 'outgoing').length || 0;
        const lastMessageAt = data && data.length > 0 ? data[0].created_at : null;

        return {
            total: data?.length || 0,
            incoming,
            outgoing,
            lastMessageAt,
        };
    }
};