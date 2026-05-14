import { InsuranceBookingModel } from "../models/insurance-booking.model";


export const findAllBookings = async () => {
    return await InsuranceBookingModel.find().lean();
};

export const findBookingById = async (bookingId: string) => {
    return await InsuranceBookingModel.findOne({ bookingId }).lean();
};
