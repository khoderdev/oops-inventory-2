import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Section = sequelize.define(
  "Section",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: "sections",
    timestamps: false
  }
);

export default Section;
