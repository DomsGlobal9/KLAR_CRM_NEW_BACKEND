import * as insuranceRepo from "../repositories/insurance.repository";
import { getUserModel } from "../models/auth.models"; // Assuming this helper exists to get the User model

export const getAllInsuranceReportsWithUserDetails = async () => {
    const UserModel = getUserModel();
    
    // 1. Fetch all insurance bookings
    const insuranceBookings = await insuranceRepo.findInsuranceBookings();

    // 2. Extract unique agentIds (mapped to user _id in auth-service)
    const agentIds = [...new Set(insuranceBookings.map(b => b.agentId))].filter(Boolean);

    // 3. Fetch matching users from auth-service database
    const users = await UserModel.find({ _id: { $in: agentIds } }).lean();

    // 4. Create lookup map
    const userMap = users.reduce((acc: any, user: any) => {
        acc[user._id.toString()] = user;
        return acc;
    }, {});

    // 5. Merge data
    return insuranceBookings.map(booking => ({
        ...booking,
        userDetails: userMap[booking.agentId || ""] || null
    }));
};

export const getSingleInsuranceBookingDetails = async (bookingId: string) => {
    const UserModel = getUserModel();
    const booking = await insuranceRepo.findInsuranceBookingById(bookingId);

    if (!booking) return null;

    // Verify agentId against auth-service
    const userDetails = await UserModel.findById(booking.agentId).lean();

    return {
        ...booking,
        userDetails: userDetails || null
    };
};