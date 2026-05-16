// import { getCabBookingModel, ICabBooking } from '../models/cab-booking.model';
// import { getUserModel } from "../models/auth.models"

// export class CabsManagementRepository {
//     /**
//      * Finds cab bookings and supplements them with cross-database User profile records
//      */
//     async findAllCabBookings(filter: Record<string, any> = {}): Promise<any[]> {
//         const CabBookingModel = getCabBookingModel();
//         const UserModel = getUserModel();

//         // 1. Fetch cab bookings matching the filter criteria
//         const bookings = await CabBookingModel.find(filter).sort({ createdAt: -1 }).lean();

//         if (bookings.length === 0) return [];

//         // 2. Extract unique string values for userIds
//         const userIds = [...new Set(bookings.map(b => b.userId).filter(Boolean))];

//         // 3. Query across to the auth service database
//         const users = await UserModel.find({ _id: { $in: userIds } }).lean();

//         // Map users via an indexing table dictionary for O(1) performance lookup mapping
//         const userMap = users.reduce((acc, user) => {
//             const userIdStr = user._id.toString();
//             acc[String(user._id)] = {
//                 email: user.email,
//                 mobile: user.mobile,
//                 clientType: user.clientType,
//                 roles: user.roles,
//                 status: user.status,
//                 businessProfile: user.businessProfile
//             };
//             return acc;
//         }, {} as Record<string, any>);

//         // 4. Merge user profile metadata safely back into the final payloads
//         return bookings.map(booking => {
//             const bookingUserIdStr = booking.userId ? booking.userId.toString() : '';
//             return{
//             ...booking,
//             userProfile: booking.userId ? (userMap[String(booking.userId)] || null) : null
//             }
//         });
//     }

//     /**
//      * Finds a distinct booking and maps the matching target user document profiles
//      */
//     async findCabBookingById(bookingId: string): Promise<any | null> {
//         const CabBookingModel = getCabBookingModel();
//         const UserModel = getUserModel();

//         const booking = await CabBookingModel.findOne({ bookingId }).lean();
//         if (!booking) return null;

//         let userProfile = null;
//         if (booking.userId) {
//             userProfile = await UserModel.findById(booking.userId).lean();
//         }

//         return {
//             ...booking,
//             userProfile: userProfile ? {
//                 email: userProfile.email,
//                 mobile: userProfile.mobile,
//                 clientType: userProfile.clientType,
//                 roles: userProfile.roles,
//                 status: userProfile.status,
//                 businessProfile: userProfile.businessProfile
//             } : null
//         };
//     }
// }






















// import { getCabBookingModel, ICabBooking } from '../models/cab-booking.model';
// import { getUserModel } from "../models/auth.models";

// export class CabsManagementRepository {
//     /**
//      * Finds cab bookings and supplements them with cross-database User profile records
//      */
//     async findAllCabBookings(filter: Record<string, any> = {}): Promise<any[]> {
//         const CabBookingModel = getCabBookingModel();
//         const UserModel = getUserModel();

//         // 1. Fetch cab bookings matching the active filter criteria
//         const bookings = await CabBookingModel.find(filter).sort({ createdAt: -1 }).lean();

//         if (bookings.length === 0) return [];

//         // 2. Extract unique string values for userIds
//         const userIds = [...new Set(bookings.map(b => b.userId?.toString()).filter(Boolean))];

//         // 3. Query across to the auth service database
//         const users = await UserModel.find({ _id: { $in: userIds } }).lean();

//         // Map users using plain string keys to prevent comparison mismatches
//         const userMap = users.reduce((acc, user) => {
//             const userIdStr = user._id.toString();
//             acc[userIdStr] = {
//                 email: user.email,
//                 mobile: user.mobile,
//                 clientType: user.clientType,
//                 roles: user.roles,
//                 status: user.status,
//                 businessProfile: user.businessProfile
//             };
//             return acc;
//         }, {} as Record<string, any>);

//         // 4. Merge user profile metadata safely back using string sanitization
//         return bookings.map(booking => {
//             const bookingUserIdStr = booking.userId ? booking.userId.toString() : '';
//             return {
//                 ...booking,
//                 userProfile: bookingUserIdStr ? (userMap[bookingUserIdStr] || null) : null
//             };
//         });
//     }

//     /**
//      * Finds a distinct booking and maps the matching target user document profiles
//      */
//     async findCabBookingById(bookingId: string): Promise<any | null> {
//         const CabBookingModel = getCabBookingModel();
//         const UserModel = getUserModel();

//         const booking = await CabBookingModel.findOne({ bookingId }).lean();
//         if (!booking) return null;

//         let userProfile = null;
//         if (booking.userId) {
//             const foundUser = await UserModel.findById(booking.userId).lean();
//             if (foundUser) {
//                 userProfile = {
//                     email: foundUser.email,
//                     mobile: foundUser.mobile,
//                     clientType: foundUser.clientType,
//                     roles: foundUser.roles,
//                     status: foundUser.status,
//                     businessProfile: foundUser.businessProfile
//                 };
//             }
//         }

