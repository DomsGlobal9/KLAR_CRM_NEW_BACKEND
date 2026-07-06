import { getBookingModel } from "../models/flight-bookings.model";
import { getUserModel } from "../models/auth.models";

export const getAllFlightsWithUsers = async (page: number = 1, limit: number = 10) => {
    const BookingModel = getBookingModel();

    const skip = (page - 1) * limit;
    const totalCount = await BookingModel.countDocuments();

    const bookings = await BookingModel.find()
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

    // Filter out guest users and invalid IDs
    const userIds = [...new Set(
        bookings
            .map(b => b.userInfo?.id?.toString())
            .filter((id): id is string => {
                // Skip guest_user and other non-ObjectId strings
                if (!id) return false;
                // Check if it's a valid ObjectId format (24 hex characters)
                return /^[0-9a-fA-F]{24}$/.test(id);
            })
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
        const isValidObjectId = userId && /^[0-9a-fA-F]{24}$/.test(userId);
        const matchingUser = isValidObjectId && userId ? userMap[userId] : null;

        // Check if it's a guest user by looking at the ID value
        const isGuestUser = userId === 'guest_user' || booking.userInfo?.type === 'guest';

        return {
            bookingId: booking.bookingId,
            bookingDate: booking.createdAt,
            status: booking.status,
            totalPrice: booking.totalPrice || 0,
            businessName: matchingUser?.businessProfile?.businessName ||
                (isGuestUser ? "Guest User" : "N/A"),
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
    const isValidObjectId = userId && /^[0-9a-fA-F]{24}$/.test(userId);
    const isGuestUser = userId === 'guest_user' || booking.userInfo?.type === 'guest';

    let userDetails = null;

    // Only try to fetch user if it's a valid ObjectId
    if (userId && isValidObjectId) {
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

    // If no user found or it's a guest, provide default guest details
    if (!userDetails && isGuestUser) {
        userDetails = {
            businessName: "Guest User",
            email: booking.userInfo?.email || "N/A",
            mobile: "N/A",
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