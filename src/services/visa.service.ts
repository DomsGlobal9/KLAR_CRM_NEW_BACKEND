// // src/service/visa.service.ts
// import { IVisaApplication } from '../models/visa-bookings.model';
// import visaRepository from '../repositories/visa.repository';


// export class VisaService {
//     // Shared paginated collection engine for custom filtered flows
//     async getVisaBookings(filter: any, page: number, limit: number) {
//         const { data, total } = await visaRepository.findAllBookings(filter, page, limit);
        
//         return {
//             data,
//             pagination: {
//                 total,
//                 page,
//                 limit,
//                 pages: Math.ceil(total / limit)
//             }
//         };
//     }

//     // Resolves single custom bookings matching secure endpoint configurations
//     async getVisaBookingByIdAndSource(id: string, channel: 'B2B_PORTAL' | 'B2C'): Promise<IVisaApplication> {
//         const query: any = { _id: id };
        
//         if (channel === 'B2B_PORTAL') {
//             query.source = 'B2B_PORTAL';
//         } else {
//             query.source = { $ne: 'B2B_PORTAL' };
//         }

//         const booking = await visaRepository.findBookingByQuery(query);
//         if (!booking) {
//             throw new Error('Visa booking not found');
//         }
//         return booking;
//     }
// }

// export default new VisaService();






















import { IVisaApplication } from '../models/visa-bookings.model';
import visaRepository from '../repositories/visa.repository';

export class VisaService {
    // Shared paginated collection engine for custom filtered flows
    async getVisaBookings(filter: any, page: number, limit: number) {
        const { data, total } = await visaRepository.findAllBookings(filter, page, limit);
        
        // Map raw schema elements to explicitly match your format requirements
        const transformedData = data.map((booking: any) => ({
            _id: booking._id,
            bookingDate: booking.createdAt,
            visaType: booking.visaType || "N/A",
            visaCategory: booking.visaCategory
        }));

        return {
            data: transformedData,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Resolves single custom bookings matching secure endpoint configurations
    async getVisaBookingByIdAndSource(id: string, channel: 'B2B_PORTAL' | 'B2C'): Promise<IVisaApplication> {
        const query: any = { _id: id };
        
        if (channel === 'B2B_PORTAL') {
            query.source = 'B2B_PORTAL';
        } else {
            query.source = { $ne: 'B2B_PORTAL' };
        }

        const booking = await visaRepository.findBookingByQuery(query);
        if (!booking) {
            throw new Error('Visa booking not found');
        }
        return booking;
    }
}

export default new VisaService();