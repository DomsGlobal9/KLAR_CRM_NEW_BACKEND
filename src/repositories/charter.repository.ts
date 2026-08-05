import { getCharterBookingModel, ICharterDocument } from '../models/charter.model';

export class CharterRepository {
    async findBookings(
        query: any,
        skip: number = 0,
        limit: number = 0
    ): Promise<{ bookings: ICharterDocument[]; totalCount: number }> {
        const CharterModel = getCharterBookingModel();

        let dbQuery = CharterModel.find(query).sort({ createdAt: -1 });

        // Apply pagination limit only when provided (> 0)
        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }

        const [bookings, totalCount] = await Promise.all([
            dbQuery.lean(),
            CharterModel.countDocuments(query)
        ]);

        return { bookings: bookings as ICharterDocument[], totalCount };
    }

    async findBookingByIdAndSource(id: string, source: 'b2b' | 'b2c'): Promise<ICharterDocument | null> {
        const CharterModel = getCharterBookingModel();
        return await CharterModel.findOne({ _id: id, source }).lean();
    }
}