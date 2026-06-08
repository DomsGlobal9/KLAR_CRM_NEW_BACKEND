import { Types } from "mongoose";
import { getWalletTransactionModel } from "../models/wallet-transaction.model";
import { getUserModel } from "../models/auth.models";

const BARSHA_USER_ID = "6a22d0a5caaf730dc28b8982";

export const getAllTransactionsForUser = async (page: number = 1, limit: number = 10) => {
    const TransactionModel = getWalletTransactionModel();
    const UserModel = getUserModel();
    const targetObjectId = new Types.ObjectId(BARSHA_USER_ID);

    // Calculate skipping parameter offsets
    const skip = (page - 1) * limit;

    // Execute queries in parallel to minimize cross-DB lookup latency
    const [transactions, totalCount] = await Promise.all([
        TransactionModel.find({ userId: targetObjectId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        TransactionModel.countDocuments({ userId: targetObjectId })
    ]);

    if (!transactions || transactions.length === 0) {
        return {
            transactions: [],
            pagination: { currentPage: page, totalPages: 0, totalCount: 0 }
        };
    }

    const user = await UserModel.findById(targetObjectId).lean();
    const businessName = user?.businessProfile?.businessName || "N/A";
    const agentEmail = user?.email || "N/A";

    const mappedTransactions = transactions.map((tx) => ({
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

    return {
        transactions: mappedTransactions,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
    };
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





























