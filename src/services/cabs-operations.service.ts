import { CabsManagementRepository } from '../repositories/cabs-management.repository';

export class CabsOperationsService {
    private cabsRepository = new CabsManagementRepository();

    async getAllCabBookings(b2bContext?: { agentId?: string; userId?: string }): Promise<any[]> {
        const queryFilter: Record<string, any> = {};

        if (b2bContext?.agentId) {
            queryFilter.agentId = b2bContext.agentId;
        } else if (b2bContext?.userId) {
            queryFilter.userId = b2bContext.userId;
        }

        return await this.cabsRepository.findAllCabBookings(queryFilter);
    }

    async getCabBookingDetail(bookingId: string): Promise<any> {
        if (!bookingId) {
            throw new Error("Target look-up parameter 'bookingId' is required");
        }

        const cabBooking = await this.cabsRepository.findCabBookingById(bookingId);
        if (!cabBooking) {
            throw new Error(`No record identified matching booking entity ID ${bookingId}`);
        }

        return cabBooking;
    }
}