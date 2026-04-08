import { Request, Response } from 'express';
import { emailResponseService } from '../services/emailResponse.service';


export const emailResponseController = {
    /**
     * Get email logs with pagination and filters
     */
    async getEmailLogs(req: Request, res: Response) {
        try {
            const {
                page = 1,
                limit = 20,
                leadId,
                status,
                trackingId,
                startDate,
                endDate
            } = req.query;

            const result = await emailResponseService.getEmailLogs({
                page: Number(page),
                limit: Number(limit),
                leadId: leadId as string,
                status: status as string,
                trackingId: trackingId as string,
                startDate: startDate as string,
                endDate: endDate as string
            });

            res.json({
                success: true,
                message: 'Email logs fetched successfully',
                ...result
            });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    /**
     * Get email replies with pagination and filters
     */
    async getEmailReplies(req: Request, res: Response) {
        try {
            const {
                page = 1,
                limit = 20,
                leadId,
                trackingId,
                startDate,
                endDate,
                unreadOnly = false
            } = req.query;

            const result = await emailResponseService.getEmailReplies({
                page: Number(page),
                limit: Number(limit),
                leadId: leadId as string,
                trackingId: trackingId as string,
                startDate: startDate as string,
                endDate: endDate as string,
                unreadOnly: unreadOnly === 'true'
            });

            res.json({
                success: true,
                message: 'Email replies fetched successfully',
                ...result
            });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    /**
     * Get complete email conversation by tracking ID
     */
    async getEmailConversation(req: Request, res: Response) {
        try {
            const { trackingId } = req.params;

            if (!trackingId) {
                return res.status(400).json({
                    success: false,
                    error: 'Tracking ID is required'
                });
            }

            const conversation = await emailResponseService.getEmailConversation(trackingId as string);

            res.json({
                success: true,
                message: 'Email conversation fetched successfully',
                data: conversation
            });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    /**
     * Get emails by lead ID
     */
    async getEmailsByLeadId(req: Request, res: Response) {
        try {
            const { leadId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    error: 'Lead ID is required'
                });
            }

            const result = await emailResponseService.getEmailsByLeadId(
                leadId as string,
                Number(page),
                Number(limit)
            );

            res.json({
                success: true,
                message: 'Emails fetched successfully',
                ...result
            });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    /**
     * Get recent/unread replies
     */
    async getRecentReplies(req: Request, res: Response) {
        try {
            const { limit = 50, hours = 24 } = req.query;

            const replies = await emailResponseService.getRecentReplies(
                Number(limit),
                Number(hours)
            );

            res.json({
                success: true,
                message: 'Recent replies fetched successfully',
                data: replies,
                count: replies.length
            });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
};