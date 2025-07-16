import express from "express";
import sectionController from "../controllers/sectionController.js";
const router = express.Router();

router.get("/sections-with-assignments", sectionController.getSectionsWithAssignments);
router.post("/", sectionController.createSection);

export default router;
