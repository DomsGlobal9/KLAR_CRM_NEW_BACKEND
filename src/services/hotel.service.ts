import { getHotelBookingModel } from "../models/hotel-bookings";
import { getUserModel } from "../models/auth.models";

export const getAllHotelsWithUsers = async () => {
    const HotelModel = getHotelBookingModel();
    const UserModel = getUserModel();

    // 1. Fetch all hotel bookings
    const bookings = await HotelModel.find().lean();

    // 2. Get unique user IDs and filter out empty/null ones
    const userIds = [...new Set(bookings.map(b => b.userId?.toString()))].filter(Boolean);

    // 3. Fetch users from the Auth database
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();

    // 4. Map users for quick lookup
    const userMap = users.reduce((acc: any, user: any) => {
        acc[user._id.toString()] = user;
        return acc;
    }, {});

    // 5. Merge and Strict Filter: Only return if user exists
    return bookings
        .filter(booking => booking.userId && userMap[booking.userId.toString()]) 
        .map(booking => {
            const user = userMap[booking.userId!.toString()];
            return {
                ...booking,
                businessName: user?.businessProfile?.businessName || "N/A"
            };
        });
};