import { Router } from "express";
const router = Router();
import {
  createCoupon,
  getCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "../controller/couponController.js";

// Admin / Vendor CRUD
router.post("/", createCoupon);
router.get("/", getCoupons);
router.get("/:id", getCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

// Apply coupon
router.post("/apply", applyCoupon);

export default router;
