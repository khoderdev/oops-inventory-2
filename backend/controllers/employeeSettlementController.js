import { AuditLog, Employee, EmployeeSettlement, EmployeeUsage, User } from "../models/index.js";

// Create settlement for employee
export const createSettlement = async (req, res) => {
  try {
    const { employeeId, settlementMonth, settlementYear, bonusAmount = 0, penaltyAmount = 0, notes } = req.body;

    // Validate required fields
    if (!employeeId || !settlementMonth || !settlementYear) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: employeeId, settlementMonth, settlementYear"
      });
    }

    // Validate month and year
    if (settlementMonth < 1 || settlementMonth > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month. Must be between 1 and 12"
      });
    }

    if (settlementYear < 2020 || settlementYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid year. Must be between 2020 and 2100"
      });
    }

    // Check if settlement already exists for this employee and period
    const existingSettlement = await EmployeeSettlement.findOne({
      where: {
        employeeId,
        settlementMonth,
        settlementYear
      }
    });

    if (existingSettlement) {
      return res.status(400).json({
        success: false,
        message: "Settlement already exists for this employee and period"
      });
    }

    // Get employee details
    const employee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "username"],
          required: false // LEFT JOIN - include employees without users
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Calculate settlement using the static method
    const calculatedSettlement = await EmployeeSettlement.calculateSettlement(employeeId, settlementMonth, settlementYear);

    // Get detailed usage data for settlement record
    const usages = await EmployeeUsage.getMonthlyUsage(employeeId, settlementMonth, settlementYear);

    const settlementData = {
      employeeId,
      settlementMonth,
      settlementYear,
      baseSalary: calculatedSettlement.baseSalary,
      totalUsageCost: calculatedSettlement.totalUsageCost,
      totalDiscountAmount: calculatedSettlement.totalDiscountAmount,
      totalDeduction: calculatedSettlement.totalDeduction,
      bonusAmount: parseFloat(bonusAmount),
      penaltyAmount: parseFloat(penaltyAmount),
      finalSalary: calculatedSettlement.finalSalary + parseFloat(bonusAmount) - parseFloat(penaltyAmount),
      usageItemsCount: calculatedSettlement.usageItemsCount,
      processedBy: req.user.id,
      notes,
      settlementData: {
        usageBreakdown: usages.map(usage => ({
          id: usage.id,
          usageType: usage.usageType,
          itemName: usage.material?.name || usage.menuItem?.name || "Unknown",
          quantity: usage.quantity,
          unit: usage.unit,
          unitCost: usage.unitCost,
          totalCost: usage.totalCost,
          discountApplied: usage.discountApplied,
          finalCost: usage.finalCost,
          usageDate: usage.usageDate
        })),
        calculationDetails: {
          baseSalary: calculatedSettlement.baseSalary,
          totalUsageCost: calculatedSettlement.totalUsageCost,
          discountPercentage: employee.discountPercentage,
          totalDiscountAmount: calculatedSettlement.totalDiscountAmount,
          netDeduction: calculatedSettlement.totalDeduction,
          bonusAmount: parseFloat(bonusAmount),
          penaltyAmount: parseFloat(penaltyAmount)
        }
      }
    };

    const settlement = await EmployeeSettlement.create(settlementData);

    // Mark all usage items as settled
    await EmployeeUsage.update(
      {
        isSettled: true,
        settlementId: settlement.id
      },
      {
        where: {
          employeeId,
          usageMonth: settlementMonth,
          usageYear: settlementYear,
          isSettled: false
        }
      }
    );

    // Fetch the created settlement with employee data
    const createdSettlement = await EmployeeSettlement.findByPk(settlement.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username"],
              required: false // LEFT JOIN - include employees without users
            }
          ]
        }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "create", "employee_settlement", settlement.id, null, createdSettlement.toJSON(), req);

    res.status(201).json({
      success: true,
      data: createdSettlement,
      message: "Employee settlement created successfully"
    });
  } catch (error) {
    console.error("Error creating settlement:", error);
    await AuditLog.logFailedAction(req.user.id, "create", "employee_settlement", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to create settlement",
      error: error.message
    });
  }
};

// Get all settlements
export const getAllSettlements = async (req, res) => {
  try {
    const { employeeId, month, year, status, page = 1, limit = 50 } = req.query;

    const where = {};

    if (employeeId) where.employeeId = employeeId;
    if (month) where.settlementMonth = parseInt(month);
    if (year) where.settlementYear = parseInt(year);
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: settlements } = await EmployeeSettlement.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username"],
              required: false // LEFT JOIN - include employees without users
            }
          ]
        }
      ],
      order: [
        ["settlementYear", "DESC"],
        ["settlementMonth", "DESC"],
        ["createdAt", "DESC"]
      ],
      limit: parseInt(limit),
      offset
    });

    await AuditLog.logUserAction(req.user.id, "view", "employee_settlements", null, null, { count, filters: { employeeId, month, year, status } }, req);

    res.json({
      success: true,
      data: {
        settlements,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      },
      message: `Retrieved ${settlements.length} settlements`
    });
  } catch (error) {
    console.error("Error fetching settlements:", error);
    await AuditLog.logFailedAction(req.user.id, "view", "employee_settlements", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settlements",
      error: error.message
    });
  }
};

