import sequelize from "../config/database.js";
import Session from "../models/Session.js";

async function setupSessions() {
  try {
    console.log("🔄 Setting up sessions table with all required fields...");
    
    // Force sync to ensure all fields are present
    await Session.sync({ alter: true });
    console.log("✅ Sessions table synchronized with model");
    
    // Test the table structure
    const tableInfo = await sequelize.getQueryInterface().describeTable('sessions');
    console.log("📋 Sessions table structure:");
    
    const requiredFields = [
      'id', 'token', 'userId', 'deviceId', 'deviceName', 'deviceType', 
      'status', 'socketId', 'lastHeartbeat', 'logoutTime', 'ipAddress', 
      'userAgent', 'expiresAt', 'isActive', 'lastActivity', 'metadata',
      'createdAt', 'updatedAt'
    ];
    
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (tableInfo[field]) {
        console.log(`  ✅ ${field}: ${tableInfo[field].type}`);
      } else {
        console.log(`  ❌ ${field}: MISSING`);
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.log(`\n⚠️  Missing fields: ${missingFields.join(', ')}`);
      console.log("🔄 Running alter sync to add missing fields...");
      await Session.sync({ alter: true });
      console.log("✅ Missing fields should now be added");
    } else {
      console.log("\n✅ All required fields are present");
    }
    
    // Test basic operations
    console.log("\n🧪 Testing basic operations...");
    
    const testCount = await Session.count();
    console.log(`📊 Current sessions count: ${testCount}`);
    
    console.log("✅ Sessions table is fully operational");
    
  } catch (error) {
    console.error("❌ Error setting up sessions:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupSessions();
