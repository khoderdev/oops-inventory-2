import express from "express";
import categoryController from "../controllers/categoryController.js";
import categoryTypeController from "../controllers/categoryTypeController.js";
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

// ===== CATEGORY TYPES ROUTES (must be before /:id route) =====

// GET /api/categories/types - Get all category types with filtering and pagination
router.get("/types", categoryTypeController.getAllCategoryTypes);

// GET /api/categories/types/category/:categoryId - Get category types by category ID
router.get("/types/category/:categoryId", categoryTypeController.getCategoryTypesByCategoryId);

// GET /api/categories/types/type/:type - Get category types by type
router.get("/types/type/:type", categoryTypeController.getCategoryTypesByType);

// POST /api/categories/types/bulk - Bulk create category types (must be before /:id route)
router.post("/types/bulk", categoryTypeController.bulkCreateCategoryTypes);

// DELETE /api/categories/types/bulk - Bulk delete category types
router.delete("/types/bulk", categoryTypeController.bulkDeleteCategoryTypes);

// GET /api/categories/types/:id - Get single category type by ID
router.get("/types/:id", categoryTypeController.getCategoryTypeById);

// POST /api/categories/types - Create new category type
router.post("/types", categoryTypeController.createCategoryType);

// PUT /api/categories/types/:id - Update category type
router.put("/types/:id", categoryTypeController.updateCategoryType);

// DELETE /api/categories/types/:id - Delete category type
router.delete("/types/:id", categoryTypeController.deleteCategoryType);

// ===== CATEGORY ROUTES (/:id must be last) =====

// GET /api/categories/:id - Get single category by ID
router.get("/:id", categoryController.getCategoryById);

// POST /api/categories - Create new category
router.post("/", categoryController.createCategory);

// PUT /api/categories/:id - Update category
router.put("/:id", categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete("/:id", categoryController.deleteCategory);

export default router;
