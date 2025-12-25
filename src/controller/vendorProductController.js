// src/controllers/vendorProductController.js
import Product from "../models/productModel.js";
import slugify from "slugify";
import { uploadBufferToDO } from "../config/s3client.js";

/* =========================
   CREATE PRODUCT
========================= */
export const createVendorProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;

    let {
      name,
      description,
      category,
      price,
      compareAtPrice,
      stock,
      sku,
      attributes,
      tags,
      isActive,
    } = req.body;

    price = Number(price);
    compareAtPrice =
      compareAtPrice !== undefined ? Number(compareAtPrice) : undefined;
    stock = stock !== undefined ? Number(stock) : 0;

    tags =
      typeof tags === "string"
        ? tags.split(",").map((t) => t.trim())
        : tags || [];

    if (typeof attributes === "string") {
      attributes = JSON.parse(attributes);
    }

    const product = new Product({
      name,
      slug: slugify(name, { lower: true, strict: true }),
      description,
      category,
      price,
      compareAtPrice,
      stock,
      sku,
      attributes: attributes || {},
      tags,
      isActive: isActive !== "false",
      vendorId,
      images: [],
    });

    if (req.files?.images?.length) {
      for (const file of req.files.images) {
        const url = await uploadBufferToDO(
          file.buffer,
          "products",
          file.originalname
        );
        product.images.push({
          url,
          public_id: file.originalname,
        });
      }
    }

    await product.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("createVendorProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET VENDOR PRODUCTS
========================= */
export const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = { vendorId, isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (minPrice)
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice)
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("getVendorProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   UPDATE PRODUCT
========================= */
export const updateVendorProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const productId = req.params.id;

    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const body = { ...req.body };

    if (body.price !== undefined) body.price = Number(body.price);
    if (body.compareAtPrice !== undefined)
      body.compareAtPrice = Number(body.compareAtPrice);
    if (body.stock !== undefined) body.stock = Number(body.stock);

    if (body.isActive !== undefined) {
      body.isActive = body.isActive === "true" || body.isActive === true;
    }

    if (body.attributes && typeof body.attributes === "string") {
      body.attributes = JSON.parse(body.attributes);
    }

    if (body.tags && typeof body.tags === "string") {
      body.tags = body.tags.split(",").map((t) => t.trim());
    }

    if (body.name && body.name !== product.name) {
      body.slug = slugify(body.name, { lower: true, strict: true });
    }

    Object.keys(body).forEach((key) => {
      if (product.schema.path(key)) {
        product.set(key, body[key]);
      }
    });

    if (req.files?.images?.length) {
      for (const file of req.files.images) {
        const url = await uploadBufferToDO(
          file.buffer,
          "products",
          file.originalname
        );
        product.images.push({
          url,
          public_id: file.originalname,
        });
      }
    }

    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    console.error("updateVendorProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   SOFT DELETE
========================= */
export const deleteVendorProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendorId: req.user.id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = false;
    await product.save();

    res.json({ success: true, message: "Product soft deleted" });
  } catch (error) {
    console.error("deleteVendorProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET SINGLE PRODUCT
========================= */
export const getVendorProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendorId: req.user.id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error("getVendorProductById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
