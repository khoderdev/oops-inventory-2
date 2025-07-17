import { Assignment, Material, MenuItem, Section, StockEntry } from "../models/index.js";

const assignmentsController = {
  getAllAssignments: async (req, res, next) => {
    try {
      const assignments = await Assignment.findAll({
        include: [
          { model: Section, as: "section" },
          { model: Material, as: "material" },
          { model: StockEntry, as: "stockEntry" },
          { model: MenuItem, as: "menuItem" }
        ]
      });
      res.status(200).json(assignments);
    } catch (error) {
      console.error("Get all assignments error:", error.message, error.stack);
      next(error);
    }
  },

  getAssignmentById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id, {
        include: [
          { model: Section, as: "section" },
          { model: Material, as: "material" },
          { model: MenuItem, as: "menuItem" },
          { model: StockEntry, as: "stockEntry" }
        ]
      });

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      res.status(200).json(assignment);
    } catch (error) {
      console.error("Get assignment by ID error:", error.message, error.stack);
      next(error);
    }
  },

  createAssignments: async (req, res, next) => {
    try {
      const { sectionId, itemType, materialId, stockEntryId, menuItemId, assignedQuantity, assignedUnit, notes } = req.body;

      console.log("Received body:", JSON.stringify(req.body, null, 2));

      if (!sectionId || !itemType) {
        return res.status(400).json({ error: "sectionId and itemType are required" });
      }

      const section = await Section.findByPk(parseInt(sectionId));
      if (!section) {
        return res.status(400).json({ error: "Invalid sectionId" });
      }

      // Handle Stock Entry Assignment
      if (itemType === "stockEntry") {
        if (!materialId || !stockEntryId || !assignedQuantity) {
          return res.status(400).json({
            error: "materialId, stockEntryId, and assignedQuantity are required for stockEntry assignment"
          });
        }

        if (assignedQuantity <= 0) {
          return res.status(400).json({ error: "Assigned quantity must be positive" });
        }

        const material = await Material.findByPk(parseInt(materialId));
        const stockEntry = await StockEntry.findByPk(String(stockEntryId));

        if (!material || !stockEntry) {
          return res.status(400).json({ error: "Invalid materialId or stockEntryId" });
        }

        if (String(stockEntry.materialId) !== String(materialId)) {
          return res.status(400).json({ error: "Material ID does not match stock entry" });
        }

        const assignment = await Assignment.create({
          sectionId: parseInt(sectionId),
          itemType,
          materialId: parseInt(materialId),
          stockEntryId: String(stockEntryId),
          assignedQuantity: Number(assignedQuantity),
          assignedUnit: String(assignedUnit || ""),
          notes: String(notes || "")
        });

        const createdAssignment = await Assignment.findByPk(assignment.id, {
          include: [
            { model: Section, as: "section" },
            { model: Material, as: "material" },
            { model: StockEntry, as: "stockEntry" },
            { model: MenuItem, as: "menuItem" }
          ]
        });

        return res.status(201).json(createdAssignment);
      }

      // Handle Menu Item Assignment
      if (itemType === "menuItem") {
        if (!menuItemId) {
          return res.status(400).json({ error: "menuItemId is required for menuItem assignment" });
        }

        const menuItem = await MenuItem.findByPk(String(menuItemId));
        if (!menuItem) {
          return res.status(400).json({ error: "Invalid menuItemId" });
        }

        const assignment = await Assignment.create({
          sectionId: parseInt(sectionId),
          itemType,
          menuItemId: parseInt(menuItemId),
          materialId: null,
          stockEntryId: null,
          assignedQuantity: null,
          assignedUnit: null,
          notes: notes ? String(notes) : null
        });

        const createdAssignment = await Assignment.findByPk(assignment.id, {
          include: [
            { model: Section, as: "section" },
            { model: MenuItem, as: "menuItem" }
          ]
        });

        return res.status(201).json(createdAssignment);
      }

      return res.status(400).json({ error: "Unsupported itemType" });
    } catch (error) {
      console.error("Create assignment error:", error.message, error.stack);
      res.status(500).json({ error: "An unexpected error occurred" });
      next(error);
    }
  },

  updateAssignments: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { sectionId, materialId, stockEntryId, assignedQuantity, assignedUnit, notes } = req.body;

      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      if (assignedQuantity !== undefined && assignedQuantity <= 0) {
        console.error("Invalid quantity:", assignedQuantity);
        return res.status(400).json({ error: "Assigned quantity must be positive" });
      }

      // Validate references if provided
      if (sectionId || materialId || stockEntryId) {
        const section = sectionId ? await Section.findByPk(parseInt(sectionId)) : null;
        const material = materialId ? await Material.findByPk(parseInt(materialId)) : null;
        let stockEntry;
        if (stockEntryId) {
          try {
            stockEntry = await StockEntry.findByPk(String(stockEntryId));
          } catch (error) {
            console.error("StockEntry lookup failed:", { stockEntryId, error: error.message });
            return res.status(400).json({ error: "Invalid stockEntryId" });
          }
        }

        if ((sectionId && !section) || (materialId && !material) || (stockEntryId && !stockEntry)) {
          console.error("Validation failed:", {
            sectionId: sectionId ? parseInt(sectionId) : null,
            materialId: materialId ? parseInt(materialId) : null,
            stockEntryId: String(stockEntryId || ""),
            sectionExists: !!section,
            materialExists: !!material,
            stockEntryExists: !!stockEntry
          });
          return res.status(400).json({ error: "Invalid sectionId, materialId, or stockEntryId" });
        }

        if (stockEntry && materialId && String(stockEntry.materialId) !== String(materialId)) {
          console.error("Material ID mismatch:", {
            stockEntryMaterialId: stockEntry.materialId,
            submittedMaterialId: materialId
          });
          return res.status(400).json({ error: "Material ID does not match stock entry" });
        }
      }

      await assignment.update({
        sectionId: sectionId ? parseInt(sectionId) : assignment.sectionId,
        materialId: materialId ? parseInt(materialId) : assignment.materialId,
        stockEntryId: stockEntryId ? String(stockEntryId) : assignment.stockEntryId,
        assignedQuantity: assignedQuantity !== undefined ? Number(assignedQuantity) : assignment.assignedQuantity,
        assignedUnit: assignedUnit !== undefined ? String(assignedUnit) : assignment.assignedUnit,
        notes: notes !== undefined ? String(notes) : assignment.notes
      });

      const updatedAssignment = await Assignment.findByPk(id, {
        include: [
          { model: Section, as: "section" },
          { model: Material, as: "material" },
          { model: StockEntry, as: "stockEntry" }
        ]
      });

      console.log("Updated assignment:", JSON.stringify(updatedAssignment, null, 2));
      res.status(200).json(updatedAssignment);
    } catch (error) {
      console.error("Update assignment error:", error.message, error.stack);
      res.status(500).json({ error: "An unexpected error occurred" });
      next(error);
    }
  },

  deleteAssignments: async (req, res, next) => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      await assignment.destroy();
      res.status(204).send();
    } catch (error) {
      console.error("Delete assignment error:", error.message, error.stack);
      res.status(500).json({ error: "An unexpected error occurred" });
      next(error);
    }
  }
};

export default assignmentsController;
