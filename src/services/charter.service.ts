import { CharterRepository } from '../repositories/charter.repository';

export class CharterService {
    private charterRepository: CharterRepository;

    constructor() {
        this.charterRepository = new CharterRepository();
    }

    private filterByDepartureDateTime(bookings: any[], filter: string) {
        const currentFilter = filter.toLowerCase();
        if (currentFilter === 'all') return bookings;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return bookings.filter((b) => {
            if (!b.departureDateTime) return false;

            const departureDate = new Date(b.departureDateTime);
            if (isNaN(departureDate.getTime())) return false;

            if (currentFilter === 'past') {
                return departureDate < today;
            }

            if (currentFilter === 'upcoming') {
                return departureDate >= today;
            }

            return true;
        });
    }

    private formatCharterResponse(bookings: any[], totalCount: number, page: number, limit: number) {
        const totalPages = Math.ceil(totalCount / limit) || 1;
        const paginationMetadata = {
            totalCount,
            totalPages,
            currentPage: page,
            rowsPerPage: limit
        };

        if (!bookings || bookings.length === 0) {
            return { bookings: [], pagination: paginationMetadata };
        }

        const transformed = bookings.map((booking) => ({
            id: booking._id,
            from: booking.from,
            to: booking.to,
            departureDateTime: booking.departureDateTime,
            passengers: booking.passengers,
            category: booking.category || 'Private Jets',
            fullName: booking.fullName,
            mobileNumber: booking.mobileNumber,
            email: booking.email,
            source: booking.source,
            createdAt: booking.createdAt,
            businessName: booking.source === 'b2b' ? (booking.fullName || 'B2B Partner') : 'Individual Customer',
            agentEmail: booking.email
        }));

        return {
            bookings: transformed,
            pagination: paginationMetadata
        };
    }

    async getCharterBookingsBySource(
        source: 'b2b' | 'b2c',
        page: number = 1,
        limit: number = 10,
        filter: string = 'all'
    ) {
        const skip = (page - 1) * limit;
        const query = { source };

        const { bookings } = await this.charterRepository.findBookings(query, 0, 0);
        const filteredBookings = this.filterByDepartureDateTime(bookings, filter);

        const paginated = filteredBookings.slice(skip, skip + limit);
        return this.formatCharterResponse(paginated, filteredBookings.length, page, limit);
    }

    async getSingleCharterDetailsBySource(id: string, source: 'b2b' | 'b2c') {
        const booking = await this.charterRepository.findBookingByIdAndSource(id, source);

        if (!booking) {
            throw new Error(`${source.toUpperCase()} Charter query not found`);
        }

        return {
            ...booking,
            userDetails: {
                businessName: source === 'b2b' ? (booking.fullName || 'B2B Partner') : 'Individual Customer',
                email: booking.email,
                mobile: booking.mobileNumber,
                clientType: source,
                role: source === 'b2b' ? 'AGENT' : 'USER'
            }
        };
    }
}

export const charterService = new CharterService();