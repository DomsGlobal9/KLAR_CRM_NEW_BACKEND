// import { getFlightBookingModel } from "../models/flight-bookings.model";
// import { getUserModel } from "../models/auth.models";

// export const getAllFlightsWithUsers = async () => {
//     const FlightModel = getFlightBookingModel();
//     console.log("🔍 Checking collection:", FlightModel.collection.name);
//     const UserModel = getUserModel();

//     // 1. Fetch all flight bookings
//     const bookings = await FlightModel.find().lean();
//     console.log("📦 Total Bookings found:", bookings.length);

//     // 2. Get unique user IDs and ensure they are strings for the $in query
//     const userIds = [...new Set(bookings.map(b => b.userId?.toString()))].filter(Boolean);

//     // 3. Fetch users from the Auth database
//     const users = await UserModel.find({ _id: { $in: userIds } }).lean();

//     // 4. Map users: Convert the MongoDB _id to a string key
//     const userMap = users.reduce((acc: any, user: any) => {
//         const stringId = user._id.toString(); 
//         acc[stringId] = user;
//         return acc;
//     }, {});

//     // 5. Merge data: Explicitly convert booking.userId to string before lookup
//     return bookings.map(booking => {
//         const bookingUserIdStr = booking.userId?.toString();
        
//         return {
//             ...booking,
//             userDetails: bookingUserIdStr ? (userMap[bookingUserIdStr] || null) : null
//         };
//     });
// };































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
            bookingDate: booking.createdAt, // Using createdAt as requested
            status: booking.status,
            businessName: user?.businessProfile?.businessName || "N/A"
        };
    });
};