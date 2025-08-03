import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const FloorPlan = sequelize.define(
  "FloorPlan",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
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
    tableName: "FloorPlans",
    timestamps: true,
    indexes: [
      {
        fields: ["name"]
      },
      {
        fields: ["isActive"]
      },
      {
        fields: ["isDefault"]
      },
      {
        fields: ["createdBy"]
      }
    ],
    hooks: {
      beforeSave: async (floorPlan) => {
        // Ensure only one default floor plan
        if (floorPlan.isDefault) {
          await FloorPlan.update(
            { isDefault: false },
            { 
              where: { 
                isDefault: true,
                id: { [sequelize.Sequelize.Op.ne]: floorPlan.id }
              }
            }
          );
        }
      }
    }
  }
);

// Function to create initial floor plan
FloorPlan.createInitialFloorPlan = async function() {
  try {
    console.log("🏗️ Checking and creating initial floor plan...");
    
    const existingPlan = await FloorPlan.findOne({ where: { isDefault: true } });
    
    if (!existingPlan) {
      const initialPlan = await FloorPlan.create({
        name: "Default Restaurant Layout",
        description: "Default floor plan with basic table arrangement",
        isActive: true,
        isDefault: true,
        metadata: {
          version: "1.0",
          totalSeats: 0,
          totalTables: 0
        }
      });
      
      console.log("✅ Created initial floor plan:", initialPlan.name);
      return initialPlan;
    } else {
      console.log("⏭️ Default floor plan already exists, skipping");
      return existingPlan;
    }
    
  } catch (error) {
    console.error("❌ Error creating initial floor plan:", error);
    throw error;
  }
};

export default FloorPlan;
