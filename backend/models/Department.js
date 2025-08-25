import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Department = sequelize.define(
  "Department",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: "Department name already exists"
      },
      validate: {
        len: {
          args: [2, 50],
          msg: "Department name must be between 2 and 50 characters"
        },
        notEmpty: {
          msg: "Department name cannot be empty"
        }
      },
      comment: "Department name"
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: {
        msg: "Department code already exists"
      },
      validate: {
        len: {
          args: [2, 10],
          msg: "Department code must be between 2 and 10 characters"
        },
        isUppercase: {
          msg: "Department code must be uppercase"
        }
      },
      comment: "Short department code (e.g., KIT for kitchen)"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Department description"
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employees",
        key: "id"
      },
      comment: "Reference to employee who manages this department"
    },
    costCenter: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Cost center code for accounting purposes"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Whether department is currently active"
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      comment: "User who created this department"
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      comment: "User who last updated this department"
    }
  },
  {
    tableName: "departments",
    timestamps: true,
    indexes: [
      {
        fields: ["name"]
      },
      {
        fields: ["code"]
      },
      {
        fields: ["managerId"]
      },
      {
        fields: ["isActive"]
      }
    ],
    hooks: {
      beforeCreate: department => {
        // Ensure code is uppercase
        if (department.code) {
          department.code = department.code.toUpperCase();
        }
      },
      beforeUpdate: department => {
        // Ensure code is uppercase
        if (department.code && department.changed("code")) {
          department.code = department.code.toUpperCase();
        }
      }
    }
  }
);

// Associations
Department.associate = models => {
  Department.belongsTo(models.Employee, {
    as: "manager",
    foreignKey: "managerId",
    constraints: false
  });

  Department.hasMany(models.Employee, {
    as: "employees",
    foreignKey: "departmentId"
  });

  Department.belongsTo(models.User, {
    as: "creator",
    foreignKey: "createdBy"
  });

  Department.belongsTo(models.User, {
    as: "updater",
    foreignKey: "updatedBy"
  });
};

// Instance methods
Department.prototype.getEmployeeCount = async function () {
  return await sequelize.models.Employee.count({
    where: {
      departmentId: this.id,
      isActive: true
    }
  });
};

Department.prototype.getActiveEmployees = async function () {
  return await sequelize.models.Employee.findAll({
    where: {
      departmentId: this.id,
      isActive: true,
      terminationDate: null
    },
    order: [
      ["firstName", "ASC"],
      ["lastName", "ASC"]
    ]
  });
};

// Static methods
Department.getActiveDepartments = function () {
  return this.findAll({
    where: {
      isActive: true
    },
    include: [
      {
        model: sequelize.models.Employee,
        as: "manager",
        attributes: ["id", "firstName", "lastName", "employeeNumber"],
        required: false
      }
    ],
    order: [["name", "ASC"]]
  });
};

Department.findByCode = function (code) {
  return this.findOne({
    where: {
      code: code.toUpperCase(),
      isActive: true
    }
  });
};

Department.searchDepartments = function (searchTerm) {
  return this.findAll({
    where: {
      isActive: true,
      [sequelize.Op.or]: [{ name: { [sequelize.Op.iLike]: `%${searchTerm}%` } }, { code: { [sequelize.Op.iLike]: `%${searchTerm}%` } }, { description: { [sequelize.Op.iLike]: `%${searchTerm}%` } }]
    },
    order: [["name", "ASC"]]
  });
};

export default Department;
