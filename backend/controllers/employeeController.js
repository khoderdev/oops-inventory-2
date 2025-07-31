import { Op } from "sequelize";
import { AuditLog, Employee, EmployeeSettlement, EmployeeUsage, Material, MenuItem, User } from "../models/index.js";

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const { department, isActive, page = 1, limit = 50, search } = req.query;

    const where = {};

    if (department) where.department = department;
    // Handle isActive parameter - default to true if not provided
    if (isActive !== undefined) {
      where.isActive = isActive === "true" || isActive === true;
    } else {
      where.isActive = true; // Default to active employees
    }

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [{ firstName: { [Op.iLike]: `%${search}%` } }, { lastName: { [Op.iLike]: `%${search}%` } }, { username: { [Op.iLike]: `%${search}%` } }];
    }

    const offset = (page - 1) * limit;

    const { count, rows: employees } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "role", "isActive"],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined
        }
      ],
      order: [["employeeNumber", "ASC"]],
      limit: parseInt(limit),
      offset
    });

    await AuditLog.logUserAction(req.user.id, "view", "employees", null, null, { count, filters: { department, isActive, search } }, req);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      },
      message: `Retrieved ${employees.length} employees`
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    await AuditLog.logFailedAction(req.user.id, "view", "employees", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message
    });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "role", "isActive", "lastLogin"]
        },
        {
          model: EmployeeUsage,
          as: "usages",
          limit: 10,
          order: [["usageDate", "DESC"]],
          include: [
            { model: Material, as: "material", attributes: ["id", "name", "category"] },
            { model: MenuItem, as: "menuItem", attributes: ["id", "name", "category"] }
          ]
        },
        {
          model: EmployeeSettlement,
          as: "settlements",
          limit: 6,
          order: [
            ["settlementYear", "DESC"],
            ["settlementMonth", "DESC"]
          ]
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    await AuditLog.logUserAction(req.user.id, "view", "employee", id, null, null, req);

    res.json({
      success: true,
      data: employee,
      message: "Employee retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching employee:", error);
    await AuditLog.logFailedAction(req.user.id, "view", "employee", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
      error: error.message
    });
  }
};

