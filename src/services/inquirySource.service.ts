import { CreateInquirySourceDTO, InquirySource, UpdateInquirySourceDTO } from "../interfaces/inquirySource.interface";
import { inquirySourceRepository } from "../repositories"

class InquirySourceService {

    async getAllSources(includeInactive: boolean = false): Promise<InquirySource[]> {
        try {
            return await inquirySourceRepository.findAll(includeInactive);
        } catch (error) {
            console.error('Error in getAllSources service:', error);
            throw new Error('Failed to fetch inquiry sources');
        }
    }

    async getSourcesByCategory(): Promise<Record<string, InquirySource[]>> {
        try {
            const sources = await inquirySourceRepository.findAll(false);

            return sources.reduce((acc: Record<string, InquirySource[]>, source) => {
                const category = source.category || 'other';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(source);
                return acc;
            }, {});
        } catch (error) {
            console.error('Error in getSourcesByCategory service:', error);
            throw new Error('Failed to fetch grouped sources');
        }
    }

    async createSource(data: CreateInquirySourceDTO, userId?: string): Promise<InquirySource> {
        try {
            
            const existing = await inquirySourceRepository.findByValue(data.value);
            if (existing) {
                throw new Error('Source with this value already exists');
            }

            
            const source = await inquirySourceRepository.create({
                ...data,
                created_by: userId
            });



            return source;
        } catch (error) {
            console.error('Error in createSource service:', error);
            throw error;
        }
    }

    async updateSource(id: string, data: UpdateInquirySourceDTO, userId?: string): Promise<InquirySource> {
        try {
            
            const existing = await inquirySourceRepository.findById(id);
            if (!existing) {
                throw new Error('Source not found');
            }

            
            if (data.value && data.value !== existing.value) {
                const duplicate = await inquirySourceRepository.findByValue(data.value);
                if (duplicate) {
                    throw new Error('Source with this value already exists');
                }
            }

            
            const updated = await inquirySourceRepository.update(id, data);



            return updated;
        } catch (error) {
            console.error('Error in updateSource service:', error);
            throw error;
        }
    }

    async deleteSource(id: string, userId?: string): Promise<{ message: string; data?: InquirySource }> {
        try {
            
            const existing = await inquirySourceRepository.findById(id);
            if (!existing) {
                throw new Error('Source not found');
            }

            
            const isUsed = await inquirySourceRepository.checkIfUsedByLeads(id);

            if (isUsed) {
                
                const deactivated = await inquirySourceRepository.softDelete(id);



                return {
                    message: 'Source deactivated successfully (soft delete)',
                    data: deactivated
                };
            } else {
                
                await inquirySourceRepository.delete(id);



                return {
                    message: 'Source deleted successfully'
                };
            }
        } catch (error) {
            console.error('Error in deleteSource service:', error);
            throw error;
        }
    }

    async toggleSourceStatus(id: string, userId?: string): Promise<InquirySource> {
        try {
            const source = await inquirySourceRepository.toggleStatus(id);



            return source;
        } catch (error) {
            console.error('Error in toggleSourceStatus service:', error);
            throw error;
        }
    }

    async updateDisplayOrder(
        sources: { id: string; display_order: number }[],
        userId?: string
    ): Promise<void> {
        try {
            await inquirySourceRepository.updateDisplayOrder(sources);


        } catch (error) {
            console.error('Error in updateDisplayOrder service:', error);
            throw new Error('Failed to update display order');
        }
    }
}

export const inquirySourceService = new InquirySourceService();