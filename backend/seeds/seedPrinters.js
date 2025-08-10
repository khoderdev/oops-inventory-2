import PrinterChannel from "../models/PrinterChannel.js";
import Printer from "../models/Printer.js";

/**
 * Seed printer channels and printers
 */
export async function seedPrinters() {
  console.log("🖨️ Seeding printer channels and printers...");

  try {
    // Seed Printer Channels
    const printerChannelsData = [
      {
        id: 1,
        name: "Cashier",
        description: "",
        isActive: true,
        priority: 1,
        settings: {},
        createdBy: 1,
        createdAt: new Date("2025-08-10T01:23:38.227+03:00"),
        updatedAt: new Date("2025-08-10T01:23:38.227+03:00")
      },
      {
        id: 2,
        name: "Bar",
        description: "",
        isActive: true,
        priority: 1,
        settings: {},
        createdBy: 1,
        createdAt: new Date("2025-08-10T01:23:44.285+03:00"),
        updatedAt: new Date("2025-08-10T01:23:44.285+03:00")
      },
      {
        id: 3,
        name: "Kitchen",
        description: "",
        isActive: true,
        priority: 1,
        settings: {},
        createdBy: 1,
        createdAt: new Date("2025-08-10T01:23:49.624+03:00"),
        updatedAt: new Date("2025-08-10T01:23:49.624+03:00")
      },
      {
        id: 4,
        name: "Arguile",
        description: "",
        isActive: true,
        priority: 1,
        settings: {},
        createdBy: 1,
        createdAt: new Date("2025-08-10T20:46:05.716+03:00"),
        updatedAt: new Date("2025-08-10T20:46:05.716+03:00")
      }
    ];

    // Seed Printers
    const printersData = [
      {
        id: 1,
        name: "Cashier",
        channelId: 1,
        type: "thermal",
        connectionType: "network",
        networkConfig: {
          port: 9100,
          protocol: "raw",
          ipAddress: "192.168.1.2"
        },
        osConfig: {},
        settings: {},
        capabilities: {},
        status: "error",
        lastPing: new Date("2025-08-10T20:40:59.578+03:00"),
        lastPrintJob: null,
        errorCount: 50,
        totalJobs: null,
        isActive: true,
        location: "",
        description: "",
        createdBy: 1,
        createdAt: new Date("2025-08-10T01:24:12.182+03:00"),
        updatedAt: new Date("2025-08-10T20:40:59.578+03:00")
      },
      {
        id: 2,
        name: "Bar",
        channelId: 2,
        type: "thermal",
        connectionType: "network",
        networkConfig: {
          port: 9100,
          protocol: "raw",
          ipAddress: "192.168.1.3"
        },
        osConfig: {},
        settings: {},
        capabilities: {},
        status: "error",
        lastPing: new Date("2025-08-10T20:41:04.644+03:00"),
        lastPrintJob: null,
        errorCount: 48,
        totalJobs: null,
        isActive: true,
        location: "",
        description: "",
        createdBy: 1,
        createdAt: new Date("2025-08-10T01:24:24.903+03:00"),
        updatedAt: new Date("2025-08-10T20:41:04.644+03:00")
      },
      {
        id: 3,
        name: "Kitchen",
        channelId: 3,
        type: "thermal",
        connectionType: "network",
        networkConfig: {
          port: 9100,
          protocol: "raw",
          ipAddress: "192.168.1.4"
        },
        osConfig: {},
        settings: {},
        capabilities: {},
        status: "error",
        lastPing: new Date("2025-08-10T20:41:09.659+03:00"),
        lastPrintJob: null,
        errorCount: 40,
        totalJobs: null,
        isActive: true,
        location: "",
        description: "",
        createdBy: 1,
        createdAt: new Date("2025-08-10T01:24:37.699+03:00"),
        updatedAt: new Date("2025-08-10T20:41:09.659+03:00")
      },
      {
        id: 4,
        name: "Arguile",
        channelId: 4,
        type: "thermal",
        connectionType: "network",
        networkConfig: {
          port: 9100,
          protocol: "raw",
          ipAddress: "192.168.1.5"
        },
        osConfig: {},
        settings: {},
        capabilities: {},
        status: "offline",
        lastPing: null,
        lastPrintJob: null,
        errorCount: 0,
        totalJobs: null,
        isActive: true,
        location: "",
        description: "",
        createdBy: 1,
        createdAt: new Date("2025-08-10T20:46:26.865+03:00"),
        updatedAt: new Date("2025-08-10T20:46:26.865+03:00")
      }
    ];

    let channelsCreated = 0;
    let channelsSkipped = 0;
    let printersCreated = 0;
    let printersSkipped = 0;

    // Create printer channels
    for (const channelData of printerChannelsData) {
      const [channel, created] = await PrinterChannel.findOrCreate({
        where: { id: channelData.id },
        defaults: channelData
      });

      if (created) {
        channelsCreated++;
        console.log(`✅ Created printer channel: ${channelData.name}`);
      } else {
        channelsSkipped++;
        console.log(`⏭️  Printer channel already exists: ${channelData.name}`);
      }
    }

    // Create printers
    for (const printerData of printersData) {
      const [printer, created] = await Printer.findOrCreate({
        where: { id: printerData.id },
        defaults: printerData
      });

      if (created) {
        printersCreated++;
        console.log(`✅ Created printer: ${printerData.name}`);
      } else {
        printersSkipped++;
        console.log(`⏭️  Printer already exists: ${printerData.name}`);
      }
    }

    console.log(`🖨️ Printer seeding completed: ${channelsCreated} channels created, ${channelsSkipped} channels skipped, ${printersCreated} printers created, ${printersSkipped} printers skipped`);

    return {
      channelsCreated,
      channelsSkipped,
      printersCreated,
      printersSkipped
    };

  } catch (error) {
    console.error("❌ Error seeding printers:", error);
    throw error;
  }
}