// Create new employee
export const createEmployee = async (req, res) => {
  try {
    const { userId, employeeNumber, department, position, baseSalary, discountPercentage = 0, hireDate, emergencyContact, bankDetails, notes } = req.body;

    // Validate required fields
    if (!userId || !department || !position || !baseSalary || !hireDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, department, position, baseSalary, hireDate"
      });
    }

    // Check if user exists and doesn't already have an employee record
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const existingEmployee = await Employee.findOne({ where: { userId } });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "User already has an employee record"
      });
    }

    // Generate employee number if not provided
    let finalEmployeeNumber = employeeNumber;
    if (!finalEmployeeNumber) {
      // Generate employee number based on department and timestamp
      const departmentCode = department.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      finalEmployeeNumber = `${departmentCode}${timestamp}`;

      // Ensure uniqueness
      let counter = 1;
      let testNumber = finalEmployeeNumber;
      while (await Employee.findOne({ where: { employeeNumber: testNumber } })) {
        testNumber = `${finalEmployeeNumber}${counter.toString().padStart(2, "0")}`;
        counter++;
      }
      finalEmployeeNumber = testNumber;
    } else {
      // Check if provided employee number is unique
      const existingNumber = await Employee.findOne({ where: { employeeNumber: finalEmployeeNumber } });
      if (existingNumber) {
        return res.status(400).json({
          success: false,
          message: "Employee number already exists"
        });
      }
    }

    const employee = await Employee.create({
      userId,
      employeeNumber: finalEmployeeNumber,
      department,
      position,
      baseSalary: parseFloat(baseSalary),
      discountPercentage: parseFloat(discountPercentage),
      hireDate,
      emergencyContact,
      bankDetails,
      notes,
      createdBy: req.user.id
    });

    // Fetch the created employee with user data
    const createdEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "role"]
        }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "create", "employee", employee.id, null, createdEmployee.toJSON(), req);

    res.status(201).json({
      success: true,
      data: createdEmployee,
      message: "Employee created successfully"
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    await AuditLog.logFailedAction(req.user.id, "create", "employee", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to create employee",
      error: error.message
    });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeNumber, department, position, baseSalary, discountPercentage, hireDate, terminationDate, isActive, emergencyContact, bankDetails, notes } = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const oldValues = employee.toJSON();

    // Check if employee number is unique (if being changed)
    if (employeeNumber && employeeNumber !== employee.employeeNumber) {
      const existingNumber = await Employee.findOne({
        where: {
          employeeNumber,
          id: { [Op.ne]: id }
        }
      });
      if (existingNumber) {
        return res.status(400).json({
          success: false,
          message: "Employee number already exists"
        });
      }
    }

    const updateData = {
      updatedBy: req.user.id
    };

    if (employeeNumber !== undefined) updateData.employeeNumber = employeeNumber;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (baseSalary !== undefined) updateData.baseSalary = parseFloat(baseSalary);
    if (discountPercentage !== undefined) updateData.discountPercentage = parseFloat(discountPercentage);
    if (hireDate !== undefined) updateData.hireDate = hireDate;
    if (terminationDate !== undefined) updateData.terminationDate = terminationDate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (bankDetails !== undefined) updateData.bankDetails = bankDetails;
    if (notes !== undefined) updateData.notes = notes;

    await employee.update(updateData);

    // Fetch updated employee with user data
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "role"]
        }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "update", "employee", id, oldValues, updatedEmployee.toJSON(), req);

    res.json({
      success: true,
      data: updatedEmployee,
      message: "Employee updated successfully"
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    await AuditLog.logFailedAction(req.user.id, "update", "employee", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to update employee",
      error: error.message
    });
  }
};

// Delete employee (soft delete by setting isActive to false)
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName"]
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const oldValues = employee.toJSON();

    // Soft delete by setting isActive to false and terminationDate to now
    await employee.update({
      isActive: false,
      terminationDate: new Date(),
      updatedBy: req.user.id
    });

    await AuditLog.logUserAction(req.user.id, "delete", "employee", id, oldValues, { isActive: false, terminationDate: new Date() }, req);

    res.json({
      success: true,
      message: "Employee deactivated successfully"
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    await AuditLog.logFailedAction(req.user.id, "delete", "employee", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to delete employee",
      error: error.message
    });
  }
};

// Get employee statistics
export const getEmployeeStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      Employee.count({ where: { isActive: true } }),
      Employee.count({ where: { isActive: false } }),
      Employee.count({ where: { department: "kitchen", isActive: true } }),
      Employee.count({ where: { department: "service", isActive: true } }),
      Employee.count({ where: { department: "management", isActive: true } }),
      EmployeeUsage.count({
        where: {
          usageDate: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      }),
      EmployeeSettlement.count({
        where: {
          status: "pending"
        }
      })
    ]);

    const [activeEmployees, inactiveEmployees, kitchenStaff, serviceStaff, managementStaff, monthlyUsages, pendingSettlements] = stats;

    const totalEmployees = activeEmployees + inactiveEmployees;

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        departmentBreakdown: {
          kitchen: kitchenStaff,
          service: serviceStaff,
          management: managementStaff,
          other: activeEmployees - kitchenStaff - serviceStaff - managementStaff
        },
        monthlyUsages,
        pendingSettlements
      },
      message: "Employee statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching employee stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee statistics",
      error: error.message
    });
  }
};

// ============================================================================
// EMPLOYEE USAGE TRACKING METHODS
// ============================================================================

