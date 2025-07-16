import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Material = sequelize.define(
  "Material",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    baseUnit: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: "materials",
    timestamps: false
  }
);

export default Material;
