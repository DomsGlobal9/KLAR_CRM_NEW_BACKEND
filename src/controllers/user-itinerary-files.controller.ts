import { Request, Response } from 'express';
import { supabaseAdmin } from '../config';
import { userItineraryFilesService } from '../services/user-itinerary-files.service';

export const userItineraryFilesController = {

    async getAllFileItineraries(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const start = (page - 1) * limit;

            // Fetch file-only itineraries
            const { data: filesData, error: filesError, count } = await supabaseAdmin
                .from('user_itinerary_files')
                .select('*', { count: 'exact' })
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .range(start, start + limit - 1);

            if (filesError) throw filesError;

            if (!filesData || filesData.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: { leads: [], total_count: 0, pagination: { page, limit, total_pages: 0 } }
                });
            }

            // Fetch lead details separately
            const leadIds = filesData.map(item => item.lead_id);
            const { data: leadsData } = await supabaseAdmin
                .from('leads')
                .select('id, name, email, phone, status')
                .in('id', leadIds);

            const leadsMap = new Map();
            leadsData?.forEach(lead => leadsMap.set(lead.id, lead));

            // Transform data
            const transformedData = filesData.map(item => ({
                itinerary_id: item.id,
                type: 'file',
                lead_details: {
                    name: leadsMap.get(item.lead_id)?.name || 'N/A',
                    email: leadsMap.get(item.lead_id)?.email || 'N/A',
                    phone: leadsMap.get(item.lead_id)?.phone || 'N/A',
                    status: leadsMap.get(item.lead_id)?.status || 'N/A',
                },
                summary: {
                    status: 'File Only',
                    flight_preferences_added: false,
                    hotel_preferences_added: false,
                    visa_preferences_added: false,
                    last_updated: item.updated_at || item.created_at,
                },
                services: [],
                created_at: item.created_at,
            }));

            return res.status(200).json({
                success: true,
                data: {
                    leads: transformedData,
                    total_count: count || 0,
                    pagination: {
                        page,
                        limit,
                        total_pages: Math.ceil((count || 0) / limit)
                    }
                }
            });

        } catch (error: any) {
            console.error('Error in getAllFileItineraries:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getFileOnlyItineraryById(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;
            const itineraryIdStr = Array.isArray(itineraryId) ? itineraryId[0] : itineraryId;

            if (!itineraryIdStr) {
                return res.status(400).json({ success: false, message: 'Itinerary ID is required' });
            }

            // Fetch the file record by its ID
            const { data: fileRecord, error: fileError } = await supabaseAdmin
                .from('user_itinerary_files')
                .select('*')
                .eq('id', itineraryIdStr)
                .eq('status', 'active')
                .single();

            if (fileError || !fileRecord) {
                return res.status(404).json({ success: false, message: 'File itinerary not found', data: null });
            }

            // ✅ CHANGE THIS PART - Use maybeSingle() instead of single()
            const { data: leadData, error: leadError } = await supabaseAdmin
                .from('leads')
                .select('*')  // Select ALL fields, not just a few
                .eq('id', fileRecord.lead_id)
                .maybeSingle();  // Use maybeSingle() instead of single()

            if (leadError) {
                console.error('Error fetching lead:', leadError);
            }

            // ✅ Return with lead_details (even if null)
            return res.status(200).json({
                success: true,
                data: {
                    ...fileRecord,
                    lead_details: leadData || null
                },
                exists: true,
                itineraryType: 'file-only'
            });
        } catch (error: any) {
            console.error('Error in getFileOnlyItineraryById:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};