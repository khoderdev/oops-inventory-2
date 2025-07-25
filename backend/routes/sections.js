import express from "express";
import sectionController from "../controllers/sectionController.js";
import { authenticate, requirePermission, auditAction } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read operations
router.get("/with-assignments", requirePermission("sections.read"), sectionController.getSectionsWithAssignments);
router.get("/", requirePermission("sections.read"), sectionController.getAllSections);

// Write operations
router.post("/", requirePermission("sections.create"), auditAction("section_create", "section"), sectionController.createSection);
router.put("/:id", requirePermission("sections.update"), auditAction("section_update", "section"), sectionController.updateSection);
router.delete("/:id", requirePermission("sections.delete"), auditAction("section_delete", "section"), sectionController.deleteSection);

export default router;
