import express from "express";
import { Op } from "sequelize";
import { StockEntryAuditHelperSimple } from "../decorators/stockEntryAuditDecoratorSimple.js";
import { StockEntryLogSimple } from "../models/index.js";

const router = express.Router();

/**
 * Stock Entry Logs API Routes
 *
 * Comprehensive API for querying and retrieving stock entry logs
 * with filtering, pagination, and reporting capabilities.
 */

// ============================================================================
// GET /api/logs/stock-entries - Get all stock entry logs with filtering
// ============================================================================
router.get("/stock-entries", async (req, res) => {
  try {
    const { page = 1, limit = 50, stockEntryId, materialId, userId, actionType, status, startDate, endDate, materialName, userName, sortBy = "actionTimestamp", sortOrder = "DESC" } = req.query;

    // Build where clause
    const whereClause = {};

    if (stockEntryId) {
      whereClause.stockEntryId = stockEntryId;
    }

    if (materialId) {
      whereClause.materialId = materialId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (actionType) {
      if (Array.isArray(actionType)) {
        whereClause.actionType = { [Op.in]: actionType };
      } else {
        whereClause.actionType = actionType;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.actionTimestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.actionTimestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.actionTimestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    if (materialName) {
      whereClause.materialName = {
        [Op.iLike]: `%${materialName}%`
      };
    }

    if (userName) {
      whereClause.userName = {
        [Op.iLike]: `%${userName}%`
      };
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Execute query
    const { count, rows: logs } = await StockEntryLogSimple.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({ success: true, data: { logs, pagination: { currentPage: parseInt(page), totalPages, totalRecords: count, recordsPerPage: parseInt(limit), hasNextPage, hasPrevPage }, filters: { stockEntryId, materialId, userId, actionType, status, startDate, endDate, materialName, userName }, sorting: { sortBy, sortOrder } }, message: `Retrieved ${logs.length} log entries` });
  } catch (error) {
    console.error("Error fetching stock entry logs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stock entry logs", details: error.message });
  }
});

// ============================================================================
// GET /api/logs/stock-entries/:stockEntryId - Get logs for specific stock entry
// ============================================================================
router.get("/stock-entries/:stockEntryId", async (req, res) => {
  try {
    const { stockEntryId } = req.params;
    const { limit = 100, actionTypes, startDate, endDate } = req.query;

    const options = {
      limit: parseInt(limit)
    };

    if (actionTypes) {
      options.actionTypes = Array.isArray(actionTypes) ? actionTypes : [actionTypes];
    }

    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    const history = await StockEntryAuditHelperSimple.getHistory(stockEntryId, options);

    // Calculate summary statistics
    const summary = {
      totalActions: history.length,
      actionBreakdown: {},
      totalQuantityChange: 0,
      totalCostChange: 0,
      successfulActions: 0,
      failedActions: 0
    };

    history.forEach(log => {
      // Action breakdown
      summary.actionBreakdown[log.actionType] = (summary.actionBreakdown[log.actionType] || 0) + 1;

      // Totals
      summary.totalQuantityChange += parseFloat(log.quantityDelta) || 0;
      summary.totalCostChange += parseFloat(log.costDelta) || 0;

      // Status counts
      if (log.status === "success") {
        summary.successfulActions++;
      } else {
        summary.failedActions++;
      }
    });

    res.json({
      success: true,
      data: {
        stockEntryId: parseInt(stockEntryId),
        history,
        summary,
        filters: options
      },
      message: `Retrieved ${history.length} log entries for stock entry ${stockEntryId}`
    });
  } catch (error) {
    console.error("Error fetching stock entry history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stock entry history",
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/logs/materials/:materialId - Get logs for specific material
// ============================================================================
router.get("/materials/:materialId", async (req, res) => {
  try {
    const { materialId } = req.params;
    const { limit = 200, actionTypes, startDate, endDate } = req.query;

    const options = {
      limit: parseInt(limit)
    };

    if (actionTypes) {
      options.actionTypes = Array.isArray(actionTypes) ? actionTypes : [actionTypes];
    }

    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    const activity = await StockEntryAuditHelperSimple.getMaterialHistory(materialId, options);

    // Calculate material-specific analytics
    const analytics = {
      totalActivities: activity.length,
      uniqueStockEntries: [...new Set(activity.map(log => log.stockEntryId))].length,
      actionBreakdown: {},
      totalQuantityChange: 0,
      totalCostChange: 0,
      timeRange: {
        earliest: activity.length > 0 ? activity[activity.length - 1].actionTimestamp : null,
        latest: activity.length > 0 ? activity[0].actionTimestamp : null
      }
    };

    activity.forEach(log => {
      analytics.actionBreakdown[log.actionType] = (analytics.actionBreakdown[log.actionType] || 0) + 1;
      analytics.totalQuantityChange += parseFloat(log.quantityDelta) || 0;
      analytics.totalCostChange += parseFloat(log.costDelta) || 0;
    });

    res.json({
      success: true,
      data: {
        materialId: parseInt(materialId),
        activity,
        analytics,
        filters: options
      },
      message: `Retrieved ${activity.length} activity entries for material ${materialId}`
    });
  } catch (error) {
    console.error("Error fetching material activity:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch material activity",
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/logs/users/:userId - Get logs for specific user
// ============================================================================
router.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 150, startDate, endDate } = req.query;

    const options = {
      limit: parseInt(limit)
    };

    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    const activity = await StockEntryAuditHelperSimple.getUserActivity(userId, options);

    // Calculate user activity analytics
    const analytics = {
      totalActivities: activity.length,
      uniqueMaterials: [...new Set(activity.map(log => log.materialName))].length,
      actionBreakdown: {},
      successRate: 0,
      timeRange: {
        earliest: activity.length > 0 ? activity[activity.length - 1].actionTimestamp : null,
        latest: activity.length > 0 ? activity[0].actionTimestamp : null
      }
    };

    let successCount = 0;
    activity.forEach(log => {
      analytics.actionBreakdown[log.actionType] = (analytics.actionBreakdown[log.actionType] || 0) + 1;
      if (log.status === "success") {
        successCount++;
      }
    });

    analytics.successRate = activity.length > 0 ? ((successCount / activity.length) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        userId: parseInt(userId),
        activity,
        analytics,
        filters: options
      },
      message: `Retrieved ${activity.length} activity entries for user ${userId}`
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user activity",
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/logs/summary - Get overall logging summary and statistics
// ============================================================================
router.get("/summary", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "actionType" } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.actionTimestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateFilter.actionTimestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateFilter.actionTimestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Get overall counts
    const totalLogs = await StockEntryLogSimple.count({ where: dateFilter });
    const successfulLogs = await StockEntryLogSimple.count({
      where: { ...dateFilter, status: "success" }
    });
    const failedLogs = await StockEntryLogSimple.count({
      where: { ...dateFilter, status: "failure" }
    });

    // Get action breakdown
    const actionBreakdown = await StockEntryLogSimple.findAll({
      where: dateFilter,
      attributes: ["actionType", [StockEntryLogSimple.sequelize.fn("COUNT", StockEntryLogSimple.sequelize.col("id")), "count"], [StockEntryLogSimple.sequelize.fn("SUM", StockEntryLogSimple.sequelize.col("quantityDelta")), "totalQuantityChange"], [StockEntryLogSimple.sequelize.fn("SUM", StockEntryLogSimple.sequelize.col("costDelta")), "totalCostChange"]],
      group: ["actionType"],
      order: [[StockEntryLogSimple.sequelize.fn("COUNT", StockEntryLogSimple.sequelize.col("id")), "DESC"]]
    });

    // Get recent activity
    const recentActivity = await StockEntryLogSimple.findAll({
      where: dateFilter,
      order: [["actionTimestamp", "DESC"]],
      limit: 10,
      attributes: ["id", "actionType", "materialName", "userName", "actionTimestamp", "status", "quantityDelta", "costDelta"]
    });

    // Get top active users
    const topUsers = await StockEntryLogSimple.findAll({
      where: { ...dateFilter, userId: { [Op.not]: null } },
      attributes: ["userId", "userName", [StockEntryLogSimple.sequelize.fn("COUNT", StockEntryLogSimple.sequelize.col("id")), "activityCount"]],
      group: ["userId", "userName"],
      order: [[StockEntryLogSimple.sequelize.fn("COUNT", StockEntryLogSimple.sequelize.col("id")), "DESC"]],
      limit: 10
    });

    // Get top materials
    const topMaterials = await StockEntryLogSimple.findAll({
      where: dateFilter,
      attributes: ["materialId", "materialName", [StockEntryLogSimple.sequelize.fn("COUNT", StockEntryLogSimple.sequelize.col("id")), "activityCount"]],
      group: ["materialId", "materialName"],
      order: [[StockEntryLogSimple.sequelize.fn("COUNT", StockEntryLogSimple.sequelize.col("id")), "DESC"]],
      limit: 10
    });

    // Calculate success rate
    const successRate = totalLogs > 0 ? ((successfulLogs / totalLogs) * 100).toFixed(2) : 0;

    const summary = {
      overview: {
        totalLogs,
        successfulLogs,
        failedLogs,
        successRate: `${successRate}%`,
        dateRange: {
          startDate: startDate || "All time",
          endDate: endDate || "Present"
        }
      },
      actionBreakdown: actionBreakdown.map(item => ({
        actionType: item.actionType,
        count: parseInt(item.dataValues.count),
        totalQuantityChange: parseFloat(item.dataValues.totalQuantityChange) || 0,
        totalCostChange: parseFloat(item.dataValues.totalCostChange) || 0
      })),
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        actionType: log.actionType,
        materialName: log.materialName,
        userName: log.userName || "System",
        timestamp: log.actionTimestamp,
        status: log.status,
        quantityChange: log.quantityDelta,
        costChange: log.costDelta
      })),
      topUsers: topUsers.map(user => ({
        userId: user.userId,
        userName: user.userName,
        activityCount: parseInt(user.dataValues.activityCount)
      })),
      topMaterials: topMaterials.map(material => ({
        materialId: material.materialId,
        materialName: material.materialName,
        activityCount: parseInt(material.dataValues.activityCount)
      }))
    };

    res.json({
      success: true,
      data: summary,
      message: "Retrieved logging summary and statistics"
    });
  } catch (error) {
    console.error("Error generating logging summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate logging summary",
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/logs/export - Export logs to CSV/JSON
// ============================================================================
router.get("/export", async (req, res) => {
  try {
    const { format = "json", startDate, endDate, actionType, status, limit = 1000 } = req.query;

    // Build where clause
    const whereClause = {};

    if (actionType) {
      if (Array.isArray(actionType)) {
        whereClause.actionType = { [Op.in]: actionType };
      } else {
        whereClause.actionType = actionType;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.actionTimestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const logs = await StockEntryLogSimple.findAll({
      where: whereClause,
      order: [["actionTimestamp", "DESC"]],
      limit: parseInt(limit)
    });

    if (format.toLowerCase() === "csv") {
      // Generate CSV
      const csvHeaders = ["ID", "Action Type", "Description", "Stock Entry ID", "Material ID", "Material Name", "User ID", "User Name", "Quantity Delta", "Cost Delta", "Status", "Timestamp", "Error Message"];

      const csvRows = logs.map(log => [log.id, log.actionType, log.actionDescription || "", log.stockEntryId, log.materialId, log.materialName, log.userId || "", log.userName || "", log.quantityDelta || 0, log.costDelta || 0, log.status, log.actionTimestamp.toISOString(), log.errorMessage || ""]);

      const csvContent = [csvHeaders, ...csvRows].map(row => row.map(field => `"${field}"`).join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="SystemLogs_${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: {
          logs,
          exportInfo: {
            format,
            totalRecords: logs.length,
            filters: { startDate, endDate, actionType, status },
            exportedAt: new Date().toISOString()
          }
        },
        message: `Exported ${logs.length} log entries`
      });
    }
  } catch (error) {
    console.error("Error exporting logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export logs",
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/logs/search - Advanced search with full-text search capabilities
// ============================================================================
router.get("/search", async (req, res) => {
  try {
    const {
      q, // search query
      page = 1,
      limit = 50,
      searchFields = ["actionDescription", "materialName", "userName"],
      ...filters
    } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query (q) parameter is required"
      });
    }

    // Build search conditions
    const searchConditions = [];
    const fieldsArray = Array.isArray(searchFields) ? searchFields : [searchFields];

    fieldsArray.forEach(field => {
      if (["actionDescription", "materialName", "userName", "errorMessage"].includes(field)) {
        searchConditions.push({
          [field]: {
            [Op.iLike]: `%${q}%`
          }
        });
      }
    });

    const whereClause = {
      [Op.or]: searchConditions
    };

    // Add additional filters
    Object.keys(filters).forEach(key => {
      if (filters[key] && key !== "page" && key !== "limit" && key !== "searchFields") {
        whereClause[key] = filters[key];
      }
    });

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await StockEntryLogSimple.findAndCountAll({
      where: whereClause,
      order: [["actionTimestamp", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        logs,
        searchInfo: {
          query: q,
          searchFields: fieldsArray,
          totalResults: count,
          currentPage: parseInt(page),
          totalPages,
          hasMore: page < totalPages
        }
      },
      message: `Found ${count} log entries matching "${q}"`
    });
  } catch (error) {
    console.error("Error searching logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search logs",
      details: error.message
    });
  }
});

export default router;