// Get settlement by ID
export const getSettlementById = async (req, res) => {
  try {
    const { id } = req.params;

    const settlement = await EmployeeSettlement.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username"],
              required: false // LEFT JOIN - include employees without users
            }
          ]
        },
        {
          model: EmployeeUsage,
          as: "usageItems",
          include: [
            { model: Material, as: "material", attributes: ["id", "name", "category"] },
            { model: MenuItem, as: "menuItem", attributes: ["id", "name", "category"] }
          ]
        },
        {
          model: User,
          as: "processor",
          attributes: ["firstName", "lastName", "username"],
          required: false // LEFT JOIN - user who processed might not exist
        },
        {
          model: User,
          as: "approver",
          attributes: ["firstName", "lastName", "username"],
          required: false // LEFT JOIN - approver may not have user account
        }
      ]
    });

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found"
      });
    }

    await AuditLog.logUserAction(req.user.id, "view", "employee_settlement", id, null, null, req);

    res.json({
      success: true,
      data: settlement,
      message: "Settlement retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching settlement:", error);
    await AuditLog.logFailedAction(req.user.id, "view", "employee_settlement", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settlement",
      error: error.message
    });
  }
};

// Approve settlement
export const approveSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const settlement = await EmployeeSettlement.findByPk(id);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found"
      });
    }

    if (settlement.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve settlement with status: ${settlement.status}`
      });
    }

    const oldValues = settlement.toJSON();

    await settlement.approve(req.user.id);

    if (notes) {
      settlement.notes = notes;
      await settlement.save();
    }

    // Fetch updated settlement with employee data
    const updatedSettlement = await EmployeeSettlement.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username"],
              required: false // LEFT JOIN - include employees without users
            }
          ]
        }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "approve", "employee_settlement", id, oldValues, updatedSettlement.toJSON(), req);

    res.json({
      success: true,
      data: updatedSettlement,
      message: "Settlement approved successfully"
    });
  } catch (error) {
    console.error("Error approving settlement:", error);
    await AuditLog.logFailedAction(req.user.id, "approve", "employee_settlement", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to approve settlement",
      error: error.message
    });
  }
};

// Mark settlement as paid
export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference, notes } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required"
      });
    }

    const settlement = await EmployeeSettlement.findByPk(id);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found"
      });
    }

    if (settlement.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Settlement must be approved before marking as paid"
      });
    }

    const oldValues = settlement.toJSON();

    await settlement.markAsPaid(paymentMethod, paymentReference, req.user.id);

    if (notes) {
      settlement.notes = notes;
      await settlement.save();
    }

    // Fetch updated settlement with employee data
    const updatedSettlement = await EmployeeSettlement.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username"],
              required: false // LEFT JOIN - include employees without users
            }
          ]
        }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "mark_paid", "employee_settlement", id, oldValues, updatedSettlement.toJSON(), req);

    res.json({
      success: true,
      data: updatedSettlement,
      message: "Settlement marked as paid successfully"
    });
  } catch (error) {
    console.error("Error marking settlement as paid:", error);
    await AuditLog.logFailedAction(req.user.id, "mark_paid", "employee_settlement", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to mark settlement as paid",
      error: error.message
    });
  }
};

// Update settlement
export const updateSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { bonusAmount, penaltyAmount, notes, status } = req.body;

    const settlement = await EmployeeSettlement.findByPk(id);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found"
      });
    }

    if (settlement.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot update paid settlement"
      });
    }

    const oldValues = settlement.toJSON();

    const updateData = {};
    if (bonusAmount !== undefined) updateData.bonusAmount = parseFloat(bonusAmount);
    if (penaltyAmount !== undefined) updateData.penaltyAmount = parseFloat(penaltyAmount);
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined && ["pending", "approved", "disputed", "cancelled"].includes(status)) {
      updateData.status = status;
    }

    await settlement.update(updateData);

    // Fetch updated settlement with employee data
    const updatedSettlement = await EmployeeSettlement.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "username"],
              required: false // LEFT JOIN - include employees without users
            }
          ]
        }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "update", "employee_settlement", id, oldValues, updatedSettlement.toJSON(), req);

    res.json({
      success: true,
      data: updatedSettlement,
      message: "Settlement updated successfully"
    });
  } catch (error) {
    console.error("Error updating settlement:", error);
    await AuditLog.logFailedAction(req.user.id, "update", "employee_settlement", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to update settlement",
      error: error.message
    });
  }
};

// Get pending settlements
export const getPendingSettlements = async (req, res) => {
  try {
    const settlements = await EmployeeSettlement.getPendingSettlements();

    res.json({
      success: true,
      data: settlements,
      message: `Retrieved ${settlements.length} pending settlements`
    });
  } catch (error) {
    console.error("Error fetching pending settlements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending settlements",
      error: error.message
    });
  }
};

// Get settlement statistics
export const getSettlementStats = async (req, res) => {
  try {
    const { year, month } = req.query;

    const where = {};
    if (year) where.settlementYear = parseInt(year);
    if (month) where.settlementMonth = parseInt(month);

    const stats = await EmployeeSettlement.findAll({
      where,
      attributes: [
        "status", 
        [EmployeeSettlement.sequelize.fn("COUNT", EmployeeSettlement.sequelize.col("id")), "count"], 
        [EmployeeSettlement.sequelize.fn("SUM", EmployeeSettlement.sequelize.col("base_salary")), "totalBaseSalary"], 
        [EmployeeSettlement.sequelize.fn("SUM", EmployeeSettlement.sequelize.col("total_deduction")), "totalDeductions"], 
        [EmployeeSettlement.sequelize.fn("SUM", EmployeeSettlement.sequelize.col("final_salary")), "totalFinalSalary"]
      ],
      group: ["status"],
      raw: true
    });

    const totalStats = await EmployeeSettlement.findAll({
      where,
      attributes: [
        [EmployeeSettlement.sequelize.fn("COUNT", EmployeeSettlement.sequelize.col("id")), "totalCount"],
        [EmployeeSettlement.sequelize.fn("SUM", EmployeeSettlement.sequelize.col("baseSalary")), "totalBaseSalary"],
        [EmployeeSettlement.sequelize.fn("SUM", EmployeeSettlement.sequelize.col("totalDeduction")), "totalDeductions"],
        [EmployeeSettlement.sequelize.fn("SUM", EmployeeSettlement.sequelize.col("finalSalary")), "totalFinalSalary"],
        [EmployeeSettlement.sequelize.fn("AVG", EmployeeSettlement.sequelize.col("finalSalary")), "avgFinalSalary"]
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totals: totalStats[0] || {
          totalCount: 0,
          totalBaseSalary: 0,
          totalDeductions: 0,
          totalFinalSalary: 0,
          avgFinalSalary: 0
        }
      },
      message: "Settlement statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching settlement statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settlement statistics",
      error: error.message
    });
  }
};

// Calculate preview settlement (without creating)
export const previewSettlement = async (req, res) => {
  try {
    const { employeeId, settlementMonth, settlementYear, bonusAmount = 0, penaltyAmount = 0 } = req.body;

    if (!employeeId || !settlementMonth || !settlementYear) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: employeeId, settlementMonth, settlementYear"
      });
    }

    // Get employee details
    const employee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "username"],
          required: false // LEFT JOIN - include employees without users
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Calculate settlement
    const calculatedSettlement = await EmployeeSettlement.calculateSettlement(employeeId, settlementMonth, settlementYear);

    // Get usage details
    const usages = await EmployeeUsage.getMonthlyUsage(employeeId, settlementMonth, settlementYear);

    const finalSalary = calculatedSettlement.baseSalary - calculatedSettlement.totalDeduction + parseFloat(bonusAmount) - parseFloat(penaltyAmount);

    const preview = {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeNumber: employee.employeeNumber,
        department: employee.department,
        discountPercentage: employee.discountPercentage
      },
      period: {
        month: settlementMonth,
        year: settlementYear,
        monthName: new Date(settlementYear, settlementMonth - 1).toLocaleString("default", { month: "long" })
      },
      calculation: {
        baseSalary: calculatedSettlement.baseSalary,
        totalUsageCost: calculatedSettlement.totalUsageCost,
        totalDiscountAmount: calculatedSettlement.totalDiscountAmount,
        totalDeduction: calculatedSettlement.totalDeduction,
        bonusAmount: parseFloat(bonusAmount),
        penaltyAmount: parseFloat(penaltyAmount),
        finalSalary,
        usageItemsCount: calculatedSettlement.usageItemsCount
      },
      usages: usages.map(usage => ({
        id: usage.id,
        usageType: usage.usageType,
        itemName: usage.material?.name || usage.menuItem?.name || "Unknown",
        quantity: usage.quantity,
        unit: usage.unit,
        unitCost: usage.unitCost,
        totalCost: usage.totalCost,
        discountApplied: usage.discountApplied,
        finalCost: usage.finalCost,
        usageDate: usage.usageDate
      }))
    };

    res.json({
      success: true,
      data: preview,
      message: "Settlement preview calculated successfully"
    });
  } catch (error) {
    console.error("Error calculating settlement preview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate settlement preview",
      error: error.message
    });
  }
};
