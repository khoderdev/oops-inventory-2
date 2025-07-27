export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable(
    "SystemLogs",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // User Information
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "ID of the user performing the action"
      },
      userName: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Name of the user performing the action (cached for performance)"
      },
      userRole: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Role of the user at the time of action"
      },

      // Action Information
      actionType: {
        type: Sequelize.ENUM("create", "edit", "add_to_stock", "waste_from_stock", "delete_stock", "adjust_quantity", "transfer_stock", "pos_toggle", "cost_update", "bulk_operation", "system_correction"),
        allowNull: false,
        comment: "Type of action performed on the stock entry"
      },
      actionDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Human-readable description of the action performed"
      },

      // Timestamp Information
      actionTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: "Precise timestamp when the action occurred (YYYY-MM-DD HH:MM:SS)"
      },
      sessionId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Session ID for tracking user sessions"
      },

      // Item Details
      stockEntryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "stock_entries",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "ID of the stock entry being affected"
      },
      materialId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "materials",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "ID of the material associated with the stock entry"
      },
      materialName: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: "Name of the material (cached for performance and historical accuracy)"
      },
      materialCategory: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Category of the material at the time of action"
      },
      supplier: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: "Supplier information at the time of action"
      },

      // Stock Modifications - Previous Values
      previousValues: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Complete previous state of the stock entry before changes"
      },
      previousQuantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        comment: "Previous purchased quantity"
      },
      previousIndividualQuantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        comment: "Previous individual quantity"
      },
      previousTotalCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "Previous total cost"
      },

      // Stock Modifications - New Values
      newValues: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Complete new state of the stock entry after changes"
      },
      newQuantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        comment: "New purchased quantity"
      },
      newIndividualQuantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        comment: "New individual quantity"
      },
      newTotalCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "New total cost"
      },

      // Quantity Changes
      quantityDelta: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        comment: "Change in quantity (positive for additions, negative for reductions)"
      },
      individualQuantityDelta: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        comment: "Change in individual quantity"
      },
      costDelta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "Change in total cost"
      },

      // Units Information
      purchasedUnit: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Unit of measurement for purchased quantity"
      },
      individualUnit: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Unit of measurement for individual quantity"
      },

      // Additional Metadata
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Additional contextual data for traceability and auditing"
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Reason provided for the action (especially for waste, adjustments, deletions)"
      },
      batchId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Batch ID for grouping related operations"
      },
      correlationId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Correlation ID for tracking related actions across different resources"
      },

      // Business Context
      businessImpact: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "low",
        comment: "Business impact level of the action"
      },
      financialImpact: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "Estimated financial impact of the action"
      },
      complianceRelevant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether this action is relevant for compliance reporting"
      },

      // Status and Validation
      status: {
        type: Sequelize.ENUM("success", "failure", "partial", "warning"),
        allowNull: false,
        defaultValue: "success",
        comment: "Status of the action execution"
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Error message if the action failed"
      },
      validationErrors: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Validation errors encountered during the action"
      },

      // Approval and Authorization
      requiresApproval: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether this action requires approval"
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "ID of the user who approved the action"
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Timestamp when the action was approved"
      },

      // Data Integrity
      dataHash: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: "SHA-256 hash of the action data for integrity verification"
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Version number for tracking schema changes"
      }
    },
    {
      comment: "Comprehensive logging table for all stock entry operations and modifications"
    }
  );

  // Create indexes for optimal query performance
  await queryInterface.addIndex("SystemLogs", ["stockEntryId"], {
    name: "idx_system_logs_stock_entry_id"
  });

  await queryInterface.addIndex("SystemLogs", ["materialId"], {
    name: "idx_system_logs_material_id"
  });

  await queryInterface.addIndex("SystemLogs", ["userId"], {
    name: "idx_system_logs_user_id"
  });

  await queryInterface.addIndex("SystemLogs", ["actionType"], {
    name: "idx_system_logs_action_type"
  });

  await queryInterface.addIndex("SystemLogs", ["actionTimestamp"], {
    name: "idx_system_logs_timestamp"
  });

  await queryInterface.addIndex("SystemLogs", ["materialName"], {
    name: "idx_system_logs_material_name"
  });

  await queryInterface.addIndex("SystemLogs", ["status"], {
    name: "idx_system_logs_status"
  });

  await queryInterface.addIndex("SystemLogs", ["businessImpact"], {
    name: "idx_system_logs_business_impact"
  });

  await queryInterface.addIndex("SystemLogs", ["batchId"], {
    name: "idx_system_logs_batch_id"
  });

  await queryInterface.addIndex("SystemLogs", ["correlationId"], {
    name: "idx_system_logs_correlation_id"
  });

  // Composite indexes for common query patterns
  await queryInterface.addIndex("SystemLogs", ["actionTimestamp", "actionType"], {
    name: "idx_system_logs_timestamp_action"
  });

  await queryInterface.addIndex("SystemLogs", ["materialId", "actionTimestamp"], {
    name: "idx_system_logs_material_timestamp"
  });

  await queryInterface.addIndex("SystemLogs", ["userId", "actionTimestamp"], {
    name: "idx_system_logs_user_timestamp"
  });

  await queryInterface.addIndex("SystemLogs", ["stockEntryId", "actionTimestamp"], {
    name: "idx_system_logs_stock_timestamp"
  });

  // Index for compliance and business impact queries
  await queryInterface.addIndex("SystemLogs", ["complianceRelevant", "actionTimestamp"], {
    name: "idx_system_logs_compliance_timestamp"
  });

  await queryInterface.addIndex("SystemLogs", ["businessImpact", "actionTimestamp"], {
    name: "idx_system_logs_impact_timestamp"
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable("SystemLogs");
};
