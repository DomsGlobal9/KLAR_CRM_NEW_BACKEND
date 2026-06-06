import { getBookingModel } from "../models/flight-bookings.model"; 
import { getUserModel } from "../models/auth.models";

export const getAllFlightsWithUsers = async (page: number = 1, limit: number = 10) => {
    const BookingModel = getBookingModel();
    
    // Calculate page skips
    const skip = (page - 1) * limit;

    // Fetch absolute metrics total for records
    const totalCount = await BookingModel.countDocuments();

    // 1. Fetch flight bookings with sort, skip, and execution limits
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

    const userIds = [...new Set(
        bookings
            .map(b => b.userInfo?.id?.toString())
            .filter((id): id is string => Boolean(id))
    )];

    // 3. Fetch matching users from the Auth database
    let users: any[] = [];
    const UserModel = getUserModel();
    
    if (userIds.length > 0) {
        users = await UserModel.find({ _id: { $in: userIds } }).lean();
    }

    // 4. Map users for quick lookup
    const userMap = users.reduce((acc: any, user: any) => {
        if (user?._id) {
            acc[user._id.toString()] = user;
        }
        return acc;
    }, {});

    // 5. Merge and Transform
    const transformedBookings = bookings.map(booking => {
        const userId = booking.userInfo?.id?.toString();
        console.log(`Checking match for Booking ${booking.bookingId}: ID from Booking (${typeof userId}) ${userId} vs Map Match: ${!!userMap[userId!]}`);

        const matchingUser = userId ? userMap[userId] : null;

        return {
            bookingId: booking.bookingId,
            bookingDate: booking.createdAt,
            status: booking.status,
            totalPrice: booking.totalPrice || 0,
            businessName: matchingUser?.businessProfile?.businessName || "N/A",
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
    
    let userDetails = null;
    if (userId) {
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
    }

    return {
        ...booking,
        userDetails 
    };
};