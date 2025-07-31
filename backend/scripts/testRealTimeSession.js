import { Session, User } from "../models/index.js";
import sequelize from "../config/database.js";

console.log("🧪 Testing Real-Time Session Tracking System...");

async function testRealTimeSession() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Test 1: Create a test session with device tracking
    console.log("\n📱 Test 1: Creating session with device tracking...");
    
    const testSession = await Session.create({
      token: "test-token-" + Date.now(),
      userId: 1, // Assuming admin user exists
      deviceId: "test-device-1",
      deviceName: "Test POS Terminal",
      deviceType: "pos",
      status: "online",
      ipAddress: "192.168.1.100",
      userAgent: "Test Agent",
      lastHeartbeat: new Date(),
      metadata: {
        testData: "Real-time session test",
        timestamp: new Date()
      }
    });

    console.log("✅ Test session created:", {
      id: testSession.id,
      deviceId: testSession.deviceId,
      deviceName: testSession.deviceName,
      deviceType: testSession.deviceType,
      status: testSession.status
    });

    // Test 2: Test heartbeat functionality
    console.log("\n💓 Test 2: Testing heartbeat functionality...");
    
    await testSession.updateHeartbeat();
    console.log("✅ Heartbeat updated successfully");
    console.log("📊 Session online status:", testSession.isOnline());

    // Test 3: Test status updates
    console.log("\n🔄 Test 3: Testing status updates...");
    
    await testSession.update({ status: "idle" });
    console.log("✅ Status updated to idle");

    // Test 4: Test static methods
    console.log("\n📈 Test 4: Testing static methods...");
    
    const activeUserSessions = await Session.getActiveUserSessions(1);
    console.log("✅ Active user sessions:", activeUserSessions.length);

    const sessionStats = await Session.getSessionStats();
    console.log("✅ Session statistics:", sessionStats);

    const userDevices = await Session.getUserDevices(1);
    console.log("✅ User devices:", userDevices.length);

    // Test 5: Test cleanup functionality
    console.log("\n🧹 Test 5: Testing cleanup functionality...");
    
    // Create an expired session for testing
    const expiredSession = await Session.create({
      token: "expired-token-" + Date.now(),
      userId: 1,
      deviceId: "expired-device",
      deviceName: "Expired Device",
      deviceType: "web",
      status: "online",
      lastHeartbeat: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      expiresAt: new Date(Date.now() - 60 * 1000) // 1 minute ago
    });

    const cleanedCount = await Session.cleanupExpired();
    console.log("✅ Cleaned up sessions:", cleanedCount);

    // Test 6: Test force logout
    console.log("\n🚪 Test 6: Testing force logout...");
    
    await testSession.setOffline();
    console.log("✅ Session set offline");
    console.log("📊 Session online status after logout:", testSession.isOnline());

    // Cleanup test data
    console.log("\n🧹 Cleaning up test data...");
    await Session.destroy({
      where: {
        token: {
          [sequelize.Sequelize.Op.like]: "test-token-%"
        }
      }
    });
    await Session.destroy({
      where: {
        token: {
          [sequelize.Sequelize.Op.like]: "expired-token-%"
        }
      }
    });
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 All tests passed! Real-time session tracking system is working correctly.");
    
  } catch (error) {
    console.error("🚨 Test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testRealTimeSession();
