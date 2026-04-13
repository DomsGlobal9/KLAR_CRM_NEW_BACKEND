import { getFlightBookingModel } from "../models/flight-bookings.model";
import { getUserModel } from "../models/auth.models";


//Get all flight booking details
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





//Get single flight booking
export const getSingleFlightDetails = async (bookingId: string) => {
    const FlightModel = getFlightBookingModel();
    const UserModel = getUserModel();

    // 1. Find the specific booking by bookingId
    const booking = await FlightModel.findOne({ bookingId }).lean();

    if (!booking) {
        throw new Error("Booking not found");
    }

    // 2. Fetch the user details for this specific booking
    const user = await UserModel.findById(booking.userId).lean();

    // 3. Return everything from the booking + userDetails
    return {
        ...booking,
        userDetails: user ? {
            businessName: user.businessProfile?.businessName,
            email: user.email,
            mobile: user.mobile,
            clientType: user.clientType
        } : null
    };
};