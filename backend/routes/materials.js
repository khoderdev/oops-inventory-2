import express from "express";
import materialController from "../controllers/materialController.js";
const router = express.Router();

router.get("/materials-with-stock", materialController.getMaterialsWithStock);
router.post("/", materialController.createMaterial);

export default router;
