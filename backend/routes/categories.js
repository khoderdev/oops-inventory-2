import express from "express";
import categoryController from "../controllers/categoryController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/categories - Get all categories with filtering and pagination
router.get("/", categoryController.getAllCategories);

// GET /api/categories/type/:type - Get categories by type (materials or menu_items)
router.get("/type/:type", categoryController.getCategoriesByType);

// PUT /api/categories/sort-orders - Bulk update sort orders (must be before /:id route)
router.put("/sort-orders", categoryController.updateSortOrders);

// GET /api/categories/:id - Get single category by ID
router.get("/:id", categoryController.getCategoryById);

// POST /api/categories - Create new category
router.post("/", categoryController.createCategory);

// PUT /api/categories/:id - Update category
router.put("/:id", categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete("/:id", categoryController.deleteCategory);

export default router;
