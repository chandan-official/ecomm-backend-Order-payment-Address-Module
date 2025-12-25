import Coupon from "../models/couponModel.js";

// ---------------- CREATE COUPON ----------------
export async function createCoupon(req, res) {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minShoppingAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      createdBy,
      vendorId,
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing)
      return res.status(400).json({ message: "Coupon code already exists" });

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minShoppingAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      createdBy,
      vendorId,
    });

    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ---------------- GET ALL COUPONS ----------------
export async function getCoupons(req, res) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ---------------- GET SINGLE COUPON ----------------
export async function getCoupon(req, res) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ---------------- UPDATE COUPON ----------------
export async function updateCoupon(req, res) {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ---------------- DELETE COUPON ----------------
export async function deleteCoupon(req, res) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ---------------- APPLY COUPON ----------------
export async function applyCoupon(req, res) {
  try {
    const { code, cartTotal } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      active: true,
    });

    if (!coupon) return res.status(400).json({ message: "Invalid coupon" });

    const now = new Date();
    if (coupon.startDate > now || coupon.endDate < now)
      return res.status(400).json({ message: "Coupon expired" });

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ message: "Coupon usage limit reached" });

    if (coupon.minShoppingAmount && cartTotal < coupon.minShoppingAmount)
      return res.status(400).json({
        message: `Minimum shopping amount is ₹${coupon.minShoppingAmount}`,
      });

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    const finalTotal = cartTotal - discount;

    // Increase used count
    coupon.usedCount += 1;
    await coupon.save();

    res.json({ finalTotal, discount, coupon: coupon.code });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
