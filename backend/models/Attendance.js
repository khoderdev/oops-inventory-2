import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Attendance = sequelize.define("Attendance", {
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
    onDelete: "CASCADE"
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("checked_in", "checked_out"),
    defaultValue: "checked_in"
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "attendances",
  timestamps: true,
  indexes: [
    {
      fields: ["employeeId"],
      name: "idx_attendance_employee"
    },
    {
      fields: ["checkIn"],
      name: "idx_attendance_checkin"
    },
    {
      fields: ["status"],
      name: "idx_attendance_status"
    }
  ]
});

// Instance methods
Attendance.prototype.checkOutEmployee = async function() {
  this.checkOut = new Date();
  this.status = "checked_out";
  return this.save();
};

// Static methods
Attendance.getCurrentAttendance = async function(employeeId) {
  return this.findOne({
    where: {
      employeeId,
      status: "checked_in"
    },
    order: [["checkIn", "DESC"]]
  });
};

Attendance.getEmployeeAttendance = async function(employeeId, { startDate, endDate } = {}) {
  const where = { employeeId };
  
  if (startDate && endDate) {
    where.checkIn = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  return this.findAll({
    where,
    order: [["checkIn", "DESC"]]
  });
};

export default Attendance;
