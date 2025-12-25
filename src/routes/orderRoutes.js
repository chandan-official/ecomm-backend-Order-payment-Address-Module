//orderRoutes
import express from "express";
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
} from "../controller/orderContrioller.js";
import { verifyToken } from "../token-config/verifyToken.js";

const router = express.Router();

// Create a new order
router.post("/create", verifyToken, createOrder);

// Get order by ID
router.get("/:id", verifyToken, getOrderById);

// Get all orders for a user
router.get("/user/orders", verifyToken, getUserOrders);

// Update order status (e.g., shipped, delivered)
router.put("/:id/status", verifyToken, updateOrderStatus);

// Cancel an order
router.delete("/:id/cancel", verifyToken, cancelOrder);

export default router;
