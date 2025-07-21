import express from "express";
import salesController from "../controllers/salesController.js";
import { 
  checkDayOperationStatus, 
  logSaleActivity, 
  warnIfDayClosed 
} from "../middleware/dayOperationsMiddleware.js";

const router = express.Router();

// Apply day operation status check to all routes
router.use(checkDayOperationStatus);

// Routes with day operations integration
router.get("/", salesController.getAllSales);
router.get("/negative-stock-report", salesController.getNegativeStockReport);
router.get("/:id", salesController.getSalesById);

// Sales creation/modification routes with activity logging
router.post("/", warnIfDayClosed, logSaleActivity, salesController.createSales);
router.put("/:id", warnIfDayClosed, logSaleActivity, salesController.updateSales);
router.delete("/:id", warnIfDayClosed, logSaleActivity, salesController.deleteSales);
router.post("/:id/revert", warnIfDayClosed, logSaleActivity, salesController.revertSale);
router.post("/:id/soft-delete", warnIfDayClosed, logSaleActivity, salesController.softDeleteSale);

export default router;