// Record employee usage (called from POS)
export const recordEmployeeUsage = async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const {
      usageType, // 'material', 'menu_item', 'stock_entry'
      materialId,
      menuItemId,
      stockEntryId,
      quantity,
      unit,
      unitCost,
      posTransactionId,
      notes
    } = req.body;

    // Validate employee exists and is active
    const employee = await Employee.findOne({
      where: { id: employeeId, isActive: true },
      include: [{ model: User, as: "user" }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or inactive"
      });
    }

    // Validate required fields based on usage type
    if (!usageType || !quantity || !unit || !unitCost) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: usageType, quantity, unit, unitCost"
      });
    }

    // Validate usage type specific fields
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

    // Calculate costs
    const totalCost = parseFloat(quantity) * parseFloat(unitCost);
    const discountApplied = employee.discountPercentage || 0;
    const discountAmount = totalCost * (discountApplied / 100);
    const finalCost = totalCost - discountAmount;

    // Create usage record
    const usage = await EmployeeUsage.create({
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
      discountAmount,
      finalCost,
      posTransactionId: posTransactionId || null,
      recordedBy: req.user.id,
      notes: notes || null
    });

    // Log the action
    await AuditLog.logUserAction(
      req.user.id,
      "create",
      "employee_usage",
      usage.id,
      null,
      {
        employeeId,
        usageType,
        quantity,
        totalCost,
        finalCost,
        posTransactionId
      },
      req
    );

    // Fetch the created usage with associations
    const createdUsage = await EmployeeUsage.findByPk(usage.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName"] }]
        },
        { model: Material, as: "material", attributes: ["name", "category"] },
        { model: MenuItem, as: "menuItem", attributes: ["name", "category"] },
        { model: StockEntry, as: "stockEntry", attributes: ["supplier", "purchaseDate"] }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Employee usage recorded successfully",
      data: createdUsage
    });
  } catch (error) {
    console.error("Error recording employee usage:", error);

    await AuditLog.logFailedAction(req.user?.id, "create", "employee_usage", error.message, req);

    res.status(500).json({
      success: false,
      message: "Failed to record employee usage",
      error: error.message
    });
  }
};

// Get employee usage history
export const getEmployeeUsage = async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const { month, year, usageType, isSettled, page = 1, limit = 50, startDate, endDate } = req.query;

    // Validate employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const where = { employeeId };

    // Apply filters
    if (month && year) {
      where.usageMonth = parseInt(month);
      where.usageYear = parseInt(year);
    }

    if (usageType) {
      where.usageType = usageType;
    }

    if (isSettled !== undefined) {
      where.isSettled = isSettled === "true";
    }

    if (startDate && endDate) {
      where.usageDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: usageRecords } = await EmployeeUsage.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName"] }]
        },
        { model: Material, as: "material", attributes: ["name", "category", "baseUnit"] },
        { model: MenuItem, as: "menuItem", attributes: ["name", "category", "price"] },
        { model: StockEntry, as: "stockEntry", attributes: ["supplier", "purchaseDate"] },
        { model: User, as: "recordedByUser", attributes: ["firstName", "lastName"] }
      ],
      order: [["usageDate", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    // Calculate summary statistics
    const summary = {
      totalRecords: count,
      totalCost: usageRecords.reduce((sum, record) => sum + parseFloat(record.totalCost), 0),
      totalDiscount: usageRecords.reduce((sum, record) => sum + parseFloat(record.discountAmount), 0),
      totalFinalCost: usageRecords.reduce((sum, record) => sum + parseFloat(record.finalCost), 0),
      settledRecords: usageRecords.filter(record => record.isSettled).length,
      unsettledRecords: usageRecords.filter(record => !record.isSettled).length
    };

    await AuditLog.logUserAction(req.user.id, "view", "employee_usage", null, null, { employeeId, filters: { month, year, usageType, isSettled }, count }, req);

    res.json({
      success: true,
      data: {
        usageRecords,
        summary,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count,
          recordsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching employee usage:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee usage",
      error: error.message
    });
  }
};

// ============================================================================
// EMPLOYEE SETTLEMENT METHODS
// ============================================================================

// Get employee settlements
export const getEmployeeSettlements = async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const { page = 1, limit = 12, status, year } = req.query;

    // Validate employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const where = { employeeId };

    if (status) where.status = status;
    if (year) where.settlementYear = parseInt(year);

    const offset = (page - 1) * limit;

    const { count, rows: settlements } = await EmployeeSettlement.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName"] }]
        },
        { model: User, as: "processedByUser", attributes: ["firstName", "lastName"] },
        { model: User, as: "approvedByUser", attributes: ["firstName", "lastName"] }
      ],
      order: [
        ["settlementYear", "DESC"],
        ["settlementMonth", "DESC"]
      ],
      limit: parseInt(limit),
      offset
    });

    await AuditLog.logUserAction(req.user.id, "view", "employee_settlements", null, null, { employeeId, count }, req);

    res.json({
      success: true,
      data: {
        settlements,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count,
          recordsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching employee settlements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee settlements",
      error: error.message
    });
  }
};

