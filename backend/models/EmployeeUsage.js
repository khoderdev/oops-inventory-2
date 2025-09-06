import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EmployeeUsage = sequelize.define(
  "EmployeeUsage",
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
    usageType: {
      type: DataTypes.ENUM("material", "menu_item", "stock_entry"),
      allowNull: false
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "materials",
        key: "id"
      },
      comment: "Reference to Material (for material usage)"
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: {
      //   model: "menuItems",
      //   key: "id"
      // },
      comment: "Reference to MenuItem (for menu item usage)"
    },
    stockEntryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: {
      //   model: "stockEntries",
      //   key: "id"
      // },
      comment: "Reference to StockEntry (for specific stock usage)"
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: {
          args: [0.001],
          msg: "Quantity must be positive"
        }
      },
      comment: "Quantity of item used"
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "Unit of measurement"
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Unit cost must be positive"
        }
      },
      comment: "Cost per unit at time of usage"
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Total cost must be positive"
        }
      },
      comment: "Total cost of usage (quantity × unitCost)"
    },
    discountApplied: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Discount percentage applied at time of usage"
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: "Actual discount amount in currency"
    },
    finalCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Final cost after discount (totalCost - discountAmount)"
    },
    usageDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "When the usage occurred"
    },
    usageMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Month of usage (1-12) for settlement calculations"
    },
    usageYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Year of usage for settlement calculations"
    },
    posTransactionId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "POS transaction ID if usage was through POS"
    },
    recordedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      comment: "User who recorded this usage"
    },
    isSettled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether this usage has been included in salary settlement"
    },
    settlementId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employee_settlements",
        key: "id"
      },
      comment: "Reference to settlement record"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional notes about the usage"
    }
  },
  {
    tableName: "employee_usages",
    timestamps: true,
    indexes: [
      {
        fields: ["employeeId"]
      },
      {
        fields: ["usageType"]
      },
      {
        fields: ["usageDate"]
      },
      {
        fields: ["usageMonth", "usageYear"]
      },
      {
        fields: ["isSettled"]
      },
      {
        fields: ["materialId"]
      },
      {
        fields: ["menuItemId"]
      },
      {
        fields: ["stockEntryId"]
      },
      {
        fields: ["posTransactionId"]
      }
    ],
    hooks: {
      beforeCreate: (usage) => {
        const date = new Date(usage.usageDate);
        usage.usageMonth = date.getMonth() + 1;
        usage.usageYear = date.getFullYear();
        
        // Calculate discount and final cost
        usage.discountAmount = usage.totalCost * (usage.discountApplied / 100);
        usage.finalCost = usage.totalCost - usage.discountAmount;
      },
      beforeUpdate: (usage) => {
        if (usage.changed('usageDate')) {
          const date = new Date(usage.usageDate);
          usage.usageMonth = date.getMonth() + 1;
          usage.usageYear = date.getFullYear();
        }
        
        if (usage.changed('totalCost') || usage.changed('discountApplied')) {
          usage.discountAmount = usage.totalCost * (usage.discountApplied / 100);
          usage.finalCost = usage.totalCost - usage.discountAmount;
        }
      }
    }
  }
);

// Static methods
EmployeeUsage.getMonthlyUsage = function(employeeId, month, year) {
  return this.findAll({
    where: {
      employeeId,
      usageMonth: month,
      usageYear: year,
      isSettled: false
    },
    include: [
      {
        model: sequelize.models.Material,
        as: 'material',
        attributes: ['id', 'name', 'categoryId', 'baseUnit']
      },
      {
        model: sequelize.models.MenuItem,
        as: 'menuItem',
        attributes: ['id', 'name', 'description', 'categoryId']
      },
      {
        model: sequelize.models.StockEntry,
        as: 'stockEntry',
        attributes: ['id', 'supplierName', 'purchaseDate']
      }
    ],
    order: [['usageDate', 'DESC']]
  });
};

EmployeeUsage.getUnsettledUsage = function(employeeId) {
  return this.findAll({
    where: {
      employeeId,
      isSettled: false
    },
    include: [
      {
        model: sequelize.models.Material,
        as: 'material',
        attributes: ['id', 'name', 'categoryId']
      },
      {
        model: sequelize.models.MenuItem,
        as: 'menuItem',
        attributes: ['id', 'name', 'categoryId']
      }
    ],
    order: [['usageDate', 'DESC']]
  });
};

EmployeeUsage.calculateMonthlyTotal = function(employeeId, month, year) {
  return this.findAll({
    where: {
      employeeId,
      usageMonth: month,
      usageYear: year,
      isSettled: false
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalUsageCost'],
      [sequelize.fn('SUM', sequelize.col('discountAmount')), 'totalDiscountAmount'],
      [sequelize.fn('SUM', sequelize.col('finalCost')), 'totalFinalCost'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'usageCount']
    ],
    raw: true
  }).then(result => result[0] || {
    totalUsageCost: 0,
    totalDiscountAmount: 0,
    totalFinalCost: 0,
    usageCount: 0
  });
};

// Calculate totals for a specific settlement (including already settled usages)
EmployeeUsage.calculateSettlementTotal = function(employeeId, settlementId) {
  return this.findAll({
    where: {
      employeeId,
      settlementId,
      isSettled: true
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalUsageCost'],
      [sequelize.fn('SUM', sequelize.col('discountAmount')), 'totalDiscountAmount'],
      [sequelize.fn('SUM', sequelize.col('finalCost')), 'totalFinalCost'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'usageCount']
    ],
    raw: true
  }).then(result => result[0] || {
    totalUsageCost: 0,
    totalDiscountAmount: 0,
    totalFinalCost: 0,
    usageCount: 0
  });
};

export default EmployeeUsage;
