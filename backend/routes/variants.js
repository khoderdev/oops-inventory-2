import express from "express";
import variantsController from "../controllers/variantsController.js";
import { authenticate, requirePermission } from "../middleware/authMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/variants - Get all variants with optional filtering
router.get("/", cacheMiddleware(60), variantsController.getAllVariants);

// GET /api/variants/menu-item/:menuItemId - Get variants for specific menu item
router.get("/menu-item/:menuItemId", cacheMiddleware(120), variantsController.getVariantsByMenuItemId);

// GET /api/variants/:id - Get variant by ID
router.get("/:id", cacheMiddleware(300), variantsController.getVariantById);

// POST /api/variants - Create new variant
router.post("/", variantsController.createVariant);

// POST /api/variants/bulk - Create multiple variants
router.post("/bulk", variantsController.createBulkVariants);

// PUT /api/variants/:id - Update variant
router.put("/:id", variantsController.updateVariant);

// PATCH /api/variants/:id/toggle-status - Toggle variant active status
router.patch("/:id/toggle-status", variantsController.toggleVariantStatus);

// DELETE /api/variants/:id - Delete variant
router.delete("/:id", variantsController.deleteVariant);

// DELETE /api/variants/bulk - Bulk delete variants
router.delete("/bulk", variantsController.bulkDeleteVariants);

export default router;
