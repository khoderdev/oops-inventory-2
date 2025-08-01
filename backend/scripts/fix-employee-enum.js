import sequelize from "../config/database.js";

async function fixEmployeeEnum() {
  try {
    console.log("🔧 Starting Employee enum fix...");
    
    // First, let's check if the employees table exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employees'
      );
    `);
    
    const tableExists = results[0].exists;
    console.log(`📋 Employees table exists: ${tableExists}`);
    
    if (!tableExists) {
      console.log("📝 Creating employees table...");
      // Create the table with the enum type first
      await sequelize.query(`
        CREATE TYPE "enum_employees_department" AS ENUM (
          'kitchen', 'service', 'management', 'cleaning', 'security', 'other'
        );
      `);
      
      // Now sync the Employee model
      const Employee = (await import("../models/Employee.js")).default;
      await Employee.sync({ force: false });
      console.log("✅ Employees table created successfully");
    } else {
      console.log("🔍 Checking enum type...");
      
      // Check if the enum type exists
      const [enumResults] = await sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'enum_employees_department'
        );
      `);
      
      const enumExists = enumResults[0].exists;
      console.log(`📊 Enum type exists: ${enumExists}`);
      
      if (!enumExists) {
        console.log("📝 Creating enum type...");
        await sequelize.query(`
          CREATE TYPE "enum_employees_department" AS ENUM (
            'kitchen', 'service', 'management', 'cleaning', 'security', 'other'
          );
        `);
        console.log("✅ Enum type created");
      }
      
      // Check if the department column exists and has the right type
      const [columnResults] = await sequelize.query(`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'department';
      `);
      
      if (columnResults.length === 0) {
        console.log("📝 Adding department column...");
        await sequelize.query(`
          ALTER TABLE "employees" 
          ADD COLUMN "department" "enum_employees_department" 
          NOT NULL DEFAULT 'service';
        `);
        console.log("✅ Department column added");
      } else {
        console.log(`📊 Department column exists with type: ${columnResults[0].udt_name}`);
        
        if (columnResults[0].udt_name !== 'enum_employees_department') {
          console.log("🔄 Updating department column type...");
          await sequelize.query(`
            ALTER TABLE "employees" 
            ALTER COLUMN "department" TYPE "enum_employees_department" 
            USING "department"::text::"enum_employees_department";
          `);
          console.log("✅ Department column type updated");
        }
      }
    }
    
    // Now test the Employee model
    console.log("🧪 Testing Employee model...");
    const Employee = (await import("../models/Employee.js")).default;
    
    // Try to describe the table
    const tableDescription = await Employee.describe();
    console.log("📋 Employee table structure:");
    console.log("  - department:", tableDescription.department);
    
    console.log("✅ Employee enum fix completed successfully!");
    
  } catch (error) {
    console.error("❌ Error fixing Employee enum:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixEmployeeEnum()
  .then(() => {
    console.log("🎉 Fix completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fix failed:", error);
    process.exit(1);
  });
