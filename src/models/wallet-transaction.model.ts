import { Schema, Document, Types, Connection } from "mongoose";
import { getDB } from "../config/mongodbDatabase.config";

export interface IWalletTransaction {
    walletId: Types.ObjectId;
    userId: Types.ObjectId;
    type: "TOP_UP" | "DEBIT" | "REFUND" | "WITHDRAW";
    direction: "CREDIT" | "DEBIT";
    amount: number;
    status: "SUCCESS" | "FAILED" | "PENDING";
    referenceType?: string;
    referenceId?: string;
    paymentMethod?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface WalletTransactionDocument extends IWalletTransaction, Document {}

const walletTransactionSchema = new Schema<WalletTransactionDocument>(
    {
        walletId: {
            type: Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["TOP_UP", "DEBIT", "REFUND", "WITHDRAW"],
            required: true,
        },
        direction: {
            type: String,
            enum: ["CREDIT", "DEBIT"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["SUCCESS", "FAILED", "PENDING"],
            default: "SUCCESS",
        },
        referenceType: String,
        referenceId: String,
        paymentMethod: String,
        description: String,
    },
    { timestamps: true }
);

export const getWalletTransactionModel = () => {
    // According to your configuration, 'auth' targets the auth-service database
    const conn = getDB("auth"); 
    return conn.model<WalletTransactionDocument>(
        "WalletTransaction", 
        walletTransactionSchema, 
        "wallettransactions"
    );
};