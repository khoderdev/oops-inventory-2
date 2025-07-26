import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Table = sequelize.define(
  "Table",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        min: 1
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      validate: {
        min: 1,
        max: 20
      }
    },
    status: {
      type: DataTypes.ENUM("available", "occupied", "reserved", "cleaning", "out_of_order"),
      allowNull: false,
      defaultValue: "available"
    },
    shape: {
      type: DataTypes.ENUM("round", "square", "rectangle"),
      allowNull: false,
      defaultValue: "square"
    },
    position: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { x: 0, y: 0 },
      validate: {
        isValidPosition(value) {
          if (value && (typeof value.x !== "number" || typeof value.y !== "number")) {
            throw new Error("Position must have numeric x and y coordinates");
          }
        }
      }
    },
    section: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "main"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastCleaned: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reservedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reservedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reservedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "Tables",
    timestamps: true,
    indexes: [
      {
        fields: ["number"],
        unique: true
      },
      {
        fields: ["status"]
      },
      {
        fields: ["section"]
      },
      {
        fields: ["isActive"]
      }
    ],
    hooks: {
      beforeSave: table => {
        // Auto-update status based on reservation
        if (table.reservedUntil && new Date() > table.reservedUntil) {
          table.status = "available";
          table.reservedBy = null;
          table.reservedAt = null;
          table.reservedUntil = null;
        }
      }
    }
  }
);

export default Table;
