import { Op } from "sequelize";
import { AuditLog, Employee, EmployeeUsage, Material, MenuItem, StockEntry, User } from "../models/index.js";

// Record employee usage
export const recordUsage = async (req, res) => {
  try {
    const { employeeId, usageType, materialId, menuItemId, stockEntryId, quantity, unit, unitCost, posTransactionId, notes } = req.body;

    // Validate required fields
    if (!employeeId || !usageType || !quantity || !unit || !unitCost) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: employeeId, usageType, quantity, unit, unitCost"
      });
    }

    // Validate usage type and corresponding ID
    if (usageType === "material" && !materialId) {
      return res.status(400).json({
        success: false,
        message: "materialId is required for material usage"
      });
    }
    if (usageType === "menu_item" && !menuItemId) {
      return res.status(400).json({
        success: false,
        message: "menuItemId is required for menu item usage"
      });
    }
    if (usageType === "stock_entry" && !stockEntryId) {
      return res.status(400).json({
        success: false,
        message: "stockEntryId is required for stock entry usage"
      });
    }

    // Verify employee exists and get discount percentage
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot record usage for inactive employee"
      });
    }

    // Calculate costs
    const totalCost = parseFloat(quantity) * parseFloat(unitCost);
    const discountApplied = employee.discountPercentage;

    const usageData = {
      employeeId,
      usageType,
      materialId: materialId || null,
      menuItemId: menuItemId || null,
      stockEntryId: stockEntryId || null,
      quantity: parseFloat(quantity),
      unit,
      unitCost: parseFloat(unitCost),
      totalCost,
      discountApplied,
      posTransactionId,
      recordedBy: req.user.id,
      notes
    };

    const usage = await EmployeeUsage.create(usageData);

    // Fetch the created usage with related data
    const createdUsage = await EmployeeUsage.findByPk(usage.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username"]
            }
          ]
        },
        { model: Material, as: "material", attributes: ["id", "name", "category"] },
        { model: MenuItem, as: "menuItem", attributes: ["id", "name", "category"] },
        { model: StockEntry, as: "stockEntry", attributes: ["id", "supplier"] }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "create", "employee_usage", usage.id, null, createdUsage.toJSON(), req);

    res.status(201).json({
      success: true,
      data: createdUsage,
      message: "Employee usage recorded successfully"
    });
  } catch (error) {
    console.error("Error recording employee usage:", error);
    await AuditLog.logFailedAction(req.user.id, "create", "employee_usage", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to record employee usage",
      error: error.message
    });
  }
};

// Get employee usage history
export const getUsageHistory = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, usageType, isSettled, page = 1, limit = 50 } = req.query;

    const where = {};

    if (employeeId) where.employeeId = employeeId;
    if (usageType) where.usageType = usageType;
    if (isSettled !== undefined) where.isSettled = isSettled === "true";

    if (startDate || endDate) {
      where.usageDate = {};
      if (startDate) where.usageDate[Op.gte] = new Date(startDate);
      if (endDate) where.usageDate[Op.lte] = new Date(endDate);
    }

    const offset = (page - 1) * limit;

    const { count, rows: usages } = await EmployeeUsage.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username", "employeeNumber"]
            }
          ]
        },
        { model: Material, as: "material", attributes: ["id", "name", "category", "baseUnit"] },
        { model: MenuItem, as: "menuItem", attributes: ["id", "name", "category", "description"] },
        { model: StockEntry, as: "stockEntry", attributes: ["id", "supplier", "purchaseDate"] },
        {
          model: User,
          as: "recorder",
          attributes: ["firstName", "lastName", "username"]
        }
      ],
      order: [["usageDate", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    await AuditLog.logUserAction(req.user.id, "view", "employee_usage", null, null, { count, filters: { employeeId, startDate, endDate, usageType, isSettled } }, req);

    res.json({
      success: true,
      data: {
        usages,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      },
      message: `Retrieved ${usages.length} usage records`
    });
  } catch (error) {
    console.error("Error fetching usage history:", error);
    await AuditLog.logFailedAction(req.user.id, "view", "employee_usage", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to fetch usage history",
      error: error.message
    });
  }
};

// Get monthly usage summary for an employee
export const getMonthlyUsageSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }

    const employee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "username"]
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Get usage details
    const usages = await EmployeeUsage.getMonthlyUsage(employeeId, parseInt(month), parseInt(year));

    // Get usage totals
    const totals = await EmployeeUsage.calculateMonthlyTotal(employeeId, parseInt(month), parseInt(year));

    // Group usages by type
    const usagesByType = {
      material: usages.filter(u => u.usageType === "material"),
      menu_item: usages.filter(u => u.usageType === "menu_item"),
      stock_entry: usages.filter(u => u.usageType === "stock_entry")
    };

    const summary = {
      employee: {
        id: employee.id,
        name: employee.getFullName(),
        employeeNumber: employee.employeeNumber,
        department: employee.department,
        baseSalary: parseFloat(employee.baseSalary),
        discountPercentage: parseFloat(employee.discountPercentage)
      },
      period: {
        month: parseInt(month),
        year: parseInt(year),
        monthName: new Date(year, month - 1).toLocaleString("default", { month: "long" })
      },
      totals: {
        totalUsageCost: parseFloat(totals.totalUsageCost || 0),
        totalDiscountAmount: parseFloat(totals.totalDiscountAmount || 0),
        totalFinalCost: parseFloat(totals.totalFinalCost || 0),
        usageCount: parseInt(totals.usageCount || 0)
      },
      usagesByType,
      usages
    };

    await AuditLog.logUserAction(req.user.id, "view", "employee_usage_summary", employeeId, null, { month, year, totals }, req);

    res.json({
      success: true,
      data: summary,
      message: "Monthly usage summary retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching monthly usage summary:", error);
    await AuditLog.logFailedAction(req.user.id, "view", "employee_usage_summary", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly usage summary",
      error: error.message
    });
  }
};

