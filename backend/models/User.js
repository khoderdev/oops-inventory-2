import bcrypt from "bcrypt";
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: "Username already exists"
      },
      validate: {
        len: {
          args: [3, 50],
          msg: "Username must be between 3 and 50 characters"
        },
        isAlphanumeric: {
          msg: "Username can only contain letters and numbers"
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: "Password must be at least 6 characters long"
        }
      }
    },
    pin: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isValidPin(value) {
          if (value && !value.startsWith("$2b$")) {
            // Only validate raw PIN (not hashed)
            if (!/^\d{6}$/.test(value)) {
              throw new Error("PIN must be exactly 6 digits");
            }
          }
        }
      }
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: {
          args: [1, 50],
          msg: "First name must be between 1 and 50 characters"
        }
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: {
          args: [1, 50],
          msg: "Last name must be between 1 and 50 characters"
        }
      }
    },

    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        len: {
          args: [10, 15],
          msg: "Phone number must be between 10 and 15 characters"
        }
      }
    },

    role: {
      type: DataTypes.ENUM("admin", "manager", "staff"),
      allowNull: false,
      defaultValue: "staff",
      validate: {
        isIn: {
          args: [["admin", "manager", "staff"]],
          msg: "Role must be admin, manager, or staff"
        }
      }
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: "Specific permissions for this user, overrides role defaults"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    }
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async user => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
        if (user.pin) {
          const salt = await bcrypt.genSalt(12);
          user.pin = await bcrypt.hash(user.pin, salt);
        }
      },
      beforeUpdate: async user => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
        if (user.changed("pin")) {
          const salt = await bcrypt.genSalt(12);
          user.pin = await bcrypt.hash(user.pin, salt);
        }
      }
    }
  }
);

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.comparePin = async function (candidatePin) {
  if (!this.pin) {
    return false;
  }
  return bcrypt.compare(candidatePin, this.pin);
};

User.prototype.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

User.prototype.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.hasPermission = function (permission) {
  // Check specific user permissions first
  if (this.permissions && this.permissions[permission] !== undefined) {
    return this.permissions[permission];
  }

  // Fall back to role-based permissions
  return this.getRolePermissions()[permission] || false;
};

