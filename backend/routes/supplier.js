// import express from 'express';
// import supplierController from '../controllers/supplierController.js';
// import { authenticate } from '../middleware/authMiddleware.js';

// const router = express.Router();

// // Apply authentication to all routes
// router.use(authenticate);

// // Supplier CRUD routes
// router.get('/', supplierController.getAllSuppliers);
// router.post('/', supplierController.createSupplier);
// router.get('/:id', supplierController.getSupplier);
// router.put('/:id', supplierController.updateSupplier);
// router.delete('/:id', supplierController.deleteSupplier);

// // Settlement routes
// router.post('/:id/settlements', supplierController.createSettlement);
// router.get('/:id/settlements', supplierController.getSettlements);

// // Invoice routes
// router.get('/:id/invoices/outstanding', supplierController.getOutstandingInvoices);

// // Bulk operations
// router.patch('/bulk/status', supplierController.bulkUpdateSupplierStatus);

// export default router;

import express from "express";
import supplierController from "../controllers/supplierController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Supplier CRUD
router.get("/", supplierController.getAllSuppliers);
router.post("/", supplierController.createSupplier);

// Special/static routes (must come before :id)
router.patch("/bulk/status", supplierController.bulkUpdateSupplierStatus);

// Get supplier summary statistics
router.get("/summary", supplierController.getSupplierSummary);

// Settlement routes
router.post("/:id/settlements", supplierController.createSettlement);
router.get("/:id/settlements", supplierController.getSettlements);

// Invoice routes
router.get("/:id/invoices/outstanding", supplierController.getOutstandingInvoices);

// Supplier by ID (placed last, numeric constraint optional)
router.get("/:id", supplierController.getSupplier);
router.put("/:id", supplierController.updateSupplier);
router.delete("/:id", supplierController.deleteSupplier);

export default router;
