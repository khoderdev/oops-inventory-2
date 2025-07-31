import { DataTypes } from "sequelize";

export const up = async (queryInterface, Sequelize) => {
  console.log("🔄 Adding real-time session tracking fields to sessions table...");

  try {
    // Add device tracking fields
    await queryInterface.addColumn("sessions", "deviceId", {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: "Unique identifier for the device/terminal"
    });

    await queryInterface.addColumn("sessions", "deviceName", {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Human-readable device name (e.g., 'POS Terminal 1', 'Admin Laptop')"
    });

    await queryInterface.addColumn("sessions", "deviceType", {
      type: DataTypes.ENUM("web", "pos", "mobile", "tablet", "desktop"),
      allowNull: false,
      defaultValue: "web"
    });

    // Add status tracking fields
    await queryInterface.addColumn("sessions", "status", {
      type: DataTypes.ENUM("online", "offline", "idle", "away"),
      allowNull: false,
      defaultValue: "online"
    });

    await queryInterface.addColumn("sessions", "socketId", {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Socket.IO connection ID for real-time communication"
    });

    await queryInterface.addColumn("sessions", "lastHeartbeat", {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW")
    });

    await queryInterface.addColumn("sessions", "logoutTime", {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addColumn("sessions", "metadata", {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: "Additional session metadata (browser info, screen resolution, etc.)"
    });

    // Add indexes for better performance
    await queryInterface.addIndex("sessions", ["deviceId"], {
      name: "sessions_device_id_idx"
    });

    await queryInterface.addIndex("sessions", ["status"], {
      name: "sessions_status_idx"
    });

    await queryInterface.addIndex("sessions", ["lastHeartbeat"], {
      name: "sessions_last_heartbeat_idx"
    });

    await queryInterface.addIndex("sessions", ["socketId"], {
      name: "sessions_socket_id_idx"
    });

    await queryInterface.addIndex("sessions", ["userId", "deviceId"], {
      name: "sessions_user_device_idx"
    });

    await queryInterface.addIndex("sessions", ["isActive", "status"], {
      name: "sessions_active_status_idx"
    });

    console.log("✅ Successfully added real-time session tracking fields");
  } catch (error) {
    console.error("🚨 Error adding real-time session fields:", error);
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  console.log("🔄 Removing real-time session tracking fields from sessions table...");

  try {
    // Remove indexes first
    await queryInterface.removeIndex("sessions", "sessions_device_id_idx");
    await queryInterface.removeIndex("sessions", "sessions_status_idx");
    await queryInterface.removeIndex("sessions", "sessions_last_heartbeat_idx");
    await queryInterface.removeIndex("sessions", "sessions_socket_id_idx");
    await queryInterface.removeIndex("sessions", "sessions_user_device_idx");
    await queryInterface.removeIndex("sessions", "sessions_active_status_idx");

    // Remove columns
    await queryInterface.removeColumn("sessions", "deviceId");
    await queryInterface.removeColumn("sessions", "deviceName");
    await queryInterface.removeColumn("sessions", "deviceType");
    await queryInterface.removeColumn("sessions", "status");
    await queryInterface.removeColumn("sessions", "socketId");
    await queryInterface.removeColumn("sessions", "lastHeartbeat");
    await queryInterface.removeColumn("sessions", "logoutTime");
    await queryInterface.removeColumn("sessions", "metadata");

    console.log("✅ Successfully removed real-time session tracking fields");
  } catch (error) {
    console.error("🚨 Error removing real-time session fields:", error);
    throw error;
  }
};
