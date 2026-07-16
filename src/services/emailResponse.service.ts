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

export interface AllEmailsFilters {
    page: number;
    limit: number;
    leadId?: string;
    status?: string;
    trackingId?: string;
    direction?: 'incoming' | 'outgoing';
    startDate?: string;
    endDate?: string;
}

export const emailResponseService = {

    async getEmailLogs(filters: EmailLogFilters) {
        const { page, limit, leadId, status, trackingId, startDate, endDate } = filters;
        const offset = (page - 1) * limit;

        const { data, total } = await emailResponseRepository.getEmailMessages({
            limit,
            offset,
            leadId,
            status,
            trackingId,
            direction: 'outgoing',
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

    async getEmailReplies(filters: EmailReplyFilters) {
        const { page, limit, leadId, trackingId, startDate, endDate, unreadOnly } = filters;
        const offset = (page - 1) * limit;

        const { data, total } = await emailResponseRepository.getIncomingEmails({
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

    async getEmailConversation(trackingId: string) {
        const { messages } = await emailResponseRepository.getEmailConversation(trackingId);

        const sentEmails = messages.filter(msg => msg.direction === 'outgoing');
        const replies = messages.filter(msg => msg.direction === 'incoming');

        return {
            trackingId,
            conversation: messages,
            sentCount: sentEmails.length,
            replyCount: replies.length
        };
    },

    async getEmailsByLeadId(leadId: string, page: number, limit: number) {
        const offset = (page - 1) * limit;

        const messages = await emailResponseRepository.getEmailMessagesByLeadId(leadId, limit, offset);

        return {
            data: messages,
            pagination: {
                page,
                limit,
                total: messages.length
            }
        };
    },

    async getRecentReplies(limit: number, hours: number) {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        const replies = await emailResponseRepository.getRecentIncomingEmails(limit, since.toISOString());

        return replies;
    },

    async getAllEmails(filters: AllEmailsFilters) {
        const { page, limit, leadId, status, trackingId, direction, startDate, endDate } = filters;
        const offset = (page - 1) * limit;

        const { data, total } = await emailResponseRepository.getEmailMessages({
            limit,
            offset,
            leadId,
            status,
            trackingId,
            direction,
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

};