//         return {
//             ...booking,
//             userProfile
//         };
//     }
// }























// import { getCabBookingModel, ICabBooking } from '../models/cab-booking.model';
// import { getUserModel } from "../models/auth.models";

// export class CabsManagementRepository {
//     /**
//      * Finds cab bookings and supplements them with cross-database User profile records
//      */
//     async findAllCabBookings(filter: Record<string, any> = {}): Promise<any[]> {
//         const CabBookingModel = getCabBookingModel();
//         const UserModel = getUserModel();

//         // 1. Fetch cab bookings matching the active filter criteria
//         const bookings = await CabBookingModel.find(filter).sort({ createdAt: -1 }).lean();

//         if (bookings.length === 0) return [];

//         // 2. Extract unique string values for userIds
//         const userIds = [...new Set(bookings.map(b => b.userId?.toString()).filter(Boolean))];

//         // 3. Query across to the auth service database
//         const users = await UserModel.find({ _id: { $in: userIds } }).lean();

//         // 4. Map users using plain string keys to prevent comparison mismatches
//         const userMap = users.reduce((acc, user) => {
//             if (user?._id) {
//                 const userIdStr = user._id.toString();
//                 acc[userIdStr] = {
//                     email: user.email,
//                     mobile: user.mobile,
//                     clientType: user.clientType,
//                     roles: user.roles,
//                     status: user.status,
//                     businessProfile: user.businessProfile
//                 };
//             }
//             return acc;
//         }, {} as Record<string, any>);

//         // 5. Merge user profile metadata safely back using string sanitization keys
//         return bookings.map(booking => {
//             const bookingUserIdStr = booking.userId ? booking.userId.toString() : '';
//             return {
//                 ...booking,
//                 userProfile: bookingUserIdStr ? (userMap[bookingUserIdStr] || null) : null
//             };
//         });
//     }

//     /**
//      * Finds a distinct booking and maps the matching target user document profiles
//      */
//     async findCabBookingById(bookingId: string): Promise<any | null> {
//         const CabBookingModel = getCabBookingModel();
//         const UserModel = getUserModel();

//         const booking = await CabBookingModel.findOne({ bookingId }).lean();
//         if (!booking) return null;

//         let userProfile = null;
//         if (booking.userId) {
//             const foundUser = await UserModel.findById(booking.userId).lean();
//             if (foundUser) {
//                 userProfile = {
//                     email: foundUser.email,
//                     mobile: foundUser.mobile,
//                     clientType: foundUser.clientType,
//                     roles: foundUser.roles,
//                     status: foundUser.status,
//                     businessProfile: foundUser.businessProfile
//                 };
//             }
//         }

//         return {
//             ...booking,
//             userProfile
//         };
//     }
// }


































import { getCabBookingModel } from '../models/cab-booking.model';
import { getUserModel } from "../models/auth.models";

export class CabsManagementRepository {
    /**
     * Finds cab bookings and supplements them with cross-database User profile records
     */
    async findAllCabBookings(filter: Record<string, any> = {}): Promise<any[]> {
        const CabBookingModel = getCabBookingModel();
        const UserModel = getUserModel();

        // 1. Fetch cab bookings matching the filter criteria
        const bookings = await CabBookingModel.find(filter).sort({ createdAt: -1 }).lean();

        if (bookings.length === 0) return [];

        // 2. Extract unique string values for userIds
        const userIds = [...new Set(bookings.map(b => b.userId?.toString()).filter(Boolean))];

        // 3. Query across to the auth service database
        const users = await UserModel.find({ _id: { $in: userIds } }).lean();

        // 4. Map users using clear plain string keys
        const userMap = users.reduce((acc, user) => {
            if (user?._id) {
                const userIdStr = user._id.toString();
                acc[userIdStr] = {
                    email: user.email,
                    mobile: user.mobile,
                    clientType: user.clientType,
                    roles: user.roles,
                    status: user.status,
                    businessProfile: user.businessProfile
                };
            }
            return acc;
        }, {} as Record<string, any>);

        // 5. Merge user profile metadata back using clean string keys
        return bookings.map(booking => {
            const bookingUserIdStr = booking.userId ? booking.userId.toString() : '';
            return {
                ...booking,
                userProfile: bookingUserIdStr ? (userMap[bookingUserIdStr] || null) : null
            };
        });
    }

    /**
     * Finds a distinct booking and maps the matching target user document profiles
     */
    async findCabBookingById(bookingId: string): Promise<any | null> {
        const CabBookingModel = getCabBookingModel();
        const UserModel = getUserModel();

        const booking = await CabBookingModel.findOne({ bookingId }).lean();
        if (!booking) return null;

        let userProfile = null;
        if (booking.userId) {
            const foundUser = await UserModel.findById(booking.userId).lean();
            if (foundUser) {
                userProfile = {
                    email: foundUser.email,
                    mobile: foundUser.mobile,
                    clientType: foundUser.clientType,
                    roles: foundUser.roles,
                    status: foundUser.status,
                    businessProfile: foundUser.businessProfile
                };
            }
        }

        return {
            ...booking,
            userProfile
        };
    }
}