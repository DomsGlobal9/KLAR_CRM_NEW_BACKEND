import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoFLightURI = process.env.MONGODB_FLIGHT_URI;

    if (!mongoFLightURI) {
      console.error('Error: MONGODB_URI is not defined in the .env file');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoFLightURI);


    console.log(`MongoDB FLights Connected`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred during database connection');
    }
    process.exit(1);
  }
};

export default connectDB;