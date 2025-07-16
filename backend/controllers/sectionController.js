import Assignment from "../models/Assignment.js";
import Material from "../models/materials.js";
import Section from "../models/sections.js";
import StockEntry from "../models/StockEntry.js";
import calculateStockConversion from "../utils/conversions.js";

export const getSectionsWithAssignments = async (req, res, next) => {
  try {
    const sections = await Section.findAll({
      include: [
        {
          model: Assignment,
          as: "assignments",
          include: [
            { model: Material, as: "material" },
            { model: StockEntry, as: "stockEntry" }
          ]
        }
      ]
    });

    const sectionsWithAssignments = sections.map(section => {
      const enrichedAssignments = section.assignments.map(assignment => {
        const conversion = calculateStockConversion(assignment.stockEntry, assignment.material);
        return { ...assignment.get(), stockEntry: assignment.stockEntry, material: assignment.material };
      });

      const totalValue = enrichedAssignments.reduce((sum, assignment) => {
        if (!assignment.stockEntry || !assignment.material) return sum;
        const conversion = calculateStockConversion(assignment.stockEntry, assignment.material);
        const costPerAssignedUnit = conversion.costPerBaseUnit * conversion.conversionFactor;
        return sum + assignment.assignedQuantity * costPerAssignedUnit;
      }, 0);

      return { ...section.get(), assignments: enrichedAssignments, totalValue };
    });

    res.json(sectionsWithAssignments);
  } catch (err) {
    next(err);
  }
};

export const createSection = async (req, res, next) => {
  try {
    const section = await Section.create(req.body);
    res.status(201).json(section);
  } catch (err) {
    next(err);
  }
};

export default {
  getSectionsWithAssignments,
  createSection
};