// Update usage record
export const updateUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unit, unitCost, notes } = req.body;

    const usage = await EmployeeUsage.findByPk(id);
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: "Usage record not found"
      });
    }

    if (usage.isSettled) {
      return res.status(400).json({
        success: false,
        message: "Cannot update settled usage record"
      });
    }

    const oldValues = usage.toJSON();

    const updateData = {};
    if (quantity !== undefined) {
      updateData.quantity = parseFloat(quantity);
      updateData.totalCost = parseFloat(quantity) * (unitCost !== undefined ? parseFloat(unitCost) : usage.unitCost);
    }
    if (unit !== undefined) updateData.unit = unit;
    if (unitCost !== undefined) {
      updateData.unitCost = parseFloat(unitCost);
      updateData.totalCost = (quantity !== undefined ? parseFloat(quantity) : usage.quantity) * parseFloat(unitCost);
    }
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate discount if total cost changed
    if (updateData.totalCost !== undefined) {
      updateData.discountAmount = updateData.totalCost * (usage.discountApplied / 100);
      updateData.finalCost = updateData.totalCost - updateData.discountAmount;
    }

    await usage.update(updateData);

    // Fetch updated usage with related data
    const updatedUsage = await EmployeeUsage.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username"]
            }
          ]
        },
        { model: Material, as: "material", attributes: ["id", "name", "category"] },
        { model: MenuItem, as: "menuItem", attributes: ["id", "name", "category"] }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "update", "employee_usage", id, oldValues, updatedUsage.toJSON(), req);

    res.json({
      success: true,
      data: updatedUsage,
      message: "Usage record updated successfully"
    });
  } catch (error) {
    console.error("Error updating usage record:", error);
    await AuditLog.logFailedAction(req.user.id, "update", "employee_usage", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to update usage record",
      error: error.message
    });
  }
};

// Delete usage record
export const deleteUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const usage = await EmployeeUsage.findByPk(id);
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: "Usage record not found"
      });
    }

    if (usage.isSettled) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete settled usage record"
      });
    }

    const oldValues = usage.toJSON();
    await usage.destroy();

    await AuditLog.logUserAction(req.user.id, "delete", "employee_usage", id, oldValues, null, req);

    res.json({
      success: true,
      message: "Usage record deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting usage record:", error);
    await AuditLog.logFailedAction(req.user.id, "delete", "employee_usage", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to delete usage record",
      error: error.message
    });
  }
};

// Get usage statistics
export const getUsageStats = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const where = {};
    if (employeeId) where.employeeId = employeeId;

    if (startDate || endDate) {
      where.usageDate = {};
      if (startDate) where.usageDate[Op.gte] = new Date(startDate);
      if (endDate) where.usageDate[Op.lte] = new Date(endDate);
    }

    const stats = await EmployeeUsage.findAll({
      where,
      attributes: ["usageType", [EmployeeUsage.sequelize.fn("COUNT", EmployeeUsage.sequelize.col("id")), "count"], [EmployeeUsage.sequelize.fn("SUM", EmployeeUsage.sequelize.col("totalCost")), "totalCost"], [EmployeeUsage.sequelize.fn("SUM", EmployeeUsage.sequelize.col("finalCost")), "finalCost"], [EmployeeUsage.sequelize.fn("AVG", EmployeeUsage.sequelize.col("discountApplied")), "avgDiscount"]],
      group: ["usageType"],
      raw: true
    });

    const totalStats = await EmployeeUsage.findAll({
      where,
      attributes: [
        [EmployeeUsage.sequelize.fn("COUNT", EmployeeUsage.sequelize.col("id")), "totalCount"],
        [EmployeeUsage.sequelize.fn("SUM", EmployeeUsage.sequelize.col("totalCost")), "totalCost"],
        [EmployeeUsage.sequelize.fn("SUM", EmployeeUsage.sequelize.col("finalCost")), "totalFinalCost"],
        [EmployeeUsage.sequelize.fn("SUM", EmployeeUsage.sequelize.col("discountAmount")), "totalDiscountAmount"]
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        byType: stats,
        totals: totalStats[0] || {
          totalCount: 0,
          totalCost: 0,
          totalFinalCost: 0,
          totalDiscountAmount: 0
        }
      },
      message: "Usage statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching usage statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch usage statistics",
      error: error.message
    });
  }
};
