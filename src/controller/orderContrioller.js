import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// Create a new order
export const createOrder = async (req, res) => {
  const userId = req.user.id;
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: "No order items provided" });
  }

  try {
    // 🔍 DEBUG
    console.log("Order Items:", orderItems);

    const firstItem = orderItems[0];
    if (!firstItem.product) {
      return res
        .status(400)
        .json({ message: "Product ID missing in order item" });
    }

    const product = await Product.findById(firstItem.product);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🔴 IMPORTANT: verify actual field name
    const vendorId = product.vendorId || product.vendor || product.seller;

    if (!vendorId) {
      return res.status(400).json({
        message: "Vendor not associated with product",
      });
    }

    const newOrder = new Order({
      user: userId,
      vendorId, // ✅ NOW GUARANTEED
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      status: "pending",
      statusHistory: [{ status: "pending" }],
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created",
      order: savedOrder,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await Order.find({ user: userId })
      .populate("orderItems.product") // <-- populate product details
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get order details by ID
export const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;
  try {
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder)
      return res.status(404).json({ message: "Order not found" });

    return res.status(200).json({ order: existingOrder });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder)
      return res.status(404).json({ message: "Order not found" });

    existingOrder.status = "cancelled";
    const updatedOrder = await existingOrder.save();

    return res
      .status(200)
      .json({ message: "Order cancelled successfully", order: updatedOrder });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder)
      return res.status(404).json({ message: "Order not found" });

    existingOrder.status = status;
    const updatedOrder = await existingOrder.save();

    return res
      .status(200)
      .json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

//get order by id
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    // Find the order by ID and populate user and products
    const order = await Order.findById(id)
      .populate("user", "name email")
      .populate({
        path: "orderItems.product",
        model: Product,
        select: "name productImageurls price", // only fetch needed fields
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
