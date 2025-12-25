import express from "express";
import {
  getAllUsers,
  updateUserRole,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
  adminlogin,
} from "../controller/adminController.js";
import verifyToken from "../token-config/verifyToken.js";
import verifyAdmin from "../middleware/verifyAdmin.js";

const router = express.Router();

// Users
router.get("/users", verifyToken, verifyAdmin, getAllUsers);
router.put("/users/:id/role", verifyToken, verifyAdmin, updateUserRole);

// Orders
router.get("/orders", verifyToken, verifyAdmin, getAllOrders);
router.put("/orders/:id/status", verifyToken, verifyAdmin, updateOrderStatus);

// Dashboard
router.get("/stats", verifyToken, verifyAdmin, getDashboardStats);
router.post("/login", adminlogin);

export default router;
