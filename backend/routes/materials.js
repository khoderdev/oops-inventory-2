import express from "express";
import materialController from "../controllers/materialController.js";
const router = express.Router();

router.get("/with-stock", materialController.getMaterialsWithStock);
router.get("/", materialController.getAllMaterials);
router.post("/", materialController.createMaterial);
router.put("/:id", materialController.updateMaterial);
router.delete("/:id", materialController.deleteMaterial);

export default router;
