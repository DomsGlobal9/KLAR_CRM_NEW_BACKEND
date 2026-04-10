import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Independent connection objects to be used in your models
export let flightConn: Connection;
export let authConn: Connection;

/**
 * CONNECT TO FLIGHTS DATABASE
 */
export const connectFlightDB = async (): Promise<Connection> => {
  try {
    const flightURI = process.env.MONGODB_FLIGHT_URI;

    if (!flightURI) {
      throw new Error('MONGODB_FLIGHT_URI is missing in .env');
    }

    flightConn = mongoose.createConnection(flightURI);
    
    // Using event listeners for better logging
    flightConn.on('connected', () => console.log('✅ MongoDB FlightConnecteds '));
    flightConn.on('error', (err) => console.error(`❌ Flights DB Error: ${err}`));

    return flightConn;
  } catch (error) {
    console.error('Flights Connection Failed:', error);
    process.exit(1);
  }
};

/**
 * CONNECT TO AUTH DATABASE
 */
export const connectAuthDB = async (): Promise<Connection> => {
  try {
    const authURI = process.env.MONGODB_AUTH_URI;

    if (!authURI) {
      throw new Error('MONGODB_AUTH_URI is missing in .env');
    }

    authConn = mongoose.createConnection(authURI);

    authConn.on('connected', () => console.log('✅ MongoDB Auth Connected'));
    authConn.on('error', (err) => console.error(`❌ Auth DB Error: ${err}`));

    return authConn;
  } catch (error) {
    console.error('Auth Connection Failed:', error);
    process.exit(1);
  }
};