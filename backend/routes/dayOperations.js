import express from "express";
import dayOperationsController from "../controllers/dayOperationsController.js";

const router = express.Router();

// Get all day operations with pagination
router.get("/", dayOperationsController.getAllDayOperations);

// Get current day operation
router.get("/current", dayOperationsController.getCurrentDayOperation);

// Get activity logs for current day
router.get("/current/activities", dayOperationsController.getCurrentDayActivities);

// Get user order statistics for current day
router.get("/current/user-order-stats", dayOperationsController.getCurrentDayUserOrderStats);

// Open a new day
router.post("/open", dayOperationsController.openDay);

// Close current day
router.post("/close", dayOperationsController.closeDay);

// Get daily report for a specific date
router.get("/report/:date", dayOperationsController.getDailyReport);

// Get day operation by ID
router.get("/:id", dayOperationsController.getDayOperationById);

// Update day operation
router.put("/:id", dayOperationsController.updateDayOperation);

export default router;
