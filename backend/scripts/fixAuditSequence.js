import sequelize from "../config/database.js";

async function fixAuditLogSequence() {
  try {
    console.log("🔧 Fixing audit_logs sequence...");

    // Get the current maximum ID
    const [results] = await sequelize.query("SELECT MAX(id) as max_id FROM audit_logs");
    const maxId = results[0]?.max_id || 0;

    console.log(`📊 Current max ID: ${maxId}`);

    // Reset the sequence to the correct value
    await sequelize.query(`SELECT setval('audit_logs_id_seq', ${maxId + 1})`);

    console.log("✅ Audit log sequence fixed successfully!");
    console.log("🎯 The sequence is now ready for new audit log entries.");
  } catch (error) {
    console.error("❌ Error fixing audit log sequence:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixAuditLogSequence();
