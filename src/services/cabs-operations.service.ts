// import { CabsManagementRepository } from '../repositories/cabs-management.repository';
// import { ICabBooking } from '../models/cab-booking.model';

// export class CabsOperationsService {
//     private cabsRepository = new CabsManagementRepository();

//     /**
//      * Business logic for fetching bookings. 
//      * Supports passing active session context to filter by specific Agent/User.
//      */
//     async getAllCabBookings(b2bContext?: { agentId?: string; userId?: string }): Promise<ICabBooking[]> {
//         const queryFilter: Record<string, any> = {};

//         if (b2bContext?.agentId) {
//             queryFilter.agentId = b2bContext.agentId;
//         } else if (b2bContext?.userId) {
//             queryFilter.userId = b2bContext.userId;
//         }

//         return await this.cabsRepository.findAllCabBookings(queryFilter);
//     }

//     /**
//      * Business logic for pulling a distinct booking asset
//      */
//     async getCabBookingDetail(bookingId: string): Promise<ICabBooking> {
//         if (!bookingId) {
//             throw new Error("Booking ID token parameter is missing");
//         }

//         const cabBooking = await this.cabsRepository.findCabBookingById(bookingId);
//         if (!cabBooking) {
//             throw new Error(`Cab booking data for tracking token ${bookingId} was not found`);
//         }

//         return cabBooking;
//     }
// }














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