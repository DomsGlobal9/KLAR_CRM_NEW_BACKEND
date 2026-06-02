import { getCabBookingModel } from '../models/cab-booking.model';
import { getUserModel } from "../models/auth.models";
import mongoose from "mongoose"; // 1. Import mongoose at the top

export class CabsManagementRepository {
    async findAllCabBookings(filter: Record<string, any> = {}): Promise<any[]> {
        const CabBookingModel = getCabBookingModel();
        const UserModel = getUserModel();

        if (filter && filter.userId) {
            filter.userId = filter.userId.toString();
        }

        // 1. Fetch cab bookings matching the filter criteria
        const bookings = await CabBookingModel.find(filter).sort({ createdAt: -1 }).lean();

        if (bookings.length === 0) return [];

        // 2. Extract unique string values, then map them to valid ObjectIds
        const userIds = [...new Set(bookings.map(b => b.userId?.toString()).filter(Boolean))]
            .map(id => new mongoose.Types.ObjectId(id)); // 🌟 CRITICAL FIX HERE

        // 3. Query across to the auth service database using real ObjectIds
        const users = await UserModel.find({ _id: { $in: userIds } }).lean();

        // 4. Map users using plain string keys for matching
        const userMap = users.reduce((acc, user) => {
            if (user?._id) {
                const userIdStr = user._id.toString(); // Convert ObjectId back to string for the map key
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
     * Also update your findCabBookingById method to ensure it queries auth accurately!
     */
    async findCabBookingById(bookingId: string): Promise<any | null> {
        const CabBookingModel = getCabBookingModel();
        const UserModel = getUserModel();

        const booking = await CabBookingModel.findOne({ bookingId }).lean();
        if (!booking) return null;

        let userProfile = null;
        if (booking.userId) {
            // 🌟 CRITICAL FIX HERE: Convert string userId to native ObjectId
            const userObjectId = new mongoose.Types.ObjectId(booking.userId.toString());
            const foundUser = await UserModel.findById(userObjectId).lean();
            
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