import express from "express";
import materialController from "../controllers/materialController.js";
import { auditAction, authenticate, requirePermission } from "../middleware/authMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read operations with caching
router.get("/with-stock", 
  requirePermission("materials.read"), 
  cacheMiddleware(180, (req) => `materials-with-stock:${JSON.stringify(req.query)}`), // 3 min cache
  materialController.getMaterialsWithStock
);

router.get("/", 
  requirePermission("materials.read"), 
  cacheMiddleware(300, (req) => `materials:${JSON.stringify(req.query)}`), // 5 min cache
  materialController.getAllMaterials
);

// Write operations (with cache invalidation)
router.post("/", requirePermission("materials.create"), auditAction("material_create", "material"), (req, res, next) => {
  // Clear materials cache after creation
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("materials");
  });
  next();
}, materialController.createMaterial);

router.put("/:id", requirePermission("materials.update"), auditAction("material_update", "material"), (req, res, next) => {
  // Clear materials cache after update
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("materials");
  });
  next();
}, materialController.updateMaterial);

router.delete("/:id", requirePermission("materials.delete"), auditAction("material_delete", "material"), (req, res, next) => {
  // Clear materials cache after deletion
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("materials");
  });
  next();
}, materialController.deleteMaterial);

export default router;
