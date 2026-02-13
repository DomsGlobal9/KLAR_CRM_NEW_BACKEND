import { supabaseAdmin } from '../config';
import { CreateInquirySourceDTO, InquirySource, UpdateInquirySourceDTO } from '../interfaces/inquirySource.interface';



class InquirySourceRepository {

    async findAll(includeInactive: boolean = false): Promise<InquirySource[]> {
        let query = supabaseAdmin
            .from('inquiry_sources')
            .select('*')
            .order('display_order');

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    }

    async findById(id: string): Promise<InquirySource | null> {
        const { data, error } = await supabaseAdmin
            .from('inquiry_sources')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async findByValue(value: string): Promise<InquirySource | null> {
        const { data, error } = await supabaseAdmin
            .from('inquiry_sources')
            .select('*')
            .eq('value', value)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async create(data: CreateInquirySourceDTO): Promise<InquirySource> {
        const { data: result, error } = await supabaseAdmin
            .from('inquiry_sources')
            .insert({
                ...data,
                category: data.category || 'other',
                display_order: data.display_order || 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async update(id: string, data: UpdateInquirySourceDTO): Promise<InquirySource> {
        const { data: result, error } = await supabaseAdmin
            .from('inquiry_sources')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('inquiry_sources')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async softDelete(id: string): Promise<InquirySource> {
        return this.update(id, {
            is_active: false
        });
    }

    async toggleStatus(id: string): Promise<InquirySource> {
        const source = await this.findById(id);
        if (!source) throw new Error('Source not found');

        return this.update(id, {
            is_active: !source.is_active
        });
    }

    async updateDisplayOrder(updates: { id: string; display_order: number }[]): Promise<void> {
        const updatePromises = updates.map(({ id, display_order }) =>
            supabaseAdmin
                .from('inquiry_sources')
                .update({
                    display_order,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
        );

        await Promise.all(updatePromises);
    }

    async checkIfUsedByLeads(sourceId: string): Promise<boolean> {
        const { data, error } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('source', sourceId)
            .limit(1);

        if (error) throw error;
        return (data && data.length > 0) || false;
    }
}

export const inquirySourceRepository = new InquirySourceRepository();