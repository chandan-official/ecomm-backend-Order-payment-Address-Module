import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";
import PDFDocument from "pdfkit";
import { uploadBufferToDO } from "../config/s3client.js"; // DO Spaces upload

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Validation
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing payment verification fields",
        });
    }

    // Signature verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    // Fetch order
    const order = await Order.findById(orderId).populate("userId");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (order.paymentStatus === "paid") {
      return res
        .status(200)
        .json({ success: true, message: "Payment already verified" });
    }

    // Update order
    order.paymentStatus = "paid";
    order.paymentId = razorpay_payment_id;
    await order.save();

    // Generate invoice PDF in memory
    const user = order.userId;
    const invoiceNumber = `INV-${Date.now()}`;
    const doc = new PDFDocument();
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // Upload PDF to DO Spaces
      const pdfUrl = await uploadBufferToDO(
        pdfBuffer,
        "invoices",
        `${invoiceNumber}.pdf`
      );

      // Save invoice record
      const newInvoice = new Invoice({
        orderId: order._id,
        userId: user._id,
        invoiceNumber,
        amount: order.total,
        paymentId: razorpay_payment_id,
        pdfUrl, // URL on DO Spaces
      });
      await newInvoice.save();

      return res.status(200).json({
        success: true,
        message: "Payment verified & invoice generated",
        invoice: newInvoice,
      });
    });

    // Write PDF content
    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Payment ID: ${razorpay_payment_id}`);
    doc.moveDown();
    doc.text(`Customer Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    if (user.phone) doc.text(`Phone: ${user.phone}`);
    doc.moveDown();
    doc.text("Items:");
    order.items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.name} - ₹${item.price} × ${
          item.quantity || item.qty
        }`
      );
    });
    doc.moveDown();
    doc.text(`Total Amount: ₹${order.total}`, { align: "right" });

    doc.end();
  } catch (error) {
    console.error("Payment verification error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
