import mongoose, { Schema, Document } from "mongoose";
import { getDB } from "../config/mongodbDatabase.config";


export enum Roles {
    // Common
    USER = "USER",

    // B2B
    B2B_ADMIN = "B2B_ADMIN",

    AGENT = "AGENT",
}


export enum UserStatus {
    REGISTERED = "REGISTERED",
    VERIFICATION_PENDING = "VERIFICATION_PENDING",
    VERIFIED = "VERIFIED",
    WALLET_SETUP_PENDING = "WALLET_SETUP_PENDING",
    ACTIVE = "ACTIVE",
    REJECTED = "REJECTED",
    BLOCKED = "BLOCKED",
    TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",
}


export enum VerificationStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export const VerificationSchema = new Schema(
    {
        status: {
            type: String,
            enum: Object.values(VerificationStatus),
            default: VerificationStatus.PENDING,
        },

        gstNumber: {
            type: String,
        },

        panNumber: {
            type: String,
        },

        address: {
            type: String,
        },

        city: {
            type: String,
        },

        country: {
            type: String,
        },

        verifiedAt: {
            type: Date,
        },

        remarks: {
            type: String,
        },
    },
    { _id: false }
);



export enum ClientType {
    B2C = "b2c",
    B2B = "b2b",
    B2B2B = "b2b2b",
}

export const BusinessProfileSchema = new Schema(
    {
        businessName: {
            type: String,
            required: true,
            trim: true,
        },

        businessType: {
            type: String,
            required: true,
        },

        contactPerson: {
            type: String,
            required: true,
            trim: true,
        },

        businessEmail: {
            type: String,
            required: true,
            lowercase: true,
        },

        businessMobile: {
            type: String,
            required: true,
        },

        gstNumber: {
            type: String,
        },

        panNumber: {
            type: String,
        },

        address: {
            type: String,
            required: true,
        },

        city: {
            type: String,
            required: true,
        },

        country: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

export interface IUser extends Document {
    clientType: ClientType;
    email: string;
    mobile: string;
    passwordHash: string;
    roles: Roles[];
    status: UserStatus;
    blockReason?: string;
    pendingReason?: string;
    rejectedReason?: string;

    businessProfile?: any;
    verification?: any;
    wallet?: any;

    createdAt: Date;
    updatedAt: Date;
}



const UserSchema = new Schema<IUser>(
    {
        clientType: {
            type: String,
            enum: Object.values(ClientType),
            required: true,
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        mobile: {
            type: String,
            required: true,
        },

        passwordHash: {
            type: String,
            required: true,
        },

        roles: {
            type: [String],
            enum: Object.values(Roles),
            default: [Roles.USER],
        },

        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.REGISTERED,
        },

        blockReason: {
            type: String,
            trim: true,
        },

        pendingReason: {
            type: String,
            trim: true,
        },

        rejectedReason: {
            type: String,
            trim: true,
        },

        businessProfile: {
            type: BusinessProfileSchema,
        },

        verification: {
            type: VerificationSchema,
        },


    },
    {
        timestamps: true,
        collection: 'users'
    }
);


UserSchema.index(
    { email: 1, clientType: 1 },
    { unique: true }
);



export const getUserModel = () => {
    const conn = getDB("auth"); 
    return conn.model<IUser>("User", UserSchema);
};
