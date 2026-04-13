// import * as FlightRepository from '../repositories/flight.repository';
// import { IFlightBooking } from '../models/flight-bookings.model';

// export const getUserFlights = async (): Promise<IFlightBooking[]> => {
//     // You could add logic here to filter by status or date if needed
//     return await FlightRepository.findAllByUserId();
// };










// import * as FlightRepository from '../repositories/flight.repository';

// export const getAllFlightsData = async () => {
//     return await FlightRepository.getAllVerifiedFlights();
// };

















import { getFlightBookingModel } from "../models/flight-bookings.model";
import { getUserModel } from "../models/auth.models";

export const getAllFlightsWithUsers = async () => {
    const FlightModel = getFlightBookingModel();
    const UserModel = getUserModel();

    // 1. Fetch all flight bookings
    const bookings = await FlightModel.find().lean();

    // 2. Get unique user IDs from bookings to minimize DB calls
    const userIds = [...new Set(bookings.map(b => b.userId))];

    // 3. Fetch users from the Auth database
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();

    // 4. Map users for quick lookup
    const userMap = users.reduce((acc: any, user: any) => {
        acc[user._id.toString()] = user;
        return acc;
    }, {});

    // 5. Merge data: Check if user exists and attach details
    return bookings.map(booking => ({
        ...booking,
        userDetails: userMap[booking.userId] || null // Verification check
    }));
};











