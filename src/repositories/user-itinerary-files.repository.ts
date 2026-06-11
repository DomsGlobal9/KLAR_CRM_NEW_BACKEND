import { supabaseAdmin } from '../config';

export const userItineraryFilesRepository = {
    
    async saveOrUpdate(data: {
        leadId: string;
        files: Record<string, { name: string; url: string }[]>;
        metadata?: Record<string, any>;
        userId?: string;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // Check if active record exists
            const { data: existing, error: findError } = await supabaseAdmin
                .from('user_itinerary_files')
                .select('*')
                .eq('lead_id', data.leadId)
                .eq('status', 'active')
                .maybeSingle();

            const now = new Date().toISOString();
            const totalFiles = Object.values(data.files).flat().length;

            if (existing) {
                // Merge existing files with new ones
                const mergedFiles = { ...existing.files };
                for (const [serviceType, files] of Object.entries(data.files)) {
                    if (!mergedFiles[serviceType]) {
                        mergedFiles[serviceType] = [];
                    }
                    mergedFiles[serviceType] = [...mergedFiles[serviceType], ...files];
                }

                const { data: updated, error: updateError } = await supabaseAdmin
                    .from('user_itinerary_files')
                    .update({
                        files: mergedFiles,
                        metadata: {
                            ...existing.metadata,
                            ...data.metadata,
                            total_files: Object.values(mergedFiles).flat().length,
                            updated_at: now
                        },
                        updated_at: now,
                        updated_by: data.userId
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                return { success: true, data: updated };
            }

            // Create new record
            const { data: inserted, error: insertError } = await supabaseAdmin
                .from('user_itinerary_files')
                .insert({
                    lead_id: data.leadId,
                    files: data.files,
                    type: 'file', 
                    metadata: {
                        ...data.metadata,
                        total_files: totalFiles,
                        created_at: now
                    },
                    status: 'active',
                    created_at: now,
                    updated_at: now,
                    created_by: data.userId,
                    updated_by: data.userId
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return { success: true, data: inserted };

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async getByLeadId(leadId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const { data, error } = await supabaseAdmin
                .from('user_itinerary_files')
                .select('*')
                .eq('lead_id', leadId)
                .eq('status', 'active')
                .maybeSingle();

            if (error) throw error;
            return { success: true, data };

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async exists(leadId: string): Promise<boolean> {
        const { data } = await supabaseAdmin
            .from('user_itinerary_files')
            .select('id')
            .eq('lead_id', leadId)
            .eq('status', 'active')
            .maybeSingle();
        return !!data;
    },

    async deleteByLeadId(leadId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabaseAdmin
                .from('user_itinerary_files')
                .update({ status: 'deleted', updated_at: new Date().toISOString() })
                .eq('lead_id', leadId);
            
            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};