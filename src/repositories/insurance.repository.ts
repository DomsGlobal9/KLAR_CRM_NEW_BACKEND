import { InsuranceBookingModel } from "../models/insurance-booking.model";

export const findInsuranceBookings = async (query: any = {}) => {
    return await InsuranceBookingModel().find(query).lean();
};

export const findInsuranceBookingById = async (bookingId: string, query: any = {}) => {
    return await InsuranceBookingModel().findOne({ bookingId, ...query }).lean();
};