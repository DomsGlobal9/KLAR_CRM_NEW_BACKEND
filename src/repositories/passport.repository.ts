import { getPassportQuoteModel, IPassportQuoteDocument } from '../models/passport.model';

export class PassportRepository {
    async findQuotes(
        query: any,
        skip: number = 0,
        limit: number = 0
    ): Promise<{ quotes: IPassportQuoteDocument[]; totalCount: number }> {
        const PassportModel = getPassportQuoteModel();

        let dbQuery = PassportModel.find(query).sort({ createdAt: -1 });

        // Apply pagination limit only when provided (> 0)
        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }

        const [quotes, totalCount] = await Promise.all([
            dbQuery.lean(),
            PassportModel.countDocuments(query)
        ]);

        return { quotes: quotes as IPassportQuoteDocument[], totalCount };
    }

    async findQuoteByIdAndSource(id: string, source: 'b2b' | 'b2c'): Promise<IPassportQuoteDocument | null> {
        const PassportModel = getPassportQuoteModel();
        return await PassportModel.findOne({ _id: id, source }).lean();
    }
}