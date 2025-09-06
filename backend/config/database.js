import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const PRODUCTION_DATABASE_URL = "postgresql://inventory_db_n6g9_user:yOnU8Ma28mZNx3TBOx6Zj4usNMI8OVFa@dpg-d2jmt88dl3ps73cfqug0-a/inventory_db_n6g9";

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
      database: "inventory_db",
      username: "postgres",
      password: "postgres",
      port: 5432,
      logging: false,
      benchmark: true
    });

// Function to reset database sequences
export const resetAllSequences = async () => {
  try {
    console.log("🔄 Resetting database sequences...");

    // Get all sequences dynamically instead of hardcoding them
    const query = `
      SELECT 
        t.relname as table_name,
        a.attname as column_name,
        s.relname as sequence_name
      FROM pg_class s
      JOIN pg_depend d ON d.objid = s.oid
      JOIN pg_class t ON d.refobjid = t.oid
      JOIN pg_attribute a ON (d.refobjid, d.refobjsubid) = (a.attrelid, a.attnum)
      WHERE s.relkind = 'S' 
      AND s.relnamespace::regnamespace::text = 'public'
      ORDER BY t.relname, a.attname;
    `;

    const sequencesResult = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    // Handle different result formats from different PostgreSQL/Sequelize versions
    const sequences = Array.isArray(sequencesResult) ? sequencesResult : [sequencesResult];

    for (const seq of sequences) {
      try {
        // Special handling for DayOperations table
        if (seq.table_name === "DayOperations") {
          const maxIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_val FROM "${seq.table_name}";`;
          const maxIdResult = await sequelize.query(maxIdQuery, {
            type: sequelize.QueryTypes.SELECT
          });

          const next_val = Array.isArray(maxIdResult) && maxIdResult[0] ? maxIdResult[0].next_val : 1;

          const setValQuery = `SELECT setval('"${seq.sequence_name}"', ${next_val}, false);`;
          await sequelize.query(setValQuery);
          console.log(`✅ Reset sequence for ${seq.table_name}.${seq.column_name} to ${next_val}`);
          continue;
        }

        // Standard sequence reset for other tables
        const maxIdQuery = `SELECT COALESCE(MAX("${seq.column_name}"), 0) + 1 as next_val FROM "${seq.table_name}";`;
        const maxIdResult = await sequelize.query(maxIdQuery, {
          type: sequelize.QueryTypes.SELECT
        });

        const next_val = Array.isArray(maxIdResult) && maxIdResult[0] ? maxIdResult[0].next_val : 1;

        const setValQuery = `SELECT setval('"${seq.sequence_name}"', ${next_val}, false);`;
        await sequelize.query(setValQuery);
        console.log(`✅ Reset sequence for ${seq.table_name}.${seq.column_name} to ${next_val}`);
      } catch (error) {
        console.warn(`⚠️ Could not reset sequence for ${seq.table_name}.${seq.column_name}:`, error.message);
      }
    }

    console.log("✅ All sequences reset successfully");
    return true;
  } catch (error) {
    console.error("❌ Error resetting sequences:", error.message);
    throw error;
  }
};

// Function to check and fix specific sequences
export const checkAndFixSequences = async () => {
  try {
    console.log("🔍 Checking database sequences...");

    // Get all sequences
    const query = `
      SELECT 
        t.relname as table_name,
        a.attname as column_name,
        s.relname as sequence_name,
        last_value
      FROM pg_class s
      JOIN pg_depend d ON d.objid = s.oid
      JOIN pg_class t ON d.refobjid = t.oid
      JOIN pg_attribute a ON (d.refobjid, d.refobjsubid) = (a.attrelid, a.attnum)
      JOIN pg_sequences ps ON ps.schemaname = 'public' AND ps.sequencename = s.relname
      WHERE s.relkind = 'S' 
      AND s.relnamespace::regnamespace::text = 'public'
      ORDER BY t.relname, a.attname;
    `;

    const sequencesResult = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    // Handle different result formats from different PostgreSQL/Sequelize versions
    const sequences = Array.isArray(sequencesResult) ? sequencesResult : [sequencesResult];

    let needsReset = false;

    for (const seq of sequences) {
      try {
        // Get the maximum ID for the table
        const maxIdQuery = `SELECT COALESCE(MAX("${seq.column_name}"), 0) as max_id FROM "${seq.table_name}";`;
        const maxIdResult = await sequelize.query(maxIdQuery, {
          type: sequelize.QueryTypes.SELECT
        });

        const max_id = Array.isArray(maxIdResult) && maxIdResult[0] ? maxIdResult[0].max_id : 0;

        console.log(`📊 ${seq.table_name} sequence info:`, {
          last_value: seq.last_value,
          max_id: max_id
        });

        // If sequence is behind the max ID, mark for reset
        if (parseInt(seq.last_value) <= parseInt(max_id || 0)) {
          console.log(`⚠️ ${seq.sequence_name} needs reset (last_value: ${seq.last_value}, max_id: ${max_id})`);
          needsReset = true;
        }
      } catch (error) {
        console.warn(`⚠️ Could not check sequence ${seq.sequence_name}:`, error.message);
      }
    }

    if (needsReset) {
      console.log("🔄 One or more sequences need resetting");
      await resetAllSequences();
    } else {
      console.log("✅ All sequences are correctly set");
    }

    return true;
  } catch (error) {
    console.error("❌ Error checking sequences:", error.message);
    throw error;
  }
};

// Add a method to sequelize instance for easy access
sequelize.resetSequences = resetAllSequences;
sequelize.checkSequences = checkAndFixSequences;

export default sequelize;