// Calculate employee settlement for a specific month/year
export const calculateEmployeeSettlement = async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }

    // Validate employee exists and is active
    const employee = await Employee.findOne({
      where: { id: employeeId, isActive: true },
      include: [{ model: User, as: "user" }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or inactive"
      });
    }

    // Check if settlement already exists for this period
    const existingSettlement = await EmployeeSettlement.findOne({
      where: {
        employeeId,
        settlementMonth: parseInt(month),
        settlementYear: parseInt(year)
      }
    });

    if (existingSettlement) {
      return res.status(400).json({
        success: false,
        message: "Settlement already exists for this period",
        data: existingSettlement
      });
    }

    // Get unsettled usage for the specified period
    const usageRecords = await EmployeeUsage.findAll({
      where: {
        employeeId,
        usageMonth: parseInt(month),
        usageYear: parseInt(year),
        isSettled: false
      },
      include: [
        { model: Material, as: "material", attributes: ["name", "category"] },
        { model: MenuItem, as: "menuItem", attributes: ["name", "category"] },
        { model: StockEntry, as: "stockEntry", attributes: ["supplier"] }
      ]
    });

    // Calculate totals
    const totalUsageCost = usageRecords.reduce((sum, record) => sum + parseFloat(record.totalCost), 0);
    const totalDiscountAmount = usageRecords.reduce((sum, record) => sum + parseFloat(record.discountAmount), 0);
    const totalDeduction = usageRecords.reduce((sum, record) => sum + parseFloat(record.finalCost), 0);
    const usageItemsCount = usageRecords.length;

    // Calculate final salary
    const baseSalary = parseFloat(employee.baseSalary);
    const finalSalary = baseSalary - totalDeduction;

    // Prepare settlement data breakdown
    const settlementData = {
      period: { month: parseInt(month), year: parseInt(year) },
      employee: {
        id: employee.id,
        name: employee.user ? `${employee.user.firstName} ${employee.user.lastName}` : "Unknown",
        employeeNumber: employee.employeeNumber,
        department: employee.department,
        discountPercentage: employee.discountPercentage
      },
      calculations: {
        baseSalary,
        totalUsageCost,
        totalDiscountAmount,
        totalDeduction,
        finalSalary,
        usageItemsCount
      },
      usageBreakdown: usageRecords.map(record => ({
        id: record.id,
        usageType: record.usageType,
        itemName: record.material?.name || record.menuItem?.name || "Unknown",
        quantity: record.quantity,
        unit: record.unit,
        unitCost: record.unitCost,
        totalCost: record.totalCost,
        discountApplied: record.discountApplied,
        discountAmount: record.discountAmount,
        finalCost: record.finalCost,
        usageDate: record.usageDate
      }))
    };

    res.json({
      success: true,
      message: "Settlement calculation completed",
      data: {
        calculatedSettlement: {
          employeeId,
          settlementMonth: parseInt(month),
          settlementYear: parseInt(year),
          baseSalary,
          totalUsageCost,
          totalDiscountAmount,
          totalDeduction,
          finalSalary,
          usageItemsCount,
          settlementData
        },
        canCreateSettlement: usageItemsCount > 0
      }
    });
  } catch (error) {
    console.error("Error calculating employee settlement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate employee settlement",
      error: error.message
    });
  }
};

