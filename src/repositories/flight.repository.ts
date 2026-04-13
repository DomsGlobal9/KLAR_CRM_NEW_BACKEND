// import { FlightBookingModel, IFlightBooking } from '../models/flight-bookings.model';

// export const findAllByUserId = async (userId: string): Promise<IFlightBooking[]> => {
//     return await FlightBookingModel.find({ userId }).sort({ createdAt: -1 });
// };













// import { FlightBookingModel, IFlightBooking } from '../models/flight-bookings.model';

// export const findAllByUserId = async (): Promise<IFlightBooking[]> => {
//     // This strictly matches the 'userId' string in your flight collection
//     // with the '_id' from your User collection.
//     return await FlightBookingModel.find.sort({ createdAt: -1 });
// };









// import { FlightBookingModel } from '../models/flights.model';
import { FlightBookingModel } from '../models/flight-bookings.model';
import mongoose from 'mongoose';

export const getAllVerifiedFlights = async () => {
    return await FlightBookingModel
        .find({})
        .sort({ createdAt: -1 })
        .lean();
    // return await FlightBookingModel.aggregate([
    //     {
    //         // 1. Join with the Users collection
    //         $lookup: {
    //             from: 'UserModel', 
    //             localField: 'userId',
    //             foreignField: '_id',
    //             as: 'userDetails'
    //         }
    //     },
    //     {
    //         // 2. Filter: Only keep flights where the userId actually matches a real user
    //         // This performs the "check" you requested.
    //         $match: {
    //             'userDetails': { $ne: [] } 
    //         }
    //     },
    //     {
    //         // 3. Optional: Remove the sensitive user details before sending to frontend
    //         $project: {
    //             userDetails: 0, 
    //             'travellerInfo.ssrBaggageInfos': 0 // Clean up clutter if needed
    //         }
    //     },
    //     {
    //         $sort: { createdAt: -1 }
    //     }
    // ]);
};