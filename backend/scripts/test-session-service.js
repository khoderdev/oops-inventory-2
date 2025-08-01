import sequelize from "../config/database.js";
import Session from "../models/Session.js";

async function testSessionService() {
  try {
    console.log("🧪 Testing Session Service functionality...");
    
    // Test 1: Basic session operations
    console.log("\n1️⃣ Testing basic session operations...");
    
    const sessionCount = await Session.count();
    console.log(`📊 Current sessions in database: ${sessionCount}`);
    
    // Test 2: Test session creation
    console.log("\n2️⃣ Testing session creation...");
    
    const testSession = await Session.create({
      userId: 1, // Assuming user ID 1 exists
      deviceId: "test-device-123",
      deviceName: "Test Device",
      deviceType: "web",
      status: "online",
      ipAddress: "127.0.0.1",
      userAgent: "Test Agent",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isActive: true,
      lastActivity: new Date(),
      metadata: JSON.stringify({ test: true })
    });
    
    console.log(`✅ Test session created with ID: ${testSession.id}`);
    
    // Test 3: Test session queries
    console.log("\n3️⃣ Testing session queries...");
    
    const activeSessions = await Session.findAll({
      where: {
        isActive: true,
        status: "online"
      }
    });
    
    console.log(`📊 Active online sessions: ${activeSessions.length}`);
    
    // Test 4: Test session updates
    console.log("\n4️⃣ Testing session updates...");
    
    await testSession.update({
      status: "idle",
      lastHeartbeat: new Date()
    });
    
    console.log("✅ Session status updated to idle");
    
    // Test 5: Cleanup test session
    console.log("\n5️⃣ Cleaning up test session...");
    
    await testSession.destroy();
    console.log("✅ Test session cleaned up");
    
    console.log("\n🎉 All session service tests passed!");
    
  } catch (error) {
    console.error("❌ Session service test failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testSessionService();
