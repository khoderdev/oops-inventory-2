// // import express from "express";
// // import sectionController from "../controllers/sectionController.js";
// // import { tablesController } from "../controllers/tablesController.js";
// // import { InnerSection, Sale, Table } from "../models/index.js";
// // const router = express.Router();

// // // Section routes
// // router.get("/with-assignments", sectionController.getSectionsWithAssignments);
// // router.get("/", tablesController.getAllSectionsWithDetails);
// // router.post("/", tablesController.createSection);
// // router.put("/:id", sectionController.updateSection);
// // router.delete("/:id", sectionController.deleteSection);

// // // Inner section routes
// // router.post("/inner-sections", tablesController.createInnerSection);
// // router.put("/inner-sections/:id", tablesController.updateInnerSection);
// // router.get("/inner-sections/:sectionId", async (req, res, next) => {
// //   try {
// //     const { sectionId } = req.params;
// //     const innerSections = await InnerSection.findAll({
// //       where: { sectionId },
// //       include: [{ model: Table, as: "tables", include: [{ model: Sale, as: "sales" }] }]
// //     });
// //     res.status(200).json(innerSections);
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // // Table routes
// // router.post("/tables", tablesController.createTable);
// // router.get("/tables/:id", tablesController.getTableById);
// // router.put("/tables/:id", tablesController.updateTable);
// // router.delete("/tables/:id", tablesController.deleteTable);

// // // Order placement for a table
// // router.post("/tables/:tableId/order", tablesController.placeOrderForTable);

// // export default router;

// import express from "express";
// import sectionController from "../controllers/sectionController.js";
// import { tablesController } from "../controllers/tablesController.js";
// import { InnerSection, Sale, Table } from "../models/index.js";

// const router = express.Router();

// // Section routes
// router.get("/with-assignments", sectionController.getSectionsWithAssignments);
// router.get("/", tablesController.getAllSectionsWithDetails);
// router.post("/", tablesController.createSection);
// router.put("/:id", sectionController.updateSection);
// router.delete("/:id", sectionController.deleteSection);

// // Inner section routes
// router.get("/inner-sections", async (req, res, next) => {
//   try {
//     const innerSections = await InnerSection.findAll({
//       include: [{ model: Table, as: "tables", include: [{ model: Sale, as: "sales" }] }]
//     });
//     res.status(200).json(innerSections);
//   } catch (error) {
//     console.error("Error fetching inner sections:", error);
//     next(error);
//   }
// });
// router.get("/inner-sections/:sectionId", async (req, res, next) => {
//   try {
//     const { sectionId } = req.params;
//     if (!sectionId || sectionId === "undefined") {
//       return res.status(400).json({ error: "Valid sectionId is required" });
//     }
//     const innerSections = await InnerSection.findAll({
//       where: { sectionId },
//       include: [{ model: Table, as: "tables", include: [{ model: Sale, as: "sales" }] }]
//     });
//     res.status(200).json(innerSections);
//   } catch (error) {
//     console.error("Error fetching inner sections for section:", error);
//     next(error);
//   }
// });
// router.post("/inner-sections", tablesController.createInnerSection);
// router.put("/inner-sections/:id", tablesController.updateInnerSection);

// // Table routes
// router.get("/tables", async (req, res, next) => {
//   try {
//     const tables = await Table.findAll({
//       include: [{ model: InnerSection, as: "innerSection" }]
//     });
//     res.status(200).json(tables);
//   } catch (error) {
//     console.error("Error fetching tables:", error);
//     next(error);
//   }
// });
// router.get("/tables/:id", tablesController.getTableById);
// router.post("/tables", tablesController.createTable);
// router.put("/tables/:id", tablesController.updateTable);
// router.delete("/tables/:id", tablesController.deleteTable);

// // Order placement for a table
// router.post("/tables/:tableId/order", tablesController.placeOrderForTable);

// export default router;
// routes/sections.js
import express from "express";
import sectionController from "../controllers/sectionController.js";
import { tablesController } from "../controllers/tablesController.js";
import { InnerSection, Sale, Table } from "../models/index.js";

const router = express.Router();

// Section routes
router.get("/with-assignments", sectionController.getSectionsWithAssignments);
router.get("/", tablesController.getAllSectionsWithDetails);
router.post("/", tablesController.createSection);
router.put("/:id", sectionController.updateSection);
router.delete("/:id", sectionController.deleteSection);

// Inner section routes
router.get("/inner-sections", async (req, res, next) => {
  try {
    const innerSections = await InnerSection.findAll({
      include: [{ model: Table, as: "tables", include: [{ model: Sale, as: "sales" }] }]
    });
    res.status(200).json(innerSections);
  } catch (error) {
    console.error("Error fetching inner sections:", error);
    next(error);
  }
});
router.get("/inner-sections/:sectionId", async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    if (!sectionId || sectionId === "undefined" || isNaN(parseInt(sectionId))) {
      return res.status(400).json({ error: "Valid sectionId is required" });
    }
    const innerSections = await InnerSection.findAll({
      where: { sectionId },
      include: [{ model: Table, as: "tables", include: [{ model: Sale, as: "sales" }] }]
    });
    res.status(200).json(innerSections);
  } catch (error) {
    console.error("Error fetching inner sections for section:", error);
    next(error);
  }
});
router.post("/inner-sections", tablesController.createInnerSection);
router.put("/inner-sections/:id", tablesController.updateInnerSection);

// Table routes
router.get("/tables", async (req, res, next) => {
  try {
    const tables = await Table.findAll({
      include: [{ model: InnerSection, as: "innerSection" }]
    });
    res.status(200).json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    next(error);
  }
});
router.get("/tables/:id", tablesController.getTableById);
router.post("/tables", tablesController.createTable);
router.put("/tables/:id", tablesController.updateTable);
router.delete("/tables/:id", tablesController.deleteTable);

// Order placement for a table
router.post("/tables/:tableId/order", tablesController.placeOrderForTable);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

export default router;
