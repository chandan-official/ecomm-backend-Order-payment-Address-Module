// middleware/cartMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// 1️⃣ Verify Token
export const verifyUserToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 NORMALIZE USER OBJECT
    req.user = {
      _id: decoded.id || decoded._id || decoded.userId,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 2️⃣ Validate Add/Update Cart Body
export const validateCartData = (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  if (!quantity || typeof quantity !== "number" || quantity <= 0) {
    return res
      .status(400)
      .json({ message: "Quantity must be a positive number" });
  }

  next();
};
