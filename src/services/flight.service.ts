import { getBookingModel } from "../models/flight-bookings.model"; 
import { getUserModel } from "../models/auth.models";

export const getAllFlightsWithUsers = async () => {
    // 1. Fetch all flight bookings using the new Model
    const BookingModel = getBookingModel();
    const bookings = await BookingModel.find().lean();

    if (!bookings || bookings.length === 0) return [];

    // 2. Get unique User IDs from userInfo.id (New Schema location)
    // We filter to ensure we only get valid strings
    const userIds = [...new Set(bookings.map(b => b.userInfo?.id?.toString()))].filter(Boolean);

    // 3. Fetch matching users from the Auth database
    const UserModel = getUserModel();
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();

    // 4. Map users for quick lookup
    const userMap = users.reduce((acc: any, user: any) => {
        acc[user._id.toString()] = user;
        return acc;
    }, {});


    // 5. Merge and Transform
    return bookings.map(booking => {
        const userId = booking.userInfo?.id.toString();
        console.log(`Checking match for Booking ${booking.bookingId}: ID from Booking (${typeof userId}) ${userId} vs Map Match: ${!!userMap[userId!]}`);

        // const user = userId ? userMap[userId] : null;
        const matchingUser = userId ? userMap[userId] : null;

        // Extract the first travellerId if it exists, as requested
        const firstTravellerId = booking.travellers && booking.travellers.length > 0 
            ? booking.travellers[0].travellerId 
            : "N/A";

        return {
            bookingId: booking.bookingId,
            bookingDate: booking.createdAt,
            status: booking.status,
            totalPrice: booking.totalPrice || 0,
            // Access businessName from the matched user's profile
            businessName: matchingUser?.businessProfile?.businessName || "N/A",
            agentEmail: booking.userInfo?.email || "N/A",
            travellerName: booking.travellers?.[0] 
                ? `${booking.travellers[0].firstName} ${booking.travellers[0].lastName}` 
                : "N/A"
        };
    });
};









// //Get single flight booking
// export const getSingleFlightDetails = async (bookingId: string) => {
//     const BookingModel = BookingModel; // Use the new model
//     const UserModel = getUserModel();

//     // 1. Find the specific booking by bookingId
//     const booking = await BookingModel.findOne({ bookingId }).lean();

//     if (!booking) {
//         throw new Error("Booking not found");
//     }

//     // 2. Fetch the user details for this specific booking
//     const user = await UserModel.findById(booking.userId).lean();

//     // 3. Return everything from the booking + userDetails
//     return {
//         ...booking,
//         userDetails: user ? {
//             businessName: user.businessProfile?.businessName,
//             email: user.email,
//             mobile: user.mobile,
//             clientType: user.clientType
//         } : null
//     };
// };



