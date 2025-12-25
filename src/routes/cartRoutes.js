import express from "express";
import {
  verifyUserToken,
  validateCartData,
} from "../middleware/cartMiddleware.js";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  removeCartItemById,
} from "../controller/cartController.js";

const router = express.Router();

router.post("/add", verifyUserToken, validateCartData, addToCart);
router.get("/getCart", verifyUserToken, getCart);

// ✅ CLEAR ROUTES FIRST
router.delete("/clear", verifyUserToken, clearCart);
router.delete("/clear/:id", verifyUserToken, removeCartItemById);

// ✅ GENERIC PARAM ROUTES LAST
router.put("/:itemId", verifyUserToken, validateCartData, updateCartItem);
router.delete("/:itemId", verifyUserToken, removeCartItem);

export default router;
