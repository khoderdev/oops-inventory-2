import sequelize from "../config/database.js";
import { Assignment, Material, MenuItem, MenuItemIngredient, Sale, StockEntry } from "../models/index.js";

const salesController = {
  // // Get all sales with associated menu items
  // getAllSales: async (req, res, next) => {
  //   try {
  //     const sales = await Sale.findAll({
  //       include: [
  //         {
  //           model: MenuItem,
  //           as: "menuItem",
  //           include: [
  //             {
  //               model: MenuItemIngredient,
  //               as: "menuItemIngredients",
  //               include: [{ model: Material, as: "material" }]
  //             }
  //           ]
  //         }
  //       ]
  //     });

  //     // Format response to match Sale interface
  //     const formattedSales = sales.map(sale => ({
  //       ...sale.get(),
  //       menuItem: {
  //         ...sale.menuItem.get(),
  //         ingredients: sale.menuItem.menuItemIngredients.map(ingredient => ({
  //           materialId: ingredient.materialId,
  //           quantity: ingredient.quantity,
  //           unit: ingredient.unit,
  //           cost: ingredient.cost
  //         }))
  //       }
  //     }));

  //     res.status(200).json(formattedSales);
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  // // Get sale by ID with associated menu item
  // getSalesById: async (req, res, next) => {
  //   try {
  //     const { id } = req.params;
  //     const sale = await Sale.findByPk(id, {
  //       include: [
  //         {
  //           model: MenuItem,
  //           as: "menuItem",
  //           include: [
  //             {
  //               model: MenuItemIngredient,
  //               as: "menuItemIngredients",
  //               include: [{ model: Material, as: "material" }]
  //             }
  //           ]
  //         }
  //       ]
  //     });

  //     if (!sale) {
  //       return res.status(404).json({ error: "Sale not found" });
  //     }

  //     const formattedSale = {
  //       ...sale.get(),
  //       menuItem: {
  //         ...sale.menuItem.get(),
  //         ingredients: sale.menuItem.menuItemIngredients.map(ingredient => ({
  //           materialId: ingredient.materialId,
  //           quantity: ingredient.quantity,
  //           unit: ingredient.unit,
  //           cost: ingredient.cost
  //         }))
  //       }
  //     };

  //     res.status(200).json(formattedSale);
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  getAllSales: async (req, res, next) => {
    try {
      const sales = await Sale.findAll();
      res.status(200).json(sales);
    } catch (error) {
      next(error);
    }
  },

  getSalesById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const sale = await Sale.findByPk(id);
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.status(200).json(sale);
    } catch (error) {
      next(error);
    }
  },

  // Create new sale
  createSales: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { saleDate, totalAmount, items, menuItems, sectionId, id, createdAt, updatedAt } = req.body;

      if (!saleDate || totalAmount === undefined) {
        await transaction.rollback();
        return res.status(400).json({ error: "Sale date and total amount are required" });
      }

      if (totalAmount < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Total amount cannot be negative" });
      }

      if (isNaN(Date.parse(saleDate))) {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid sale date" });
      }

      // Process individual items and update section assignments AND stock entries
      if (items && items.length > 0) {
        for (const item of items) {
          const assignment = await Assignment.findByPk(item.assignmentId, {
            include: [
              { model: Material, as: "material" },
              { model: StockEntry, as: "stockEntry" }
            ],
            transaction
          });

          if (!assignment) {
            await transaction.rollback();
            return res.status(400).json({ error: `Assignment ${item.assignmentId} not found` });
          }

          const material = assignment.material;
          const stockEntry = assignment.stockEntry;

          if (!stockEntry) {
            await transaction.rollback();
            return res.status(400).json({ error: `Stock entry not found for assignment ${item.assignmentId}` });
          }

          // Handle package unit conversion for inventory deduction
          let assignmentDeductionQuantity = item.quantity;
          let stockEntryDeductionQuantity = item.quantity;

          if (material && material.unitType === "package" && item.unit === material.baseUnit && (assignment.assignedUnit === "box" || assignment.assignedUnit === "pack" || assignment.assignedUnit === "case")) {
            // Convert base units back to package units for assignment deduction
            // e.g., selling 12 bottles should deduct 1 box from assignment
            assignmentDeductionQuantity = item.quantity / material.packageQuantity;

            // For stock entry, we need to convert based on the stock entry's purchased unit
            if (stockEntry.purchasedUnit === assignment.assignedUnit) {
              // Stock entry is in same unit as assignment (e.g., both in boxes)
              stockEntryDeductionQuantity = assignmentDeductionQuantity;
            } else if (stockEntry.purchasedUnit === material.baseUnit) {
              // Stock entry is in base units (e.g., bottles)
              stockEntryDeductionQuantity = item.quantity;
            } else {
              // Handle other unit conversions if needed
              stockEntryDeductionQuantity = item.quantity;
            }

            console.log(`Package unit sale conversion for ${material.name}:`, {
              soldQuantity: item.quantity,
              soldUnit: item.unit,
              packageQuantity: material.packageQuantity,
              assignmentDeductionQuantity: assignmentDeductionQuantity,
              stockEntryDeductionQuantity: stockEntryDeductionQuantity,
              assignmentUnit: assignment.assignedUnit,
              stockEntryUnit: stockEntry.purchasedUnit
            });
          }

          // Check if sufficient quantity is available in assignment
          if (assignment.assignedQuantity < assignmentDeductionQuantity) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Insufficient quantity in assignment for ${material?.name || "item"}. Available: ${assignment.assignedQuantity}, Requested: ${assignmentDeductionQuantity}`
            });
          }

          // Check if sufficient quantity is available in stock entry
          if (stockEntry.purchasedQuantity < stockEntryDeductionQuantity) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Insufficient quantity in stock entry for ${material?.name || "item"}. Available: ${stockEntry.purchasedQuantity}, Requested: ${stockEntryDeductionQuantity}`
            });
          }

          // Update assignment quantity
          await assignment.update(
            {
              assignedQuantity: assignment.assignedQuantity - assignmentDeductionQuantity
            },
            { transaction }
          );

          // Update stock entry quantity
          await stockEntry.update(
            {
              purchasedQuantity: stockEntry.purchasedQuantity - stockEntryDeductionQuantity
            },
            { transaction }
          );

          console.log(`Updated assignment ${assignment.id}: ${assignment.assignedQuantity + assignmentDeductionQuantity} -> ${assignment.assignedQuantity}`);
          console.log(`Updated stock entry ${stockEntry.id}: ${stockEntry.purchasedQuantity + stockEntryDeductionQuantity} -> ${stockEntry.purchasedQuantity}`);
        }
      }

      // Create the sale record
      const sale = await Sale.create(
        {
          id: id,
          saleDate: new Date(saleDate),
          totalAmount,
          sectionId,
          items: items || [],
          menuItems: menuItems || [], // Store menuItems as JSON
          createdAt: createdAt || new Date(),
          updatedAt: updatedAt || new Date()
        },
        { transaction }
      );

      await transaction.commit();
      return res.status(201).json(sale);
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Update sale
  updateSales: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { menuItemId, saleDate, totalAmount } = req.body;

      const sale = await Sale.findByPk(id, { transaction });
      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: "Sale not found" });
      }

      // Validate menuItemId if provided
      if (menuItemId !== undefined) {
        const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
        if (!menuItem) {
          await transaction.rollback();
          return res.status(404).json({ error: "Menu item not found" });
        }
      }

      // Validate totalAmount if provided
      if (totalAmount !== undefined && totalAmount < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Total amount cannot be negative" });
      }

      // Validate saleDate if provided
      if (saleDate !== undefined && isNaN(Date.parse(saleDate))) {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid sale date" });
      }

      // Update sale
      await sale.update(
        {
          menuItemId: menuItemId !== undefined ? menuItemId : sale.menuItemId,
          saleDate: saleDate !== undefined ? new Date(saleDate) : sale.saleDate,
          totalAmount: totalAmount !== undefined ? totalAmount : sale.totalAmount
        },
        { transaction }
      );

      // Fetch the updated sale with associated menu item
      const updatedSale = await Sale.findByPk(id, {
        include: [
          {
            model: MenuItem,
            as: "menuItem",
            include: [
              {
                model: MenuItemIngredient,
                as: "menuItemIngredients",
                include: [{ model: Material, as: "material" }]
              }
            ]
          }
        ],
        transaction
      });

      // Format response to match Sale interface
      const formattedSale = {
        ...updatedSale.get(),
        menuItem: {
          ...updatedSale.menuItem.get(),
          ingredients: updatedSale.menuItem.menuItemIngredients.map(ingredient => ({
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost
          }))
        }
      };

      await transaction.commit();
      res.status(200).json(formattedSale);
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Delete sale
  deleteSales: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const sale = await Sale.findByPk(id, { transaction });

      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: "Sale not found" });
      }

      // Delete sale
      await sale.destroy({ transaction });

      await transaction.commit();
      res.status(204).send();
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
};

export default salesController;
