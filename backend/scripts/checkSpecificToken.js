import { Session, User } from "../models/index.js";

const checkSpecificToken = async () => {
  try {
    console.log("🔍 Checking specific token from frontend...\n");

    // You'll need to provide the token from your browser's localStorage
    console.log("📋 To check your frontend token:");
    console.log("1. Open browser DevTools (F12)");
    console.log("2. Go to Application/Storage tab");
    console.log("3. Look for localStorage");
    console.log("4. Find 'auth_token' key");
    console.log("5. Copy the token value and run:");
    console.log("   node scripts/checkSpecificToken.js YOUR_TOKEN_HERE\n");

    const tokenToCheck = process.argv[2];
    
    if (!tokenToCheck) {
      console.log("❌ No token provided as argument");
      console.log("Usage: node scripts/checkSpecificToken.js YOUR_TOKEN_HERE");
      return;
    }

    console.log(`🔍 Checking token: ${tokenToCheck.substring(0, 20)}...`);

    // Find session with this specific token
    const session = await Session.findOne({
      where: {
        token: tokenToCheck,
        isActive: true
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "role"]
        }
      ]
    });

    if (!session) {
      console.log("❌ Token not found in database or session is inactive!");
      console.log("💡 This explains the 401 errors.");
      console.log("\n🔧 Solutions:");
      console.log("1. Clear localStorage and log in again");
      console.log("2. Or use the active session token from database");
      
      // Show the active session token
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

      if (activeSession) {
        console.log(`\n✅ Active session found in database:`);
        console.log(`   Token: ${activeSession.token}`);
        console.log(`   User: ${activeSession.user.username}`);
        console.log(`   Last Activity: ${activeSession.lastActivity}`);
        console.log(`\n💡 You can manually set this token in localStorage:`);
        console.log(`   localStorage.setItem('auth_token', '${activeSession.token}');`);
      }
    } else {
      console.log("✅ Token found and valid!");
      console.log(`   Session ID: ${session.id}`);
      console.log(`   User: ${session.user.username} (${session.user.firstName} ${session.user.lastName})`);
      console.log(`   Role: ${session.user.role}`);
      console.log(`   Last Activity: ${session.lastActivity}`);
      console.log(`   Expires At: ${session.expiresAt}`);
      console.log(`   Is Expired: ${session.isExpired()}`);
      console.log("\n🤔 If token is valid but you're getting 401 errors, check:");
      console.log("1. Backend server is running");
      console.log("2. Database connection is working");
      console.log("3. No middleware issues");
    }

  } catch (error) {
    console.error("❌ Error checking token:", error);
  }
};

// Run the check
checkSpecificToken().then(() => {
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
