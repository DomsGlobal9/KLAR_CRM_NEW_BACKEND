import { Request, Response } from 'express';
import { itineraryPreferencesService } from '../services';
import {
    IUpdatePreferenceData,
    IFrontendFormData,
    IDateRangeParams,
    IPaginationParams
} from '../interfaces';
import {
    validateFormData,
    calculateFormStats,
    formatFormDataForDisplay
} from '../helpers';
import { AuthRequest } from '../middleware';
import { itineraryPdfService } from '../services/itinerary-pdf.service';
import { s3UploadService } from '../services/s3-upload.service';
import { leadService } from '../services/lead.service';
import { pdfDeliveryService } from '../services/pdfDelivery.service';
import { DeliveryOptions, processPDFDelivery } from '../helpers/pdfDelivery.helper';
import { sendErrorResponse, sendUploadResponse } from '../helpers/response.helper';
import { itineraryPreferencesRepository } from '../repositories/itinerary-preferences.repository';
import { fileUploadService } from '../services/file-upload.service';
import { supabaseAdmin } from '../config';

export const itineraryPreferencesController = {

    /**
     * Get all preferences for a lead
     */
    async getPreferences(req: Request, res: Response) {
        try {
            const { itinerary_id } = req.params;

            if (!itinerary_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            const result = await itineraryPreferencesService.getPreferences(itinerary_id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getPreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Save preferences
     */
    async savePreferences(req: Request, res: Response) {
        try {
            const formData: IFrontendFormData = req.body;
            const submissionType = formData.submissionType || 'form';

            if (!formData?.leadData?.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            // For file-only submission, skip detailed validation
            if (submissionType === 'files-only') {
                // Just check if files exist
                if (!formData.uploadedFiles || Object.keys(formData.uploadedFiles).length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'At least one file is required for file-only itinerary creation'
                    });
                }

                // Call service with file-only flag
                const result = await itineraryPreferencesService.saveFileOnlyPreferences(formData);

                return res.status(201).json({
                    ...result,
                    message: 'Itinerary created from uploaded files successfully'
                });
            }

            // For form submission, proceed with normal validation
            const result = await itineraryPreferencesService.savePreferences(formData);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(201).json({
                ...result,
                message: 'Preferences saved successfully'
            });

        } catch (error) {
            console.error('Error in savePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Update preferences
     */
    async updatePreferences(req: Request, res: Response) {
        try {

            const { itinerary_id } = req.params;
            const updateData: IUpdatePreferenceData = req.body;

            if (!itinerary_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Itinerary ID is required'
                });
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Update data is required'
                });
            }

            const result = await itineraryPreferencesService.updatePreferences(
                updateData,
                itinerary_id as string,
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json({
                ...result,
                message: 'Preferences updated successfully'
            });
        } catch (error) {
            console.error('Error in updatePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Delete preferences
     */
    async deletePreferences(req: Request, res: Response) {
        try {
            const { itinerary_id } = req.params;

            if (!itinerary_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            const result = await itineraryPreferencesService.deletePreferences(itinerary_id as string);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in deletePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Check if lead has preferences
     */
    async checkPreferencesExist(req: Request, res: Response) {
        try {
            const { leadId } = req.params;

            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            const result = await itineraryPreferencesService.checkPreferencesExist(leadId as string);

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in checkPreferencesExist controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Save or update preferences (upsert)
     */
    // async saveOrUpdatePreferences(req: Request, res: Response) {
    //     try {
    //         const formData: IFrontendFormData = req.body;

    //         if (!formData?.leadData?.id) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: 'Lead ID is required'
    //             });
    //         }

    //         const result = await itineraryPreferencesService.saveOrUpdatePreferences(formData);

    //         if (!result.success) {
    //             return res.status(400).json(result);
    //         }

    //         return res.status(200).json({
    //             ...result,
    //             message: `Preferences ${result.action} successfully`
    //         });
    //     } catch (error) {
    //         console.error('Error in saveOrUpdatePreferences controller:', error);
    //         return res.status(500).json({
    //             success: false,
    //             message: 'Internal server error'
    //         });
    //     }
    // },

    /**
     * Get flight preference by ID
     */
    async getFlightPreferenceById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Flight preference ID is required'
                });
            }

            const result = await itineraryPreferencesService.getFlightPreferenceById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getFlightPreferenceById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get hotel preference by ID
     */
    async getHotelPreferenceById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Hotel preference ID is required'
                });
            }

            const result = await itineraryPreferencesService.getHotelPreferenceById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getHotelPreferenceById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get visa preference by ID
     */
    async getVisaPreferenceById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Visa preference ID is required'
                });
            }

            const result = await itineraryPreferencesService.getVisaPreferenceById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getVisaPreferenceById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get all leads with preferences (admin endpoint)
     */
    async getAllLeads(req: AuthRequest, res: Response) {
        try {
            const leadId = req.query.id as string;
            const minimal = req.query.minimal === 'true';
            const detailed = req.query.detailed === 'true';

            const userDetails = req.user;
            const userRole = userDetails?.role;
            const userId = userDetails?.id;

            const withTimeout = async (promise: Promise<any>, label: string) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`${label} TIMEOUT ❌`)), 5000)
                    )
                ]);
            };

            if (leadId) {
                if (userRole === 'rm') {
                    const hasAccess = await withTimeout(
                        itineraryPreferencesService.checkLeadAccess(leadId, userId as string),
                        "checkLeadAccess"
                    );

                    if (!hasAccess) {
                        return res.status(403).json({
                            success: false,
                            message: 'You do not have permission to access this lead'
                        });
                    }
                }

                const singleResult = await withTimeout(
                    itineraryPreferencesService.getPreferences(leadId),
                    "getPreferences"
                );

                if (!singleResult.success || !singleResult.data) {
                    return res.status(404).json({
                        success: false,
                        message: `Lead with ID ${leadId} not found`
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: {
                        leads: [singleResult.data],
                        total_count: 1
                    }
                });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || (minimal ? 100 : 50);
            const sortOrder = (req.query.sort_order as 'asc' | 'desc') || 'desc';

            const roleFilter = {
                role: userRole,
                userId: userId,
                assignedToField: 'assigned_to'
            };

            if (detailed) {
                const paginationParams: IPaginationParams = {
                    page: Math.max(1, page),
                    limit: Math.min(Math.max(1, limit), 50),
                    sort_by: 'updated_at',
                    sort_order: sortOrder
                };

                const result = await withTimeout(
                    itineraryPreferencesService.getAllLeads(paginationParams, roleFilter),
                    "getAllLeads"
                );

                return res.status(200).json(result);
            }

            const paginationParams: IPaginationParams = {
                page: Math.max(1, page),
                limit: Math.min(Math.max(1, limit), 100),
                sort_by: 'updated_at',
                sort_order: sortOrder
            };

            if (minimal) {
                const result = await withTimeout(
                    itineraryPreferencesService.getAllLeadsMinimal(paginationParams, roleFilter),
                    "getAllLeadsMinimal"
                );

                return res.status(200).json(result);
            } else {
                const result = await withTimeout(
                    itineraryPreferencesService.getAllLeadsBasic(paginationParams, roleFilter),
                    "getAllLeadsBasic"
                );

                return res.status(200).json(result);
            }

        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },

    /**
     * Validate form data without saving
     */
    async validatePreferences(req: Request, res: Response) {
        try {
            const formData: IFrontendFormData = req.body;

            if (!formData) {
                return res.status(400).json({
                    success: false,
                    message: 'Request body is required'
                });
            }

            const validation = validateFormData(formData);
            const stats = calculateFormStats(formData);
            const formattedData = formatFormDataForDisplay(formData);

            return res.status(200).json({
                success: true,
                validation,
                statistics: stats,
                formatted_data: formattedData,
                message: validation.isValid ? 'Form data is valid' : 'Form data validation failed'
            });
        } catch (error) {
            console.error('Error in validatePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },


    /**
     * Display & Download Itinerary pdf
     */
    async downloadItineraryOnlyPDF(req: Request, res: Response) {
        const { itinerary_id } = req.params;
        const itinResult = await itineraryPreferencesService.getPreferences(itinerary_id as string);
        console.log("469 itinerary-preferences.controller.ts-PDF Generation Data:", itinResult.data);
        const html = await itineraryPdfService.generateHTML(itinResult.data);
        const buffer = await itineraryPdfService.generateBuffer(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Itinerary.pdf"');
        return res.send(buffer);
    },



    async uploadItineraryToS3(req: Request, res: Response) {
        try {
            const { itinerary_id } = req.params;
            const { sendVia } = req.body;


            const leadId = await itineraryPreferencesService.getleadByitineraryId(itinerary_id as string);


            const leadData = await leadService.getLeadById(leadId);

            if (!leadData) {
                return res.status(404).json({ success: false, message: "Lead Data not found" });
            }

            const itinResult = await itineraryPreferencesService.getPreferences(itinerary_id as string);
            if (!itinResult.data) {
                return res.status(404).json({ success: false, message: "Itinerary preferences not found" });
            }

            const prefSummary = itinResult.data.user_preferences_summary;
            if (!prefSummary?.id) {
                return res.status(400).json({
                    success: false,
                    message: "User preference summary not found"
                });
            }

            const html = await itineraryPdfService.generateHTML(itinResult.data);
            const buffer = await itineraryPdfService.generateBuffer(html);

            const clientName = itinResult.data.lead_details?.name?.replace(/\s+/g, '_') || 'client';
            const fileName = `itinerary_${leadId}_${clientName}.pdf`;

            const publicUrl = await s3UploadService.uploadToS3(buffer, fileName);

            const clientPhone = leadData.phone || itinResult.data.lead_details?.phone;
            const clientEmail = leadData.email || itinResult.data.lead_details?.email;

            const deliveryOptions: DeliveryOptions = {
                leadId: leadId,
                clientName: itinResult.data.lead_details?.name || leadData.name || 'Client',
                clientEmail: clientEmail,
                clientPhone: clientPhone,
                pdfUrl: publicUrl,
                pdfFileName: fileName,
                htmlContent: html,
            };

            const deliveryResult = await processPDFDelivery(deliveryOptions, sendVia);

            const isDelivered =
                deliveryResult?.whatsapp?.sent === true ||
                deliveryResult?.email?.sent === true;

            if (isDelivered) {
                await itineraryPreferencesRepository.updateItineraryStatus(
                    leadId,
                    prefSummary.id,
                    'Itinerary_send'
                );
            }

            return sendUploadResponse(res, {
                success: true,
                publicUrl,
                leadId: leadId,
                clientPhone,
                clientEmail,
                deliveryResult
            });

        } catch (error: any) {
            console.error("❌ S3 Workflow Error:", error);
            return sendErrorResponse(res, error);
        }
    },

    async uploadPdfFile(req: Request, res: Response) {
        try {
            const file = req.file;
            const { serviceType, leadId } = req.body;

            if (!file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            if (file.mimetype !== 'application/pdf') {
                return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
            }

            const result = await fileUploadService.uploadPdf(file, leadId, serviceType);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json({
                success: true,
                data: { fileUrl: result.fileUrl, message: result.message }
            });
        } catch (error: any) {
            console.error('Error in uploadPdfFile:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async uploadImageFile(req: Request, res: Response) {
        try {
            const file = req.file;
            const { serviceType, leadId } = req.body;

            if (!file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({ success: false, message: 'Only image files are allowed' });
            }

            const result = await fileUploadService.uploadImage(file, leadId, serviceType);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json({
                success: true,
                data: { fileUrl: result.fileUrl, message: result.message }
            });
        } catch (error: any) {
            console.error('Error in uploadImageFile:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // Add this new method to the controller
    async uploadMultipleFiles(req: Request, res: Response) {
        try {
            const files = req.files as Express.Multer.File[];
            const { serviceType, leadId } = req.body;

            if (!files || files.length === 0) {
                return res.status(400).json({ success: false, message: 'No files uploaded' });
            }

            const uploadedUrls: string[] = [];
            const errors: string[] = [];

            // Upload files one by one and collect URLs
            for (const file of files) {
                try {
                    let result;
                    if (file.mimetype === 'application/pdf') {
                        result = await fileUploadService.uploadPdf(file, leadId, serviceType);
                    } else if (['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
                        result = await fileUploadService.uploadImage(file, leadId, serviceType);
                    } else {
                        errors.push(`${file.originalname}: Unsupported file type`);
                        continue;
                    }

                    if (result.success && result.fileUrl) {
                        uploadedUrls.push(result.fileUrl);
                    } else {
                        errors.push(`${file.originalname}: ${result.error}`);
                    }
                } catch (error: any) {
                    errors.push(`${file.originalname}: ${error.message}`);
                }
            }

            return res.status(200).json({
                success: uploadedUrls.length > 0,
                data: {
                    uploadedUrls,
                    totalUploaded: uploadedUrls.length,
                    totalFailed: errors.length,
                    errors: errors.length > 0 ? errors : undefined
                },
                message: `${uploadedUrls.length} file(s) uploaded successfully`
            });

        } catch (error: any) {
            console.error('Error in uploadMultipleFiles:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
 * Save uploaded file URLs to database
 */
async saveUploadedFileUrls(req: Request, res: Response) {
  try {
    const { fileUrls, serviceType, leadId } = req.body;

    if (!fileUrls || fileUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'No file URLs provided' });
    }

    if (!leadId) {
      return res.status(400).json({ success: false, message: 'Lead ID is required' });
    }

    // Get existing data
    const { data: existingSummary, error: fetchError } = await supabaseAdmin
      .from('user_itenary_preferences_summary')
      .select('metadata')
      .eq('lead_id', leadId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(fetchError.message);
    }

    const currentMetadata = existingSummary?.metadata || {};
    const existingAttachments = currentMetadata.attachments || [];

    const updatedMetadata = {
      ...currentMetadata,
      attachments: [
        ...existingAttachments,
        {
          id: `${leadId}_${Date.now()}`,
          serviceType,
          fileUrls,
          totalFiles: fileUrls.length,
          uploadedAt: new Date().toISOString()
        }
      ]
    };

    const { error: updateError } = await supabaseAdmin
      .from('user_itenary_preferences_summary')
      .update({ 
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return res.status(200).json({
      success: true,
      message: `${fileUrls.length} file URL(s) saved successfully`,
      data: { fileUrls, serviceType, leadId }
    });

  } catch (error: any) {
    console.error('Error in saveUploadedFileUrls:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
},
};




