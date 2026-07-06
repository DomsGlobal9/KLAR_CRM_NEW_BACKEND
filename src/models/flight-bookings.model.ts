import mongoose, { Schema, Document } from "mongoose";
import { getDB } from "../config/mongodbDatabase.config";


export type PaxType = "ADULT" | "CHILD" | "INFANT";

export interface UserInfo {
    id: string;
    email: string;
    role: string;
    clientType: string;
    type?: 'guest' | 'registered';
}

export interface SSRInfo {
    key: string;
    code: string;
}

export interface Traveller {
    travellerId: string;
    title: string;
    paxType: PaxType;
    firstName: string;
    lastName: string;
    dob: string;

    passportNumber?: string;
    passportNationality?: string;
    passportIssueDate?: string;
    passportExpiryDate?: string;

    ssrSeatInfos?: SSRInfo[];
    ssrMealInfos?: SSRInfo[];
    ssrBaggageInfos?: SSRInfo[];
}

export interface GSTInfo {
    gstNumber: string;
    registeredName: string;
    email: string;
    mobile: string;
    address: string;
}

export interface EmergencyContact {
    email: string;
    phone: string;
    name: string;
}

export interface Booking {
    bookingId: string;

    amount?: number;
    tripjackPrice?: number;
    markupPrice?: number;
    totalPrice?: number;

    email: string;
    phone: string;

    isHold: boolean;

    travellers: Traveller[];

    gstInfo?: GSTInfo;
    emergencyContact?: EmergencyContact;
    userInfo?: UserInfo;

    status:
    | "INITIATED"
    | "PENDING"
    | "CONFIRMED"
    | "FAILED"
    | "CANCEL_REQUESTED"
    | "CANCELLED";

    amendmentId?: string;

    createdAt?: Date;
    updatedAt?: Date;
}


export interface BookingDocument extends Booking, Document { }

const SSRSchema = new Schema(
    {
        key: { type: String },
        code: { type: String }
    },
    { _id: false }
);

const TravellerSchema = new Schema(
    {
        travellerId: { type: String, required: true },

        title: String,
        paxType: { type: String, enum: ["ADULT", "CHILD", "INFANT"] },
        firstName: String,
        lastName: String,
        dob: String,

        passportNumber: String,
        passportNationality: String,
        passportIssueDate: String,
        passportExpiryDate: String,

        ssrSeatInfos: [SSRSchema],
        ssrMealInfos: [SSRSchema],
        ssrBaggageInfos: [SSRSchema]
    },
    { _id: false }
);

const BookingSchema = new Schema<BookingDocument>(
    {
        bookingId: {
            type: String,
            required: true,
            unique: true
        },
        amount: Number,
        tripjackPrice: Number,
        markupPrice: Number,
        totalPrice: Number,
        email: String,
        phone: String,
        isHold: Boolean,
        travellers: [TravellerSchema],

        gstInfo: {
            gstNumber: String,
            registeredName: String,
            email: String,
            mobile: String,
            address: String
        },

        emergencyContact: {
            email: String,
            phone: String,
            name: String
        },

        userInfo: {
            id: String,
            email: String,
            role: String,
            clientType: String
        },

        status: {
            type: String,
            enum: [
                "INITIATED",
                "SUCCESS",
                "ON_HOLD",
                "CANCELLED",
                "FAILED",
                "PENDING",
                "ABORTED",
                "UNCONFIRMED",
                "REQUESTED",
                "REJECTED",
                "NO_SHOW",
                "VOIDED",
                "REISSUED"
            ],
            default: "INITIATED"
        },

        amendmentId: { type: String }
    },
    { timestamps: true }
);

// export const BookingModel = mongoose.model<BookingDocument>(
//     "Booking",
//     BookingSchema
// );




export const getBookingModel = () => {
    // Ensure this uses the same "b2b" (or whichever DB holds the bookings) as before
    const conn = getDB("b2b"); 
    return conn.model<BookingDocument>("Booking", BookingSchema, "bookings");
};