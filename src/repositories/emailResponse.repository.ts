import { supabaseAdmin } from '../config';

export interface EmailLog {
    id: string;
    tracking_id: string;
    lead_id: string | null;
    message_id: string | null;
    in_reply_to: string | null;
    to_email: string[];
    cc_email: string[] | null;
    bcc_email: string[] | null;
    subject: string;
    status: string;
    error: string | null;
    created_at: string;
    updated_at: string;
}

export interface EmailReply {
    id: string;
    tracking_id: string | null;
    lead_id: string | null;
    from_email: string;
    to_email: string[] | null;
    subject: string | null;
    body: string | null;
    html_body: string | null;
    message_id: string | null;
    in_reply_to: string | null;
    raw_headers: any | null;
    created_at: string;
}

export const emailResponseRepository = {
    /**
     * Get email logs with filters
     */
    async getEmailLogs(params: {
        limit: number;
        offset: number;
        leadId?: string;
        status?: string;
        trackingId?: string;
        startDate?: string;
        endDate?: string;
    }) {
        let query = supabaseAdmin
            .from('email_logs')
            .select('*', { count: 'exact', head: false });

        // Apply filters
        if (params.leadId) {
            query = query.eq('lead_id', params.leadId);
        }
        if (params.status) {
            query = query.eq('status', params.status);
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

        // Apply pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as EmailLog[], total: count || 0 };
    },

    /**
     * Get email replies with filters
     */
    async getEmailReplies(params: {
        limit: number;
        offset: number;
        leadId?: string;
        trackingId?: string;
        startDate?: string;
        endDate?: string;
        unreadOnly?: boolean;
    }) {
        let query = supabaseAdmin
            .from('email_replies')
            .select('*', { count: 'exact', head: false });

        // Apply filters
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

        // Apply pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as EmailReply[], total: count || 0 };
    },

    /**
     * Get email logs by tracking ID
     */
    async getEmailLogsByTrackingId(trackingId: string): Promise<EmailLog[]> {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .select('*')
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as EmailLog[];
    },

    /**
     * Get replies by tracking ID
     */
    async getRepliesByTrackingId(trackingId: string): Promise<EmailReply[]> {
        const { data, error } = await supabaseAdmin
            .from('email_replies')
            .select('*')
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as EmailReply[];
    },

    /**
     * Get email logs by lead ID
     */
    async getEmailLogsByLeadId(leadId: string, limit: number, offset: number): Promise<EmailLog[]> {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data as EmailLog[];
    },

    /**
     * Get replies by lead ID
     */
    async getRepliesByLeadId(leadId: string, limit: number, offset: number): Promise<EmailReply[]> {
        const { data, error } = await supabaseAdmin
            .from('email_replies')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data as EmailReply[];
    },

    /**
     * Get recent replies
     */
    async getRecentReplies(limit: number, since: string): Promise<EmailReply[]> {
        const { data, error } = await supabaseAdmin
            .from('email_replies')
            .select('*')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as EmailReply[];
    },

    /**
     * Mark reply as read (if you add a read_status column)
     * Note: You'll need to add this column to your table first
     */
    async markReplyAsRead(replyId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('email_replies')
            .update({ read_status: true } as any)
            .eq('id', replyId);

        if (error) throw error;
    }
};