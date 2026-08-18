import { supabaseAdmin } from '../config';
import { AuthRepository } from './auth.repository';

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
    user_id?: string | null;
    sender_name?: string | null;
    sender_email?: string | null;
    raw_headers: any | null;
    error: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Attach sender name/email to a page of messages.
 *
 * This used to call supabaseAdmin.auth.admin.getUserById() per message — an
 * HTTPS round trip each. The Map here looked like a cache, but because every
 * item ran concurrently inside Promise.all, they all missed it and fired their
 * requests simultaneously; it only helped on the rare sequential re-check.
 *
 * Now: work out which users are actually needed, resolve them in one query,
 * then fill the rows in memory.
 */
async function formatMessagesWithUserLookup(data: any[]): Promise<EmailMessage[]> {
    const rows = data || [];

    const readItem = (item: any) => ({
        userId: item.user_id || item.raw_headers?.user_id || null,
        senderName: item.sender_name || item.raw_headers?.sender_name || null,
        senderEmail: item.sender_email || item.raw_headers?.sender_email || null,
    });

    // Only look up users whose name or email is actually missing.
    const idsToResolve = rows
        .map(readItem)
        .filter(({ userId, senderName, senderEmail }) => userId && (!senderName || !senderEmail))
        .map(({ userId }) => userId as string);

    const summaries = await AuthRepository.getUserSummariesByIds(idsToResolve);

    return rows.map((item: any) => {
        const { userId, senderName, senderEmail } = readItem(item);

        const resolved = userId ? summaries.get(userId) : undefined;

        const finalName = senderName || resolved?.name || null;
        const finalEmail = senderEmail || resolved?.email || null;

        return {
            ...item,
            user_id: userId,
            sender_name: finalName,
            sender_email: finalEmail,
            senderName: finalName || item.senderName,
            senderEmail: finalEmail || item.senderEmail,
        } as EmailMessage;
    });
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
        search?: string;
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
        if (params.search) {
            const term = params.search.trim();
            if (term) {
                query = query.or(`subject.ilike.%${term}%,from_email.ilike.%${term}%`);
            }
        }

        query = query
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        const formattedData = await formatMessagesWithUserLookup(data || []);
        return { data: formattedData, total: count || 0 };
    },

    async getIncomingEmails(params: {
        limit: number;
        offset: number;
        leadId?: string;
        trackingId?: string;
        startDate?: string;
        endDate?: string;
        unreadOnly?: boolean;
        search?: string;
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
        if (params.search) {
            const term = params.search.trim();
            if (term) {
                query = query.or(`subject.ilike.%${term}%,from_email.ilike.%${term}%`);
            }
        }

        query = query
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        const formattedData = await formatMessagesWithUserLookup(data || []);
        return { data: formattedData, total: count || 0 };
    },

    async getOutgoingEmails(params: {
        limit: number;
        offset: number;
        leadId?: string;
        trackingId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
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
        if (params.search) {
            const term = params.search.trim();
            if (term) {
                query = query.or(`subject.ilike.%${term}%,from_email.ilike.%${term}%`);
            }
        }

        query = query
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        const formattedData = await formatMessagesWithUserLookup(data || []);
        return { data: formattedData, total: count || 0 };
    },

    async getEmailMessagesByTrackingId(trackingId: string): Promise<EmailMessage[]> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return formatMessagesWithUserLookup(data || []);
    },

    async getEmailThreadByTrackingId(trackingId: string): Promise<EmailMessage[]> {
        const { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('tracking_id', trackingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return formatMessagesWithUserLookup(data || []);
    },

    async getEmailMessagesByLeadId(leadId: string, limit: number, offset: number): Promise<{ data: EmailMessage[]; total: number }> {
        const { data, error, count } = await supabaseAdmin
            .from('email_messages')
            .select('*', { count: 'exact', head: false })
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        const formattedData = await formatMessagesWithUserLookup(data || []);
        return { data: formattedData, total: count || 0 };
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
        try {
            // Step 1: Find reference message(s) by tracking_id or id
            const { data: refData } = await supabaseAdmin
                .from('email_messages')
                .select('*')
                .or(`tracking_id.eq.${trackingId},id.eq.${trackingId}`);

            const refMessages = refData || [];

            const leadIds = new Set<string>();
            const trackingIds = new Set<string>([trackingId]);
            const customerEmails = new Set<string>();

            refMessages.forEach(msg => {
                if (msg.lead_id) leadIds.add(msg.lead_id);
                if (msg.tracking_id) trackingIds.add(msg.tracking_id);
                if (msg.parent_tracking_id) trackingIds.add(msg.parent_tracking_id);

                const extractCleanEmail = (str: string) => {
                    if (!str) return '';
                    const match = str.match(/<([^>]+)>/);
                    const e = match ? match[1] : str;
                    return e.toLowerCase().trim();
                };

                if (msg.direction === 'incoming' && msg.from_email) {
                    const clean = extractCleanEmail(msg.from_email);
                    if (clean) customerEmails.add(clean);
                } else if (msg.direction === 'outgoing' && msg.to_email) {
                    const toArr = Array.isArray(msg.to_email) ? msg.to_email : [msg.to_email];
                    toArr.forEach((e: string) => {
                        const clean = extractCleanEmail(e);
                        if (clean) customerEmails.add(clean);
                    });
                }
            });

            let candidateMessages: EmailMessage[] = [];

            // Query by lead_id if available
            if (leadIds.size > 0) {
                const { data: leadMsgs } = await supabaseAdmin
                    .from('email_messages')
                    .select('*')
                    .in('lead_id', Array.from(leadIds))
                    .order('created_at', { ascending: true });
                if (leadMsgs) candidateMessages.push(...(leadMsgs as EmailMessage[]));
            }

            // Query by tracking_id or parent_tracking_id
            if (trackingIds.size > 0) {
                const { data: trackMsgs } = await supabaseAdmin
                    .from('email_messages')
                    .select('*')
                    .or(`tracking_id.in.(${Array.from(trackingIds).join(',')}),parent_tracking_id.in.(${Array.from(trackingIds).join(',')})`)
                    .order('created_at', { ascending: true });
                if (trackMsgs) candidateMessages.push(...(trackMsgs as EmailMessage[]));
            }

            // Query by customer email if available
            if (customerEmails.size > 0) {
                for (const email of Array.from(customerEmails)) {
                    const { data: emailMsgs } = await supabaseAdmin
                        .from('email_messages')
                        .select('*')
                        .or(`from_email.ilike.%${email}%,to_email.cs.{"${email}"}`)
                        .order('created_at', { ascending: true });
                    if (emailMsgs) candidateMessages.push(...(emailMsgs as EmailMessage[]));
                }
            }

            // Fallback: If no reference messages were found initially, do simple eq query
            if (candidateMessages.length === 0) {
                const { data: fallbackData } = await supabaseAdmin
                    .from('email_messages')
                    .select('*')
                    .eq('tracking_id', trackingId)
                    .order('created_at', { ascending: true });
                candidateMessages = (fallbackData as EmailMessage[]) || [];
            }

            // Deduplicate by ID
            const msgMap = new Map<string, EmailMessage>();
            candidateMessages.forEach(msg => {
                if (msg && msg.id && !msgMap.has(msg.id)) {
                    msgMap.set(msg.id, msg);
                }
            });

            // Sort chronologically (oldest -> newest)
            const allMessages = Array.from(msgMap.values()).sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateA - dateB;
            });

            const formatted = await formatMessagesWithUserLookup(allMessages);
            return { messages: formatted, total: formatted.length };
        } catch (err) {
            // Fallback in case of unexpected query errors
            const { data, count } = await supabaseAdmin
                .from('email_messages')
                .select('*', { count: 'exact', head: false })
                .eq('tracking_id', trackingId)
                .order('created_at', { ascending: true });
            const formatted = await formatMessagesWithUserLookup(data || []);
            return { messages: formatted, total: count || 0 };
        }
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
    },

    async getEmailById(id: string): Promise<EmailMessage | null> {
        let { data, error } = await supabaseAdmin
            .from('email_messages')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (!data) {
            const { data: byTrack } = await supabaseAdmin
                .from('email_messages')
                .select('*')
                .eq('tracking_id', id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            data = byTrack;
        }

        if (!data) {
            const { data: byMsg } = await supabaseAdmin
                .from('email_messages')
                .select('*')
                .eq('message_id', id)
                .maybeSingle();
            data = byMsg;
        }

        if (error || !data) return null;
        const formatted = await formatMessagesWithUserLookup([data]);
        return formatted[0] || null;
    }
};