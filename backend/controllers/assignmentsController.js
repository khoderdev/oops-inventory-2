import Assignment from "../models/Assignment.js";

const assignmentsController = {
  // Get all assignments
  getAllAssignments: async (req, res, next) => {
    try {
      const assignments = await Assignment.findAll({
        include: ["Section", "Material", "StockEntry"]
      });
      res.status(200).json(assignments);
    } catch (error) {
      next(error);
    }
  },

  // Get assignment by ID
  getAssignmentById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id, {
        include: ["Section", "Material", "StockEntry"]
      });

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      res.status(200).json(assignment);
    } catch (error) {
      next(error);
    }
  },

  // Create new assignment
  createAssignments: async (req, res, next) => {
    try {
      const { sectionId, materialId, stockEntryId, assignedQuantity } = req.body;

      // Validate required fields
      if (!sectionId || !materialId || !stockEntryId || !assignedQuantity) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Validate assignedQuantity is positive
      if (assignedQuantity <= 0) {
        return res.status(400).json({ error: "Assigned quantity must be positive" });
      }

      const assignment = await Assignment.create({
        sectionId,
        materialId,
        stockEntryId,
        assignedQuantity
      });

      // Fetch the created assignment with associations
      const createdAssignment = await Assignment.findByPk(assignment.id, {
        include: ["Section", "Material", "StockEntry"]
      });

      res.status(201).json(createdAssignment);
    } catch (error) {
      next(error);
    }
  },

  // Update assignment
  updateAssignments: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { sectionId, materialId, stockEntryId, assignedQuantity } = req.body;

      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Validate assignedQuantity if provided
      if (assignedQuantity !== undefined && assignedQuantity <= 0) {
        return res.status(400).json({ error: "Assigned quantity must be positive" });
      }

      await assignment.update({
        sectionId: sectionId || assignment.sectionId,
        materialId: materialId || assignment.materialId,
        stockEntryId: stockEntryId || assignment.stockEntryId,
        assignedQuantity: assignedQuantity !== undefined ? assignedQuantity : assignment.assignedQuantity
      });

      // Fetch the updated assignment with associations
      const updatedAssignment = await Assignment.findByPk(id, {
        include: ["Section", "Material", "StockEntry"]
      });

      res.status(200).json(updatedAssignment);
    } catch (error) {
      next(error);
    }
  },

  // Delete assignment
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
      nextIBL;
    }
  }
};

export default assignmentsController;
