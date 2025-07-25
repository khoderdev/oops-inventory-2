import express from "express";
import assignmentsController from "../controllers/assignmentsController.js";
import { authenticate, requirePermission, auditAction } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read operations
router.get("/", requirePermission("assignments.read"), assignmentsController.getAllAssignments);
router.get("/:id", requirePermission("assignments.read"), assignmentsController.getAssignmentById);

// Write operations
router.post("/", requirePermission("assignments.create"), auditAction("assignment_create", "assignment"), assignmentsController.createAssignments);
router.put("/:id", requirePermission("assignments.update"), auditAction("assignment_update", "assignment"), assignmentsController.updateAssignments);
router.delete("/:id", requirePermission("assignments.delete"), auditAction("assignment_delete", "assignment"), assignmentsController.deleteAssignments);

export default router;
