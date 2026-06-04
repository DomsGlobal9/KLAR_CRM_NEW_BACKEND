import { Request, Response } from "express";
import { 
    getAllTransactionsForUser, 
    getSingleTransactionDetails 
} from "../services/wallet-transaction.service";



export const getTransactionReport = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10; // Supports dynamic row size changes

        const { transactions, pagination } = await getAllTransactionsForUser(page, limit);

        res.status(200).json({
            success: true,
            pagination,
            data: transactions
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getSingleTransaction = async (req: Request, res: Response) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID parameter is required",
            });
        }

        const id = Array.isArray(transactionId) ? transactionId[0] : transactionId;
        const data = await getSingleTransactionDetails(id);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        const statusCode = error.message === "Transaction not found" ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};