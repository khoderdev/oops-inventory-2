import { Material, StockEntry, Category } from "../models/index.js";
import conversions from "../utils/conversions.js";
import { Op } from "sequelize";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions, parseFieldSelection } from "../utils/paginationHelpers.js";
import { isValidCategory, getMaterialCategories } from "../utils/categoryHelpers.js";
import sequelize from "../config/database.js";

const materialController = {
  // Get all materials with stock information (with pagination and filtering)
  getMaterialsWithStock: async (req, res, next) => {
    try {
      const { includeStockEntries = "true", fields = "" } = req.query;

      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 10000, // Increased default to load all materials
        maxLimit: 50000, // Increased max limit to handle large datasets
        allowedSortFields: ["name", "categoryId", "unitType", "createdAt", "updatedAt", "baseUnit"]
      });

      // Build filter conditions
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: ["name"],
          exactFilters: ["categoryId", "unitType"]
        },
        Op
      );

      // Parse field selection for optimized transfer
      const selectedFields = parseFieldSelection(fields, ["id", "name", "baseUnit", "unitType", "inputUnit", "packageQuantity", "volumePerUnit", "volumeUnit", "categoryId", "costPerBaseUnit", "createdAt", "updatedAt"]);

      // Base query options
      const queryOptions = {
        where: whereClause,
        order: [[paginationParams.sortBy, paginationParams.sortOrder]],
        limit: paginationParams.limit,
        offset: paginationParams.offset,
        distinct: true,
        attributes: selectedFields
      };

      // Always include category information
      queryOptions.include = [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "value"],
          required: false
        }
      ];

      // Conditionally include stock entries based on query parameter
      if (includeStockEntries === "true") {
        queryOptions.include.push({
          model: StockEntry,
          as: "stockEntries",
          required: false,
          attributes: ["id", "purchasedQuantity", "purchasedUnit", "purchasedConvertedQuantity", "purchasedConvertedUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "expiryDate", "purchaseDate", "createdAt"]
        });
      }

      const { count, rows: materials } = await Material.findAndCountAll(queryOptions);

      // Process materials with stock calculations
      const materialsWithStock = materials.map(material => {
        const materialData = material.get();
        const stockEntries = materialData.stockEntries || [];
        let totalQuantityInBaseUnit = 0;
        let totalValue = 0;

        if (stockEntries.length > 0) {
          stockEntries.forEach(entry => {
            const conversion = conversions.calculateStockConversion(entry, materialData);
            totalQuantityInBaseUnit += conversion.convertedQuantity;
            totalValue += conversion.totalCostInBaseUnit;
          });
        }

        const averageCostPerBaseUnit = totalQuantityInBaseUnit > 0 ? totalValue / totalQuantityInBaseUnit : 0;

        const result = {
          ...materialData,
          totalQuantityInBaseUnit,
          totalValue,
          averageCostPerBaseUnit,
          availableQuantity: totalQuantityInBaseUnit,
          // Flatten category data for frontend compatibility
          category: materialData.category?.value || null,
          categoryName: materialData.category?.name || null
        };

        // Only include stock entries if requested
        if (includeStockEntries !== "true") {
          delete result.stockEntries;
        }

        return result;
      });

      const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);

      res.json({
        data: materialsWithStock,
        pagination,
        filters: {
          search: req.query.search || "",
          category: req.query.category || "",
          unitType: req.query.unitType || "",
          sortBy: paginationParams.sortBy,
          sortOrder: paginationParams.sortOrder,
          includeStockEntries,
          fields
        },
        meta: {
          requestTime: new Date().toISOString(),
          totalDataSize: materialsWithStock.length
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Get all materials without stock information (with pagination and filtering)
  getAllMaterials: async (req, res, next) => {
    try {
      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 10000, // Increased default to load all materials
        maxLimit: 50000, // Increased max limit to handle large datasets
        allowedSortFields: ["name", "category", "unitType", "baseUnit", "createdAt", "updatedAt"]
      });

      // Build filter conditions
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: ["name"],
          exactFilters: ["category", "unitType"],
          rangeFilters: ["createdAt", "updatedAt"]
        },
        Op
      );

      // Parse field selection for optimized data transfer
      const selectedFields = parseFieldSelection(req.query.fields, ["id", "name", "baseUnit", "unitType", "inputUnit", "packageQuantity", "volumePerUnit", "volumeUnit", "category", "createdAt", "updatedAt"]);

      const queryOptions = {
        where: whereClause,
        order: [[paginationParams.sortBy, paginationParams.sortOrder]],
        limit: paginationParams.limit,
        offset: paginationParams.offset,
        attributes: selectedFields
      };

      const { count, rows: materials } = await Material.findAndCountAll(queryOptions);

      const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);

      res.status(200).json({
        data: materials,
        pagination,
        filters: {
          search: req.query.search || "",
          category: req.query.category || "",
          unitType: req.query.unitType || "",
          sortBy: paginationParams.sortBy,
          sortOrder: paginationParams.sortOrder,
          fields: req.query.fields || ""
        },
        meta: {
          requestTime: new Date().toISOString(),
          totalDataSize: materials.length
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Get a single material by ID
  getMaterial: async (req, res, next) => {
    try {
      const { id } = req.params;

      const material = await Material.findByPk(id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "value"]
          }
        ]
      });

      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Format response to match frontend expectations
      const materialData = {
        id: material.id,
        name: material.name,
        baseUnit: material.baseUnit,
        unitType: material.unitType,
        inputUnit: material.inputUnit,
        packageQuantity: material.packageQuantity,
        volumePerUnit: material.volumePerUnit,
        volumeUnit: material.volumeUnit,
        categoryId: material.categoryId,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
        // Include category information
        category: material.category?.value || null,
        categoryName: material.category?.name || null
      };

      res.status(200).json(materialData);
    } catch (err) {
      next(err);
    }
  },

  // Create a new material
  createMaterial: async (req, res, next) => {
    try {
      const { name, baseUnit, unitType, inputUnit, packageQuantity, volumePerBottle, volumeUnit, category, categoryId } = req.body;

      // Handle both category (value) and categoryId for backwards compatibility
      let finalCategoryId = categoryId;
      if (category && !categoryId) {
        // If category value is provided, find the corresponding categoryId
        const categoryRecord = await Category.findOne({
          where: { value: category, isActive: true }
        });
        if (categoryRecord) {
          finalCategoryId = categoryRecord.id;
        }
      }

      // Validate required fields
      if (!name || !baseUnit || !unitType) {
        return res.status(400).json({ error: "Name, baseUnit, unitType are required" });
      }

      // Validate baseUnit is not empty
      if (baseUnit.trim() === "") {
        return res.status(400).json({ error: "Base unit cannot be empty" });
      }

      // Validate categoryId if provided
      if (finalCategoryId) {
        const categoryExists = await Category.findOne({
          where: {
            id: finalCategoryId,
            isActive: true
          }
        });
        if (!categoryExists) {
          return res.status(400).json({
            error: `Invalid category ID: ${finalCategoryId}. Please use a valid category ID.`
          });
        }
      }

      // Validate package-specific fields
      if (unitType === "package") {
        if (!packageQuantity || packageQuantity < 1) {
          return res.status(400).json({ error: "Package quantity must be at least 1 for package materials" });
        }
        if (!inputUnit || inputUnit.trim() === "") {
          return res.status(400).json({ error: "Input unit is required for package materials" });
        }
      }

      const materialData = {
        name,
        baseUnit,
        unitType,
        inputUnit,
        packageQuantity: unitType === "package" ? packageQuantity : null,
        volumePerUnit: volumePerBottle || null,
        volumeUnit: volumeUnit || null,
        categoryId: finalCategoryId
      };

      const material = await Material.create(materialData);
      res.status(201).json(material);
    } catch (err) {
      next(err);
    }
  },

  // Update a material
  updateMaterial: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, baseUnit, unitType, inputUnit, packageQuantity, volumePerBottle, volumeUnit, category, categoryId } = req.body;

      // Handle both category (value) and categoryId for backwards compatibility
      let finalCategoryId = categoryId;
      if (category && !categoryId) {
        // If category value is provided, find the corresponding categoryId
        const categoryRecord = await Category.findOne({
          where: { value: category, isActive: true }
        });
        if (categoryRecord) {
          finalCategoryId = categoryRecord.id;
        }
      }

      const material = await Material.findByPk(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Validate baseUnit if provided
      if (baseUnit !== undefined && baseUnit.trim() === "") {
        return res.status(400).json({ error: "Base unit cannot be empty" });
      }

      // Validate categoryId if provided
      if (finalCategoryId !== undefined && finalCategoryId) {
        const categoryExists = await Category.findOne({
          where: {
            id: finalCategoryId,
            isActive: true
          }
        });
        if (!categoryExists) {
          return res.status(400).json({
            error: `Invalid category ID: ${finalCategoryId}. Please use a valid category ID.`
          });
        }
      }

      // Validate package-specific fields if unitType is being changed to package
      const newUnitType = unitType !== undefined ? unitType : material.unitType;
      if (newUnitType === "package") {
        const newPackageQuantity = packageQuantity !== undefined ? packageQuantity : material.packageQuantity;
        const newInputUnit = inputUnit !== undefined ? inputUnit : material.inputUnit;

        if (!newPackageQuantity || newPackageQuantity < 1) {
          return res.status(400).json({ error: "Package quantity must be at least 1 for package materials" });
        }
        if (!newInputUnit || newInputUnit.trim() === "") {
          return res.status(400).json({ error: "Input unit is required for package materials" });
        }
      }

      await material.update({
        name: name !== undefined ? name : material.name,
        baseUnit: baseUnit !== undefined ? baseUnit : material.baseUnit,
        unitType: unitType !== undefined ? unitType : material.unitType,
        inputUnit: inputUnit !== undefined ? inputUnit : material.inputUnit,
        packageQuantity: packageQuantity !== undefined ? packageQuantity : material.packageQuantity,
        volumePerUnit: volumePerBottle !== undefined ? volumePerBottle : material.volumePerUnit,
        volumeUnit: volumeUnit !== undefined ? volumeUnit : material.volumeUnit,
        categoryId: finalCategoryId !== undefined ? finalCategoryId : material.categoryId
      });

      res.status(200).json(material);
    } catch (err) {
      next(err);
    }
  },

  // Delete a material
  deleteMaterial: async (req, res, next) => {
    try {
      const { id } = req.params;
      const material = await Material.findByPk(id);

      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      await material.destroy();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // Get available material categories
  getMaterialCategories: async (req, res, next) => {
    try {
      const categories = await getMaterialCategories();
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (err) {
      next(err);
    }
  },

  // Bulk delete materials
  bulkDeleteMaterial: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: "Invalid request format" });
      }

      // Convert string IDs to numbers and filter out any invalid values
      const materialIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);

      if (materialIds.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: "No valid material IDs provided" });
      }

      // Check if materials exist
      const materials = await Material.findAll({
        where: { id: materialIds },
        transaction: t
      });

      if (materials.length !== materialIds.length) {
        const foundIds = materials.map(m => m.id);
        const missingIds = materialIds.filter(id => !foundIds.includes(id));
        console.warn(`Some materials not found: ${missingIds.join(", ")}`);
      }

      if (materials.length === 0) {
        await t.rollback();
        return res.status(404).json({ error: "No valid materials found to delete" });
      }

      // Delete the materials
      await Material.destroy({
        where: { id: materialIds },
        transaction: t
      });

      // Commit the transaction
      await t.commit();

      // Let the route handler send the response and clear cache
      next();
    } catch (err) {
      await t.rollback();
      console.error("Error in bulkDeleteMaterial:", err);
      next(err);
    }
  },
  // bulkDeleteMaterial: async (req, res, next) => {
  //   try {
  //     const { ids } = req.body;
  //     if (!ids || !Array.isArray(ids) || ids.length === 0) {
  //       return res.status(400).json({ error: "Invalid request format" });
  //     }

  //     // Convert all IDs to numbers for consistent comparison
  //     const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

  //     // Find which IDs actually exist
  //     const existingMaterials = await Material.findAll({
  //       where: {
  //         id: numericIds
  //       }
  //     });

  //     const existingIds = existingMaterials.map(material => material.id);

  //     // Delete only the existing ones
  //     if (existingIds.length > 0) {
  //       await Material.destroy({ where: { id: existingIds } });
  //     }

  //     // Clear materials cache after deletion
  //     import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
  //       clearCacheByPattern("materials");
  //     });

  //     // Return success with details
  //     res.status(200).json({
  //       message: "Bulk delete completed",
  //       deletedCount: existingIds.length,
  //       notFoundIds: numericIds.filter(id => !existingIds.includes(id))
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // },

  // Bulk update materials categories
  bulkUpdateMaterialCategories: async (req, res, next) => {
    try {
      const { ids, categoryId } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !categoryId) {
        return res.status(400).json({ error: "Invalid request format" });
      }
      const materials = await Material.findAll({ where: { id: ids } });
      if (materials.length === 0) {
        return res.status(404).json({ error: "Materials not found" });
      }
      await Material.update({ categoryId }, { where: { id: ids } });
      // Clear materials cache after update
      import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
        clearCacheByPattern("materials");
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};

export default materialController;
