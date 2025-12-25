// controllers/cartController.js
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js"; // optional if you have a product collection
import mongoose from "mongoose";
// ✅ Add item to cart

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const image =
      product.images?.[0]?.url ||
      product.productImageurls?.[0]?.url ||
      "/placeholder.png"; // fallback

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, cartItems: [] });
    }

    const existingItem = cart.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.qty += quantity;
    } else {
      cart.cartItems.push({
        product: product._id,
        name: product.name,
        image,
        price: product.price,
        qty: quantity,
      });
    }

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("addToCart error:", error);
    res.status(500).json({ message: error.message });
  }
};

//  Get user cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate(
      "cartItems.product"
    );

    if (!cart) {
      return res.status(200).json({ cartItems: [] });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("getCart error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✏️ Update item quantity
export const updateCartItem = async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ message: "Cart updated", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🗑️ Remove single item
export const removeCartItem = async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    res.status(200).json({ message: "Item removed", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🧹 Clear all items
export const clearCart = async (req, res) => {
  const userId = req.user.id;

  try {
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// controllers/cartController.js
export const removeCartItemById = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params; // this is the cartItemId

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Remove the specific item
    cart.cartItems = cart.cartItems.filter(
      (item) => item._id.toString() !== id
    );

    await cart.save();

    res.status(200).json({ message: "Item removed", cart });
  } catch (error) {
    console.error("removeCartItemById error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
