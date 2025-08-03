import express from "express";
import { floorPlanController } from "../controllers/floorPlanController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Floor plan routes
router.get("/", floorPlanController.getFloorPlans);
router.get("/:floorPlanId", floorPlanController.getFloorPlan);
router.post("/", floorPlanController.createFloorPlan);
router.put("/:floorPlanId", floorPlanController.updateFloorPlan);
router.delete("/:floorPlanId", floorPlanController.deleteFloorPlan);
router.patch("/:floorPlanId/default", floorPlanController.setDefaultFloorPlan);

// Table integration routes
router.get("/:floorPlanId/tables", floorPlanController.getFloorPlanTables);
router.patch("/furniture/:furnitureItemId/status", floorPlanController.updateFurnitureStatus);

export default router;
