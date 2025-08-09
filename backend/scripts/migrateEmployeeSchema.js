#!/usr/bin/env node

import sequelize from '../config/database.js';

async function migrateEmployeeSchema() {
  try {
    console.log('🔧 Starting Employee schema migration...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 1. Make userId column nullable
    console.log('📝 Making userId column nullable...');
    await sequelize.query(`
      ALTER TABLE employees 
      ALTER COLUMN "userId" DROP NOT NULL;
    `);
    console.log('✅ userId column is now nullable');

    // 2. Add new employee personal fields
    console.log('📝 Adding new employee personal fields...');
    
    // Check if columns already exist before adding them
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      AND column_name IN ('firstName', 'lastName', 'email', 'phone');
    `);
    
    const existingColumns = results.map(row => row.column_name);
    
    if (!existingColumns.includes('firstName')) {
      await sequelize.query(`
        ALTER TABLE employees 
        ADD COLUMN "firstName" VARCHAR(100);
      `);
      console.log('✅ Added firstName column');
    } else {
      console.log('ℹ️  firstName column already exists');
    }
    
    if (!existingColumns.includes('lastName')) {
      await sequelize.query(`
        ALTER TABLE employees 
        ADD COLUMN "lastName" VARCHAR(100);
      `);
      console.log('✅ Added lastName column');
    } else {
      console.log('ℹ️  lastName column already exists');
    }
    
    if (!existingColumns.includes('email')) {
      await sequelize.query(`
        ALTER TABLE employees 
        ADD COLUMN "email" VARCHAR(255);
      `);
      console.log('✅ Added email column');
    } else {
      console.log('ℹ️  email column already exists');
    }
    
    if (!existingColumns.includes('phone')) {
      await sequelize.query(`
        ALTER TABLE employees 
        ADD COLUMN "phone" VARCHAR(20);
      `);
      console.log('✅ Added phone column');
    } else {
      console.log('ℹ️  phone column already exists');
    }

    // 3. Add unique constraints for email and phone (if columns were just created)
    if (!existingColumns.includes('email')) {
      console.log('📝 Adding unique constraint for email...');
      await sequelize.query(`
        ALTER TABLE employees 
        ADD CONSTRAINT employees_email_unique UNIQUE ("email");
      `);
      console.log('✅ Added unique constraint for email');
    }
    
    if (!existingColumns.includes('phone')) {
      console.log('📝 Adding unique constraint for phone...');
      await sequelize.query(`
        ALTER TABLE employees 
        ADD CONSTRAINT employees_phone_unique UNIQUE ("phone");
      `);
      console.log('✅ Added unique constraint for phone');
    }

    // 4. Update existing employees with placeholder data (if needed)
    console.log('📝 Checking for employees without personal data...');
    const [employeesWithoutData] = await sequelize.query(`
      SELECT id, "userId"
      FROM employees 
      WHERE "firstName" IS NULL OR "lastName" IS NULL OR "email" IS NULL OR "phone" IS NULL;
    `);

    if (employeesWithoutData.length > 0) {
      console.log(`📝 Updating ${employeesWithoutData.length} employees with placeholder data...`);
      
      for (const employee of employeesWithoutData) {
        // Get user data if userId exists
        let userData = null;
        if (employee.userId) {
          const [userResults] = await sequelize.query(`
            SELECT "firstName", "lastName", "email", "phone"
            FROM users 
            WHERE id = :userId;
          `, {
            replacements: { userId: employee.userId }
          });
          userData = userResults[0];
        }

        // Update employee with user data or placeholder data
        await sequelize.query(`
          UPDATE employees 
          SET 
            "firstName" = COALESCE("firstName", :firstName),
            "lastName" = COALESCE("lastName", :lastName),
            "email" = COALESCE("email", :email),
            "phone" = COALESCE("phone", :phone)
          WHERE id = :employeeId;
        `, {
          replacements: {
            employeeId: employee.id,
            firstName: userData?.firstName || `Employee${employee.id}`,
            lastName: userData?.lastName || 'User',
            email: userData?.email || `employee${employee.id}@company.com`,
            phone: userData?.phone || `+1-555-000-${String(employee.id).padStart(4, '0')}`
          }
        });
      }
      console.log('✅ Updated existing employees with personal data');
    } else {
      console.log('ℹ️  All employees already have personal data');
    }

    // 5. Make the new fields NOT NULL after populating data
    console.log('📝 Making new personal fields required...');
    await sequelize.query(`
      ALTER TABLE employees 
      ALTER COLUMN "firstName" SET NOT NULL,
      ALTER COLUMN "lastName" SET NOT NULL,
      ALTER COLUMN "email" SET NOT NULL,
      ALTER COLUMN "phone" SET NOT NULL;
    `);
    console.log('✅ Personal fields are now required');

    console.log('🎉 Employee schema migration completed successfully!');
    console.log('📋 Summary of changes:');
    console.log('   • userId column is now nullable (employees can exist without user accounts)');
    console.log('   • Added firstName, lastName, email, phone columns');
    console.log('   • Added unique constraints for email and phone');
    console.log('   • Updated existing employees with personal data');
    console.log('   • New personal fields are required for new employees');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrateEmployeeSchema();
