// import mongoose from 'mongoose';
// import dotenv from 'dotenv';

// dotenv.config();

// const connectDB = async (): Promise<void> => {
//   try {
//     const mongoFLightURI = process.env.MONGODB_FLIGHT_URI;

//     if (!mongoFLightURI) {
//       console.error('Error: MONGODB_URI is not defined in the .env file');
//       process.exit(1);
//     }

//     const conn = await mongoose.connect(mongoFLightURI);


//     console.log(`MongoDB FLights Connected`);
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error(`Error: ${error.message}`);
//     } else {
//       console.error('An unknown error occurred during database connection');
//     }
//     process.exit(1);
//   }
// };

// export default connectDB;


























// import mongoose, { Connection } from 'mongoose';
// import dotenv from 'dotenv';

// dotenv.config();

// // Define a type to hold our multiple connections
// interface DbConnections {
//   flightConn: Connection;
//   authConn: Connection;
// }

// // We declare a variable to hold the connections so we can export them if needed elsewhere
// let connections: DbConnections;

// const connectDB = async (): Promise<DbConnections> => {
//   try {
//     const mongoFlightURI = process.env.MONGODB_FLIGHT_URI;
//     const mongoAuthURI = process.env.MONGODB_AUTH_URI;

//     // Validation
//     if (!mongoFlightURI || !mongoAuthURI) {
//       console.error('Error: One or more MongoDB URIs are missing in the .env file');
//       process.exit(1);
//     }

//     // Create separate connections
//     const flightConn = await mongoose.createConnection(mongoFlightURI).asPromise();
//     console.log(`MongoDB Flights Connected`);

//     const authConn = await mongoose.createConnection(mongoAuthURI).asPromise();
//     console.log(`MongoDB Auth Connected`);

//     connections = { flightConn, authConn };
//     return connections;
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error(`Database Connection Error: ${error.message}`);
//     } else {
//       console.error('An unknown error occurred during database connection');
//     }
//     process.exit(1);
//     throw error;
//   }
// };

// export { connections };
// export default connectDB;




















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
    flightConn.on('connected', () => console.log('✅ MongoDB Flights Connected'));
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