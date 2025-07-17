import sequelize from "../config/database.js";
import { Material, MenuItem, MenuItemIngredient, Sale } from "../models/index.js";

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
  // createSales: async (req, res, next) => {
  //   const transaction = await sequelize.transaction();
  //   try {
  //     const { menuItemId, saleDate, totalAmount, items, sectionId, id, createdAt, updatedAt } = req.body;

  //     if (!saleDate || totalAmount === undefined) {
  //       await transaction.rollback();
  //       return res.status(400).json({ error: "Sale date and total amount are required" });
  //     }

  //     if (totalAmount < 0) {
  //       await transaction.rollback();
  //       return res.status(400).json({ error: "Total amount cannot be negative" });
  //     }

  //     if (isNaN(Date.parse(saleDate))) {
  //       await transaction.rollback();
  //       return res.status(400).json({ error: "Invalid sale date" });
  //     }

  //     if (menuItemId) {
  //       const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
  //       if (!menuItem) {
  //         await transaction.rollback();
  //         return res.status(404).json({ error: "Menu item not found" });
  //       }

  //       const sale = await Sale.create(
  //         {
  //           menuItemId,
  //           saleDate: new Date(saleDate),
  //           totalAmount,
  //           sectionId,
  //           createdAt,
  //           updatedAt
  //         },
  //         { transaction }
  //       );

  //       const createdSale = await Sale.findByPk(sale.id, {
  //         include: [
  //           {
  //             model: MenuItem,
  //             as: "menuItem",
  //             include: [
  //               {
  //                 model: MenuItemIngredient,
  //                 as: "menuItemIngredients",
  //                 include: [{ model: Material, as: "material" }]
  //               }
  //             ]
  //           }
  //         ],
  //         transaction
  //       });

  //       const formattedSale = {
  //         ...createdSale.get(),
  //         menuItem: {
  //           ...createdSale.menuItem.get(),
  //           ingredients: createdSale.menuItem.menuItemIngredients.map(ingredient => ({
  //             materialId: ingredient.materialId,
  //             quantity: ingredient.quantity,
  //             unit: ingredient.unit,
  //             cost: ingredient.cost
  //           }))
  //         }
  //       };

  //       await transaction.commit();
  //       return res.status(201).json(formattedSale);
  //     }

  //     // === CASE 2: DIRECT MATERIAL SALE ===
  //     if (Array.isArray(items) && items.length > 0) {
  //       const sale = await Sale.create(
  //         {
  //           saleDate: new Date(saleDate),
  //           totalAmount,
  //           sectionId,
  //           createdAt,
  //           updatedAt,
  //           items // store as JSON or separate model if normalized
  //         },
  //         { transaction }
  //       );

  //       await transaction.commit();
  //       return res.status(201).json(sale); // plain sale record
  //     }

  //     await transaction.rollback();
  //     return;
  //   } catch (error) {
  //     await transaction.rollback();
  //     next(error);
  //   }
  // },

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
