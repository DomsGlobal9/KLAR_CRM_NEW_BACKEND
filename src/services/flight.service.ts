import { getBookingModel } from "../models/flight-bookings.model";
import { getUserModel } from "../models/auth.models";

// ==========================================
// B2B FLIGHT SERVICES
// ==========================================
export const getAllFlightsWithUsers = async (
    page: number = 1,
    limit: number = 10,
    filter: string = "all"
) => {
    const BookingModel = getBookingModel();
    const skip = (page - 1) * limit;

    // Base B2B database query
    const baseQuery = {
        "userInfo.clientType": "b2b",
        "userInfo.role": { $exists: true, $ne: "" }
    };

    // Fetch all B2B records to filter strictly in JavaScript
    const allBookings = await BookingModel.find(baseQuery)
        .sort({ createdAt: -1 })
        .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cancelledStatuses = ["CANCELLED", "CANCEL_REQUESTED", "VOIDED", "REJECTED"];

    // Standard JavaScript if/else filtering
    const filteredBookings = allBookings.filter((b) => {
        const currentFilter = filter.toLowerCase();

        // 1. "All Bookings" tab -> Shows every booking regardless of departureDate or status
        if (currentFilter === "all") {
            return true;
        }

        // Rule: If departureDate is missing/null, exclude from past, upcoming, and cancelled
        if (!b.departureDate) {
            return false;
        }

        const isCancelledStatus = cancelledStatuses.includes(b.status?.toUpperCase());

        // 2. "Cancelled" tab -> Must have departureDate AND a cancelled status
        if (currentFilter === "cancelled") {
            return isCancelledStatus;
        }

        // If status is cancelled, exclude from past & upcoming
        if (isCancelledStatus) {
            return false;
        }

        // Parse departureDate safely
        let depDate: Date;
        if (typeof b.departureDate === 'string' && b.departureDate.includes('/')) {
            const [day, month, year] = b.departureDate.split('/');
            depDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        } else {
            depDate = new Date(b.departureDate);
        }

        if (isNaN(depDate.getTime())) {
            return false;
        }

        // 3. "Past Bookings" tab -> departureDate < today
        if (currentFilter === "past") {
            return depDate < today;
        }

        // 4. "Upcoming Bookings" tab -> departureDate >= today
        if (currentFilter === "upcoming") {
            return depDate >= today;
        }

        return true;
    });

    const totalCount = filteredBookings.length;
    const paginatedBookings = filteredBookings.slice(skip, skip + limit);

    return await formatFlightResponse(paginatedBookings, totalCount, page, limit);
};

// Helper function to keep user lookup logic clean
const formatFlightResponse = async (bookings: any[], totalCount: number, page: number, limit: number) => {
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

    const userIds = [...new Set(
        bookings
            .map(b => (b as any).userInfo?.id?.toString())
            .filter((id): id is string => !!id && /^[0-9a-fA-F]{24}$/.test(id))
    )];

    let users: any[] = [];
    const UserModel = getUserModel();

    if (userIds.length > 0) {
        users = await UserModel.find({ _id: { $in: userIds } }).lean();
    }

    const userMap = users.reduce((acc: any, user: any) => {
        if (user?._id) {
            acc[user._id.toString()] = user;
        }
        return acc;
    }, {});

    const transformedBookings = bookings.map(booking => {
        const userId = booking.userInfo?.id?.toString();
        const matchingUser = userId ? userMap[userId] : null;
        const isGuestUser = userId === 'guest_user' || booking.userInfo?.type === 'guest';

        return {
            bookingId: booking.bookingId,
            bookingDate: booking.createdAt,
            status: booking.status,
            totalPrice: booking.totalPrice || 0,
            businessName: matchingUser?.businessProfile?.businessName || (isGuestUser ? "Guest User" : "N/A"),
            agentEmail: booking.userInfo?.email || "N/A",
            departureDate: booking.departureDate || null,
            travellerName: booking.travellers?.[0]
                ? `${booking.travellers[0].firstName} ${booking.travellers[0].lastName}`
                : "N/A"
        };
    });

    return {
        bookings: transformedBookings,
        pagination: paginationMetadata
    };
};




