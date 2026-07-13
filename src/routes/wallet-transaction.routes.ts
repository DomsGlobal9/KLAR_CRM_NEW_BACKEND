import { Router } from "express";
import { 
    getTransactionReport, 
    getSingleTransaction 
} from "../controllers/wallet-transaction.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Get summary listing of all transactions matching target user
router.get("/report", authenticate, getTransactionReport);

// Get complete payload analysis for individual specific transaction tracking 
router.get("/report/:transactionId", authenticate, getSingleTransaction);

export default router;