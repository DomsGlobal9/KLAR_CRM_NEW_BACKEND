import { CabBookingModel } from "../models/cab-booking.model";

export const findCabBookings = async (query: any = {}) => {
    return await CabBookingModel().find(query).lean();
};

export const findCabBookingById = async (bookingId: string, query: any = {}) => {
    return await CabBookingModel().findOne({ bookingId, ...query }).lean();
};