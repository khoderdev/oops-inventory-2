import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const FurnitureItem = sequelize.define(
  "FurnitureItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    floorAreaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "FloorAreas",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    designerItemId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "ID from the floor designer frontend"
    },
    type: {
      type: DataTypes.ENUM("round-table", "square-table", "rectangular-table", "chair", "bar"),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    position: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidPosition(value) {
          if (!value || typeof value !== 'object') {
            throw new Error("Position must be an object");
          }
          if (typeof value.x !== 'number' || typeof value.y !== 'number') {
            throw new Error("Position must have numeric x and y coordinates");
          }
        }
      }
    },
    dimensions: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidDimensions(value) {
          if (!value || typeof value !== 'object') {
            throw new Error("Dimensions must be an object");
          }
          if (typeof value.width !== 'number' || typeof value.height !== 'number') {
            throw new Error("Dimensions must have numeric width and height");
          }
          if (value.width <= 0 || value.height <= 0) {
            throw new Error("Dimensions must be positive");
          }
        }
      }
    },
    rotation: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 360
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#8B4513",
      validate: {
        is: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      }
    },
    seatingCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 20
      }
    },
    zIndex: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 1
    },
    parentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Parent furniture item ID for grouped items"
    },
    isTable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether this furniture item represents a table for orders"
    },
    tableNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      validate: {
        min: 1
      },
      comment: "Table number for ordering system integration"
    },
    status: {
      type: DataTypes.ENUM("available", "occupied", "reserved", "cleaning", "out_of_order"),
      allowNull: false,
      defaultValue: "available"
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
    tableName: "FurnitureItems",
    timestamps: true,
    indexes: [
      {
        fields: ["floorAreaId"]
      },
      {
        fields: ["designerItemId"]
      },
      {
        fields: ["type"]
      },
      {
        fields: ["isTable"]
      },
      {
        fields: ["tableNumber"],
        unique: true,
        where: {
          tableNumber: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ["status"]
      },
      {
        fields: ["isActive"]
      }
    ],
    hooks: {
      beforeValidate: (furnitureItem) => {
        // Auto-set isTable for table types
        const tableTypes = ["round-table", "square-table", "rectangular-table"];
        if (tableTypes.includes(furnitureItem.type)) {
          furnitureItem.isTable = true;
        }
      }
    }
  }
);

export default FurnitureItem;
