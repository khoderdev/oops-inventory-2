import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const FloorArea = sequelize.define(
  "FloorArea",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    floorPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "FloorPlans",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    bounds: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { x: 0, y: 0, width: 800, height: 600 },
      validate: {
        isValidBounds(value) {
          if (!value || typeof value !== 'object') {
            throw new Error("Bounds must be an object");
          }
          const required = ['x', 'y', 'width', 'height'];
          for (const prop of required) {
            if (typeof value[prop] !== 'number') {
              throw new Error(`Bounds.${prop} must be a number`);
            }
          }
          if (value.width <= 0 || value.height <= 0) {
            throw new Error("Bounds width and height must be positive");
          }
        }
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#f8fafc",
      validate: {
        is: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      }
    },
    section: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "main"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  },
  {
    tableName: "FloorAreas",
    timestamps: true,
    indexes: [
      {
        fields: ["floorPlanId"]
      },
      {
        fields: ["name"]
      },
      {
        fields: ["section"]
      },
      {
        fields: ["isActive"]
      }
    ]
  }
);

export default FloorArea;
