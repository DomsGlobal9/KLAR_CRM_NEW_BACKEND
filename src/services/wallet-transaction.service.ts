import { Types } from "mongoose";
import { getWalletTransactionModel } from "../models/wallet-transaction.model";
import { getUserModel } from "../models/auth.models";

// Static reference to Barsha's user ID as displayed in your database screenshots
const BARSHA_USER_ID = "699d3fcb1264eb3701610b2a";

export const getAllTransactionsForUser = async () => {
    const TransactionModel = getWalletTransactionModel();
    const UserModel = getUserModel();

    // Convert string ID into a Mongoose ObjectId to perform proper query matching
    const targetObjectId = new Types.ObjectId(BARSHA_USER_ID);

    // 1. Fetch transactions belonging exclusively to Barsha
    const transactions = await TransactionModel.find({ userId: targetObjectId })
        .sort({ createdAt: -1 })
        .lean();

    if (!transactions || transactions.length === 0) return [];

    // 2. Fetch Barsha's user profile details once for cross-referencing
    const user = await UserModel.findById(targetObjectId).lean();
    const businessName = user?.businessProfile?.businessName || "N/A";
    const agentEmail = user?.email || "N/A";

    // 3. Map and simplify summary payload layout
    return transactions.map((tx) => ({
        transactionId: tx._id,
        walletId: tx.walletId,
        date: tx.createdAt,
        type: tx.type,
        direction: tx.direction,
        amount: tx.amount,
        status: tx.status,
        businessName,
        agentEmail,
        referenceId: tx.referenceId || "N/A",
        description: tx.description || ""
    }));
};

export const getSingleTransactionDetails = async (transactionId: string) => {
    const TransactionModel = getWalletTransactionModel();
    const UserModel = getUserModel();

    // 1. Fetch transaction record checking both ID and matching static user restriction
    const transaction = await TransactionModel.findOne({
        _id: new Types.ObjectId(transactionId),
        userId: new Types.ObjectId(BARSHA_USER_ID),
    }).lean();

    if (!transaction) {
        throw new Error("Transaction not found");
    }

    // 2. Hydrate with Barsha's profile context
    const user = await UserModel.findById(transaction.userId).lean();
    
    let userDetails = null;
    if (user) {
        userDetails = {
            businessName: user.businessProfile?.businessName || "N/A",
            email: user.email,
            mobile: user.mobile,
            clientType: user.clientType,
            role: user.roles?.[0] || "USER",
        };
    }

    return {
        ...transaction,
        userDetails,
    };
};