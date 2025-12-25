import User from "../models/profileModel.js";
import Address from "../models/addressModel.js";

// ==========================
// USER PROFILE
// ==========================

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// ==========================
// ADDRESS CONTROLLER
// ==========================

// Add a new address
export const addAddress = async (req, res) => {
  try {
    const { label, street, city, state, postalCode, country, phone } = req.body;

    // Basic validation
    if (!street || !city || !state || !postalCode || !phone) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // If this is the first address, set as default
    const existingAddresses = await Address.find({ user: req.user.id });
    const isDefault = existingAddresses.length === 0;

    const newAddress = await Address.create({
      user: req.user.id,
      label: label || "Home",
      street,
      city,
      state,
      postalCode,
      country: country || "India",
      phone,
      isDefault,
    });

    const addresses = await Address.find({ user: req.user.id });
    res.status(201).json({ message: "Address added successfully", addresses });
  } catch (error) {
    console.error("addAddress error:", error);
    res
      .status(500)
      .json({ message: "Error adding address", error: error.message });
  }
};

// Delete an address
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!address) return res.status(404).json({ message: "Address not found" });

    await address.deleteOne();

    const addresses = await Address.find({ user: req.user.id });
    res
      .status(200)
      .json({ message: "Address deleted successfully", addresses });
  } catch (error) {
    console.error("deleteAddress error:", error);
    res
      .status(500)
      .json({ message: "Error deleting address", error: error.message });
  }
};

// Set default address
export const setDefaultAddress = async (req, res) => {
  try {
    const addressToSet = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!addressToSet)
      return res.status(404).json({ message: "Address not found" });

    // Reset all addresses for the user
    await Address.updateMany(
      { user: req.user.id },
      { $set: { isDefault: false } }
    );

    // Set the selected address as default
    addressToSet.isDefault = true;
    await addressToSet.save();

    const addresses = await Address.find({ user: req.user.id });
    res
      .status(200)
      .json({ message: "Default address set successfully", addresses });
  } catch (error) {
    console.error("setDefaultAddress error:", error);
    res
      .status(500)
      .json({ message: "Error setting default address", error: error.message });
  }
};

// Get all addresses for the logged-in user
export const getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id });
    res.status(200).json({ addresses });
  } catch (error) {
    console.error("getAllAddresses error:", error);
    res
      .status(500)
      .json({ message: "Error fetching addresses", error: error.message });
  }
};
