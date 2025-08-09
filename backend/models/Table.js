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
      type: DataTypes.ENUM("available", "opened", "reserved", "cleaning", "out_of_order"),
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

// Function to create initial table data
Table.createInitialTables = async function() {
  try {
    console.log("🏪 Checking and creating initial tables...");
    
    const initialTables = [
      { number: 1, seats: 4, status: "available", shape: "square", position: { x: 20, y: 20 }, section: "outdoor", isActive: true },
      { number: 2, seats: 4, status: "available", shape: "square", position: { x: 40, y: 20 }, section: "outdoor", isActive: true },
      { number: 3, seats: 6, status: "available", shape: "rectangle", position: { x: 60, y: 20 }, section: "outdoor", isActive: true },
      { number: 4, seats: 2, status: "available", shape: "round", position: { x: 80, y: 20 }, section: "outdoor", isActive: true },
      { number: 5, seats: 4, status: "available", shape: "square", position: { x: 20, y: 50 }, section: "outdoor", isActive: true },
      { number: 6, seats: 8, status: "available", shape: "rectangle", position: { x: 40, y: 50 }, section: "outdoor", isActive: true },
      { number: 7, seats: 2, status: "available", shape: "round", position: { x: 60, y: 50 }, section: "outdoor", isActive: true },
      { number: 8, seats: 4, status: "available", shape: "square", position: { x: 80, y: 50 }, section: "outdoor", isActive: true },
      { number: 9, seats: 4, status: "available", shape: "square", position: { x: 20, y: 80 }, section: "indoor", isActive: true },
      { number: 10, seats: 4, status: "available", shape: "square", position: { x: 40, y: 80 }, section: "indoor", isActive: true },
      { number: 11, seats: 2, status: "available", shape: "round", position: { x: 60, y: 80 }, section: "indoor", isActive: true },
      { number: 12, seats: 8, status: "available", shape: "rectangle", position: { x: 80, y: 80 }, section: "indoor", isActive: true },
      { number: 13, seats: 4, status: "available", shape: "square", position: { x: 80, y: 50 }, section: "indoor", isActive: true }
    ];
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const tableData of initialTables) {
      // Check if table with this number already exists
      const existingTable = await Table.findOne({ where: { number: tableData.number } });
      
      if (!existingTable) {
        await Table.create(tableData);
        createdCount++;
        console.log(`✅ Created table ${tableData.number} (${tableData.section})`);
      } else {
        existingCount++;
        console.log(`⏭️  Table ${tableData.number} already exists, skipping`);
      }
    }
    
    console.log(`📊 Initial tables setup complete:`);
    console.log(`   ✅ Created: ${createdCount} tables`);
    console.log(`   ⏭️  Existing: ${existingCount} tables`);
    console.log(`   📋 Total: ${initialTables.length} tables`);
    
    return { created: createdCount, existing: existingCount, total: initialTables.length };
    
  } catch (error) {
    console.error("❌ Error creating initial tables:", error);
    throw error;
  }
};

export default Table;
