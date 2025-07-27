import express from "express";
import materialController from "../controllers/materialController.js";
import { auditAction, authenticate, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read operations
router.get("/with-stock", requirePermission("materials.read"), materialController.getMaterialsWithStock);
router.get("/", requirePermission("materials.read"), materialController.getAllMaterials);

// Write operations
router.post("/", requirePermission("materials.create"), auditAction("material_create", "material"), materialController.createMaterial);
router.put("/:id", requirePermission("materials.update"), auditAction("material_update", "material"), materialController.updateMaterial);
router.delete("/:id", requirePermission("materials.delete"), auditAction("material_delete", "material"), materialController.deleteMaterial);

export default router;
