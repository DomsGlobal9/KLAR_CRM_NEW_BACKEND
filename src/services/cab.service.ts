import * as cabRepo from "../repositories/cab.repository";
import { getUserModel } from "../models/auth.models";

/**
 * Fetch paginated cab reports with hydration from user profiles
 */
export const getAllCabReportsWithUserDetails = async (
    page: number = 1, 
    limit: number = 10,
    portalType: "b2b" | "b2c"
) => {
    const UserModel = getUserModel();
    const skip = (page - 1) * limit;
    
    // Explicit query mapping on "userInfo.clientType".
    // Evaluates "b2b" case, or alternative multi-case (lowercase options or GUEST uppercase)
    const queryFilter = portalType === "b2b" 
        ? { 
            $or: [
                { "userInfo.clientType": "b2b" },
                { "userInfo.clientType": "B2B" } // Case tolerance for legacy writes
            ] 
          }
        : {
            $or: [
                { "userInfo.clientType": "b2c" },
                { "userInfo.clientType": "B2C" },
                { "userInfo.clientType": "GUEST" },
                { "userInfo.clientType": { $exists: false } } 
            ]
          };
    
    const cabBookings = await cabRepo.findCabBookings(queryFilter);
    
    // Sort documents safely by date descending
    const sortedBookings = [...cabBookings].sort((a, b) => {
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

    // Extract unique identifier strings safely for profile lookup arrays
    const actorIds = [...new Set(
        paginatedBookings
            .map(b => b.agentId?.toString() || b.userId?.toString())
            .filter((id): id is string => 
                id !== undefined &&
                id !== 'guest_user' && 
                !id.includes('@') && 
                /^[0-9a-fA-F]{24}$/.test(id)
            )
    )];

    let users: any[] = [];
    if (actorIds.length > 0) {
        users = await UserModel.find({ _id: { $in: actorIds } }).lean();
    }

    const userMap = users.reduce((acc: any, user: any) => {
        if (user?._id) {
            acc[user._id.toString()] = user;
        }
        return acc;
    }, {});

    // Hydrate the matching records array cleanly
    const mergedData = paginatedBookings.map(booking => {
        const targetIdStr = booking.agentId?.toString() || booking.userId?.toString();
        const rawClientType = booking.userInfo?.clientType || '';
        
        // Exact Casing Rule Application
        let normalizedClientType = rawClientType;
        if (rawClientType.toUpperCase() === 'GUEST') {
            normalizedClientType = 'GUEST'; // Must be uppercase
        } else {
            normalizedClientType = rawClientType.toLowerCase(); // b2b or b2c must be lowercase
        }
        
        let defaultUserDetails = null;
        if (normalizedClientType === 'GUEST' || !targetIdStr || !/^[0-9a-fA-F]{24}$/.test(targetIdStr)) {
            defaultUserDetails = {
                businessProfile: {
                    businessName: "Individual Customer"
                },
                email: booking.passenger?.email || booking.agentName || "Guest Rider",
                clientType: "b2c"
            };
        }

        // Apply updated formatting inside cloned record payload structure
        const updatedBooking = {
            ...booking,
            userInfo: booking.userInfo ? {
                ...booking.userInfo,
                clientType: normalizedClientType
            } : undefined
        };

        return {
            ...updatedBooking,
            userDetails: (targetIdStr && userMap[targetIdStr]) ? userMap[targetIdStr] : defaultUserDetails
        };
    });

    return {
        bookings: mergedData,
        pagination: paginationMetadata
    };
};

/**
 * Fetch a single cab booking detail matching criteria
 */
export const getSingleCabBookingDetails = async (bookingId: string, portalType: "b2b" | "b2c") => {
    const UserModel = getUserModel();
    
    const targetQuery = portalType === "b2b"
        ? { 
            $or: [
                { "userInfo.clientType": "b2b" },
                { "userInfo.clientType": "B2B" }
            ] 
          }
        : {
            $or: [
                { "userInfo.clientType": "b2c" },
                { "userInfo.clientType": "B2C" },
                { "userInfo.clientType": "GUEST" },
                { "userInfo.clientType": { $exists: false } }
            ]
          };

    const booking = await cabRepo.findCabBookingById(bookingId, targetQuery);
    if (!booking) return null;

    let userDetails = null;
    const trackingId = booking.agentId || booking.userId;
    const rawClientType = booking.userInfo?.clientType || '';
    
    let normalizedClientType = rawClientType;
    if (rawClientType.toUpperCase() === 'GUEST') {
        normalizedClientType = 'GUEST';
    } else {
        normalizedClientType = rawClientType.toLowerCase();
    }
    
    if (trackingId && normalizedClientType !== 'GUEST' && !trackingId.includes('@') && /^[0-9a-fA-F]{24}$/.test(trackingId)) {
        userDetails = await UserModel.findById(trackingId.toString()).lean();
    }

    if (!userDetails) {
        userDetails = {
            businessProfile: {
                businessName: "Individual Customer"
            },
            email: booking.passenger?.email || booking.agentName || "Guest Rider",
            clientType: "b2c"
        };
    }

    return {
        ...booking,
        userInfo: booking.userInfo ? {
            ...booking.userInfo,
            clientType: normalizedClientType
        } : undefined,
        userDetails
    };
};