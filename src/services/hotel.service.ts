// import { getHotelBookingModel } from "../models/hotel-bookings";
// import { getUserModel } from "../models/auth.models";

// export const getAllHotelsWithUsers = async () => {
//     const HotelModel = getHotelBookingModel();
//     const UserModel = getUserModel();

//     // 1. Fetch all hotel bookings
//     const bookings = await HotelModel.find().lean();

//     // 2. Extract unique userIds and filter nulls
//     const userIds = [...new Set(bookings.map(b => b.agentId?.toString()))].filter(Boolean);

//     // 3. Fetch users
//     const users = await UserModel.find({
//         _id: { $in: userIds }
//     }).lean();

//     // 4. Create lookup map
//     const userMap = users.reduce((acc: any, user: any) => {
//         acc[user._id.toString()] = user;
//         return acc;
//     }, {});

//     return bookings
//         .filter(booking => booking.agentId && userMap[booking.agentId.toString()])
//         .map(booking => {
//             const user = userMap[booking.agentId!.toString()];
            
//             return {
//                 reservationId: booking.reservationId,
//                 status: booking.status,
//                 bookingDate: booking.createdAt,
//                 businessName:
//                     user?.businessProfile?.businessName || "N/A"
//             };
//         });
// };








// export const getSingleHotelDetails = async (reservationId: string) => {
//     const HotelModel = getHotelBookingModel();
//     const UserModel = getUserModel();

//     // 1. Find the specific booking by reservationId
//     const booking = await HotelModel.findOne({ reservationId }).lean();

//     if (!booking) {
//         throw new Error("Hotel booking not found");
//     }

//     // 2. Fetch the associated user for business information
//     const user = await UserModel.findById(booking.agentId).lean();

//     // 3. Return the full booking object merged with key user details
//     return {
//         ...booking,
//         userDetails: user ? {
//             businessName: user.businessProfile?.businessName,
//             email: user.email,
//             mobile: user.mobile
//         } : null
//     };
// };


























import { getHotelBookingModel } from "../models/hotel-bookings";
import { getUserModel } from "../models/auth.models";

export const getAllHotelsWithUsers = async () => {
    const HotelModel = getHotelBookingModel();
    const UserModel = getUserModel();

    // 1. Fetch all hotel bookings
    const bookings = await HotelModel.find().lean();

    // 2. Extract unique userIds and filter null/undefined values with type guard
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

    return bookings
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
};

export const getSingleHotelDetails = async (reservationId: string) => {
    const HotelModel = getHotelBookingModel();
    const UserModel = getUserModel();

    // 1. Find the specific booking by reservationId
    const booking = await HotelModel.findOne({ reservationId }).lean();

    if (!booking) {
        throw new Error("Hotel booking not found");
    }

    // 2. Fetch the associated user for business information (only if agentId exists)
    let user = null;
    if (booking.agentId) {
        user = await UserModel.findById(booking.agentId.toString()).lean();
    }

    // 3. Return the full booking object merged with key user details
    return {
        ...booking,
        userDetails: user ? {
            businessName: user.businessProfile?.businessName,
            email: user.email,
            mobile: user.mobile
        } : null
    };
};