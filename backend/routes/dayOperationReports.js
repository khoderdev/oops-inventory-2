import express from "express";
import dayOperationReportsController from "../controllers/dayOperationReportsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Day Operation Reports Routes
 * Base path: /api/day-operation-reports
 */

// Get all reports with pagination and filtering
router.get("/", authenticate, dayOperationReportsController.getAllReports);

// Get report by ID
router.get("/:id", authenticate, dayOperationReportsController.getReportById);

// Get reports for a specific day operation
router.get("/day-operation/:dayOperationId", authenticate, dayOperationReportsController.getReportsByDayOperation);

// Create a new report
router.post("/", authenticate, dayOperationReportsController.createReport);

// Generate a report for a day operation
router.post("/generate/:dayOperationId", authenticate, dayOperationReportsController.generateReport);

// Update an existing report
router.put("/:id", authenticate, dayOperationReportsController.updateReport);

// Delete a report
router.delete("/:id", authenticate, dayOperationReportsController.deleteReport);

export default router;
