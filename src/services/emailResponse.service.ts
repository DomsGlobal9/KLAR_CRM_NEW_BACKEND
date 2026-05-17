import { emailResponseRepository } from "../repositories/emailResponse.repository";


export interface EmailLogFilters {
    page: number;
    limit: number;
    leadId?: string;
    status?: string;
    trackingId?: string;
    startDate?: string;
    endDate?: string;
}

export interface EmailReplyFilters {
    page: number;
    limit: number;
    leadId?: string;
    trackingId?: string;
    startDate?: string;
    endDate?: string;
    unreadOnly?: boolean;
}

export const emailResponseService = {
    /**
     * Get email logs with pagination and filters
     */
    async getEmailLogs(filters: EmailLogFilters) {
        const { page, limit, leadId, status, trackingId, startDate, endDate } = filters;
        const offset = (page - 1) * limit;

        const { data, total } = await emailResponseRepository.getEmailLogs({
            limit,
            offset,
            leadId,
            status,
            trackingId,
            startDate,
            endDate
        });

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Get email replies with pagination and filters
     */
    async getEmailReplies(filters: EmailReplyFilters) {
        const { page, limit, leadId, trackingId, startDate, endDate, unreadOnly } = filters;
        const offset = (page - 1) * limit;

        const { data, total } = await emailResponseRepository.getEmailReplies({
            limit,
            offset,
            leadId,
            trackingId,
            startDate,
            endDate,
            unreadOnly
        });

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Get complete email conversation by tracking ID
     */
    async getEmailConversation(trackingId: string) {
        // Get sent email logs
        const sentEmails = await emailResponseRepository.getEmailLogsByTrackingId(trackingId);

        // Get replies for this tracking ID
        const replies = await emailResponseRepository.getRepliesByTrackingId(trackingId);

        // Combine and sort by created_at
        const conversation = [
            ...sentEmails.map(email => ({ ...email, type: 'sent' as const })),
            ...replies.map(reply => ({ ...reply, type: 'received' as const }))
        ].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        return {
            trackingId,
            conversation,
            sentCount: sentEmails.length,
            replyCount: replies.length
        };
    },

    /**
     * Get emails by lead ID
     */
    async getEmailsByLeadId(leadId: string, page: number, limit: number) {
        const offset = (page - 1) * limit;

        const sentEmails = await emailResponseRepository.getEmailLogsByLeadId(leadId, limit, offset);
        const replies = await emailResponseRepository.getRepliesByLeadId(leadId, limit, offset);

        const allEmails = [
            ...sentEmails.map(email => ({ ...email, type: 'sent' as const })),
            ...replies.map(reply => ({ ...reply, type: 'received' as const }))
        ].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
            data: allEmails,
            pagination: {
                page,
                limit,
                total: allEmails.length
            }
        };
    },

    /**
     * Get recent replies (last X hours)
     */
    async getRecentReplies(limit: number, hours: number) {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        const replies = await emailResponseRepository.getRecentReplies(limit, since.toISOString());

        return replies;
    }
};