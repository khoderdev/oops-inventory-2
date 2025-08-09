import sequelize from "./database.js";

async function createPrinterTables() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Create printer_channels table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS printer_channels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 1,
        settings JSONB DEFAULT '{}',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ printer_channels table created");

    // Create printers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS printers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        channel_id INTEGER REFERENCES printer_channels(id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('thermal', 'inkjet', 'laser', 'receipt', 'label')),
        connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('usb', 'network', 'bluetooth', 'serial')),
        network_config JSONB DEFAULT '{}',
        os_config JSONB DEFAULT '{}',
        settings JSONB DEFAULT '{}',
        capabilities JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'busy', 'maintenance')),
        last_ping TIMESTAMP,
        last_print_job TIMESTAMP,
        error_count INTEGER DEFAULT 0,
        total_jobs INTEGER,
        is_active BOOLEAN DEFAULT true,
        location VARCHAR(200),
        description TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ printers table created");

    // Verify tables exist
    const [channelResult] = await sequelize.query("SELECT COUNT(*) FROM printer_channels");
    const [printerResult] = await sequelize.query("SELECT COUNT(*) FROM printers");
    
    console.log(`✅ printer_channels table has ${channelResult[0].count} rows`);
    console.log(`✅ printers table has ${printerResult[0].count} rows`);

    console.log("✅ All printer tables created successfully.");
    
  } catch (error) {
    console.error("❌ Table creation failed:", error);
    console.error("Error details:", error.message);
  } finally {
    await sequelize.close();
  }
}

createPrinterTables();
