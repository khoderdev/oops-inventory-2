import express from "express";
import { getSauces, getSauce, createSauce, updateSauce, deleteSauce, bulkDeleteSauces, togglePOSVisibility, toggleActiveStatus, calculateSauceCost, getSauceCategories } from "../controllers/saucesController.js";
import { auditAction, authenticate, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read operations with caching
router.get("/", requirePermission("sauces.read"), getSauces);

router.get("/categories", requirePermission("sauces.read"), getSauceCategories);

router.get("/:id", requirePermission("sauces.read"), getSauce);

// Cost calculation endpoint
router.post("/calculate-cost", requirePermission("sauces.read"), calculateSauceCost);

// Write operations (no caching, with audit logging)
router.post("/", requirePermission("sauces.create"), auditAction("CREATE_SAUCE"), createSauce);

router.put("/:id", requirePermission("sauces.update"), auditAction("UPDATE_SAUCE"), updateSauce);

router.delete("/:id", requirePermission("sauces.delete"), auditAction("DELETE_SAUCE"), deleteSauce);

router.post("/bulk-delete", requirePermission("sauces.delete"), auditAction("BULK_DELETE_SAUCES"), bulkDeleteSauces);

// Status toggle operations
router.patch("/:id/pos-visibility", requirePermission("sauces.update"), auditAction("TOGGLE_SAUCE_POS"), togglePOSVisibility);

router.patch("/:id/active-status", requirePermission("sauces.update"), auditAction("TOGGLE_SAUCE_ACTIVE"), toggleActiveStatus);

export default router;
