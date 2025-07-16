import express from "express";
import assignmentsController from "../controllers/assignmentsController.js";
const router = express.Router();

router.get("/", assignmentsController.getAllAssignments);
router.get("/:id", assignmentsController.getAssignmentById);
router.post("/", assignmentsController.createAssignments);
router.put("/:id", assignmentsController.updateAssignments);
router.delete("/:id", assignmentsController.deleteAssignments);

export default router;
