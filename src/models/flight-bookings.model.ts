// import mongoose, { Schema, Document } from 'mongoose';
// import { getDB } from "../config/mongodbDatabase.config";

// export enum BookingStatus {
//     PENDING = 'PENDING',
//     CONFIRMED = 'CONFIRMED',
//     CANCELLED = 'CANCELLED',
//     FAILED = 'FAILED',
//     ON_HOLD = 'ON_HOLD',
//     UNCONFIRMED = 'UNCONFIRMED'
// }

// export enum PassengerType {
//     ADULT = 'ADULT',
//     CHILD = 'CHILD',
//     INFANT = 'INFANT'
// }

// export enum Title {
//     MR = 'Mr',
//     MR_DOT = 'Mr.',
//     MRS = 'Mrs',
//     MRS_DOT = 'Mrs.',
//     MS = 'Ms',
//     MS_DOT = 'Ms.',
//     MASTER = 'Master',
//     MISS = 'Miss'
// }

// export interface ISSRItem {
//     key: string;
//     code: string;
// }

// export interface IPassenger extends Document {
//     ti: Title;
//     fN: string;
//     lN: string;
//     pt: PassengerType;
//     dob: Date;
//     pNat?: string;
//     pNum?: string;
//     eD?: Date;
//     pid?: Date;
//     di?: string;
//     ssrBaggageInfos?: ISSRItem[];
//     ssrMealInfos?: ISSRItem[];
//     ssrSeatInfos?: ISSRItem[];
//     ssrExtraServiceInfos?: ISSRItem[];
// }

// export interface IPaymentInfo {
//     amount: number;
// }

// export interface IGstInfo {
//     gstNumber: string;
//     registeredName: string;
//     email?: string;
//     mobile?: string;
//     address?: string;
// }

// export interface IDeliveryInfo {
//     emails: string[];
//     contacts: string[];
// }

// export interface IContactInfo {
//     emails: string[];
//     contacts: string[];
//     ecn?: string;
// }

// export interface IFlightBooking extends Document {
//     bookingId: string;
//     userId: string;
//     paymentInfos: IPaymentInfo[];
//     travellerInfo: IPassenger[];
//     gstInfo?: IGstInfo;
//     deliveryInfo: IDeliveryInfo;
//     contactInfo?: IContactInfo;
//     status: BookingStatus;
//     totalAmount: number;
//     bookingDate: Date;
//     priceIds?: string[];
//     tripDetails?: any;
//     failureReason?: string;
//     cancelledAt?: Date;
//     confirmedAt?: Date;
//     createdAt: Date;
//     updatedAt: Date;
// }

// const PassengerSchema = new Schema<IPassenger>({
//     ti: {
//         type: String,
//         required: true,
//         enum: Object.values(Title)
//     },
//     fN: { type: String, required: true },
//     lN: { type: String, required: true },
//     pt: {
//         type: String,
//         required: true,
//         enum: Object.values(PassengerType)
//     },
//     dob: { type: Date, required: true },
//     pNat: { type: String },
//     pNum: { type: String },
//     eD: { type: Date },
//     pid: { type: Date },
//     di: { type: String },
//     ssrBaggageInfos: [{
//         key: { type: String, required: true },
//         code: { type: String, required: true }
//     }],
//     ssrMealInfos: [{
//         key: { type: String, required: true },
//         code: { type: String, required: true }
//     }],
//     ssrSeatInfos: [{
//         key: { type: String, required: true },
//         code: { type: String, required: true }
//     }],
//     ssrExtraServiceInfos: [{
//         key: { type: String, required: true },
//         code: { type: String, required: true }
//     }]
// }, { _id: false });

// const FlightBookingSchema = new Schema<IFlightBooking>({
//     bookingId: {
//         type: String,
//         required: true,
//         unique: true,
//         index: true
//     },
//     userId: {
//         type: String,
//         required: true,
//         index: true
//     },
//     paymentInfos: [{
//         amount: { type: Number, required: true }
//     }],
//     travellerInfo: [PassengerSchema],
//     gstInfo: {
//         gstNumber: { type: String },
//         registeredName: { type: String },
//         email: { type: String },
//         mobile: { type: String },
//         address: { type: String }
//     },
//     deliveryInfo: {
//         emails: [{ type: String }],
//         contacts: [{ type: String }]
//     },
//     contactInfo: {
//         emails: [{ type: String }],
//         contacts: [{ type: String }],
//         ecn: { type: String }
//     },
//     status: {
//         type: String,
//         enum: Object.values(BookingStatus),
//         default: BookingStatus.CONFIRMED,
//         index: true
//     },
    
//     bookingDate: { type: Date, default: Date.now },
//     priceIds: [{ type: String }],
//     tripDetails: { type: Schema.Types.Mixed },
//     failureReason: { type: String },
//     cancelledAt: { type: Date },
//     confirmedAt: { type: Date }
// }, {
//     timestamps: true,
//     collection: 'flightbookings'
// });

// FlightBookingSchema.index({ createdAt: -1 });
// FlightBookingSchema.index({ status: 1, createdAt: -1 });



// export const getFlightBookingModel = () => {
//     const conn = getDB("b2b");
//     return conn.model<IFlightBooking>("FlightBooking", FlightBookingSchema);
// };


















import mongoose, { Schema, Document } from "mongoose";


export type PaxType = "ADULT" | "CHILD" | "INFANT";

export interface UserInfo {
    id: string;
    email: string;
    role: string;
    clientType: string;
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

export const BookingModel = mongoose.model<BookingDocument>(
    "Booking",
    BookingSchema
);