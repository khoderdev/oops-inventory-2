import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EmployeeSettlement = sequelize.define(
  "EmployeeSettlement",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employees",
        key: "id"
      },
      comment: "Reference to Employee"
    },
    settlementMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      },
      comment: "Month of settlement (1-12)"
    },
    settlementYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2100
      },
      comment: "Year of settlement"
    },
    baseSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Base salary for the month"
    },
    totalUsageCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Total cost of items used before discount"
    },
    totalDiscountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Total discount amount applied"
    },
    totalDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Final deduction amount (totalUsageCost - totalDiscountAmount)"
    },
    bonusAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Additional bonus amount"
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Penalty amount (if any)"
    },
    finalSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Final salary after all calculations"
    },
    usageItemsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Number of usage items included in settlement"
    },
    settlementDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "When the settlement was processed"
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When the salary was actually paid"
    },
    paymentMethod: {
      type: DataTypes.ENUM("bank_transfer", "cash", "check", "mobile_payment", "other"),
      allowNull: true,
      comment: "Method used for salary payment"
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Payment reference number or transaction ID"
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "paid", "disputed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
      comment: "Settlement status"
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      comment: "User who approved the settlement"
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When the settlement was approved"
    },
    processedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      comment: "User who processed the settlement"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional notes about the settlement"
    },
    settlementData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Detailed breakdown of settlement calculations"
    }
  },
  {
    tableName: "employee_settlements",
    timestamps: true,
    indexes: [
      {
        fields: ["employeeId"]
      },
      {
        fields: ["settlementMonth", "settlementYear"]
      },
      {
        fields: ["status"]
      },
      {
        fields: ["settlementDate"]
      },
      {
        fields: ["paymentDate"]
      },
      {
        unique: true,
        fields: ["employeeId", "settlementMonth", "settlementYear"],
        name: "unique_employee_month_year"
      }
    ],
    hooks: {
      beforeCreate: (settlement) => {
        // Calculate final salary
        settlement.finalSalary = settlement.baseSalary 
          - settlement.totalDeduction 
          + settlement.bonusAmount 
          - settlement.penaltyAmount;
      },
      beforeUpdate: (settlement) => {
        if (settlement.changed('baseSalary') || 
            settlement.changed('totalDeduction') || 
            settlement.changed('bonusAmount') || 
            settlement.changed('penaltyAmount')) {
          settlement.finalSalary = settlement.baseSalary 
            - settlement.totalDeduction 
            + settlement.bonusAmount 
            - settlement.penaltyAmount;
        }
        
        // Set approval timestamp
        if (settlement.changed('status') && settlement.status === 'approved' && !settlement.approvedAt) {
          settlement.approvedAt = new Date();
        }
      }
    }
  }
);

// Instance methods
EmployeeSettlement.prototype.markAsPaid = function(paymentMethod, paymentReference, paidBy) {
  this.status = 'paid';
  this.paymentDate = new Date();
  this.paymentMethod = paymentMethod;
  this.paymentReference = paymentReference;
  this.updatedBy = paidBy;
  return this.save();
};

EmployeeSettlement.prototype.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return this.save();
};

EmployeeSettlement.prototype.getSettlementSummary = function() {
  return {
    id: this.id,
    employeeId: this.employeeId,
    period: `${this.settlementYear}-${String(this.settlementMonth).padStart(2, '0')}`,
    baseSalary: parseFloat(this.baseSalary),
    totalUsageCost: parseFloat(this.totalUsageCost),
    totalDiscountAmount: parseFloat(this.totalDiscountAmount),
    totalDeduction: parseFloat(this.totalDeduction),
    bonusAmount: parseFloat(this.bonusAmount),
    penaltyAmount: parseFloat(this.penaltyAmount),
    finalSalary: parseFloat(this.finalSalary),
    usageItemsCount: this.usageItemsCount,
    status: this.status,
    settlementDate: this.settlementDate,
    paymentDate: this.paymentDate,
    paymentMethod: this.paymentMethod
  };
};

// Static methods
EmployeeSettlement.getByEmployee = function(employeeId, limit = 12) {
  return this.findAll({
    where: { employeeId },
    order: [['settlementYear', 'DESC'], ['settlementMonth', 'DESC']],
    limit,
    include: [{
      model: sequelize.models.Employee,
      as: 'employee',
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'username']
      }]
    }]
  });
};

EmployeeSettlement.getByPeriod = function(month, year) {
  return this.findAll({
    where: {
      settlementMonth: month,
      settlementYear: year
    },
    include: [{
      model: sequelize.models.Employee,
      as: 'employee',
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'username']
      }]
    }],
    order: [['employee', 'employeeNumber', 'ASC']]
  });
};

EmployeeSettlement.getPendingSettlements = function() {
  return this.findAll({
    where: {
      status: 'pending'
    },
    include: [{
      model: sequelize.models.Employee,
      as: 'employee',
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'username']
      }]
    }],
    order: [['settlementDate', 'ASC']]
  });
};

EmployeeSettlement.calculateSettlement = async function(employeeId, month, year) {
  const employee = await sequelize.models.Employee.findByPk(employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const usageTotal = await sequelize.models.EmployeeUsage.calculateMonthlyTotal(employeeId, month, year);
  
  return {
    baseSalary: parseFloat(employee.baseSalary),
    totalUsageCost: parseFloat(usageTotal.totalUsageCost || 0),
    totalDiscountAmount: parseFloat(usageTotal.totalDiscountAmount || 0),
    totalDeduction: parseFloat(usageTotal.totalFinalCost || 0),
    usageItemsCount: parseInt(usageTotal.usageCount || 0),
    finalSalary: parseFloat(employee.baseSalary) - parseFloat(usageTotal.totalFinalCost || 0)
  };
};

export default EmployeeSettlement;
