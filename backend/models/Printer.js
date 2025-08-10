import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Printer = sequelize.define(
  "Printer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: "Printer name must be between 1 and 100 characters"
        }
      }
    },
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "printer_channels",
        key: "id"
      }
    },
    type: {
      type: DataTypes.ENUM("thermal", "inkjet", "laser", "receipt", "label"),
      allowNull: false
    },
    connectionType: {
      type: DataTypes.ENUM("usb", "network", "bluetooth", "serial"),
      allowNull: false
    },

    // Network Configuration
    networkConfig: {
      type: DataTypes.JSONB,
      defaultValue: {
        ipAddress: null,
        port: 9100,
        protocol: "raw"
      },
      allowNull: true
    },

    // OS Integration (Windows)
    osConfig: {
      type: DataTypes.JSONB,
      defaultValue: {
        printerName: null,
        driverName: null,
        isDefault: false,
        isShared: false,
        shareName: null
      },
      allowNull: true
    },

    // Print Settings
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        paperSize: "80mm",
        orientation: "portrait",
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        dpi: 203,
        duplex: false,
        copies: 1,
        colorMode: "monochrome"
      },
      allowNull: false
    },

    // Printer Capabilities
    capabilities: {
      type: DataTypes.JSONB,
      defaultValue: {
        maxWidth: 80,
        maxLength: 3000,
        supportsCutter: false,
        supportsDrawer: false,
        supportsBarcodes: false,
        supportsImages: false,
        supportsColor: false,
        supportedFormats: ["text", "escpos"]
      },
      allowNull: false
    },

    // Status & Health
    status: {
      type: DataTypes.ENUM("online", "offline", "error", "busy", "maintenance"),
      defaultValue: "offline",
      allowNull: false
    },
    lastPing: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastPrintJob: {
      type: DataTypes.DATE,
      allowNull: true
    },
    errorCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    totalJobs: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    // Management
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    }
  },
  {
    tableName: "printers",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["channel_id", "is_active"]
      },
      {
        fields: ["status"]
      },
      {
        fields: ["connection_type"]
      },
      {
        fields: ["created_by"]
      }
    ],
    validate: {
      networkConfigRequired() {
        // Skip validation if only isActive is being updated
        const changedFields = this.changed();
        if (changedFields && changedFields.length === 1 && changedFields[0] === "isActive") {
          return;
        }

        // Skip validation if only updating non-connection related fields
        const connectionRelatedFields = ["connectionType", "osConfig", "networkConfig", "name", "type"];
        const hasConnectionChanges = changedFields && changedFields.some(field => connectionRelatedFields.includes(field));

        if (!hasConnectionChanges && !this.isNewRecord) {
          return;
        }

        // Only validate network config if connection type is network and we're creating or updating connection-related fields
        if (this.connectionType === "network" && (this.isNewRecord || this.changed("connectionType") || this.changed("networkConfig")) && (!this.networkConfig || !this.networkConfig.ipAddress)) {
          throw new Error("IP address is required for network printers");
        }
      },
      osConfigRequired() {
        // Skip validation if only isActive is being updated
        const changedFields = this.changed();
        if (changedFields && changedFields.length === 1 && changedFields[0] === "isActive") {
          return;
        }

        // Skip validation if only updating non-connection related fields
        const connectionRelatedFields = ["connectionType", "osConfig", "networkConfig", "name", "type"];
        const hasConnectionChanges = changedFields && changedFields.some(field => connectionRelatedFields.includes(field));

        if (!hasConnectionChanges && !this.isNewRecord) {
          return;
        }

        // Only validate OS config if connection type is USB and we're creating or updating connection-related fields
        if (this.connectionType === "usb" && (this.isNewRecord || this.changed("connectionType") || this.changed("osConfig")) && (!this.osConfig || !this.osConfig.printerName)) {
          throw new Error("OS printer name is required for USB printers");
        }
      }
    }
  }
);

export default Printer;
