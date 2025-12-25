import express from "express";
import {
  generateInvoice,
  getUserInvoices,
} from "../controllers/invoiceController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Create and save invoice
router.post("/generate", verifyToken, generateInvoice);

// Fetch user invoices
router.get("/user/:userId", verifyToken, getUserInvoices);

export default router;
