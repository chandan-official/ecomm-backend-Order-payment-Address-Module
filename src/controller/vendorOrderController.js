import Order from "../models/orderModel.js";

// GET vendor orders
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const orders = await Order.find({ vendorId })
      .populate("user", "name email")
      .populate("orderItems.product", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching vendor orders",
      error: err.message,
    });
  }
};

// UPDATE vendor order status
export const updateVendorOrderStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "packed",
      "in_transit",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const update = {
      status,
      $push: {
        statusHistory: { status },
      },
    };

    if (status === "delivered") {
      update.isDelivered = true;
      update.deliveredAt = new Date();
    }

    const order = await Order.findOneAndUpdate({ _id: id, vendorId }, update, {
      new: true,
      runValidators: false, // 🔥 KEY LINE
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating order status",
      error: err.message,
    });
  }
};

// GET single vendor order by ID
export const getVendorOrderById = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      vendorId,
    })
      .populate("user", "name email")
      .populate("orderItems.product", "name price");

    if (!order) {
      return res.status(404).json({
        message: "Order not found or unauthorized access",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching order",
      error: err.message,
    });
  }
};

// controller/vendorOrderController.js
export const getVendorOrderCount = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const total = await Order.countDocuments({ vendorId });
    const pending = await Order.countDocuments({ vendorId, status: "pending" });
    const confirmed = await Order.countDocuments({
      vendorId,
      status: "confirmed",
    });
    const packed = await Order.countDocuments({ vendorId, status: "packed" });
    const inTransit = await Order.countDocuments({
      vendorId,
      status: "in_transit",
    });
    const delivered = await Order.countDocuments({
      vendorId,
      status: "delivered",
    });
    const cancelled = await Order.countDocuments({
      vendorId,
      status: "cancelled",
    });

    res.status(200).json({
      success: true,
      counts: {
        total,
        pending,
        confirmed,
        packed,
        inTransit,
        delivered,
        cancelled,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching order counts",
      error: err.message,
      console: console.log(err),
    });
  }
};
