import express from "express";
import sectionController from "../controllers/sectionController.js";
const router = express.Router();

router.get("/with-assignments", sectionController.getSectionsWithAssignments);
router.get("/", sectionController.getAllSections);
router.post("/", sectionController.createSection);
router.put("/:id", sectionController.updateSection);
router.delete("/:id", sectionController.deleteSection);

export default router;
