import sequelize from "../config/database.js";
import Session from "../models/Session.js";

async function checkAndCreateSessionsTable() {
  try {
    console.log("🔍 Checking if sessions table exists...");
    
    // Test if the table exists by trying to query it
    try {
      await Session.findOne({ limit: 1 });
      console.log("✅ Sessions table exists and is accessible");
      return;
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.original.code === '42P01') {
        console.log("❌ Sessions table does not exist. Creating it...");
        
        // Sync the Session model to create the table
        await Session.sync({ force: false });
        console.log("✅ Sessions table created successfully");
        
        // Test again
        await Session.findOne({ limit: 1 });
        console.log("✅ Sessions table is now accessible");
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("❌ Error checking/creating sessions table:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkAndCreateSessionsTable();
