import express from "express";
import upload from "./multer.js";

import {
  registerVendor,
  loginVendor,
  getVendorProfile,
  updateVendorProfile,
} from "../controller/vendorController.js";

import {
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorProducts,
  getVendorProductById,
} from "../controller/vendorProductController.js";

import {
  getVendorOrders,
  updateVendorOrderStatus,
  getVendorOrderById,
  getVendorOrderCount,
} from "../controller/vendorOrderController.js";

import { verifyToken, verifyRole } from "../token-config/verifyToken.js";

const router = express.Router();

/* ---------- AUTH ---------- */
router.post(
  "/register",
  upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "shopImages", maxCount: 10 },
  ]),
  registerVendor
);

router.post("/login", loginVendor);

/* ---------- PROFILE ---------- */
router.get("/profile", verifyToken, verifyRole("vendor"), getVendorProfile);
router.put("/profile", verifyToken, verifyRole("vendor"), updateVendorProfile);

/* ---------- PRODUCTS ---------- */
router.post(
  "/products",
  verifyToken,
  verifyRole("vendor"),
  upload.fields([{ name: "images", maxCount: 10 }]),
  createVendorProduct
);

router.get(
  "/products",
  verifyToken,
  verifyRole("vendor", "admin"),
  getVendorProducts
);

router.get(
  "/products/:id",
  verifyToken,
  verifyRole("vendor"),
  getVendorProductById
);

router.put(
  "/products/:id",
  verifyToken,
  verifyRole("vendor"),
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateVendorProduct
);

router.delete(
  "/products/:id",
  verifyToken,
  verifyRole("vendor"),
  deleteVendorProduct
);

/* ---------- ORDERS ---------- */
router.get(
  "/orders/count",
  verifyToken,
  verifyRole("vendor"),
  getVendorOrderCount
);
router.get("/orders", verifyToken, verifyRole("vendor"), getVendorOrders);
router.get(
  "/orders/:id",
  verifyToken,
  verifyRole("vendor"),
  getVendorOrderById
);
router.put(
  "/orders/:id/status",
  verifyToken,
  verifyRole("vendor"),
  updateVendorOrderStatus
);

export default router;
