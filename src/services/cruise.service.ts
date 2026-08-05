import { CruiseRepository } from '../repositories/cruise.repository';

export class CruiseService {
    private cruiseRepository: CruiseRepository;

    constructor() {
        this.cruiseRepository = new CruiseRepository();
    }

    private parseSailMonth(sailMonth: string): Date | null {
        if (!sailMonth) return null;
        
        // YYYY-MM format
        if (/^\d{4}-\d{2}$/.test(sailMonth)) {
            const [year, month] = sailMonth.split('-').map(num => parseInt(num, 10));
            return new Date(year, month - 1, 1);
        }
        
        // MM/YYYY or DD/MM/YYYY format
        if (sailMonth.includes('/')) {
            const parts = sailMonth.split('/');
            if (parts.length === 2) {
                return new Date(parseInt(parts[1], 10), parseInt(parts[0], 10) - 1, 1);
            } else if (parts.length === 3) {
                return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            }
        }

        const parsed = new Date(sailMonth);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    private filterBySailMonth(enquiries: any[], filter: string) {
        const currentFilter = filter.toLowerCase();
        if (currentFilter === 'all') return enquiries;

        const startOfCurrentMonth = new Date();
        startOfCurrentMonth.setDate(1);
        startOfCurrentMonth.setHours(0, 0, 0, 0);

        return enquiries.filter((e) => {
            const sailDate = this.parseSailMonth(e.sailMonth);
            if (!sailDate) return false;

            if (currentFilter === 'past') {
                return sailDate < startOfCurrentMonth;
            }

            if (currentFilter === 'upcoming') {
                return sailDate >= startOfCurrentMonth;
            }

            return true;
        });
    }

    private formatCruiseResponse(enquiries: any[], totalCount: number, page: number, limit: number) {
        const totalPages = Math.ceil(totalCount / limit) || 1;
        const paginationMetadata = {
            totalCount,
            totalPages,
            currentPage: page,
            rowsPerPage: limit
        };

        if (!enquiries || enquiries.length === 0) {
            return { enquiries: [], pagination: paginationMetadata };
        }

        const transformed = enquiries.map((enquiry) => ({
            id: enquiry._id,
            departurePort: enquiry.departurePort,
            sailMonth: enquiry.sailMonth,
            nights: enquiry.nights,
            fullName: enquiry.fullName,
            mobileNumber: enquiry.mobileNumber,
            emailId: enquiry.emailId,
            source: enquiry.source,
            createdAt: enquiry.createdAt,
            businessName: enquiry.source === 'b2b' ? (enquiry.fullName || 'B2B Partner') : 'Individual Customer',
            agentEmail: enquiry.emailId
        }));

        return {
            enquiries: transformed,
            pagination: paginationMetadata
        };
    }

    async getCruiseEnquiriesBySource(
        source: 'b2b' | 'b2c',
        page: number = 1,
        limit: number = 10,
        filter: string = 'all'
    ) {
        const skip = (page - 1) * limit;
        const query = { source };

        const { enquiries } = await this.cruiseRepository.findEnquiries(query, 0, 0);
        const filteredEnquiries = this.filterBySailMonth(enquiries, filter);

        const paginated = filteredEnquiries.slice(skip, skip + limit);
        return this.formatCruiseResponse(paginated, filteredEnquiries.length, page, limit);
    }

    async getSingleCruiseDetailsBySource(id: string, source: 'b2b' | 'b2c') {
        const enquiry = await this.cruiseRepository.findEnquiryByIdAndSource(id, source);

        if (!enquiry) {
            throw new Error(`${source.toUpperCase()} Cruise query not found`);
        }

        return {
            ...enquiry,
            userDetails: {
                businessName: source === 'b2b' ? (enquiry.fullName || 'B2B Partner') : 'Individual Customer',
                email: enquiry.emailId,
                mobile: enquiry.mobileNumber,
                clientType: source,
                role: source === 'b2b' ? 'AGENT' : 'USER'
            }
        };
    }
}

export const cruiseService = new CruiseService();