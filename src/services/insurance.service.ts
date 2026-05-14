import * as InsuranceRepo from "../repositories/insurance.repository";
import { getUserModel } from "../models/auth.models"; // Assuming this helper exists

export const getAllInsuranceReport = async () => {
    const bookings = await InsuranceRepo.findAllBookings();
    const UserModel = getUserModel();

    // Extract unique agent IDs
    const agentIds = [...new Set(bookings.map(b => b.agentId))].filter(Boolean);
    
    // Fetch user details from auth database
    const agents = await UserModel.find({ _id: { $in: agentIds } }).lean();
    const agentMap = agents.reduce((acc: any, agent: any) => {
        acc[agent._id.toString()] = agent;
        return acc;
    }, {});

    // Map business info to bookings
    return bookings.map(booking => ({
        bookingId: booking.bookingId,
        status: booking.status,
        amount: booking.amount,
        currency: booking.currencyCode,
        createdAt: booking.createdAt,
        businessName: agentMap[booking.agentId!]?.businessProfile?.businessName || "N/A",
        agentEmail: agentMap[booking.agentId!]?.email || booking.agentName
    }));
};



export const getSingleInsuranceDetails = async (bookingId: string) => {
    const booking = await InsuranceRepo.findBookingById(bookingId);
    if (!booking) return null;

    const UserModel = getUserModel();
    const agent = await UserModel.findById(booking.agentId).lean();

    return {
        ...booking,
        userDetails: {
            businessName: agent?.businessProfile?.businessName || "N/A",
            email: agent?.email,
            mobile: agent?.mobile
        }
    };
};