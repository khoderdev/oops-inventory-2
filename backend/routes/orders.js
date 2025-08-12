import express from "express";
import { ordersController } from "../controllers/ordersController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Order CRUD operations
router.post("/", ordersController.createOrder);
router.get("/", ordersController.getOrders);
router.get("/drafts", ordersController.getDraftOrders);
router.get("/:orderId", ordersController.getOrder);
router.put("/:orderId", ordersController.updateOrder);
router.post("/:orderId/items", ordersController.addOrderItems);
router.delete("/:orderId/items", ordersController.removeOrderItems);
router.patch("/:orderId/autosave", ordersController.autoSaveOrder);

// Order status management
router.patch("/:orderId/status", ordersController.updateOrderStatus);
router.patch("/:orderId/cancel", ordersController.cancelOrder);
router.patch("/:orderId/void", ordersController.voidOrder);

// Order completion
router.post("/:orderId/complete", ordersController.completeOrder);

// Table-specific orders
router.get("/table/:tableId", ordersController.getTableOrders);

export default router;
