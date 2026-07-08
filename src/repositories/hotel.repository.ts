import { getHotelBookingModel } from "../models/hotel-bookings";

export const getB2BHotelFilters = () => {
    return {
        "userInfo.clientType": "b2b",
        "userInfo.role": { $exists: true, $ne: "" }
    };
};

export const getB2CHotelFilters = () => {
    return {
        $or: [
            { "userInfo.clientType": { $exists: false } },
            { "userInfo.clientType": { $exists: true, $ne: "b2b" } },
            { "userInfo.role": "" },
            { "userInfo.role": { $exists: false } }
        ]
    };
};

export const findHotelBookingsWithPagination = async (filter: any, skip: number, limit: number) => {
    const HotelModel = getHotelBookingModel();
    
    const totalCount = await HotelModel.countDocuments(filter);
    const bookings = await HotelModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return { bookings, totalCount };
};

export const findHotelBookingByQuery = async (query: any) => {
    const HotelModel = getHotelBookingModel();
    return await HotelModel.findOne(query).lean();
};