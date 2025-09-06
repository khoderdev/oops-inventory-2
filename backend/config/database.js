// import chalk from "chalk";
// import { Sequelize } from "sequelize";
// import dotenv from "dotenv";

// // Load environment variables from .env file
// dotenv.config();

// // Production database URL
// const PRODUCTION_DATABASE_URL = "postgresql://inventory_db_n6g9_user:yOnU8Ma28mZNx3TBOx6Zj4usNMI8OVFa@dpg-d2jmt88dl3ps73cfqug0-a/inventory_db_n6g9";

// // Check if we're in production mode
// const isProduction = process.env.NODE_ENV === "production";

// console.log(`🔧 Database Config - NODE_ENV: ${process.env.NODE_ENV}`);
// console.log(`🔧 Database Config - Using ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} database`);

// const sequelize = isProduction
//   ? new Sequelize(PRODUCTION_DATABASE_URL, {
//       dialect: "postgres",
//       logging: false,
//       benchmark: true,
//       dialectOptions: {
//         ssl: {
//           require: true,
//           rejectUnauthorized: false
//         }
//       }
//     })
//   : new Sequelize({
//       dialect: "postgres",
//       host: "localhost",
//       database: "inventory_db",
//       username: "postgres",
//       password: "postgres",
//       port: 5432,
//       logging: false,
//       // logging: console.log,
//       benchmark: true
//     });

// export default sequelize;

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Production database URL
const PRODUCTION_DATABASE_URL = "postgresql://inventory_db_n6g9_user:yOnU8Ma28mZNx3TBOx6Zj4usNMI8OVFa@dpg-d2jmt88dl3ps73cfqug0-a/inventory_db_n6g9";

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === "production";

console.log(`🔧 Database Config - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔧 Database Config - Using ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} database`);

const sequelize = isProduction
  ? new Sequelize(PRODUCTION_DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      benchmark: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      dialect: "postgres",
      host: "localhost",
      database: "inventory_db1",
      username: "postgres",
      password: "postgres",
      port: 5432,
      logging: false,
      // logging: console.log,
      benchmark: true
    });

// Function to reset database sequences
export const resetAllSequences = async () => {
  try {
    console.log("🔄 Resetting database sequences...");

    // List of sequences to reset (add more as needed)
    const sequencesToReset = ["sessions_id_seq", "audit_logs_id_seq", "users_id_seq", "menuItems_id_seq", "sauces_id_seq", "stock_entries_id_seq", "materials_id_seq", "menu_item_ingredients_id_seq", "menu_item_sauces_id_seq", "printers_id_seq", "system_logs_id_seq"];

    for (const seqName of sequencesToReset) {
      try {
        // Extract table name from sequence name
        const tableName = seqName.replace("_id_seq", "");

        await sequelize.query(`
          SELECT setval('${seqName}', 
            COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1, 
            false
          );
        `);
        console.log(`✅ ${seqName} reset successfully`);
      } catch (seqError) {
        // If sequence doesn't exist, try to create it
        if (seqError.message.includes("does not exist")) {
          console.log(`ℹ️  Sequence ${seqName} does not exist, skipping...`);
        } else {
          console.warn(`⚠️ Could not reset sequence ${seqName}:`, seqError.message);
        }
      }
    }

    console.log("✅ All sequences reset successfully");
  } catch (error) {
    console.error("❌ Error resetting sequences:", error.message);
    throw error;
  }
};

// Function to check and fix specific sequences
export const checkAndFixSequences = async () => {
  try {
    console.log("🔍 Checking database sequences...");

    // Check sessions sequence specifically since we had issues with it
    try {
      const [result] = await sequelize.query(`
        SELECT 
          seq.relname as sequence_name,
          tab.relname as table_name,
          seq_vals.last_value,
          (SELECT MAX(id) FROM sessions) as max_id
        FROM pg_class seq
        JOIN pg_namespace nsp ON nsp.oid = seq.relnamespace
        LEFT JOIN pg_depend dep ON dep.objid = seq.oid AND dep.deptype = 'a'
        LEFT JOIN pg_class tab ON dep.refobjid = tab.oid
        CROSS JOIN (SELECT last_value FROM sessions_id_seq) seq_vals
        WHERE seq.relkind = 'S' 
        AND seq.relname = 'sessions_id_seq'
        AND nsp.nspname = 'public';
      `);

      if (result && result.length > 0) {
        const sequenceInfo = result[0];
        console.log(`📊 Sessions sequence info:`, {
          last_value: sequenceInfo.last_value,
          max_id: sequenceInfo.max_id
        });

        // If sequence is behind the max ID, fix it
        if (sequenceInfo.last_value <= sequenceInfo.max_id) {
          console.log(`⚠️ Sessions sequence needs reset (last_value: ${sequenceInfo.last_value}, max_id: ${sequenceInfo.max_id})`);
          await resetAllSequences();
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not check sessions sequence:", error.message);
    }
  } catch (error) {
    console.error("❌ Error checking sequences:", error.message);
  }
};

// Add a method to sequelize instance for easy access
sequelize.resetSequences = resetAllSequences;
sequelize.checkSequences = checkAndFixSequences;

export default sequelize;
