import express from "express";
import { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, toggleSupplierStatus, getSupplierStockEntries } from "../controllers/suppliersController.js";
import { getAllSupplierPayments, getPaymentById, createPayment, updatePayment, deletePayment, getSupplierPaymentStats } from "../controllers/supplierPaymentsController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Supplier routes
router.get("/", cacheMiddleware(60), getAllSuppliers);
router.get("/:id", cacheMiddleware(60), getSupplierById);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);
router.patch("/:id/toggle-status", toggleSupplierStatus);

// NEW: Get supplier stock entries
router.get("/:supplierId/stock-entries", cacheMiddleware(60), getSupplierStockEntries);

// Supplier payment routes
router.get("/payments/all", cacheMiddleware(60), getAllSupplierPayments);
router.get("/payments/:id", cacheMiddleware(60), getPaymentById);
router.post("/payments", createPayment);
router.put("/payments/:id", updatePayment);
router.delete("/payments/:id", deletePayment);
router.get("/:supplierId/payment-stats", cacheMiddleware(60), getSupplierPaymentStats);

export default router;
