import { Session, User } from "../models/index.js";

const fixAuthIssue = async () => {
  try {
    console.log("🔧 Fixing authentication issue...\n");

    // Get the active session from database
    const activeSession = await Session.findOne({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "role"]
        }
      ],
      order: [["lastActivity", "DESC"]]
    });

    if (!activeSession) {
      console.log("❌ No active session found in database!");
      console.log("💡 Creating a new session for admin user...");
      
      // Find admin user
      const adminUser = await User.findOne({
        where: { 
          role: "admin",
          isActive: true 
        }
      });

      if (!adminUser) {
        console.log("❌ No admin user found! Please create one first.");
        return;
      }

      // Create new session
      const crypto = await import('crypto');
      const newToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const newSession = await Session.create({
        token: newToken,
        userId: adminUser.id,
        deviceId: "browser-fix",
        deviceName: "Browser Fix",
        deviceType: "web",
        status: "active",
        ipAddress: "127.0.0.1",
        userAgent: "Auth Fix Script",
        expiresAt: expiresAt,
        isActive: true,
        lastActivity: new Date()
      });

      console.log("✅ Created new session:");
      console.log(`   Token: ${newToken}`);
      console.log(`   User: ${adminUser.username}`);
      console.log(`   Expires: ${expiresAt}`);
      
      console.log("\n🔧 IMMEDIATE FIX - Run this in your browser console:");
      console.log(`localStorage.setItem('auth_token', '${newToken}');`);
      console.log(`localStorage.setItem('refresh_token', '${newToken}');`);
      console.log(`localStorage.setItem('token_expiry', '${Math.floor(expiresAt.getTime() / 1000)}');`);
      console.log(`localStorage.setItem('last_activity', '${Date.now()}');`);
      console.log(`localStorage.setItem('session_id', '${Date.now()}');`);
      console.log(`window.location.reload();`);
      
    } else {
      console.log("✅ Active session found in database:");
      console.log(`   Token: ${activeSession.token}`);
      console.log(`   User: ${activeSession.user.username}`);
      console.log(`   Last Activity: ${activeSession.lastActivity}`);
      console.log(`   Expires: ${activeSession.expiresAt}`);
      
      console.log("\n🔧 IMMEDIATE FIX - Run this in your browser console:");
      console.log(`localStorage.setItem('auth_token', '${activeSession.token}');`);
      console.log(`localStorage.setItem('refresh_token', '${activeSession.token}');`);
      console.log(`localStorage.setItem('token_expiry', '${Math.floor(activeSession.expiresAt.getTime() / 1000)}');`);
      console.log(`localStorage.setItem('last_activity', '${Date.now()}');`);
      console.log(`localStorage.setItem('session_id', '${activeSession.id}');`);
      console.log(`window.location.reload();`);
    }

    console.log("\n📋 Steps to fix:");
    console.log("1. Open your browser DevTools (F12)");
    console.log("2. Go to Console tab");
    console.log("3. Copy and paste the localStorage commands above");
    console.log("4. The page will reload and you'll be authenticated");

  } catch (error) {
    console.error("❌ Error fixing auth issue:", error);
  }
};

// Run the fix
fixAuthIssue().then(() => {
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
