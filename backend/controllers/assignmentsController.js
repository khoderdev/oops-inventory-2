import { Assignment, Material, Section, StockEntry } from "../models/index.js";

const assignmentsController = {
  getAllAssignments: async (req, res, next) => {
    try {
      const assignments = await Assignment.findAll({
        include: [
          { model: Section, as: "Section" },
          { model: Material, as: "material" },
          { model: StockEntry, as: "StockEntry" }
        ]
      });
      res.status(200).json(assignments);
    } catch (error) {
      next(error);
    }
  },

  getAssignmentById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id, {
        include: [
          { model: Section, as: "Section" },
          { model: Material, as: "material" },
          { model: StockEntry, as: "StockEntry" }
        ]
      });

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      res.status(200).json(assignment);
    } catch (error) {
      next(error);
    }
  },

  createAssignments: async (req, res, next) => {
    try {
      const { sectionId, materialId, stockEntryId, assignedQuantity } = req.body;

      if (!sectionId || !materialId || !stockEntryId || !assignedQuantity) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (assignedQuantity <= 0) {
        return res.status(400).json({ error: "Assigned quantity must be positive" });
      }

      const assignment = await Assignment.create({ sectionId, materialId, stockEntryId, assignedQuantity });

      const createdAssignment = await Assignment.findByPk(assignment.id, {
        include: [
          { model: Section, as: "Section" },
          { model: Material, as: "material" },
          { model: StockEntry, as: "StockEntry" }
        ]
      });

      res.status(201).json(createdAssignment);
    } catch (error) {
      next(error);
    }
  },

  updateAssignments: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { sectionId, materialId, stockEntryId, assignedQuantity } = req.body;

      const assignment = await Assignment.findByPk(id);
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });

      if (assignedQuantity !== undefined && assignedQuantity <= 0) {
        return res.status(400).json({ error: "Assigned quantity must be positive" });
      }

      await assignment.update({
        sectionId: sectionId || assignment.sectionId,
        materialId: materialId || assignment.materialId,
        stockEntryId: stockEntryId || assignment.stockEntryId,
        assignedQuantity: assignedQuantity !== undefined ? assignedQuantity : assignment.assignedQuantity
      });

      const updatedAssignment = await Assignment.findByPk(id, {
        include: [
          { model: Section, as: "Section" },
          { model: Material, as: "material" },
          { model: StockEntry, as: "StockEntry" }
        ]
      });

      res.status(200).json(updatedAssignment);
    } catch (error) {
      next(error);
    }
  },

  deleteAssignments: async (req, res, next) => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id);
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });

      await assignment.destroy();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};

export default assignmentsController;
