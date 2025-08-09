import { Session, User } from "../models/index.js";

const checkAuthStatus = async () => {
  try {
    console.log("🔍 Checking authentication status...\n");

    // Get all active sessions
    const activeSessions = await Session.findAll({
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

    console.log(`📊 Found ${activeSessions.length} active sessions:`);
    
    if (activeSessions.length === 0) {
      console.log("❌ No active sessions found in database!");
      console.log("💡 This explains the 401 errors - all sessions have been invalidated.");
      console.log("\n🔧 Solutions:");
      console.log("1. User needs to log in again");
      console.log("2. Or we can create a new session for existing user");
    } else {
      activeSessions.forEach((session, index) => {
        console.log(`\n${index + 1}. Session ID: ${session.id}`);
        console.log(`   User: ${session.user.username} (${session.user.firstName} ${session.user.lastName})`);
        console.log(`   Role: ${session.user.role}`);
        console.log(`   Token: ${session.token.substring(0, 20)}...`);
        console.log(`   Last Activity: ${session.lastActivity}`);
        console.log(`   Expires At: ${session.expiresAt}`);
        console.log(`   Is Expired: ${session.isExpired()}`);
      });
    }

    // Check for any users in the system
    const allUsers = await User.findAll({
      where: { isActive: true },
      attributes: ["id", "username", "firstName", "lastName", "role"]
    });

    console.log(`\n👥 Found ${allUsers.length} active users in system:`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });

  } catch (error) {
    console.error("❌ Error checking auth status:", error);
  }
};

// Run the check
checkAuthStatus().then(() => {
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
