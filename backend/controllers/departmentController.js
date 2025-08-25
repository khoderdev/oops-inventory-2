import { Op } from "sequelize";
import { AuditLog, Department, Employee, User } from "../models/index.js";

// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 50, search } = req.query;

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === "true" || isActive === true;
    } else {
      where.isActive = true;
    }

    // Add search functionality
    if (search) {
      where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { code: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }];
    }

    const offset = (page - 1) * limit;

    const { count, rows: departments } = await Department.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: "manager",
          attributes: ["id", "firstName", "lastName", "employeeNumber"],
          required: false
        },
        {
          model: Employee,
          as: "employees",
          attributes: ["id"],
          required: false,
          where: { isActive: true }
        }
      ],
      order: [["name", "ASC"]],
      limit: parseInt(limit),
      offset,
      distinct: true // Important for count with includes
    });

    // Add employee count to each department
    const departmentsWithCount = departments.map(dept => {
      const deptJson = dept.toJSON();
      deptJson.employeeCount = dept.employees ? dept.employees.length : 0;
      delete deptJson.employees; // Remove the employees array
      return deptJson;
    });

    await AuditLog.logUserAction(req.user.id, "view", "departments", null, null, { count, filters: { isActive, search } }, req);

    res.json({
      success: true,
      data: {
        departments: departmentsWithCount,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      },
      message: `Retrieved ${departments.length} departments`
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    await AuditLog.logFailedAction(req.user.id, "view", "departments", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message
    });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "manager",
          attributes: ["id", "firstName", "lastName", "employeeNumber", "position", "email", "phone"],
          required: false
        },
        {
          model: Employee,
          as: "employees",
          where: { isActive: true },
          required: false,
          attributes: ["id", "firstName", "lastName", "employeeNumber", "position", "hireDate"],
          order: [
            ["firstName", "ASC"],
            ["lastName", "ASC"]
          ]
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "firstName", "lastName"],
          required: false
        },
        {
          model: User,
          as: "updater",
          attributes: ["id", "firstName", "lastName"],
          required: false
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    await AuditLog.logUserAction(req.user.id, "view", "department", id, null, null, req);

    res.json({
      success: true,
      data: department,
      message: "Department retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    await AuditLog.logFailedAction(req.user.id, "view", "department", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department",
      error: error.message
    });
  }
};

// Create new department
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, managerId, costCenter } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, code"
      });
    }

    // Check if name is unique
    const existingName = await Department.findOne({
      where: { name }
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "Department name already exists"
      });
    }

    // Check if code is unique
    const existingCode = await Department.findOne({
      where: { code: code.toUpperCase() }
    });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Department code already exists"
      });
    }

    // Check if manager exists (if provided)
    if (managerId) {
      const manager = await Employee.findByPk(managerId);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager employee not found"
        });
      }
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description: description || null,
      managerId: managerId || null,
      costCenter: costCenter || null,
      createdBy: req.user.id
    });

    // Fetch the created department with associations
    const createdDepartment = await Department.findByPk(department.id, {
      include: [
        {
          model: Employee,
          as: "manager",
          attributes: ["id", "firstName", "lastName", "employeeNumber"],
          required: false
        }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "create", "department", department.id, null, createdDepartment.toJSON(), req);

    res.status(201).json({
      success: true,
      data: createdDepartment,
      message: "Department created successfully"
    });
  } catch (error) {
    console.error("Error creating department:", error);
    await AuditLog.logFailedAction(req.user.id, "create", "department", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to create department",
      error: error.message
    });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, managerId, costCenter, isActive } = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    const oldValues = department.toJSON();

    // Check if name is unique (if being changed)
    if (name && name !== department.name) {
      const existingName = await Department.findOne({
        where: {
          name,
          id: { [Op.ne]: id }
        }
      });
      if (existingName) {
        return res.status(400).json({
          success: false,
          message: "Department name already exists"
        });
      }
    }

    // Check if code is unique (if being changed)
    if (code && code.toUpperCase() !== department.code) {
      const existingCode = await Department.findOne({
        where: {
          code: code.toUpperCase(),
          id: { [Op.ne]: id }
        }
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: "Department code already exists"
        });
      }
    }

    // Check if manager exists (if being changed)
    if (managerId && managerId !== department.managerId) {
      const manager = await Employee.findByPk(managerId);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager employee not found"
        });
      }
    }

    const updateData = {
      updatedBy: req.user.id
    };

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (costCenter !== undefined) updateData.costCenter = costCenter;
    if (isActive !== undefined) updateData.isActive = isActive;

    await department.update(updateData);

    // Fetch updated department with associations
    const updatedDepartment = await Department.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "manager",
          attributes: ["id", "firstName", "lastName", "employeeNumber"],
          required: false
        }
      ]
    });

    await AuditLog.logUserAction(req.user.id, "update", "department", id, oldValues, updatedDepartment.toJSON(), req);

    res.json({
      success: true,
      data: updatedDepartment,
      message: "Department updated successfully"
    });
  } catch (error) {
    console.error("Error updating department:", error);
    await AuditLog.logFailedAction(req.user.id, "update", "department", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error.message
    });
  }
};

// Delete department (soft delete by setting isActive to false)
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    // Check if department has active employees
    const employeeCount = await department.getEmployeeCount();
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${employeeCount} active employees. Reassign employees first.`
      });
    }

    const oldValues = department.toJSON();

    // Soft delete by setting isActive to false
    await department.update({
      isActive: false,
      updatedBy: req.user.id
    });

    await AuditLog.logUserAction(req.user.id, "delete", "department", id, oldValues, { isActive: false }, req);

    res.json({
      success: true,
      message: "Department deactivated successfully"
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    await AuditLog.logFailedAction(req.user.id, "delete", "department", error.message, req);
    res.status(500).json({
      success: false,
      message: "Failed to delete department",
      error: error.message
    });
  }
};

// Get department statistics
export const getDepartmentStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      Department.count({ where: { isActive: true } }),
      Department.count({ where: { isActive: false } }),
      Employee.count({ where: { isActive: true } }),
      // Count employees by department
      Employee.count({
        where: { isActive: true },
        include: [
          {
            model: Department,
            as: "department",
            where: { isActive: true },
            attributes: []
          }
        ]
      })
    ]);

    const [activeDepartments, inactiveDepartments, totalEmployees, employeesWithDepartment] = stats;

    // Get employee count per department
    const departments = await Department.findAll({
      where: { isActive: true },
      include: [
        {
          model: Employee,
          as: "employees",
          attributes: [],
          where: { isActive: true },
          required: false
        }
      ],
      attributes: ["id", "name", "code", [sequelize.fn("COUNT", sequelize.col("employees.id")), "employeeCount"]],
      group: ["Department.id"],
      order: [["name", "ASC"]],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalDepartments: activeDepartments + inactiveDepartments,
        activeDepartments,
        inactiveDepartments,
        totalEmployees,
        employeesWithDepartment,
        employeesWithoutDepartment: totalEmployees - employeesWithDepartment,
        departments
      },
      message: "Department statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching department stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department statistics",
      error: error.message
    });
  }
};
