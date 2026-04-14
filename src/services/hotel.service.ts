import { getHotelBookingModel } from "../models/hotel-bookings";
import { getUserModel } from "../models/auth.models";

export const getAllHotelsWithUsers = async () => {
    const HotelModel = getHotelBookingModel();
    const UserModel = getUserModel();

    // 1. Fetch all hotel bookings from hotel-booking-service
    const bookings = await HotelModel.find().lean();

    // 2. Extract unique userIds and filter nulls
    const userIds = [...new Set(bookings.map(b => b.userId?.toString()))].filter(Boolean);

    // 3. Fetch matching users from auth-service database
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();

    // 4. Create a map for user lookups
    const userMap = users.reduce((acc: any, user: any) => {
        acc[user._id.toString()] = user;
        return acc;
    }, {});

    return bookings
        .filter(booking => booking.userId && userMap[booking.userId.toString()])
        .map(booking => {
            const user = userMap[booking.userId!.toString()];
            
            return {
                reservationId: booking.reservationId,
                status: booking.status,
                bookingDate: booking.createdAt, // Using createdAt as the booking date
                businessName: user?.businessProfile?.businessName || "N/A"
            };
        });
};