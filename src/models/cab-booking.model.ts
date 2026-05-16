import mongoose, { Schema, Document, Model } from 'mongoose';
import { getDB } from '../config/mongodbDatabase.config';

export enum CabBookingStatus {
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    PENDING = 'PENDING',
    FAILED = 'FAILED',
}

export interface ICabBooking extends Document {
    bookingId: string;
    correlationId?: string;
    userId?: string;
    userName?: string;
    agentId?: string;
    agentName?: string;
    status: CabBookingStatus;
    pickupDate: Date;
    origin: {
        displayAddress: string;
        lat: string;
        long: string;
    };
    destination: {
        displayAddress: string;
        lat: string;
        long: string;
    };
    vehicleType: string;
    vehicleCategory: string;
    totalAmount: number;
    currency: string;
    passenger: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    tripJackRequest?: any;
    tripJackResponse?: any;
    createdAt: Date;
    updatedAt: Date;
}

const CabBookingSchema = new Schema<ICabBooking>(
    {
        bookingId: { type: String, required: true, unique: true, index: true },
        correlationId: { type: String, index: true },
        userId: { type: String, index: true },
        userName: { type: String },
        agentId: { type: String, index: true },
        agentName: { type: String },
        status: {
            type: String,
            enum: Object.values(CabBookingStatus),
            default: CabBookingStatus.PENDING,
            index: true
        },
        pickupDate: { type: Date, required: true },
        origin: {
            displayAddress: { type: String, required: true },
            lat: { type: String },
            long: { type: String }
        },
        destination: {
            displayAddress: { type: String, required: true },
            lat: { type: String },
            long: { type: String }
        },
        vehicleType: { type: String, required: true },
        vehicleCategory: { type: String },
        totalAmount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        passenger: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true }
        },
        tripJackRequest: { type: Schema.Types.Mixed },
        tripJackResponse: { type: Schema.Types.Mixed }
    },
    {
        timestamps: true,
        collection: 'cabbookings' // Matching your MongoDB image collection name
    }
);

CabBookingSchema.index({ agentId: 1, createdAt: -1 });
CabBookingSchema.index({ userId: 1, createdAt: -1 });

export const getCabBookingModel = (): Model<ICabBooking> => {
    const conn = getDB("b2b"); 
    const cabDb = conn.useDb("cabs-service"); // Matching your MongoDB image database name
    return cabDb.model<ICabBooking>('CabBooking', CabBookingSchema);
};