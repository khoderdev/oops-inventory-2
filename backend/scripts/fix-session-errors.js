import sequelize from "../config/database.js";
import Session from "../models/Session.js";

async function fixSessionErrors() {
  try {
    console.log("🔧 Fixing session-related errors...");
    
    // Test if sessions table exists and is accessible
    try {
      const sessionCount = await Session.count();
      console.log(`✅ Sessions table is accessible (${sessionCount} sessions)`);
      
      // Test basic session operations that the real-time service uses
      console.log("🧪 Testing real-time service queries...");
      
      // This is the exact query that was failing in the heartbeat service
      const inactiveSessions = await Session.findAll({
        where: {
          isActive: true,
          status: "online",
          lastHeartbeat: {
            [sequelize.Sequelize.Op.lt]: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
          }
        }
      });
      
      console.log(`✅ Heartbeat query works (found ${inactiveSessions.length} inactive sessions)`);
      
      // Test session creation (what happens during login)
      console.log("🧪 Testing session creation...");
      
      const testSession = await Session.create({
        userId: 1,
        deviceId: "test-fix-123",
        deviceName: "Test Fix Device",
        deviceType: "web",
        status: "online",
        ipAddress: "127.0.0.1",
        userAgent: "Fix Test Agent",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        lastActivity: new Date(),
        lastHeartbeat: new Date()
      });
      
      console.log(`✅ Session creation works (ID: ${testSession.id})`);
      
      // Clean up test session
      await testSession.destroy();
      console.log("✅ Test session cleaned up");
      
      console.log("\n🎉 All session operations are working correctly!");
      console.log("🔄 The real-time session service should now work without errors.");
      
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.original.code === '42P01') {
        console.log("❌ Sessions table does not exist. Creating it...");
        await Session.sync({ force: false });
        console.log("✅ Sessions table created. Re-running tests...");
        
        // Recursively call this function to test again
        return await fixSessionErrors();
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error("❌ Failed to fix session errors:", error);
    console.error("📋 Error details:", {
      name: error.name,
      message: error.message,
      code: error.original?.code
    });
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixSessionErrors();
