import mongoose, { Schema, Document } from 'mongoose';
import { getDB } from '../config/mongodbDatabase.config';

export interface ICharterBooking {
    from: string;
    to: string;
    departureDateTime: Date;
    passengers: number;
    category?: string;
    fullName: string;
    mobileNumber: string;
    email: string;
    source: 'b2b' | 'b2c';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICharterDocument extends ICharterBooking, Document {}

const charterSchema = new Schema<ICharterDocument>(
    {
        from: { type: String, required: true, trim: true },
        to: { type: String, required: true, trim: true },
        departureDateTime: { type: Date, required: true },
        passengers: { type: Number, required: true, min: 1 },
        category: {
            type: String,
            enum: [
                "Private Jets",
                "Helicopter Charter",
                "Corporate Charter",
                "Group Charter",
            ]
        },
        fullName: { type: String, required: true, trim: true },
        mobileNumber: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        source: { type: String, enum: ["b2b", "b2c"], required: true },
    },
    { 
        timestamps: true,
        collection: 'charterbookings'
    }
);

export const getCharterBookingModel = () => {
    const conn = getDB("b2b");
    const charterDb = conn.useDb("charter-service");
    return charterDb.model<ICharterDocument>('CharterBooking', charterSchema, 'charterbookings');
};