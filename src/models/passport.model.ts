import mongoose, { Schema, Document } from 'mongoose';
import { getDB } from '../config/mongodbDatabase.config';

export interface IPassportQuote {
    source: 'b2b' | 'b2c';
    service: 'New passport' | 'Renewal' | 'Reissue' | 'Police Clearance Certificate';
    applicant: 'Adult' | 'Minor';
    city: string;
    fullName: string;
    mobileNumber: string;
    emailId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPassportQuoteDocument extends IPassportQuote, Document {}

const PassportQuoteSchema: Schema = new Schema(
    {
        source: {
            type: String,
            required: true,
            enum: ['b2b', 'b2c'],
            lowercase: true,
            trim: true,
        },
        service: {
            type: String,
            required: true,
            enum: ['New passport', 'Renewal', 'Reissue', 'Police Clearance Certificate'],
        },
        applicant: {
            type: String,
            required: true,
            enum: ['Adult', 'Minor'],
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        mobileNumber: {
            type: String,
            required: true,
            trim: true,
        },
        emailId: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
    },
    {
        timestamps: true,
        collection: 'passportquotes'
    }
);

export const getPassportQuoteModel = () => {
    const conn = getDB("b2b");
    const passportDb = conn.useDb("passport-service");
    return passportDb.model<IPassportQuoteDocument>('PassportQuote', PassportQuoteSchema, 'passportquotes');
};