import mongoose, { Schema, Document } from 'mongoose';
import { getDB } from '../config/mongodbDatabase.config';

export interface ICruiseEnquiry extends Document {
    departurePort: string;
    sailMonth: string;
    nights: string;
    fullName: string;
    mobileNumber: string;
    emailId: string;
    source: 'b2b' | 'b2c';
    createdAt: Date;
    updatedAt: Date;
}

const CruiseEnquirySchema = new Schema<ICruiseEnquiry>(
    {
        departurePort: { type: String, required: true },
        sailMonth: { type: String, required: true },
        nights: { type: String, required: true },
        fullName: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        emailId: { type: String, required: true },
        source: { type: String, default: 'b2c', enum: ['b2b', 'b2c'] }
    },
    { 
        timestamps: true,
        collection: 'cruiseenquiries'
    }
);

export const getCruiseEnquiryModel = () => {
    const conn = getDB("b2b");
    const cruiseDb = conn.useDb("cruise-service");
    return cruiseDb.model<ICruiseEnquiry>('CruiseEnquiry', CruiseEnquirySchema, 'cruiseenquiries');
};