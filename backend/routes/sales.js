import express from "express";
import salesController from "../controllers/salesController.js";
const router = express.Router();

router.get("/", salesController.getAllSales);
router.get("/negative-stock-report", salesController.getNegativeStockReport);
router.get("/:id", salesController.getSalesById);
router.post("/", salesController.createSales);
router.put("/:id", salesController.updateSales);
router.delete("/:id", salesController.deleteSales);
router.post("/:id/revert", salesController.revertSale);
router.post("/:id/soft-delete", salesController.softDeleteSale);

export default router;