// import * as FlightRepository from '../repositories/flight.repository';
// import { IFlightBooking } from '../models/flight-bookings.model';

// export const getUserFlights = async (): Promise<IFlightBooking[]> => {
//     // You could add logic here to filter by status or date if needed
//     return await FlightRepository.findAllByUserId();
// };










import * as FlightRepository from '../repositories/flight.repository';

export const getAllFlightsData = async () => {
    return await FlightRepository.getAllVerifiedFlights();
};












