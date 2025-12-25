import express from "express";
import {
  getProfile,
  updateProfile,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  getAllAddresses,
} from "../controller/profileController.js";

import verifyToken from "../token-config/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getProfile);
router.put("/", verifyToken, updateProfile);
router.get("/address/get", verifyToken, getAllAddresses);
router.post("/address/add", verifyToken, addAddress);
router.delete("/address/:id", verifyToken, deleteAddress);
router.put("/address/default/:id", verifyToken, setDefaultAddress);

export default router;
