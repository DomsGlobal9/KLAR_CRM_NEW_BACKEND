import * as insuranceRepo from "../repositories/insurance.repository";
import { getUserModel } from "../models/auth.models";

/**
 * Fetch paginated insurance reports hydration with user profile context records
 */
export const getAllInsuranceReportsWithUserDetails = async (
    page: number = 1, 
    limit: number = 10,
    portalType: "b2b" | "b2c"
) => {
    const UserModel = getUserModel();
    const skip = (page - 1) * limit;
    
    // Inclusive fallback query matrix to prevent losing historical or un-hydrated records
    const queryFilter = portalType === "b2b" 
        ? { "tjBookPayload.source": "B2B_PORTAL" }
        : {
            $or: [
                { "tjBookPayload.source": "B2C_PORTAL" },
                { "agentId": "guest_user" },
                { "userId": "guest_user" },
                { "tjBookPayload.source": { $exists: false } } 
            ]
          };
    
    const insuranceBookings = await insuranceRepo.findInsuranceBookings(queryFilter);
    
    // Sort documents safely by date descending
    const sortedBookings = [...insuranceBookings].sort((a, b) => {
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        return timeB - timeA;
    });

    const totalCount = sortedBookings.length; 
    const paginatedBookings = sortedBookings.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const paginationMetadata = {
        totalCount,
        totalPages,
        currentPage: page,
        rowsPerPage: limit
    };

    // Extract unique matching hexadecimal pattern IDs safely
    const agentIds = [...new Set(
        paginatedBookings
            .map(b => b.agentId?.toString() || b.userId?.toString())
            .filter((id): id is string => 
                Boolean(id) && 
                id !== 'guest_user' && 
                /^[0-9a-fA-F]{24}$/.test(id as any)
            )
    )];

    let users: any[] = [];
    if (agentIds.length > 0) {
        users = await UserModel.find({ _id: { $in: agentIds } }).lean();
    }

    const userMap = users.reduce((acc: any, user: any) => {
        if (user?._id) {
            acc[user._id.toString()] = user;
        }
        return acc;
    }, {});

    // Hydrate the matching records array cleanly
    const mergedData = paginatedBookings.map(booking => {
        const userIdStr = booking.agentId?.toString() || booking.userId?.toString();
        
        let defaultUserDetails = null;
        if (userIdStr === 'guest_user' || !userIdStr || !/^[0-9a-fA-F]{24}$/.test(userIdStr)) {
            defaultUserDetails = {
                businessProfile: {
                    businessName: "Individual Customer"
                },
                email: booking.userName || booking.agentName || "Guest",
                clientType: "b2c"
            };
        }

        return {
            ...booking,
            userDetails: (userIdStr && userMap[userIdStr]) ? userMap[userIdStr] : defaultUserDetails
        };
    });

    return {
        bookings: mergedData,
        pagination: paginationMetadata
    };
};

/**
 * Fetch a single insurance booking's detailed trace information
 */
export const getSingleInsuranceBookingDetails = async (bookingId: string, portalType: "b2b" | "b2c") => {
    const UserModel = getUserModel();
    
    const targetQuery = portalType === "b2b"
        ? { bookingId, "tjBookPayload.source": "B2B_PORTAL" }
        : {
            bookingId,
            $or: [
                { "tjBookPayload.source": "B2C_PORTAL" },
                { "agentId": "guest_user" },
                { "userId": "guest_user" },
                { "tjBookPayload.source": { $exists: false } }
            ]
          };

    const booking = await insuranceRepo.findInsuranceBookingById(bookingId, targetQuery);
    if (!booking) return null;

    let userDetails = null;
    const trackingId = booking.agentId || booking.userId;
    
    // Apply regex validation safeguard to prevent casting crashes on guest identifiers
    if (trackingId && trackingId !== 'guest_user' && /^[0-9a-fA-F]{24}$/.test(trackingId)) {
        userDetails = await UserModel.findById(trackingId.toString()).lean();
    }

    // Default configuration hydration block for unmatched single views
    if (!userDetails && (trackingId === 'guest_user' || !trackingId || !/^[0-9a-fA-F]{24}$/.test(trackingId))) {
        userDetails = {
            businessProfile: {
                businessName: "Individual Customer"
            },
            email: booking.userName || booking.agentName || "Guest",
            clientType: "b2c"
        };
    }

    return {
        ...booking,
        userDetails
    };
};