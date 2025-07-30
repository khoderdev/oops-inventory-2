import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Employee = sequelize.define(
  "Employee",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "id"
      },
      comment: "Reference to User model for authentication"
    },
    employeeNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: {
        msg: "Employee number already exists"
      },
      validate: {
        len: {
          args: [3, 20],
          msg: "Employee number must be between 3 and 20 characters"
        }
      },
      comment: "Unique employee identifier"
    },
    department: {
      type: DataTypes.ENUM("kitchen", "service", "management", "cleaning", "security", "other"),
      allowNull: false,
      defaultValue: "service",
      comment: "Employee department"
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: "Position must be between 2 and 100 characters"
        }
      },
      comment: "Job position/title"
    },
    baseSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Base salary must be positive"
        }
      },
      comment: "Monthly base salary amount"
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: "Discount percentage must be positive"
        },
        max: {
          args: [100],
          msg: "Discount percentage cannot exceed 100%"
        }
      },
      comment: "Employee discount percentage (0-100)"
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Date when employee was hired"
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Date when employee was terminated (null if active)"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Whether employee is currently active"
    },
    emergencyContact: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Emergency contact information",
      validate: {
        isValidContact(value) {
          if (value && (!value.name || !value.phone)) {
            throw new Error("Emergency contact must include name and phone");
          }
        }
      }
    },
    bankDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Bank account details for salary payments",
      validate: {
        isValidBankDetails(value) {
          if (value && (!value.accountNumber || !value.bankName)) {
            throw new Error("Bank details must include account number and bank name");
          }
        }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional notes about the employee"
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      comment: "User who created this employee record"
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      comment: "User who last updated this employee record"
    }
  },
  {
    tableName: "employees",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"]
      },
      {
        fields: ["employeeNumber"]
      },
      {
        fields: ["department"]
      },
      {
        fields: ["isActive"]
      },
      {
        fields: ["hireDate"]
      }
    ],
    hooks: {
      beforeCreate: (employee) => {
        // Auto-generate employee number if not provided
        if (!employee.employeeNumber) {
          const timestamp = Date.now().toString().slice(-6);
          employee.employeeNumber = `EMP${timestamp}`;
        }
      }
    }
  }
);

// Instance methods
Employee.prototype.getFullName = function() {
  // Check both User (capital U) and user (lowercase u) for compatibility
  const userData = this.User || this.user;
  return userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown Employee';
};

Employee.prototype.calculateMonthlyDeduction = function(usageAmount) {
  const discountAmount = usageAmount * (this.discountPercentage / 100);
  return usageAmount - discountAmount;
};

Employee.prototype.isCurrentlyActive = function() {
  return this.isActive && !this.terminationDate;
};

// Static methods
Employee.getActiveEmployees = function() {
  return this.findAll({
    where: {
      isActive: true,
      terminationDate: null
    },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'username', 'firstName', 'lastName', 'role']
    }],
    order: [['employeeNumber', 'ASC']]
  });
};

Employee.getByDepartment = function(department) {
  return this.findAll({
    where: {
      department,
      isActive: true,
      terminationDate: null
    },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'username', 'firstName', 'lastName']
    }]
  });
};

export default Employee;
