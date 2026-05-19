// import { getBookingModel } from "../models/flight-bookings.model"; 
// import { getUserModel } from "../models/auth.models";

// export const getAllFlightsWithUsers = async () => {
//     // 1. Fetch all flight bookings using the new Model
//     const BookingModel = getBookingModel();
//     const bookings = await BookingModel.find().lean();

//     if (!bookings || bookings.length === 0) return [];

//     // 2. Get unique User IDs from userInfo.id (New Schema location)
//     // We filter to ensure we only get valid strings
//     const userIds = [...new Set(bookings.map(b => b.userInfo?.id?.toString()))].filter(Boolean);

//     // 3. Fetch matching users from the Auth database
//     const UserModel = getUserModel();
//     const users = await UserModel.find({ _id: { $in: userIds } }).lean();

//     // 4. Map users for quick lookup
//     const userMap = users.reduce((acc: any, user: any) => {
//         acc[user._id.toString()] = user;
//         return acc;
//     }, {});


//     // 5. Merge and Transform
//     return bookings.map(booking => {
//         const userId = booking.userInfo?.id.toString();
//         console.log(`Checking match for Booking ${booking.bookingId}: ID from Booking (${typeof userId}) ${userId} vs Map Match: ${!!userMap[userId!]}`);

//         // const user = userId ? userMap[userId] : null;
//         const matchingUser = userId ? userMap[userId] : null;

//         // Extract the first travellerId if it exists, as requested
//         const firstTravellerId = booking.travellers && booking.travellers.length > 0 
//             ? booking.travellers[0].travellerId 
//             : "N/A";

//         return {
//             bookingId: booking.bookingId,
//             bookingDate: booking.createdAt,
//             status: booking.status,
//             totalPrice: booking.totalPrice || 0,
//             // Access businessName from the matched user's profile
//             businessName: matchingUser?.businessProfile?.businessName || "N/A",
//             agentEmail: booking.userInfo?.email || "N/A",
//             travellerName: booking.travellers?.[0] 
//                 ? `${booking.travellers[0].firstName} ${booking.travellers[0].lastName}` 
//                 : "N/A"
//         };
//     });
// };





// /**
//  * Get detailed information for a single flight booking including agent details
//  */
// export const getSingleFlightDetails = async (bookingId: string) => {
//     const BookingModel = getBookingModel();
//     const UserModel = getUserModel();

//     // 1. Find the specific booking by bookingId (from the flight-service DB)
//     const booking = await BookingModel.findOne({ bookingId }).lean();

//     if (!booking) {
//         throw new Error("Booking not found");
//     }

//     // 2. Fetch the user details using the ID from the new schema's userInfo object
//     // We safely convert to string to ensure a match with the Auth DB _id
//     const userId = booking.userInfo?.id?.toString();
    
//     let userDetails = null;
//     if (userId) {
//         const user = await UserModel.findById(userId).lean();
//         if (user) {
//             userDetails = {
//                 businessName: user.businessProfile?.businessName || "N/A",
//                 email: user.email,
//                 mobile: user.mobile,
//                 clientType: user.clientType,
//                 role: user.roles?.[0] || "USER"
//             };
//         }
//     }

//     // 3. Return the full booking document plus the merged userDetails
//     return {
//         ...booking,
//         userDetails // Added as a separate object for the frontend to consume
//     };
// };
























import { getBookingModel } from "../models/flight-bookings.model"; 
import { getUserModel } from "../models/auth.models";

export const getAllFlightsWithUsers = async () => {
    // 1. Fetch all flight bookings using the new Model
    const BookingModel = getBookingModel();
    const bookings = await BookingModel.find().lean();

    if (!bookings || bookings.length === 0) return [];

    // 2. Get unique User IDs from userInfo.id (New Schema location)
    // We filter to ensure we only get valid strings using type guard
    const userIds = [...new Set(
        bookings
            .map(b => b.userInfo?.id?.toString())
            .filter((id): id is string => Boolean(id))
    )];

    // 3. Fetch matching users from the Auth database (only if we have userIds)
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
    return bookings.map(booking => {
        const userId = booking.userInfo?.id?.toString();
        console.log(`Checking match for Booking ${booking.bookingId}: ID from Booking (${typeof userId}) ${userId} vs Map Match: ${!!userMap[userId!]}`);

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

/**
 * Get detailed information for a single flight booking including agent details
 */
export const getSingleFlightDetails = async (bookingId: string) => {
    const BookingModel = getBookingModel();
    const UserModel = getUserModel();

    // 1. Find the specific booking by bookingId (from the flight-service DB)
    const booking = await BookingModel.findOne({ bookingId }).lean();

    if (!booking) {
        throw new Error("Booking not found");
    }

    // 2. Fetch the user details using the ID from the new schema's userInfo object
    // We safely convert to string to ensure a match with the Auth DB _id
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

    // 3. Return the full booking document plus the merged userDetails
    return {
        ...booking,
        userDetails // Added as a separate object for the frontend to consume
    };
};