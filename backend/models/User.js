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
      },
      beforeUpdate: async user => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
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
      // Full system access
      "users.create": true,
      "users.read": true,
      "users.update": true,
      "users.delete": true,
      "materials.create": true,
      "materials.read": true,
      "materials.update": true,
      "materials.delete": true,
      "stock.create": true,
      "stock.read": true,
      "stock.update": true,
      "stock.delete": true,
      "sales.create": true,
      "sales.read": true,
      "sales.update": true,
      "sales.delete": true,
      "sales.revert": true,
      "sections.create": true,
      "sections.read": true,
      "sections.update": true,
      "sections.delete": true,
      "assignments.create": true,
      "assignments.read": true,
      "assignments.update": true,
      "assignments.delete": true,
      "menuItems.create": true,
      "menuItems.read": true,
      "menuItems.update": true,
      "menuItems.delete": true,
      "dayOperations.create": true,
      "dayOperations.read": true,
      "dayOperations.update": true,
      "dayOperations.delete": true,
      "reports.read": true,
      "reports.export": true,
      "analytics.read": true,
      "system.settings": true
    },
    manager: {
      // Management level access
      "users.read": true,
      "users.update": false, // Can't modify users
      "materials.create": true,
      "materials.read": true,
      "materials.update": true,
      "materials.delete": false, // Can't delete materials
      "stock.create": true,
      "stock.read": true,
      "stock.update": true,
      "stock.delete": false,
      "sales.create": true,
      "sales.read": true,
      "sales.update": true,
      "sales.delete": true,
      "sales.revert": true,
      "sections.create": true,
      "sections.read": true,
      "sections.update": true,
      "sections.delete": false,
      "assignments.create": true,
      "assignments.read": true,
      "assignments.update": true,
      "assignments.delete": true,
      "menuItems.create": true,
      "menuItems.read": true,
      "menuItems.update": true,
      "menuItems.delete": false,
      "dayOperations.create": true,
      "dayOperations.read": true,
      "dayOperations.update": true,
      "dayOperations.delete": false,
      "reports.read": true,
      "reports.export": true,
      "analytics.read": true,
      "system.settings": false
    },
    staff: {
      // Basic operational access
      "users.read": false,
      "materials.read": true,
      "stock.create": true,
      "stock.read": true,
      "stock.update": false, // Can add stock but not modify existing
      "sales.create": true,
      "sales.read": true,
      "sales.update": false,
      "sales.delete": false,
      "sales.revert": false,
      "sections.read": true,
      "assignments.read": true,
      "menuItems.read": true,
      "dayOperations.read": true,
      "reports.read": false, // Limited report access
      "analytics.read": false
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
