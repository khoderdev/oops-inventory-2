import express from "express";
import variantsController from "../controllers/variantsController.js";
import { authenticate, requirePermission } from "../middleware/authMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/variants - Get all variants with optional filtering
router.get(
  "/",
  requirePermission("variants.read"),
  cacheMiddleware(60), // Cache for 1 minute
  variantsController.getAllVariants
);

// GET /api/variants/menu-item/:menuItemId - Get variants for specific menu item
router.get(
  "/menu-item/:menuItemId",
  requirePermission("variants.read"),
  cacheMiddleware(120), // Cache for 2 minutes
  variantsController.getVariantsByMenuItemId
);

// GET /api/variants/:id - Get variant by ID
router.get(
  "/:id",
  requirePermission("variants.read"),
  cacheMiddleware(300), // Cache for 5 minutes
  variantsController.getVariantById
);

// POST /api/variants - Create new variant
router.post(
  "/",
  requirePermission("variants.create"),
  variantsController.createVariant
);

// POST /api/variants/bulk - Create multiple variants
router.post(
  "/bulk",
  requirePermission("variants.create"),
  variantsController.createBulkVariants
);

// PUT /api/variants/:id - Update variant
router.put(
  "/:id",
  requirePermission("variants.update"),
  variantsController.updateVariant
);

// PATCH /api/variants/:id/toggle-status - Toggle variant active status
router.patch(
  "/:id/toggle-status",
  requirePermission("variants.update"),
  variantsController.toggleVariantStatus
);

// DELETE /api/variants/:id - Delete variant
router.delete(
  "/:id",
  requirePermission("variants.delete"),
  variantsController.deleteVariant
);

// DELETE /api/variants/bulk - Bulk delete variants
router.delete(
  "/bulk",
  requirePermission("variants.delete"),
  variantsController.bulkDeleteVariants
);

export default router;
