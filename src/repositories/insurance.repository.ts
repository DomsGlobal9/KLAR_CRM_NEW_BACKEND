// import { InsuranceBookingModel } from "../models/insurance-booking.model";


// export const findAllBookings = async () => {
//     return await InsuranceBookingModel.find().lean();
// };

// export const findBookingById = async (bookingId: string) => {
//     return await InsuranceBookingModel.findOne({ bookingId }).lean();
// };










import { InsuranceBookingModel, IInsuranceBooking } from "../models/insurance.model";

export const findInsuranceBookings = async (query: any = {}) => {
    return await InsuranceBookingModel.find(query).lean();
};

export const findInsuranceBookingById = async (bookingId: string) => {
    return await InsuranceBookingModel.findOne({ bookingId }).lean();
};