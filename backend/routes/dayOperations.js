import express from "express";
import dayOperationsController from "../controllers/dayOperationsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all day operations with pagination
router.get("/", authenticate, dayOperationsController.getAllDayOperations);

// Get current day operation
router.get("/current", authenticate, dayOperationsController.getCurrentDayOperation);

// Get activity logs for current day
router.get("/current/activities", authenticate, dayOperationsController.getCurrentDayActivities);

// Get user order statistics for current day
router.get("/current/user-order-stats", authenticate, dayOperationsController.getCurrentDayUserOrderStats);

// Open a new day
router.post("/open", authenticate, dayOperationsController.openDay);

// Close current day
router.post("/close", authenticate, dayOperationsController.closeDay);

// Get daily report for a specific date
router.get("/report/:date", authenticate, dayOperationsController.getDailyReport);

// Get day operation by ID
router.get("/:id", authenticate, dayOperationsController.getDayOperationById);

// Update day operation
router.put("/:id", authenticate, dayOperationsController.updateDayOperation);

export default router;