// Create employee settlement
export const createSettlement = async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const { settlementMonth, settlementYear, bonusAmount = 0, penaltyAmount = 0, notes } = req.body;

    if (!settlementMonth || !settlementYear) {
      return res.status(400).json({
        success: false,
        message: "Settlement month and year are required"
      });
    }

    // Validate employee exists and is active
    const employee = await Employee.findOne({
      where: { id: employeeId, isActive: true },
      include: [{ model: User, as: "user" }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or inactive"
      });
    }

    // Check if settlement already exists
    const existingSettlement = await EmployeeSettlement.findOne({
      where: {
        employeeId,
        settlementMonth: parseInt(settlementMonth),
        settlementYear: parseInt(settlementYear)
      }
    });

    if (existingSettlement) {
      return res.status(400).json({
        success: false,
        message: "Settlement already exists for this period"
      });
    }

    // Get unsettled usage for the period
    const usageRecords = await EmployeeUsage.findAll({
      where: {
        employeeId,
        usageMonth: parseInt(settlementMonth),
        usageYear: parseInt(settlementYear),
        isSettled: false
      }
    });

    // Calculate totals
    const totalUsageCost = usageRecords.reduce((sum, record) => sum + parseFloat(record.totalCost), 0);
    const totalDiscountAmount = usageRecords.reduce((sum, record) => sum + parseFloat(record.discountAmount), 0);
    const totalDeduction = usageRecords.reduce((sum, record) => sum + parseFloat(record.finalCost), 0);
    const usageItemsCount = usageRecords.length;

    // Calculate final salary with bonus/penalty
    const baseSalary = parseFloat(employee.baseSalary);
    const finalSalary = baseSalary - totalDeduction + parseFloat(bonusAmount) - parseFloat(penaltyAmount);

    // Create settlement
    const settlement = await EmployeeSettlement.create({
      employeeId,
      settlementMonth: parseInt(settlementMonth),
      settlementYear: parseInt(settlementYear),
      baseSalary,
      totalUsageCost,
      totalDiscountAmount,
      totalDeduction,
      bonusAmount: parseFloat(bonusAmount),
      penaltyAmount: parseFloat(penaltyAmount),
      finalSalary,
      usageItemsCount,
      processedBy: req.user.id,
      notes: notes || null,
      settlementData: {
        period: { month: parseInt(settlementMonth), year: parseInt(settlementYear) },
        employee: {
          id: employee.id,
          name: employee.user ? `${employee.user.firstName} ${employee.user.lastName}` : "Unknown",
          employeeNumber: employee.employeeNumber,
          department: employee.department
        },
        usageRecordIds: usageRecords.map(record => record.id)
      }
    });

    // Mark usage records as settled
    await EmployeeUsage.update(
      { isSettled: true, settlementId: settlement.id },
      {
        where: {
          id: { [Op.in]: usageRecords.map(record => record.id) }
        }
      }
    );

    // Log the action
    await AuditLog.logUserAction(
      req.user.id,
      "create",
      "employee_settlement",
      settlement.id,
      null,
      {
        employeeId,
        period: `${settlementMonth}/${settlementYear}`,
        finalSalary,
        usageItemsCount
      },
      req
    );

    // Fetch the created settlement with associations
    const createdSettlement = await EmployeeSettlement.findByPk(settlement.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName"] }]
        },
        { model: User, as: "processedByUser", attributes: ["firstName", "lastName"] }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Employee settlement created successfully",
      data: createdSettlement
    });
  } catch (error) {
    console.error("Error creating employee settlement:", error);

    await AuditLog.logFailedAction(req.user?.id, "create", "employee_settlement", error.message, req);

    res.status(500).json({
      success: false,
      message: "Failed to create employee settlement",
      error: error.message
    });
  }
};

