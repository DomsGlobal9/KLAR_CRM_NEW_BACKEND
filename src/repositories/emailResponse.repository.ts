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
    // 🔍 DEBUG: Log incoming parameters
    console.log('\n📧 ===== EMAIL REPLIES REPOSITORY =====');
    console.log('🔹 Input Parameters:', {
        limit: params.limit,
        offset: params.offset,
        leadId: params.leadId || 'NOT PROVIDED',
        trackingId: params.trackingId || 'NOT PROVIDED',
        startDate: params.startDate || 'NOT PROVIDED',
        endDate: params.endDate || 'NOT PROVIDED',
        unreadOnly: params.unreadOnly || false
    });

    let query = supabaseAdmin
        .from('email_replies')
        .select('*', { count: 'exact', head: false });

    // Apply filters
    if (params.leadId) {
        console.log('🔹 Applying filter: lead_id =', params.leadId);
        query = query.eq('lead_id', params.leadId);
    }
    if (params.trackingId) {
        console.log('🔹 Applying filter: tracking_id =', params.trackingId);
        query = query.eq('tracking_id', params.trackingId);
    }
    if (params.startDate) {
        console.log('🔹 Applying filter: created_at >=', params.startDate);
        query = query.gte('created_at', params.startDate);
    }
    if (params.endDate) {
        console.log('🔹 Applying filter: created_at <=', params.endDate);
        query = query.lte('created_at', params.endDate);
    }
    if (params.unreadOnly) {
        console.log('🔹 Applying filter: unreadOnly = true');
        // Note: This filter isn't actually applied yet - you need to add it
        // query = query.eq('read_status', false);
    }

    // Apply pagination and ordering
    const rangeStart = params.offset;
    const rangeEnd = params.offset + params.limit - 1;
    console.log(`🔹 Pagination: rows ${rangeStart} to ${rangeEnd} (limit: ${params.limit})`);
    
    query = query
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);

    // 🔍 DEBUG: Log the actual query being executed
    console.log('🔹 Executing Supabase query...');
    console.log('🔹 Query details:', {
        table: 'email_replies',
        order: 'created_at DESC',
        range: `${rangeStart}-${rangeEnd}`
    });

    const { data, error, count } = await query;

    if (error) {
        console.error('❌ Database Error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        throw error;
    }

    // 🔍 DEBUG: Log the results
    console.log('🔹 Query Results:', {
        totalCount: count || 0,
        returnedCount: data?.length || 0,
        hasData: data && data.length > 0
    });

    if (data && data.length > 0) {
        console.log('🔹 Sample Data (First Record):', {
            id: data[0].id,
            subject: data[0].subject,
            from_email: data[0].from_email,
            to_email: data[0].to_email,
            lead_id: data[0].lead_id,
            tracking_id: data[0].tracking_id,
            created_at: data[0].created_at,
            body_preview: data[0].body?.substring(0, 100) + '...' || 'No body'
        });
        
        console.log('🔹 Sample Data (Last Record):', {
            id: data[data.length - 1].id,
            subject: data[data.length - 1].subject,
            from_email: data[data.length - 1].from_email,
            created_at: data[data.length - 1].created_at
        });

        // Show all unique lead_ids if present
        const uniqueLeadIds = [...new Set(data.map(item => item.lead_id).filter(Boolean))];
        if (uniqueLeadIds.length > 0) {
            console.log('🔹 Unique Lead IDs in results:', uniqueLeadIds);
        }

        // Show all unique tracking_ids if present
        const uniqueTrackingIds = [...new Set(data.map(item => item.tracking_id).filter(Boolean))];
        if (uniqueTrackingIds.length > 0) {
            console.log('🔹 Unique Tracking IDs in results:', uniqueTrackingIds);
        }

        // Log date range of results
        if (data.length > 1) {
            const dates = data.map(item => new Date(item.created_at));
            const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
            console.log('🔹 Date range in results:', {
                earliest: minDate.toISOString(),
                latest: maxDate.toISOString(),
                span: `${Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60))} hours`
            });
        }
    } else {
        console.log('⚠️ No data returned from query');
        console.log('🔹 Possible reasons:');
        console.log('   - No matching records in database');
        console.log('   - Filters are too restrictive');
        console.log('   - Pagination range is out of bounds');
        console.log('   - Database connection issue');
    }

    console.log('📧 ===== END REPOSITORY DEBUG =====\n');

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