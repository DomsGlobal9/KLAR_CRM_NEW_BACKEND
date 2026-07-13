// import { IVisaApplication } from "../models/visa-bookings.model";
// import { getVisaApplicationModel } from "../models/visa-bookings.model";

// export class VisaRepository {
//     // Dynamic paginated search for B2B/B2C dashboards
//     async findAllBookings(
//         filter: Record<string, any>,
//         page: number,
//         limit: number
//     ): Promise<{ data: IVisaApplication[]; total: number }> {
//         const skip = (page - 1) * limit;
        
//         // ✅ Dynamically resolve model context inside the invocation path
//         const VisaApplicationModel = getVisaApplicationModel();

//         const [data, total] = await Promise.all([
//             VisaApplicationModel.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .lean(),
//             VisaApplicationModel.countDocuments(filter)
//         ]);

//         return { data, total };
//     }

//     // Find deep validation document targets securely
//     async findBookingByQuery(query: Record<string, any>): Promise<IVisaApplication | null> {
//         // ✅ Dynamically resolve model context here too
//         const VisaApplicationModel = getVisaApplicationModel();
//         return await VisaApplicationModel.findOne(query).lean();
//     }
// }

// export default new VisaRepository();






















import { IVisaApplication } from "../models/visa-bookings.model";
import { getVisaApplicationModel } from "../models/visa-bookings.model";

export class VisaRepository {
    // Dynamic paginated search for B2B/B2C dashboards
    async findAllBookings(
        filter: Record<string, any>,
        page: number,
        limit: number
    ): Promise<{ data: any[]; total: number }> {
        const skip = (page - 1) * limit;
        const VisaApplicationModel = getVisaApplicationModel();

        const [data, total] = await Promise.all([
            VisaApplicationModel.find(
                filter, 
                // 1 indicates include field, 0 indicates exclude field
                { _id: 1, createdAt: 1, visaType: 1, visaCategory: 1 } 
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
            VisaApplicationModel.countDocuments(filter)
        ]);

        return { data, total };
    }

    // Find deep validation document targets securely (Kept full payload for single details view)
    async findBookingByQuery(query: Record<string, any>): Promise<IVisaApplication | null> {
        const VisaApplicationModel = getVisaApplicationModel();
        return await VisaApplicationModel.findOne(query).lean();
    }
}

export default new VisaRepository();