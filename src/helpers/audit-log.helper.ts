import { supabaseAdmin } from '../config';

export interface AuditLogData {
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    details?: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
}

export async function createLeadAuditLog(data: AuditLogData): Promise<void> {
    try {
        await supabaseAdmin
            .from('audit_logs')
            .insert({
                ...data,
                created_at: new Date().toISOString()
            });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
}