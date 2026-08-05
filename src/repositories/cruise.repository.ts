import { getCruiseEnquiryModel, ICruiseEnquiry } from '../models/cruise.model';

export class CruiseRepository {
    async findEnquiries(
        query: any,
        skip: number = 0,
        limit: number = 0
    ): Promise<{ enquiries: ICruiseEnquiry[]; totalCount: number }> {
        const CruiseModel = getCruiseEnquiryModel();

        let dbQuery = CruiseModel.find(query).sort({ createdAt: -1 });

        // Apply pagination limit only when provided (> 0)
        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }

        const [enquiries, totalCount] = await Promise.all([
            dbQuery.lean(),
            CruiseModel.countDocuments(query)
        ]);

        return { enquiries: enquiries as ICruiseEnquiry[], totalCount };
    }

    async findEnquiryByIdAndSource(id: string, source: 'b2b' | 'b2c'): Promise<ICruiseEnquiry | null> {
        const CruiseModel = getCruiseEnquiryModel();
        return await CruiseModel.findOne({ _id: id, source }).lean();
    }
}