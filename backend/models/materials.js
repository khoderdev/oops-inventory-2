import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { MATERIAL_CATEGORIES, UNIT_OPTIONS, isValidMaterialCategory, isValidUnitType } from "../utils/conversions.js";

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
      allowNull: false,
      validate: {
        notEmpty: { msg: "Name cannot be empty" }
      }
    },
    baseUnit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Base unit cannot be empty" },
        isValidBaseUnit(value) {
          // Skip validation during table creation when unitType might not be set
          if (this.unitType && UNIT_OPTIONS[this.unitType] && !UNIT_OPTIONS[this.unitType].includes(value)) {
            throw new Error(`Invalid base unit for unit type ${this.unitType}`);
          }
        }
      }
    },
    unitType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidUnitType(value) {
          if (!isValidUnitType(value)) {
            throw new Error(`Invalid unit type. Must be one of: ${Object.keys(UNIT_OPTIONS).join(", ")}`);
          }
        }
      }
    },

    inputUnit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Original input unit from MaterialForm (e.g., 'box', 'pack')"
    },

    packageQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [1], msg: "Package quantity must be at least 1" }
      },
      comment: "For package units: how many base units per package"
    },

    category: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidCategory(value) {
          if (!isValidMaterialCategory(value)) {
            throw new Error(`Invalid category. Must be one of: ${MATERIAL_CATEGORIES.map(c => c.value).join(", ")}`);
          }
        }
      }
    }
  },
  {
    tableName: "materials",
    timestamps: true
  }
);

// Static method to create initial materials
Material.createInitialMaterials = async function() {
  try {
    console.log("🌱 Creating initial materials...");
    
    const initialMaterials = [
      {
        name: "7up",
        baseUnit: "bottle",
        unitType: "package",
        inputUnit: "box",
        packageQuantity: 12,
        category: "beverages"
      },
      {
        name: "Mirinda",
        baseUnit: "bottle",
        unitType: "package",
        inputUnit: "box",
        packageQuantity: 12,
        category: "beverages"
      },
      {
        name: "Pepsi",
        baseUnit: "bottle",
        unitType: "package",
        inputUnit: "box",
        packageQuantity: 12,
        category: "beverages"
      },
      {
        name: "Beef",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "meat"
      },
      {
        name: "Pickles",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "vegetables"
      },
      {
        name: "Tomato",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "vegetables"
      },
      {
        name: "Chicken",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "meat"
      },
      {
        name: "Bun",
        baseUnit: "piece",
        unitType: "package",
        inputUnit: "pack",
        packageQuantity: 4,
        category: "grains"
      },
      {
        name: "Onion",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "vegetables"
      },
      {
        name: "Bajaxi",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "meat"
      },
      {
        name: "Mais",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "vegetables"
      },
      {
        name: "Banana",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "vegetables"
      },
      {
        name: "Ice Cream",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "dairy"
      },
      {
        name: "Chocolate",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "sweets"
      },
      {
        name: "Steak",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "meat"
      },
      {
        name: "Fries",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "vegetables"
      },
      {
        name: "Almaza Beer",
        baseUnit: "bottle",
        unitType: "package",
        inputUnit: "box",
        packageQuantity: 24,
        category: "alcohol"
      },
      {
        name: "Nuts",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "grains"
      },
      {
        name: "Potato",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "vegetables"
      },
      {
        name: "Tobacco",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "tobacco"
      },
      {
        name: "Charcoal",
        baseUnit: "g",
        unitType: "mass",
        inputUnit: "kg",
        packageQuantity: null,
        category: "other"
      }
    ];

    let createdCount = 0;
    let existingCount = 0;
    
    console.log(`📋 Processing ${initialMaterials.length} materials...`);
    
    for (const materialData of initialMaterials) {
      try {
        // Check if material already exists by name
        const existingMaterial = await Material.findOne({
          where: { name: materialData.name }
        });
        
        if (!existingMaterial) {
          await Material.create(materialData);
          console.log(`✅ Created material: ${materialData.name}`);
          createdCount++;
        } else {
          console.log(`⚠️  Material already exists: ${materialData.name}`);
          existingCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating material ${materialData.name}:`, error.message);
      }
    }
    
    const summary = {
      total: initialMaterials.length,
      created: createdCount,
      existing: existingCount,
      message: `Materials initialization completed: ${createdCount} created, ${existingCount} already existed`
    };
    
    console.log(`📊 Materials Summary:`);
    console.log(`   - Total materials: ${summary.total}`);
    console.log(`   - Created: ${summary.created}`);
    console.log(`   - Already existed: ${summary.existing}`);
    console.log(`✅ ${summary.message}`);
    
    return summary;
    
  } catch (error) {
    console.error("❌ Error creating initial materials:", error);
    throw error;
  }
};

export default Material;
