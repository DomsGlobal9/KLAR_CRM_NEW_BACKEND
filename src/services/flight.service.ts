import { getFlightBookingModel } from "../models/flight-bookings.model";
import { getUserModel } from "../models/auth.models";

export const getAllFlightsWithUsers = async () => {
    const FlightModel = getFlightBookingModel();
    const UserModel = getUserModel();

    // 1. Fetch all flight bookings
    const bookings = await FlightModel.find().lean();

    // 2. Get unique user IDs
    const userIds = [...new Set(bookings.map(b => b.userId?.toString()))].filter(Boolean);

    // 3. Fetch matching users
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();

    // 4. Map users for quick lookup
    const userMap = users.reduce((acc: any, user: any) => {
        acc[user._id.toString()] = user;
        return acc;
    }, {});

    // 5. Merge and Transform data to return only specific fields
    return bookings.map(booking => {
        const bookingUserIdStr = booking.userId?.toString();
        const user = bookingUserIdStr ? userMap[bookingUserIdStr] : null;

        return {
            bookingId: booking.bookingId,
            bookingDate: booking.createdAt, 
            status: booking.status,
            businessName: user?.businessProfile?.businessName || "N/A"
        };
    });
};