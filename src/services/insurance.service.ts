import * as insuranceRepo from "../repositories/insurance.repository";
import { getUserModel } from "../models/auth.models"; // Assuming this helper exists to get the User model

export const getAllInsuranceReportsWithUserDetails = async () => {
    const UserModel = getUserModel();
    
    // 1. Fetch all insurance bookings
    const insuranceBookings = await insuranceRepo.findInsuranceBookings();

    // 2. Extract unique agentIds and filter out null/undefined values with type guard
    const agentIds = [...new Set(
        insuranceBookings
            .map(b => b.agentId?.toString())
            .filter((id): id is string => Boolean(id))
    )];

    // 3. Fetch matching users from auth-service database (only if we have agentIds)
    let users: any[] = [];
    if (agentIds.length > 0) {
        users = await UserModel.find({ _id: { $in: agentIds } }).lean();
    }

    // 4. Create lookup map
    const userMap = users.reduce((acc: any, user: any) => {
        if (user?._id) {
            acc[user._id.toString()] = user;
        }
        return acc;
    }, {});

    // 5. Merge data
    return insuranceBookings.map(booking => {
        const agentIdStr = booking.agentId?.toString();
        return {
            ...booking,
            userDetails: agentIdStr ? (userMap[agentIdStr] || null) : null
        };
    });
};

export const getSingleInsuranceBookingDetails = async (bookingId: string) => {
    const UserModel = getUserModel();
    const booking = await insuranceRepo.findInsuranceBookingById(bookingId);

    if (!booking) return null;

    // Verify agentId against auth-service
    let userDetails = null;
    if (booking.agentId) {
        userDetails = await UserModel.findById(booking.agentId.toString()).lean();
    }

    return {
        ...booking,
        userDetails: userDetails || null
    };
};