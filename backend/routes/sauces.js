import express from "express";
import { getSauces, getSauce, createSauce, updateSauce, deleteSauce, bulkDeleteSauces, togglePOSVisibility, toggleActiveStatus, calculateSauceCost, getSauceCategories } from "../controllers/saucesController.js";
import { auditAction } from "../middleware/authMiddleware.js";

const router = express.Router();

// Read operations
router.get("/", getSauces);

router.get("/categories", getSauceCategories);

router.get("/:id", getSauce);

// Cost calculation endpoint
router.post("/calculate-cost", calculateSauceCost);

// Write operations (with audit logging)
router.post("/", auditAction("CREATE_SAUCE"), createSauce);

router.put("/:id", auditAction("UPDATE_SAUCE"), updateSauce);

router.delete("/:id", auditAction("DELETE_SAUCE"), deleteSauce);

router.post("/bulk-delete", auditAction("BULK_DELETE_SAUCES"), bulkDeleteSauces);

// Status toggle operations
router.patch("/:id/pos-visibility", auditAction("TOGGLE_SAUCE_POS"), togglePOSVisibility);

router.patch("/:id/active-status", auditAction("TOGGLE_SAUCE_ACTIVE"), toggleActiveStatus);

export default router;
