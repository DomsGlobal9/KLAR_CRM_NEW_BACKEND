// import { getHotelBookingModel } from "../models/hotel-bookings";
// import { getUserModel } from "../models/auth.models";

// export const getAllHotelsWithUsers = async (page: number = 1, limit: number = 10) => {
//     const HotelModel = getHotelBookingModel();
//     const UserModel = getUserModel();

//     const skip = (page - 1) * limit;
//     const totalCount = await HotelModel.countDocuments();

//     // 1. Fetch hotel bookings with sorting, skip, and limit applied
//     const bookings = await HotelModel.find()
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean();

//     const totalPages = Math.ceil(totalCount / limit) || 1;
//     console.log("hotel.service.ts -> getAllHotelsWithUsers -> bookings", totalCount, totalPages);

//     const pagination = {
//         totalCount,
//         totalPages,
//         currentPage: page,
//         rowsPerPage: limit
//     };
//     console.log("hotel.service.ts -> getAllHotelsWithUsers -> bookings", pagination, bookings);

//     // 2. Extract unique userIds and filter null/undefined values
//     const userIds = [...new Set(
//         bookings
//             .map(b => b.agentId?.toString())
//             .filter((id): id is string => Boolean(id))
//     )];

//     // 3. Fetch users only if we have valid userIds
//     let users: any[] = [];
//     if (userIds.length > 0) {
//         users = await UserModel.find({
//             _id: { $in: userIds }
//         }).lean();
//     }

//     // 4. Create lookup map
//     const userMap = users.reduce((acc: any, user: any) => {
//         if (user?._id) {
//             acc[user._id.toString()] = user;
//         }
//         return acc;
//     }, {});

//     const transformedBookings = bookings.map(booking => {
//         const agentIdStr = booking.agentId?.toString();
//         const user = agentIdStr ? userMap[agentIdStr] : null;

//         return {
//             reservationId: booking.reservationId,
//             status: booking.status,
//             bookingDate: booking.createdAt,
//             businessName: user?.businessProfile?.businessName || "Guest User"
//         };
//     });

//     return {
//         bookings: transformedBookings,
//         pagination
//     }
// }



// export const getSingleHotelDetails = async (reservationId: string) => {
//     const HotelModel = getHotelBookingModel();
//     const UserModel = getUserModel();

//     const booking = await HotelModel.findOne({ reservationId }).lean();

//     if (!booking) {
//         throw new Error("Hotel booking not found");
//     }

//     let user = null;
//     if (booking.agentId) {
//         user = await UserModel.findById(booking.agentId.toString()).lean();
//     }

//     return {
//         ...booking,
//         userDetails: user ? {
//             businessName: user.businessProfile?.businessName,
//             email: user.email,
//             mobile: user.mobile
//         } : null
//     };
// };










































import { getUserModel } from "../models/auth.models";
import { 
    getB2BHotelFilters, 
    getB2CHotelFilters, 
    findHotelBookingsWithPagination, 
    findHotelBookingByQuery 
} from "../repositories/hotel.repository";

// Helper logic to load structural aggregation dependencies seamlessly
const compileUserLookupsMap = async (bookings: any[]) => {
    const agentIds = [...new Set(
        bookings
            .map(b => b.agentId?.toString() || b.userInfo?.id?.toString())
            .filter((id): id is string => id && /^[0-9a-fA-F]{24}$/.test(id))
    )];

    let users: any[] = [];
    if (agentIds.length > 0) {
        const UserModel = getUserModel();
        users = await UserModel.find({ _id: { $in: agentIds } }).lean();
    }

    return users.reduce((acc: any, user: any) => {
        if (user?._id) acc[user._id.toString()] = user;
        return acc;
    }, {});
};

// ==========================================
// B2B HOTEL SERVICES
// ==========================================
export const getAllB2BHotelsWithUsers = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const filter = getB2BHotelFilters();

    const { bookings, totalCount } = await findHotelBookingsWithPagination(filter, skip, limit);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const pagination = { totalCount, totalPages, currentPage: page, rowsPerPage: limit };

    if (!bookings || bookings.length === 0) {
        return { bookings: [], pagination };
    }

    const userMap = await compileUserLookupsMap(bookings);

    const transformedBookings = bookings.map(booking => {
        const agentIdStr = booking.agentId?.toString() || booking.userInfo?.id?.toString();
        const user = agentIdStr ? userMap[agentIdStr] : null;

        return {
            reservationId: booking.reservationId,
            status: booking.status,
            bookingDate: booking.createdAt,
            hotelName: booking.hotelName || "ABC Travel Agency"
        };
    });

    return { bookings: transformedBookings, pagination };
};

export const getSingleB2BHotelDetails = async (reservationId: string) => {
    const filter = { reservationId, ...getB2BHotelFilters() };
    const booking = await findHotelBookingByQuery(filter);
    if (!booking) throw new Error("B2B Hotel booking not found");

    const agentIdStr = booking.agentId?.toString() || booking.userInfo?.id?.toString();
    let userDetails = null;

    if (agentIdStr && /^[0-9a-fA-F]{24}$/.test(agentIdStr)) {
        const UserModel = getUserModel();
        const user = await UserModel.findById(agentIdStr).lean();
        if (user) {
            userDetails = {
                businessName: user.businessProfile?.businessName || "N/A",
                email: user.email,
                mobile: user.mobile
            };
        }
    }

    return { ...booking, userDetails };
};

// ==========================================
// B2C HOTEL SERVICES
// ==========================================
export const getAllB2CHotelsWithUsers = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const filter = getB2CHotelFilters();

    const { bookings, totalCount } = await findHotelBookingsWithPagination(filter, skip, limit);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const pagination = { totalCount, totalPages, currentPage: page, rowsPerPage: limit };

    if (!bookings || bookings.length === 0) {
        return { bookings: [], pagination };
    }

    const userMap = await compileUserLookupsMap(bookings);
        console.log("hotel.service.ts -> getAllB2CHotelsWithUsers -> userMap", userMap);
    const transformedBookings = bookings.map(booking => {
        const userIdStr = booking.userInfo?.id?.toString() || booking.agentId?.toString();
        const user = userIdStr ? userMap[userIdStr] : null;
        const isGuest = userIdStr === 'guest_user' || !booking.userInfo?.clientType;

        return {
            reservationId: booking.reservationId,
            status: booking.status,
            bookingDate: booking.createdAt,
            guestName: booking?.guestName || (isGuest ? "Guest User" : "Individual Customer")
        };
    });

    return { bookings: transformedBookings, pagination };
};

export const getSingleB2CHotelDetails = async (reservationId: string) => {
    const filter = { reservationId, ...getB2CHotelFilters() };
    const booking = await findHotelBookingByQuery(filter);
    if (!booking) throw new Error("B2C Hotel booking not found");

    const userIdStr = booking.userInfo?.id?.toString() || booking.agentId?.toString();
    let userDetails = null;

    if (userIdStr && /^[0-9a-fA-F]{24}$/.test(userIdStr)) {
        const UserModel = getUserModel();
        const user = await UserModel.findById(userIdStr).lean();
        if (user) {
            userDetails = {
                businessName: user.businessProfile?.businessName || "Individual Customer",
                email: user.email,
                mobile: user.mobile
            };
        }
    }

    return {
        ...booking,
        userDetails: userDetails || {
            businessName: booking.userInfo?.id === 'guest_user' ? "Guest User" : "Individual Customer",
            email: booking.userInfo?.email || booking.guestEmail || "N/A",
            mobile: booking.userInfo?.phone || booking.guestMobile || "N/A"
        }
    };
};