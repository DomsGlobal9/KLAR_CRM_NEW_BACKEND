import { getBookingModel } from "../models/flight-bookings.model";
import { getUserModel } from "../models/auth.models";

// ==========================================
// B2B FLIGHT SERVICES
// ==========================================
export const getAllFlightsWithUsers = async (page: number = 1, limit: number = 10) => {
    const BookingModel = getBookingModel();
    const skip = (page - 1) * limit;

    const queryFilter = { 
        "userInfo.clientType": "b2b",
        "userInfo.role": { $exists: true, $ne: "" } 
    };

    const totalCount = await BookingModel.countDocuments(queryFilter);
    const bookings = await BookingModel.find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

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
            .map(b => b.userInfo?.id?.toString())
            .filter((id): id is string => id && /^[0-9a-fA-F]{24}$/.test(id))
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
export const getAllB2CFlightsWithUsers = async (page: number = 1, limit: number = 10) => {
    const BookingModel = getBookingModel();
    const skip = (page - 1) * limit;
    
    const queryFilter = { 
        $or: [
            { "userInfo.clientType": { $exists: false } },
            { "userInfo.clientType": { $exists: true, $ne: "b2b" } },
            { "userInfo.role": "" },
            { "userInfo.role": { $exists: false } }
        ] 
    };

    const totalCount = await BookingModel.countDocuments(queryFilter);
    const bookings = await BookingModel.find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

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
            .map(b => b.userInfo?.id?.toString())
            .filter((id): id is string => id && /^[0-9a-fA-F]{24}$/.test(id))
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
        const isGuest = userId === 'guest_user' || !booking.userInfo?.clientType;

        return {
            bookingId: booking.bookingId,
            bookingDate: booking.createdAt,
            status: booking.status,
            totalPrice: booking.totalPrice || 0,
            businessName: matchingUser?.businessProfile?.businessName || 
                          (isGuest ? "Guest User" : "Individual Customer"),
            agentEmail: booking.userInfo?.email || booking.email || "N/A",
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