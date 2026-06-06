import { getHotelBookingModel } from "../models/hotel-bookings";
import { getUserModel } from "../models/auth.models";

export const getAllHotelsWithUsers = async (page: number = 1, limit: number = 10) => {
    const HotelModel = getHotelBookingModel();
    const UserModel = getUserModel();

    const skip = (page - 1) * limit;
    const totalCount = await HotelModel.countDocuments();

    // 1. Fetch hotel bookings with sorting, skip, and limit applied
    const bookings = await HotelModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalPages = Math.ceil(totalCount / limit) || 1;

    const pagination = {
        totalCount,
        totalPages,
        currentPage: page,
        rowsPerPage: limit
    };

    // 2. Extract unique userIds and filter null/undefined values
    const userIds = [...new Set(
        bookings
            .map(b => b.agentId?.toString())
            .filter((id): id is string => Boolean(id))
    )];

    // 3. Fetch users only if we have valid userIds
    let users: any[] = [];
    if (userIds.length > 0) {
        users = await UserModel.find({
            _id: { $in: userIds }
        }).lean();
    }

    // 4. Create lookup map
    const userMap = users.reduce((acc: any, user: any) => {
        if (user?._id) {
            acc[user._id.toString()] = user;
        }
        return acc;
    }, {});

    const transformedBookings = bookings
        .filter(booking => booking.agentId && userMap[booking.agentId.toString()])
        .map(booking => {
            const user = userMap[booking.agentId!.toString()];
            
            return {
                reservationId: booking.reservationId,
                status: booking.status,
                bookingDate: booking.createdAt,
                businessName: user?.businessProfile?.businessName || "N/A"
            };
        });

    return {
        bookings: transformedBookings,
        pagination
    };
};

export const getSingleHotelDetails = async (reservationId: string) => {
    const HotelModel = getHotelBookingModel();
    const UserModel = getUserModel();

    const booking = await HotelModel.findOne({ reservationId }).lean();

    if (!booking) {
        throw new Error("Hotel booking not found");
    }

    let user = null;
    if (booking.agentId) {
        user = await UserModel.findById(booking.agentId.toString()).lean();
    }

    return {
        ...booking,
        userDetails: user ? {
            businessName: user.businessProfile?.businessName,
            email: user.email,
            mobile: user.mobile
        } : null
    };
};