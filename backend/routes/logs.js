import express from "express";
import { Op } from "sequelize";
import { StockEntryAuditHelperSimple } from "../decorators/stockEntryAuditDecoratorSimple.js";
import { SystemLogs, AuditLog, User, Employee } from "../models/index.js";

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
    const { count, rows: logs } = await SystemLogs.findAndCountAll({
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
    const totalLogs = await SystemLogs.count({ where: dateFilter });
    const successfulLogs = await SystemLogs.count({
      where: { ...dateFilter, status: "success" }
    });
    const failedLogs = await SystemLogs.count({
      where: { ...dateFilter, status: "failure" }
    });

    // Get action breakdown
    const actionBreakdown = await SystemLogs.findAll({
      where: dateFilter,
      attributes: ["actionType", [SystemLogs.sequelize.fn("COUNT", SystemLogs.sequelize.col("id")), "count"], [SystemLogs.sequelize.fn("SUM", SystemLogs.sequelize.col("quantityDelta")), "totalQuantityChange"], [SystemLogs.sequelize.fn("SUM", SystemLogs.sequelize.col("costDelta")), "totalCostChange"]],
      group: ["actionType"],
      order: [[SystemLogs.sequelize.fn("COUNT", SystemLogs.sequelize.col("id")), "DESC"]]
    });

    // Get recent activity
    const recentActivity = await SystemLogs.findAll({
      where: dateFilter,
      order: [["actionTimestamp", "DESC"]],
      limit: 10,
      attributes: ["id", "actionType", "materialName", "userName", "actionTimestamp", "status", "quantityDelta", "costDelta"]
    });

    // Get top active users
    const topUsers = await SystemLogs.findAll({
      where: { ...dateFilter, userId: { [Op.not]: null } },
      attributes: ["userId", "userName", [SystemLogs.sequelize.fn("COUNT", SystemLogs.sequelize.col("id")), "activityCount"]],
      group: ["userId", "userName"],
      order: [[SystemLogs.sequelize.fn("COUNT", SystemLogs.sequelize.col("id")), "DESC"]],
      limit: 10
    });

    // Get top materials
    const topMaterials = await SystemLogs.findAll({
      where: dateFilter,
      attributes: ["materialId", "materialName", [SystemLogs.sequelize.fn("COUNT", SystemLogs.sequelize.col("id")), "activityCount"]],
      group: ["materialId", "materialName"],
      order: [[SystemLogs.sequelize.fn("COUNT", SystemLogs.sequelize.col("id")), "DESC"]],
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

    const logs = await SystemLogs.findAll({
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

    const { count, rows: logs } = await SystemLogs.findAndCountAll({
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

// ============================================================================
// GET /api/logs/employees - Get employee audit logs with filtering
// ============================================================================
router.get("/employees", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      employeeId, 
      userId, 
      action, 
      startDate, 
      endDate, 
      sortBy = "timestamp", 
      sortOrder = "DESC" 
    } = req.query;

    // Build where clause for employee-related audit logs
    const whereClause = {
      resource: { [Op.in]: ["employee", "employees", "employee_usage"] }
    };

    if (employeeId) {
      whereClause.recordId = employeeId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (action) {
      if (Array.isArray(action)) {
        whereClause.action = { [Op.in]: action };
      } else {
        whereClause.action = action;
      }
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Execute query with user and employee associations
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName"],
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format logs for response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : "System",
      action: log.action,
      resource: log.resource,
      recordId: log.recordId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      description: log.description,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));

    res.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: count,
          recordsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: { employeeId, userId, action, startDate, endDate },
        sorting: { sortBy, sortOrder }
      },
      message: `Retrieved ${logs.length} employee audit log entries`
    });
  } catch (error) {
    console.error("Error fetching employee audit logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee audit logs",
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/logs/settlements - Get settlement audit logs with filtering
// ============================================================================
router.get("/settlements", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      settlementId, 
      employeeId, 
      userId, 
      action, 
      startDate, 
      endDate, 
      sortBy = "timestamp", 
      sortOrder = "DESC" 
    } = req.query;

    // Build where clause for settlement-related audit logs
    const whereClause = {
      resource: { [Op.in]: ["employee_settlement", "employee_settlements", "settlement"] }
    };

    if (settlementId) {
      whereClause.recordId = settlementId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (action) {
      if (Array.isArray(action)) {
        whereClause.action = { [Op.in]: action };
      } else {
        whereClause.action = action;
      }
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Execute query with user associations
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName"],
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format logs for response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : "System",
      action: log.action,
      resource: log.resource,
      recordId: log.recordId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      description: log.description,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      // Extract settlement-specific info from description or values
      settlementInfo: log.newValues || log.oldValues
    }));

    res.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: count,
          recordsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: { settlementId, employeeId, userId, action, startDate, endDate },
        sorting: { sortBy, sortOrder }
      },
      message: `Retrieved ${logs.length} settlement audit log entries`
    });
  } catch (error) {
    console.error("Error fetching settlement audit logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch settlement audit logs",
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/logs/audit-summary - Get audit logs summary for employees and settlements
// ============================================================================
router.get("/audit-summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateFilter.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateFilter.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Get employee audit logs summary
    const employeeLogs = await AuditLog.count({
      where: {
        ...dateFilter,
        resource: { [Op.in]: ["employee", "employees", "employee_usage"] }
      }
    });

    // Get settlement audit logs summary
    const settlementLogs = await AuditLog.count({
      where: {
        ...dateFilter,
        resource: { [Op.in]: ["employee_settlement", "employee_settlements", "settlement"] }
      }
    });

    // Get action breakdown for employees
    const employeeActionBreakdown = await AuditLog.findAll({
      where: {
        ...dateFilter,
        resource: { [Op.in]: ["employee", "employees", "employee_usage"] }
      },
      attributes: [
        "action",
        [AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("id")), "count"]
      ],
      group: ["action"],
      order: [[AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("id")), "DESC"]]
    });

    // Get action breakdown for settlements
    const settlementActionBreakdown = await AuditLog.findAll({
      where: {
        ...dateFilter,
        resource: { [Op.in]: ["employee_settlement", "employee_settlements", "settlement"] }
      },
      attributes: [
        "action",
        [AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("id")), "count"]
      ],
      group: ["action"],
      order: [[AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("id")), "DESC"]]
    });

    // Get recent activity
    const recentActivity = await AuditLog.findAll({
      where: {
        ...dateFilter,
        resource: { [Op.in]: ["employee", "employees", "employee_usage", "employee_settlement", "employee_settlements", "settlement"] }
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName"],
          required: false
        }
      ],
      order: [["timestamp", "DESC"]],
      limit: 10
    });

    // Get top active users
    const topUsers = await AuditLog.findAll({
      where: {
        ...dateFilter,
        resource: { [Op.in]: ["employee", "employees", "employee_usage", "employee_settlement", "employee_settlements", "settlement"] },
        userId: { [Op.not]: null }
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName"],
          required: false
        }
      ],
      attributes: [
        "userId",
        [AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("AuditLog.id")), "activityCount"]
      ],
      group: ["userId", "user.id", "user.firstName", "user.lastName"],
      order: [[AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("AuditLog.id")), "DESC"]],
      limit: 10
    });

    const summary = {
      overview: {
        totalEmployeeLogs: employeeLogs,
        totalSettlementLogs: settlementLogs,
        totalAuditLogs: employeeLogs + settlementLogs,
        dateRange: {
          startDate: startDate || "All time",
          endDate: endDate || "Present"
        }
      },
      employeeActions: employeeActionBreakdown.map(item => ({
        action: item.action,
        count: parseInt(item.dataValues.count)
      })),
      settlementActions: settlementActionBreakdown.map(item => ({
        action: item.action,
        count: parseInt(item.dataValues.count)
      })),
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        recordId: log.recordId,
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : "System",
        timestamp: log.timestamp,
        description: log.description
      })),
      topUsers: topUsers.map(user => ({
        userId: user.userId,
        userName: user.user ? `${user.user.firstName} ${user.user.lastName}` : "Unknown",
        activityCount: parseInt(user.dataValues.activityCount)
      }))
    };

    res.json({
      success: true,
      data: summary,
      message: "Retrieved employee and settlement audit summary"
    });
  } catch (error) {
    console.error("Error generating audit summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate audit summary",
      details: error.message
    });
  }
});

export default router;
