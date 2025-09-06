import express from "express";
import assignmentsRoutes from "./assignments.js";
import authRoutes from "./auth.js";
import backupSchedulerRoutes from "./backup-scheduler.js";
import backupRoutes from "./backup.js";
import categoriesRoutes from "./categories.js";
import dayOperationsRoutes from "./dayOperations.js";
import dayOperationReportsRoutes from "./dayOperationReports.js";
import employeeRoutes from "./employees.js";
import logsRoutes from "./logs.js";
import materialRoutes from "./materials.js";
import menuItemsRoutes from "./menuItems.js";
import ordersRoutes from "./orders.js";
import suppliersRoutes from "./suppliers.js";
import posRoutes from "./pos.js";
import printersRoutes from "./printers.js";
import salesRoutes from "./sales.js";
import sectionRoutes from "./sections.js";
import sessionsRoutes from "./sessions.js";
import stockEntriesRoutes from "./stockEntries.js";
import saucesRoutes from "./sauces.js";
import tablesRoutes from "./tables.js";
import departmentRoutes from "./departmentRoutes.js";
import userRoutes from "./users.js";
import variantsRoutes from "./variants.js";
import variantIngredientsRoutes from "./variantIngredients.js";


const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/categories", categoriesRoutes);
router.use("/materials", materialRoutes);
router.use("/sections", sectionRoutes);
router.use("/assignments", assignmentsRoutes);
router.use("/stock-entries", stockEntriesRoutes);
router.use("/sauces", saucesRoutes);
router.use("/menu-items", menuItemsRoutes);
router.use("/orders", ordersRoutes);
router.use("/pos", posRoutes);
router.use("/tables", tablesRoutes);
router.use("/sales", salesRoutes);
router.use("/day-operations", dayOperationsRoutes);
router.use("/suppliers", suppliersRoutes);
router.use("/day-operation-reports", dayOperationReportsRoutes);
router.use("/logs", logsRoutes);
router.use("/sessions", sessionsRoutes);
router.use("/backup", backupRoutes);
router.use("/backup-scheduler", backupSchedulerRoutes);
router.use("/printers", printersRoutes);
router.use("/variants", variantsRoutes);
router.use("/variant-ingredients", variantIngredientsRoutes);
router.use("/departments", departmentRoutes);
// Emergency fix for sequences
router.post("/admin/fix-sequences", async (req, res) => {
  // call it using this in terminal: curl -X POST http://localhost:3000/admin/fix-sequences
  try {
    await resetAllSequences();
    res.json({ success: true, message: "Database sequences reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reset sequences", error: error.message });
  }
});


export default router;
