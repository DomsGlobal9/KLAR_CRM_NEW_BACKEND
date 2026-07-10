import * as insuranceRepo from "../repositories/insurance.repository";
import { getUserModel } from "../models/auth.models";

export const getAllInsuranceReportsWithUserDetails = async (page: number = 1, limit: number = 10) => {
    const UserModel = getUserModel();
    
    const skip = (page - 1) * limit;
    
    // 1. Fetch all insurance bookings from the database
    const insuranceBookings = await insuranceRepo.findInsuranceBookings();
    
    // SORTING FUNCTIONALITY: Sort dynamically by date descending (Latest First) before paginating
    // const sortedBookings = [...insuranceBookings].sort(
    //     (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    // );
    const sortedBookings = [...insuranceBookings].sort((a, b) => {
    // 1. Get numeric values safely, falling back to 0 if the field is missing
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    
    return timeB - timeA;
});

    const totalCount = sortedBookings.length; 
    
    // Extract the precise page window slice from sorted data
    const paginatedBookings = sortedBookings.slice(skip, skip + limit);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    const paginationMetadata = {
        totalCount,
        totalPages,
        currentPage: page,
        rowsPerPage: limit
    };

    // 2. Extract unique agentIds
    const agentIds = [...new Set(
        paginatedBookings
            .map(b => b.agentId?.toString())
            .filter((id): id is string => Boolean(id))
    )];

    // 3. Fetch matching users from database
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
    const mergedData = paginatedBookings.map(booking => {
        const agentIdStr = booking.agentId?.toString();
        return {
            ...booking,
            userDetails: agentIdStr ? (userMap[agentIdStr] || null) : null
        };
    });

    return {
        bookings: mergedData,
        pagination: paginationMetadata
    };
};

export const getSingleInsuranceBookingDetails = async (bookingId: string) => {
    const UserModel = getUserModel();
    const booking = await insuranceRepo.findInsuranceBookingById(bookingId);

    if (!booking) return null;

    let userDetails = null;
    if (booking.agentId) {
        userDetails = await UserModel.findById(booking.agentId.toString()).lean();
    }

    return {
        ...booking,
        userDetails: userDetails || null
    };
};