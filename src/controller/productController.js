// controllers/productController.js
import Product from "../models/productModel.js";
import slugify from "slugify";
import { uploadBufferToDO } from "../config/s3client.js";

/* =========================
   CREATE PRODUCT
========================= */
export const createProduct = async (req, res) => {
  try {
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
      vendorId,
    } = req.body;

    price = Number(price);
    compareAtPrice = compareAtPrice ? Number(compareAtPrice) : undefined;
    stock = stock ? Number(stock) : 0;

    tags = tags
      ? typeof tags === "string"
        ? tags.split(",").map((t) => t.trim())
        : tags
      : [];

    const slug = slugify(name, { lower: true, strict: true });

    const product = new Product({
      name,
      slug,
      description,
      category,
      price,
      compareAtPrice,
      stock,
      sku,
      attributes: attributes || {},
      tags,
      isActive: isActive === "false" ? false : true,
      vendorId,
      productImageurls: [],
    });

    // Upload images to DO Spaces
    if (req.files && req.files.length > 0) {
      const uploadedImages = [];
      for (const file of req.files) {
        // Convert ArrayBuffer to Node Buffer if needed
        const buffer =
          file.buffer instanceof ArrayBuffer
            ? Buffer.from(file.buffer)
            : file.buffer;

        const imageUrl = await uploadBufferToDO(
          buffer,
          "products",
          file.originalname,
          file.mimetype
        );
        uploadedImages.push({ url: imageUrl, public_id: file.originalname });
      }
      product.productImageurls = uploadedImages;
    }

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("createProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   UPDATE PRODUCT
========================= */
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const body = { ...req.body };

    if (body.attributes && typeof body.attributes === "string") {
      body.attributes = JSON.parse(body.attributes);
    }
    if (body.tags && typeof body.tags === "string") {
      body.tags = body.tags.split(",").map((t) => t.trim());
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    Object.assign(product, body);

    // Upload new images to DO Spaces
    if (req.files && req.files.length > 0) {
      const uploadedImages = [];
      for (const file of req.files) {
        const buffer =
          file.buffer instanceof ArrayBuffer
            ? Buffer.from(file.buffer)
            : file.buffer;

        const imageUrl = await uploadBufferToDO(
          buffer,
          "products",
          file.originalname,
          file.mimetype
        );
        uploadedImages.push({ url: imageUrl, public_id: file.originalname });
      }
      product.productImageurls =
        product.productImageurls.concat(uploadedImages);
    }

    await product.save();
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET PRODUCTS (LIST / PAGINATE)
========================= */
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      tags,
      sortBy = "createdAt",
      order = "desc",
      inStock,
      includeInactive = false,
    } = req.query;

    const filter = includeInactive === "true" ? {} : { isActive: true };

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
    if (tags) filter.tags = { $in: tags.split(",").map((t) => t.trim()) };
    if (inStock === "true") filter.stock = { $gt: 0 };

    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(filter)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET SINGLE PRODUCT BY ID OR SLUG
========================= */
export const getProductById = async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };
    const product = await Product.findOne(query);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("getProductById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   SOFT DELETE PRODUCT
========================= */
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isActive = false;
    await product.save();

    res.status(200).json({ success: true, message: "Product soft-deleted" });
  } catch (error) {
    console.error("deleteProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
