import { Op } from "sequelize";
import { Material, StockEntry, Category } from "../models/index.js";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions, parseFieldSelection } from "../utils/paginationHelpers.js";

const beverageStockController = {
  getBeverageStockEntries: async (req, res, next) => {
    try {
      const { includeMaterial = "true", fields = "" } = req.query;
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 1000,
        maxLimit: 5000,
        allowedSortFields: ["id", "supplier", "purchaseDate", "expiryDate", "totalCost", "createdAt", "updatedAt"]
      });
      // Build filter conditions
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: ["supplier"],
          exactFilters: ["materialId", "isPOSItem"],
          rangeFilters: ["purchaseDate", "expiryDate", "totalCost", "createdAt"]
        },
        Op
      );

      // Parse field selection for optimized transfer
      const selectedFields = parseFieldSelection(fields, ["id", "materialId", "supplier", "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "expiryDate", "isPOSItem", "printerId", "notes", "createdAt", "updatedAt"]);

      // Base query options
      const queryOptions = {
        where: whereClause,
        order: [[paginationParams.sortBy, paginationParams.sortOrder]],
        limit: paginationParams.limit,
        offset: paginationParams.offset,
        distinct: true,
        attributes: selectedFields
      };

      // Include material data with category for filtering
      queryOptions.include = [
        {
          model: Material,
          as: "material",
          attributes: ["id", "name", "baseUnit", "unitType", "inputUnit", "packageQuantity", "categoryId"],
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "value", "type"],
              where: {
                type: "materials",
                value: {
                  [Op.in]: ["beverages", "cold", "hot", "drinks", "alcohol", "shisha"]
                }
              },
              required: true
            }
          ],
          required: true
        }
      ];

      const { count, rows: stockEntries } = await StockEntry.findAndCountAll(queryOptions);

      // Build pagination response
      const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);

      res.status(200).json({
        data: stockEntries,
        pagination,
        filters: {
          search: req.query.search || "",
          materialId: req.query.materialId || "",
          isPOSItem: req.query.isPOSItem || "",
          purchaseDate_from: req.query.purchaseDate_from || "",
          purchaseDate_to: req.query.purchaseDate_to || "",
          expiryDate_from: req.query.expiryDate_from || "",
          expiryDate_to: req.query.expiryDate_to || "",
          totalCost_from: req.query.totalCost_from || "",
          totalCost_to: req.query.totalCost_to || "",
          sortBy: paginationParams.sortBy,
          sortOrder: paginationParams.sortOrder,
          includeMaterial,
          fields
        },
        meta: {
          requestTime: new Date().toISOString(),
          totalDataSize: stockEntries.length,
          categories: ["beverages", "cold", "hot", "drinks", "alcohol", "shisha"]
        }
      });
    } catch (error) {
      console.error("Error fetching beverage stock entries:", error);
      next(error);
    }
  },

  // Get beverage stock entry by ID
  getBeverageStockEntryById: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "Invalid stock entry ID" });
      }

      const stockEntry = await StockEntry.findByPk(id, {
        include: {
          model: Material,
          as: "material",
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "value", "type"],
              where: {
                type: "materials",
                value: {
                  [Op.in]: ["beverages", "cold", "hot", "drinks", "alcohol", "shisha"]
                }
              },
              required: true
            }
          ],
          required: true
        }
      });

      if (!stockEntry) {
        return res.status(404).json({ error: "Beverage stock entry not found" });
      }

      res.status(200).json(stockEntry);
    } catch (error) {
      console.error("Error fetching beverage stock entry by ID:", error);
      next(error);
    }
  },

  // Get unique beverage names from stock entries
  getUniqueBeverageNames: async (req, res, next) => {
    try {
      const stockEntries = await StockEntry.findAll({
        include: {
          model: Material,
          as: "material",
          attributes: ["id", "name"],
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "value", "type"],
              where: {
                type: "materials",
                value: {
                  [Op.in]: ["beverages", "cold", "hot", "drinks", "alcohol", "shisha"]
                }
              },
              required: true
            }
          ],
          required: true
        },
        attributes: []
      });

      // Extract unique material names
      const uniqueNames = new Set();
      stockEntries.forEach(entry => {
        if (entry.material?.name) {
          uniqueNames.add(entry.material.name);
        }
      });

      const beverageNames = Array.from(uniqueNames).sort();

      res.status(200).json({
        data: beverageNames,
        count: beverageNames.length,
        meta: {
          requestTime: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching unique beverage names:", error);
      next(error);
    }
  }
};

export default beverageStockController;
