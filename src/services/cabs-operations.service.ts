import { CabsManagementRepository } from '../repositories/cabs-management.repository';

export class CabsOperationsService {
    private cabsRepository = new CabsManagementRepository();

    async getAllCabBookings(targetUserId?: string): Promise<any[]> {
        const queryFilter: Record<string, any> = {};

        // If a userId filter was passed, apply it directly to match the string in the DB
        if (targetUserId) {
            queryFilter.userId = targetUserId;
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