import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

const CategoryType = sequelize.define(
  "CategoryType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Type cannot be empty" },
        len: { args: [1, 50], msg: "Type must be between 1 and 50 characters" }
      }
    }
  },
  {
    tableName: "category_types",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["type"]
      }
    ]
  }
);

export default CategoryType;