User.prototype.getRolePermissions = function () {
  const rolePermissions = {
    admin: {
      // === USER MANAGEMENT ===
      "users.create": true,
      "users.read": true,
      "users.update": true,
      "users.delete": true,
      "users.resetPassword": true,
      "users.unlock": true,
      "users.managePermissions": true,
      "users.viewActivity": true,
      "users.impersonate": true,

      // === AUTHENTICATION & SECURITY ===
      "auth.manageSessions": true,
      "auth.viewAuditLogs": true,
      "auth.securitySettings": true,
      "auth.twoFactor": true,
      "auth.apiKeys": true,

      // === MATERIALS MANAGEMENT ===
      "materials.create": true,
      "materials.read": true,
      "materials.update": true,
      "materials.delete": true,
      "materials.import": true,
      "materials.export": true,
      "materials.bulkOperations": true,
      "materials.viewCosts": true,
      "materials.manageCategories": true,

      // === INVENTORY & STOCK MANAGEMENT ===
      "stock.create": true,
      "stock.read": true,
      "stock.update": true,
      "stock.delete": true,
      "stock.adjust": true,
      "stock.transfer": true,
      "stock.wasteRecord": true,
      "stock.viewCosts": true,
      "stock.bulkOperations": true,
      "stock.alerts": true,
      "stock.forecasting": true,

      // === SALES & TRANSACTIONS ===
      "sales.create": true,
      "sales.read": true,
      "sales.update": true,
      "sales.delete": true,
      "sales.revert": true,
      "sales.refund": true,
      "sales.viewProfits": true,
      "sales.discount": true,
      "sales.void": true,
      "sales.export": true,

      // === ORDERS MANAGEMENT ===
      "orders.create": true,
      "orders.read": true,
      "orders.update": true,
      "orders.delete": true,
      "orders.void": true,
      "orders.complete": true,
      "orders.cancel": true,
      "orders.viewAll": true,
      "orders.manageQueue": true,

      // === POS SYSTEM ===
      "pos.access": true,
      "pos.cashDrawer": true,
      "pos.receipts": true,
      "pos.payments": true,
      "pos.tables": true,
      "pos.kitchenDisplay": true,
      "pos.customerDisplay": true,

      // === MENU MANAGEMENT ===
      "menuItems.create": true,
      "menuItems.read": true,
      "menuItems.update": true,
      "menuItems.delete": true,
      "menuItems.pricing": true,
      "menuItems.categories": true,
      "menuItems.recipes": true,
      "menuItems.nutritional": true,
      "menuItems.availability": true,

      // === SECTIONS & ASSIGNMENTS ===
      "sections.create": true,
      "sections.read": true,
      "sections.update": true,
      "sections.delete": true,
      "assignments.create": true,
      "assignments.read": true,
      "assignments.update": true,
      "assignments.delete": true,
      "assignments.bulk": true,

      // === DAILY OPERATIONS ===
      "dayOperations.create": true,
      "dayOperations.read": true,
      "dayOperations.update": true,
      "dayOperations.delete": true,
      "dayOperations.close": true,
      "dayOperations.reopen": true,
      "dayOperations.cashCount": true,

      // === REPORTS & ANALYTICS ===
      "reports.read": true,
      "reports.sales": true,
      "reports.inventory": true,
      "reports.financial": true,
      "reports.waste": true,
      "reports.staff": true,
      "reports.customer": true,
      "reports.export": true,
      "reports.schedule": true,
      "analytics.dashboard": true,
      "analytics.trends": true,
      "analytics.forecasting": true,
      "analytics.profitability": true,

      // === FINANCIAL MANAGEMENT ===
      "finance.viewCosts": true,
      "finance.viewProfits": true,
      "finance.pricing": true,
      "finance.budgets": true,
      "finance.expenses": true,
      "finance.taxReports": true,

      // === CUSTOMER MANAGEMENT ===
      "customers.create": true,
      "customers.read": true,
      "customers.update": true,
      "customers.delete": true,
      "customers.loyalty": true,
      "customers.feedback": true,

      // === SUPPLIERS & PROCUREMENT ===
      "suppliers.create": true,
      "suppliers.read": true,
      "suppliers.update": true,
      "suppliers.delete": true,
      "procurement.orders": true,
      "procurement.receiving": true,

      // === SYSTEM ADMINISTRATION ===
      "system.settings": true,
      "system.backup": true,
      "system.restore": true,
      "system.maintenance": true,
      "system.logs": true,
      "system.integrations": true,
      "system.database": true,
      "system.notifications": true,

      // === COMPLIANCE & AUDIT ===
      "compliance.foodSafety": true,
      "compliance.healthDept": true,
      "compliance.tax": true,
      "audit.trails": true,
      "audit.reports": true,

      // === DEPARTMENT MANAGEMENT ===
      "department.create": true,
      "department.read": true,
      "department.update": true,
      "department.delete": true,

      // === EMPLOYEE MANAGEMENT ===
      "employee.create": true,
      "employee.read": true,
      "employee.update": true,
      "employee.delete": true,
      "employee.viewSalary": true,
      "employee.manageSalary": true,
      "employee.usageRecord": true,
      "employee.usageView": true,
      "employee.settlementCreate": true,
      "employee.settlementApprove": true,
      "employee.settlementProcess": true,
      "employee.settlementView": true,
      "employee.settlementDelete": true,
      "employee.attendanceView": true,

      // === COMMUNICATION ===
      "communication.announcements": true,
      "communication.messages": true,
      "communication.notifications": true,

      // === EMERGENCY & SPECIAL ===
      "emergency.override": true,
      "emergency.shutdown": true,
      "special.functions": true
    },

    manager: {
      // === USER MANAGEMENT (Limited) ===
      "users.read": true,
      "users.viewActivity": true,
      "users.create": false,
      "users.update": false,
      "users.delete": false,
      "users.resetPassword": false,
      "users.unlock": false,
      "users.managePermissions": false,
      "users.impersonate": false,

      // === AUTHENTICATION & SECURITY ===
      "auth.manageSessions": true,
      "auth.viewAuditLogs": true,
      "auth.securitySettings": false,
      "auth.twoFactor": false,
      "auth.apiKeys": false,

      // === MATERIALS MANAGEMENT ===
      "materials.create": true,
      "materials.read": true,
      "materials.update": true,
      "materials.delete": false,
      "materials.import": true,
      "materials.export": true,
      "materials.bulkOperations": true,
      "materials.viewCosts": true,
      "materials.manageCategories": true,

      // === INVENTORY & STOCK MANAGEMENT ===
      "stock.create": true,
      "stock.read": true,
      "stock.update": true,
      "stock.delete": false,
      "stock.adjust": true,
      "stock.transfer": true,
      "stock.wasteRecord": true,
      "stock.viewCosts": true,
      "stock.bulkOperations": true,
      "stock.alerts": true,
      "stock.forecasting": true,

      // === SALES & TRANSACTIONS ===
      "sales.create": true,
      "sales.read": true,
      "sales.update": true,
      "sales.delete": true,
      "sales.revert": true,
      "sales.refund": true,
      "sales.viewProfits": true,
      "sales.discount": true,
      "sales.void": true,
      "sales.export": true,

      // === ORDERS MANAGEMENT ===
      "orders.create": true,
      "orders.read": true,
      "orders.update": true,
      "orders.delete": false,
      "orders.void": true,
      "orders.complete": true,
      "orders.cancel": true,
      "orders.viewAll": true,
      "orders.manageQueue": true,

      // === POS SYSTEM ===
      "pos.access": true,
      "pos.cashDrawer": true,
      "pos.receipts": true,
      "pos.payments": true,
      "pos.tables": true,
      "pos.kitchenDisplay": true,
      "pos.customerDisplay": true,

      // === MENU MANAGEMENT ===
      "menuItems.create": true,
      "menuItems.read": true,
      "menuItems.update": true,
      "menuItems.delete": false,
      "menuItems.pricing": true,
      "menuItems.categories": true,
      "menuItems.recipes": true,
      "menuItems.nutritional": true,
      "menuItems.availability": true,

      // === SECTIONS & ASSIGNMENTS ===
      "sections.create": true,
      "sections.read": true,
      "sections.update": true,
      "sections.delete": false,
      "assignments.create": true,
      "assignments.read": true,
      "assignments.update": true,
      "assignments.delete": true,
      "assignments.bulk": true,

      // === DAILY OPERATIONS ===
      "dayOperations.create": true,
      "dayOperations.read": true,
      "dayOperations.update": true,
      "dayOperations.delete": false,
      "dayOperations.close": true,
      "dayOperations.reopen": false,
      "dayOperations.cashCount": true,

      // === REPORTS & ANALYTICS ===
      "reports.read": true,
      "reports.sales": true,
      "reports.inventory": true,
      "reports.financial": true,
      "reports.waste": true,
      "reports.staff": true,
      "reports.customer": true,
      "reports.export": true,
      "reports.schedule": true,
      "analytics.dashboard": true,
      "analytics.trends": true,
      "analytics.forecasting": true,
      "analytics.profitability": true,

      // === FINANCIAL MANAGEMENT (Limited) ===
      "finance.viewCosts": true,
      "finance.viewProfits": true,
      "finance.pricing": true,
      "finance.budgets": false,
      "finance.expenses": false,
      "finance.taxReports": false,

      // === CUSTOMER MANAGEMENT ===
      "customers.create": true,
      "customers.read": true,
      "customers.update": true,
      "customers.delete": false,
      "customers.loyalty": true,
      "customers.feedback": true,

      // === SUPPLIERS & PROCUREMENT ===
      "suppliers.create": false,
      "suppliers.read": true,
      "suppliers.update": false,
      "suppliers.delete": false,
      "procurement.orders": true,
      "procurement.receiving": true,

      // === SYSTEM ADMINISTRATION (Limited) ===
      "system.settings": false,
      "system.backup": false,
      "system.restore": false,
      "system.maintenance": false,
      "system.logs": true,
      "system.integrations": false,
      "system.database": false,
      "system.notifications": true,

      // === COMPLIANCE & AUDIT ===
      "compliance.foodSafety": true,
      "compliance.healthDept": true,
      "compliance.tax": false,
      "audit.trails": true,
      "audit.reports": true,

      // === EMPLOYEE MANAGEMENT ===
      "employee.create": true,
      "employee.read": true,
      "employee.update": true,
      "employee.delete": false,
      "employee.viewSalary": true,
      "employee.manageSalary": false,
      "employee.usageRecord": true,
      "employee.usageView": true,
      "employee.settlementCreate": true,
      "employee.settlementApprove": false,
      "employee.settlementProcess": false,
      "employee.settlementView": true,
      "employee.settlementDelete": true,
      "employee.attendanceView": true,

      // === COMMUNICATION ===
      "communication.announcements": true,
      "communication.messages": true,
      "communication.notifications": true,

      // === EMERGENCY & SPECIAL ===
      "emergency.override": false,
      "emergency.shutdown": false,
      "special.functions": false
    },

    staff: {
      // === USER MANAGEMENT ===
      "users.read": false,
      "users.viewActivity": false,

      // === AUTHENTICATION & SECURITY ===
      "auth.manageSessions": false,
      "auth.viewAuditLogs": false,

      // === MATERIALS MANAGEMENT (Basic) ===
      "materials.create": false,
      "materials.read": true,
      "materials.update": false,
      "materials.delete": false,
      "materials.viewCosts": false,

      // === INVENTORY & STOCK MANAGEMENT (Basic) ===
      "stock.create": true,
      "stock.read": true,
      "stock.update": false,
      "stock.delete": false,
      "stock.adjust": false,
      "stock.transfer": false,
      "stock.wasteRecord": true,
      "stock.viewCosts": false,

      // === SALES & TRANSACTIONS (Basic) ===
      "sales.create": true,
      "sales.read": true,
      "sales.update": true,
      "sales.delete": false,
      "sales.revert": true,
      "sales.refund": true,
      "sales.viewProfits": true,
      "sales.discount": true,
      "sales.void": true,

      // === ORDERS MANAGEMENT (Full) ===
      "orders.create": true,
      "orders.read": true,
      "orders.update": true,
      "orders.delete": false,
      "orders.void": true,
      "orders.complete": true,
      "orders.cancel": true,
      "orders.viewAll": true,
      "orders.manageQueue": true,

      // === POS SYSTEM (Basic Access) ===
      "pos.access": true,
      "pos.cashDrawer": false,
      "pos.receipts": true,
      "pos.payments": true,
      "pos.tables": true,
      "pos.kitchenDisplay": false,
      "pos.customerDisplay": false,

      // === MENU MANAGEMENT (Read Only) ===
      "menuItems.create": false,
      "menuItems.read": true,
      "menuItems.update": false,
      "menuItems.delete": false,
      "menuItems.pricing": false,
      "menuItems.categories": false,
      "menuItems.recipes": false,
      "menuItems.nutritional": false,
      "menuItems.availability": false,

      // === SECTIONS & ASSIGNMENTS (Read Only) ===
      "sections.create": false,
      "sections.read": true,
      "sections.update": false,
      "sections.delete": false,
      "assignments.create": false,
      "assignments.read": true,
      "assignments.update": false,
      "assignments.delete": false,

      // === DAILY OPERATIONS (Full) ===
      "dayOperations.create": true,
      "dayOperations.read": true,
      "dayOperations.update": true,
      "dayOperations.delete": false,
      "dayOperations.close": true,
      "dayOperations.cashCount": true,

      // === REPORTS & ANALYTICS (Limited) ===
      "reports.read": true,
      "reports.sales": true,
      "reports.inventory": true,
      "reports.financial": true,
      "reports.waste": true,
      "reports.staff": true,
      "reports.customer": true,
      "reports.export": false,
      "analytics.dashboard": false,
      "analytics.trends": false,

      // === CUSTOMER MANAGEMENT (Basic) ===
      "customers.create": false,
      "customers.read": true,
      "customers.update": false,
      "customers.delete": false,
      "customers.loyalty": false,
      "customers.feedback": false,

      // === EMPLOYEE MANAGEMENT ===
      "employee.create": false,
      "employee.read": true,
      "employee.update": false,
      "employee.delete": false,
      "employee.viewSalary": false,
      "employee.manageSalary": false,
      "employee.usageRecord": true,
      "employee.usageView": true,
      "employee.settlementCreate": false,
      "employee.settlementApprove": false,
      "employee.settlementProcess": false,
      "employee.settlementView": false,
      "employee.attendanceView": true,

      // === SAUCE MANAGEMENT ===
      "sauces.create": false,
      "sauces.read": true,
      "sauces.update": false,
      "sauces.delete": false,
      "sauces.bulkDelete": false,
      "sauces.togglePOSVisibility": false,
      "sauces.toggleActiveStatus": false,
      "sauces.calculateCost": false,

      // === All Other Permissions ===
      "finance.viewCosts": false,
      "finance.viewProfits": false,
      "suppliers.read": false,
      "system.settings": false,
      "compliance.foodSafety": false,
      "audit.trails": false,
      "communication.messages": false,
      "emergency.override": false
    }
  };

  return rolePermissions[this.role] || {};
};

// Static methods
User.incLoginAttempts = async function (userId) {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  const user = await this.findByPk(userId);
  if (!user) return;

  const updates = { loginAttempts: user.loginAttempts + 1 };

  // If we have a previous lock that has expired, restart at 1
  if (user.lockUntil && user.lockUntil < Date.now()) {
    updates.loginAttempts = 1;
    updates.lockUntil = null;
  }
  // If we're at max attempts and not locked yet, lock the account
  else if (user.loginAttempts + 1 >= maxAttempts && !user.isLocked()) {
    updates.lockUntil = Date.now() + lockTime;
  }

  await user.update(updates);
};

User.resetLoginAttempts = async function (userId) {
  const user = await this.findByPk(userId);
  if (!user) return;

  await user.update({
    loginAttempts: 0,
    lockUntil: null,
    lastLogin: new Date()
  });
};

export default User;
