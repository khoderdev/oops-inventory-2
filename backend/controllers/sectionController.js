import { Assignment, Material, MenuItem, Section, StockEntry } from "../models/index.js";
import calculateStockConversion from "../utils/conversions.js";

const sectionController = {
  // Get all sections with assignments
  getSectionsWithAssignments: async (req, res, next) => {
    try {
      const sections = await Section.findAll({
        include: [
          {
            model: Assignment,
            as: "assignments",
            include: [
              { model: Material, as: "material" },
              { model: StockEntry, as: "stockEntry" },
              { model: MenuItem, as: "menuItem" }
            ]
          }
        ]
      });

      const sectionsWithAssignments = sections.map(section => {
        const enrichedAssignments = section.assignments.map(assignment => {
          const assignmentData = {
            ...assignment.get(),
            stockEntry: assignment.stockEntry,
            material: assignment.material,
            menuItem: assignment.menuItem,
            section: section.get()
          };

          // Handle package unit conversion for stock entries
          if (assignment.stockEntry && assignment.material) {
            const material = assignment.material;
            const isPackageUnit = material.unitType === "package" && (assignment.assignedUnit === "box" || assignment.assignedUnit === "pack" || assignment.assignedUnit === "case");

            if (isPackageUnit && material.packageQuantity) {
              // Use actual individual quantity from stock entry if available, otherwise calculate
              const convertedQuantity = assignment.stockEntry?.purchasedIndividualQuantity || assignment.assignedQuantity * material.packageQuantity;

              console.log(`Backend package conversion for ${material.name}:`, {
                originalQuantity: assignment.assignedQuantity,
                originalUnit: assignment.assignedUnit,
                packageQuantity: material.packageQuantity,
                actualIndividualQuantity: assignment.stockEntry?.purchasedIndividualQuantity,
                convertedQuantity: convertedQuantity,
                baseUnit: material.baseUnit,
                usingActualQuantity: !!assignment.stockEntry?.purchasedIndividualQuantity
              });

              // Keep original assignment data but add conversion info
              assignmentData.originalQuantity = assignment.assignedQuantity;
              assignmentData.originalUnit = assignment.assignedUnit;
              assignmentData.convertedQuantity = convertedQuantity;
              assignmentData.convertedUnit = material.baseUnit;
              assignmentData.isPackageConverted = true;
            }
          }

          return assignmentData;
        });

        const totalValue = enrichedAssignments.reduce((sum, assignment) => {
          if (assignment.stockEntry && assignment.material) {
            const conversion = calculateStockConversion(assignment.stockEntry, assignment.material);
            const costPerAssignedUnit = conversion.costPerBaseUnit * conversion.conversionFactor;
            return sum + assignment.assignedQuantity * costPerAssignedUnit;
          }
          if (assignment.menuItem) {
            return sum + assignment.menuItem.price;
          }
          return sum;
        }, 0);

        return { ...section.get(), assignments: enrichedAssignments, totalValue };
      });

      res.json(sectionsWithAssignments);
    } catch (err) {
      next(err);
    }
  },

  // Create a new section
  createSection: async (req, res, next) => {
    try {
      const { name } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      // Validate name is not empty
      if (name.trim() === "") {
        return res.status(400).json({ error: "Name cannot be empty" });
      }

      const section = await Section.create(req.body);
      res.status(201).json(section);
    } catch (err) {
      next(err);
    }
  },

  // Update a section
  updateSection: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const section = await Section.findByPk(id);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }

      // Validate name if provided
      if (name !== undefined && name.trim() === "") {
        return res.status(400).json({ error: "Name cannot be empty" });
      }

      await section.update({
        name: name !== undefined ? name : section.name
      });

      res.status(200).json(section);
    } catch (err) {
      next(err);
    }
  },

  getAllSections: async (req, res, next) => {
    try {
      const sections = await Section.findAll();
      res.json(sections);
    } catch (err) {
      next(err);
    }
  },

  // Delete a section
  deleteSection: async (req, res, next) => {
    try {
      const { id } = req.params;
      const section = await Section.findByPk(id);

      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }

      await section.destroy();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};

export default sectionController;