// Get settlement by ID
export const getSettlementById = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = await EmployeeSettlement.findByPk(settlementId, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName"] }]
        },
        { model: User, as: "processedByUser", attributes: ["firstName", "lastName"] },
        { model: User, as: "approvedByUser", attributes: ["firstName", "lastName"] }
      ]
    });

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found"
      });
    }

    // Get associated usage records
    const usageRecords = await EmployeeUsage.findAll({
      where: { settlementId },
      include: [
        { model: Material, as: "material", attributes: ["name", "category"] },
        { model: MenuItem, as: "menuItem", attributes: ["name", "category"] },
        { model: StockEntry, as: "stockEntry", attributes: ["supplier"] }
      ],
      order: [["usageDate", "DESC"]]
    });

    await AuditLog.logUserAction(req.user.id, "view", "employee_settlement", settlementId, null, null, req);

    res.json({
      success: true,
      data: {
        settlement,
        usageRecords
      }
    });
  } catch (error) {
    console.error("Error fetching settlement:", error);
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
    const { settlementId } = req.params;
    const { notes } = req.body;

    const settlement = await EmployeeSettlement.findByPk(settlementId);

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

    // Update settlement
    await settlement.update({
      status: "approved",
      approvedBy: req.user.id,
      approvedAt: new Date(),
      notes: notes || settlement.notes
    });

    // Log the action
    await AuditLog.logUserAction(req.user.id, "approve", "employee_settlement", settlementId, { status: "pending" }, { status: "approved", approvedBy: req.user.id }, req);

    // Fetch updated settlement
    const updatedSettlement = await EmployeeSettlement.findByPk(settlementId, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName"] }]
        },
        { model: User, as: "processedByUser", attributes: ["firstName", "lastName"] },
        { model: User, as: "approvedByUser", attributes: ["firstName", "lastName"] }
      ]
    });

    res.json({
      success: true,
      message: "Settlement approved successfully",
      data: updatedSettlement
    });
  } catch (error) {
    console.error("Error approving settlement:", error);

    await AuditLog.logFailedAction(req.user?.id, "approve", "employee_settlement", error.message, req);

    res.status(500).json({
      success: false,
      message: "Failed to approve settlement",
      error: error.message
    });
  }
};

// Mark settlement as paid
export const markSettlementAsPaid = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const { paymentMethod, paymentReference, paymentDate, notes } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required"
      });
    }

    const settlement = await EmployeeSettlement.findByPk(settlementId);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found"
      });
    }

    if (settlement.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Cannot mark settlement as paid. Current status: ${settlement.status}. Settlement must be approved first.`
      });
    }

    const oldValues = {
      status: settlement.status,
      paymentDate: settlement.paymentDate,
      paymentMethod: settlement.paymentMethod,
      paymentReference: settlement.paymentReference
    };

    // Update settlement
    await settlement.update({
      status: "paid",
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      paymentReference: paymentReference || null,
      notes: notes || settlement.notes
    });

    // Log the action
    await AuditLog.logUserAction(
      req.user.id,
      "pay",
      "employee_settlement",
      settlementId,
      oldValues,
      {
        status: "paid",
        paymentDate: settlement.paymentDate,
        paymentMethod,
        paymentReference
      },
      req
    );

    // Fetch updated settlement
    const updatedSettlement = await EmployeeSettlement.findByPk(settlementId, {
      include: [
        {
          model: Employee,
          as: "employee",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName"] }]
        },
        { model: User, as: "processedByUser", attributes: ["firstName", "lastName"] },
        { model: User, as: "approvedByUser", attributes: ["firstName", "lastName"] }
      ]
    });

    res.json({
      success: true,
      message: "Settlement marked as paid successfully",
      data: updatedSettlement
    });
  } catch (error) {
    console.error("Error marking settlement as paid:", error);

    await AuditLog.logFailedAction(req.user?.id, "pay", "employee_settlement", error.message, req);

    res.status(500).json({
      success: false,
      message: "Failed to mark settlement as paid",
      error: error.message
    });
  }
};
