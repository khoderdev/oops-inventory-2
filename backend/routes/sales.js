import express from "express";
import salesController from "../controllers/salesController.js";
const router = express.Router();

router.get("/", salesController.getAllSales);
router.get("/negative-stock-report", salesController.getNegativeStockReport);
router.get("/:id", salesController.getSalesById);
router.post("/", salesController.createSales);
router.put("/:id", salesController.updateSales);
router.delete("/:id", salesController.deleteSales);

export default router;