export const getSingleFlightDetails = async (bookingId: string) => {
    const BookingModel = getBookingModel();
    const UserModel = getUserModel();

    const booking = await BookingModel.findOne({ bookingId }).lean();
    if (!booking) {
        throw new Error("Booking not found");
    }

    const userId = booking.userInfo?.id?.toString();
    const isGuestUser = userId === 'guest_user' || booking.userInfo?.type === 'guest';
    let userDetails = null;

    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
        try {
            const user = await UserModel.findById(userId).lean();
            if (user) {
                userDetails = {
                    businessName: user.businessProfile?.businessName || "N/A",
                    email: user.email,
                    mobile: user.mobile,
                    clientType: user.clientType,
                    role: user.roles?.[0] || "USER"
                };
            }
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
        }
    }

    if (!userDetails && isGuestUser) {
        userDetails = {
            businessName: "Guest User",
            email: booking.userInfo?.email || booking.email || "N/A",
            mobile: booking.phone || booking.emergencyContact?.phone || "N/A",
            clientType: "guest",
            role: "GUEST"
        };
    }

    return {
        ...booking,
        userDetails: userDetails || {
            businessName: "N/A",
            email: booking.userInfo?.email || "N/A",
            mobile: "N/A",
            clientType: "unknown",
            role: "UNKNOWN"
        }
    };
};

// ==========================================
// B2C FLIGHT SERVICES
// ==========================================
export const getAllB2CFlightsWithUsers = async (
    page: number = 1,
    limit: number = 10,
    filter: string = "all"
) => {
    const BookingModel = getBookingModel();
    const skip = (page - 1) * limit;

    // Base B2C database query
    const baseQuery = {
        $or: [
            { "userInfo.clientType": { $exists: false } },
            { "userInfo.clientType": { $exists: true, $ne: "b2b" } },
            { "userInfo.role": "" },
            { "userInfo.role": { $exists: false } }
        ]
    };

    const allBookings = await BookingModel.find(baseQuery)
        .sort({ createdAt: -1 })
        .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cancelledStatuses = ["CANCELLED", "CANCEL_REQUESTED", "VOIDED", "REJECTED"];

    // Standard JavaScript if/else filtering
    const filteredBookings = allBookings.filter((b) => {
        const currentFilter = filter.toLowerCase();

        // 1. "All Bookings" tab
        if (currentFilter === "all") {
            return true;
        }

        // Rule: If departureDate is missing/null, exclude from past, upcoming, and cancelled
        if (!b.departureDate) {
            return false;
        }

        const isCancelledStatus = cancelledStatuses.includes(b.status?.toUpperCase());

        // 2. "Cancelled" tab
        if (currentFilter === "cancelled") {
            return isCancelledStatus;
        }

        if (isCancelledStatus) {
            return false;
        }

        // Parse departureDate safely
        let depDate: Date;
        if (typeof b.departureDate === 'string' && b.departureDate.includes('/')) {
            const [day, month, year] = b.departureDate.split('/');
            depDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        } else {
            depDate = new Date(b.departureDate);
        }

        if (isNaN(depDate.getTime())) {
            return false;
        }

        // 3. "Past Bookings" tab
        if (currentFilter === "past") {
            return depDate < today;
        }

        // 4. "Upcoming Bookings" tab
        if (currentFilter === "upcoming") {
            return depDate >= today;
        }

        return true;
    });

    const totalCount = filteredBookings.length;
    const paginatedBookings = filteredBookings.slice(skip, skip + limit);

    return await formatFlightResponse(paginatedBookings, totalCount, page, limit);
};





export const getSingleB2CFlightDetails = async (bookingId: string) => {
    const BookingModel = getBookingModel();
    const UserModel = getUserModel();

    const queryFilter = {
        bookingId,
        $or: [
            { "userInfo.clientType": { $exists: false } },
            { "userInfo.clientType": { $exists: true, $ne: "b2b" } },
            { "userInfo.role": "" },
            { "userInfo.role": { $exists: false } }
        ]
    };

    const booking = await BookingModel.findOne(queryFilter).lean();
    if (!booking) {
        throw new Error("B2C Booking not found");
    }

    const userId = booking.userInfo?.id?.toString();
    let userDetails = null;

    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
        try {
            const user = await UserModel.findById(userId).lean();
            if (user) {
                userDetails = {
                    businessName: user.businessProfile?.businessName || "Individual Customer",
                    email: user.email,
                    mobile: user.mobile,
                    clientType: user.clientType,
                    role: user.roles?.[0] || "USER"
                };
            }
        } catch (error) {
            console.error(`Error fetching B2C user ${userId}:`, error);
        }
    }

    return {
        ...booking,
        userDetails: userDetails || {
            businessName: booking.userInfo?.id === 'guest_user' ? "Guest User" : "Individual Customer",
            email: booking.userInfo?.email || booking.email || "N/A",
            mobile: booking.phone || booking.emergencyContact?.phone || "N/A",
            clientType: "b2c",
            role: "USER"
        }
    };
};