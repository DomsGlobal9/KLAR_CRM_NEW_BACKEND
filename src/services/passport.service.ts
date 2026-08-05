import { PassportRepository } from '../repositories/passport.repository';

export class PassportService {
    private passportRepository: PassportRepository;

    constructor() {
        this.passportRepository = new PassportRepository();
    }

    private filterByServiceType(quotes: any[], filter: string) {
        const currentFilter = filter.trim().toLowerCase();
        if (currentFilter === 'all') return quotes;

        return quotes.filter((q) => {
            if (!q.service) return false;
            return q.service.toLowerCase() === currentFilter;
        });
    }

    private formatPassportResponse(quotes: any[], totalCount: number, page: number, limit: number) {
        const totalPages = Math.ceil(totalCount / limit) || 1;
        const paginationMetadata = {
            totalCount,
            totalPages,
            currentPage: page,
            rowsPerPage: limit
        };

        if (!quotes || quotes.length === 0) {
            return { quotes: [], pagination: paginationMetadata };
        }

        const transformed = quotes.map((quote) => ({
            id: quote._id,
            service: quote.service,
            applicant: quote.applicant,
            city: quote.city,
            fullName: quote.fullName,
            mobileNumber: quote.mobileNumber,
            emailId: quote.emailId,
            source: quote.source,
            createdAt: quote.createdAt,
            businessName: quote.source === 'b2b' ? (quote.fullName || 'B2B Partner') : 'Individual Customer',
            agentEmail: quote.emailId
        }));

        return {
            quotes: transformed,
            pagination: paginationMetadata
        };
    }

    async getPassportQuotesBySource(
        source: 'b2b' | 'b2c',
        page: number = 1,
        limit: number = 10,
        filter: string = 'all'
    ) {
        const skip = (page - 1) * limit;
        const query = { source };

        const { quotes } = await this.passportRepository.findQuotes(query, 0, 0);
        const filteredQuotes = this.filterByServiceType(quotes, filter);

        const paginated = filteredQuotes.slice(skip, skip + limit);
        return this.formatPassportResponse(paginated, filteredQuotes.length, page, limit);
    }

    async getSinglePassportDetailsBySource(id: string, source: 'b2b' | 'b2c') {
        const quote = await this.passportRepository.findQuoteByIdAndSource(id, source);

        if (!quote) {
            throw new Error(`${source.toUpperCase()} Passport query not found`);
        }

        return {
            ...quote,
            userDetails: {
                businessName: source === 'b2b' ? (quote.fullName || 'B2B Partner') : 'Individual Customer',
                email: quote.emailId,
                mobile: quote.mobileNumber,
                clientType: source,
                role: source === 'b2b' ? 'AGENT' : 'USER'
            }
        };
    }
}

export const passportService = new PassportService();