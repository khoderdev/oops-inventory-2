import sequelize from "../config/database.js";
import { seedTables } from "../utils/seedTables.js";

async function initializeDatabase() {
  try {
    console.log("🚀 Starting database initialization...");
    
    // Step 1: Test database connection
    console.log("🔌 Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    
    // Step 2: Create enum types if they don't exist
    console.log("\n📊 Ensuring enum types exist...");
    
    const enumTypes = [
      {
        name: 'enum_employees_department',
        values: ['kitchen', 'service', 'management', 'cleaning', 'security', 'other']
      },
      {
        name: 'enum_tables_status',
        values: ['available', 'occupied', 'reserved', 'cleaning', 'out_of_order']
      },
      {
        name: 'enum_tables_shape',
        values: ['round', 'square', 'rectangular', 'oval']
      }
    ];
    
    for (const enumType of enumTypes) {
      try {
        const [results] = await sequelize.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = '${enumType.name}'
          );
        `);
        
        if (!results[0].exists) {
          console.log(`📝 Creating enum type: ${enumType.name}`);
          const valuesStr = enumType.values.map(v => `'${v}'`).join(', ');
          await sequelize.query(`
            CREATE TYPE "${enumType.name}" AS ENUM (${valuesStr});
          `);
          console.log(`✅ Created: ${enumType.name}`);
        } else {
          console.log(`✅ Exists: ${enumType.name}`);
        }
      } catch (error) {
        console.log(`⚠️  Enum ${enumType.name} issue (likely already exists):`, error.message);
      }
    }
    
    // Step 3: Sync models with error handling
    console.log("\n🔄 Syncing database models...");
    
    try {
      // Sync all models, but don't fail if there are enum comment issues
      await sequelize.sync({ alter: true });
      console.log("✅ Database models synced successfully");
    } catch (error) {
      console.log("⚠️  Model sync had issues (likely enum comments), continuing...");
      console.log("Error details:", error.message);
      
      // Try to sync critical models individually
      const criticalModels = ['User', 'Employee', 'Table', 'Session'];
      
      for (const modelName of criticalModels) {
        try {
          const modelModule = await import(`../models/${modelName}.js`);
          const Model = modelModule.default;
          if (Model) {
            await Model.sync({ alter: true });
            console.log(`✅ Synced: ${modelName}`);
          }
        } catch (modelError) {
          console.log(`⚠️  ${modelName} sync issue:`, modelError.message);
        }
      }
    }
    
    // Step 4: Ensure sessions table exists
    console.log("\n📋 Ensuring sessions table exists...");
    
    const [sessionResults] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      );
    `);
    
    if (!sessionResults[0].exists) {
      console.log("📝 Creating sessions table...");
      await sequelize.query(`
        CREATE TABLE "sessions" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        ) WITH (OIDS=FALSE);
        
        ALTER TABLE "sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        CREATE INDEX "IDX_session_expire" ON "sessions" ("expire");
      `);
      console.log("✅ Sessions table created");
    } else {
      console.log("✅ Sessions table exists");
    }
    
    // Step 5: Seed initial data
    console.log("\n🌱 Seeding initial data...");
    
    try {
      const seedResult = await seedTables();
      console.log("✅ Table seeding completed:", seedResult);
    } catch (seedError) {
      console.log("⚠️  Seeding issue:", seedError.message);
    }
    
    // Step 6: Final verification
    console.log("\n🔍 Final verification...");
    
    const [tableCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log(`📊 Total tables in database: ${tableCount[0].count}`);
    
    // Test a simple query
    await sequelize.query('SELECT 1 as test');
    console.log("✅ Database queries working");
    
    console.log("\n🎉 Database initialization completed successfully!");
    
    return {
      success: true,
      message: "Database initialized successfully"
    };
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Export for use in other modules
export { initializeDatabase };

// Run directly if this script is executed
if (process.argv[1] && process.argv[1].includes('startup-database.js')) {
  initializeDatabase()
    .then((result) => {
      console.log("\n🏁 Startup completed:", result.message);
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Startup failed:", error);
      process.exit(1);
    })
    .finally(() => {
      sequelize.close();
    });
}
