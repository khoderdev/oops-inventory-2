import express from "express";
import { tablesController } from "../controllers/tablesController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Table CRUD operations
router.get("/", tablesController.getTables);
router.get("/sections", tablesController.getTableSections);
router.get("/:tableId", tablesController.getTable);
router.post("/", tablesController.createTable);
router.put("/:tableId", tablesController.updateTable);
router.delete("/:tableId", tablesController.deleteTable);

// Table status management
router.patch("/:tableId/reserve", tablesController.reserveTable);
router.patch("/:tableId/clear-reservation", tablesController.clearReservation);
router.patch("/:tableId/cleaning", tablesController.markForCleaning);
router.patch("/:tableId/clean", tablesController.markAsClean);

export default router;
