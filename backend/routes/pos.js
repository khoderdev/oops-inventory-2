import express from "express";
import posController from "../controllers/posController.js";
import { authenticate, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all POS items (menu items + POS-enabled stock entries)
router.get("/items", requirePermission("pos.access"), posController.getPOSItems);

// Get POS items by category
router.get("/items/category/:category", requirePermission("pos.access"), posController.getPOSItemsByCategory);

export default router;
