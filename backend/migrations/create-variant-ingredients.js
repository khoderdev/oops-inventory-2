import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const createVariantIngredientsTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('Creating variantIngredients table...');
    
    await queryInterface.createTable('variantIngredients', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      variantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Variants',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      materialId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Materials',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      sauceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Sauces',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      cost: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('variantIngredients', ['variantId'], {
      name: 'idx_variant_ingredients_variant_id'
    });

    await queryInterface.addIndex('variantIngredients', ['materialId'], {
      name: 'idx_variant_ingredients_material_id'
    });

    await queryInterface.addIndex('variantIngredients', ['sauceId'], {
      name: 'idx_variant_ingredients_sauce_id'
    });

    await queryInterface.addIndex('variantIngredients', ['variantId', 'sortOrder'], {
      name: 'idx_variant_ingredients_variant_sort'
    });

    // Create unique constraints
    await queryInterface.addConstraint('variantIngredients', {
      fields: ['variantId', 'materialId'],
      type: 'unique',
      name: 'variant_material_unique',
      where: {
        materialId: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.addConstraint('variantIngredients', {
      fields: ['variantId', 'sauceId'],
      type: 'unique',
      name: 'variant_sauce_unique',
      where: {
        sauceId: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // Add check constraint to ensure either materialId or sauceId is set
    await queryInterface.addConstraint('variantIngredients', {
      type: 'check',
      name: 'either_material_or_sauce',
      where: sequelize.literal('(("materialId" IS NOT NULL AND "sauceId" IS NULL) OR ("materialId" IS NULL AND "sauceId" IS NOT NULL))')
    });

    console.log('variantIngredients table created successfully!');
  } catch (error) {
    console.error('Error creating variantIngredients table:', error);
    throw error;
  }
};

// Execute the migration
createVariantIngredientsTable();
