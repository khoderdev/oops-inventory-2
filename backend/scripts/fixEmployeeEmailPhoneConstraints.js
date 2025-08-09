import sequelize from '../config/database.js';

async function fixEmployeeEmailPhoneConstraints() {
  try {
    console.log('🔄 Fixing Employee email and phone constraints...');
    
    // Check current constraints
    const [emailConstraint] = await sequelize.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'email'
    `);
    
    const [phoneConstraint] = await sequelize.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'phone'
    `);
    
    console.log('Current email constraint:', emailConstraint[0]);
    console.log('Current phone constraint:', phoneConstraint[0]);
    
    // Fix email column - make it nullable
    if (emailConstraint[0] && emailConstraint[0].is_nullable === 'NO') {
      console.log('🔧 Making email column nullable...');
      await sequelize.query(`
        ALTER TABLE "employees" 
        ALTER COLUMN "email" DROP NOT NULL
      `);
      console.log('✅ Email column is now nullable');
    } else {
      console.log('✅ Email column is already nullable');
    }
    
    // Fix phone column - make it nullable
    if (phoneConstraint[0] && phoneConstraint[0].is_nullable === 'NO') {
      console.log('🔧 Making phone column nullable...');
      await sequelize.query(`
        ALTER TABLE "employees" 
        ALTER COLUMN "phone" DROP NOT NULL
      `);
      console.log('✅ Phone column is now nullable');
    } else {
      console.log('✅ Phone column is already nullable');
    }
    
    // Verify the changes
    const [updatedEmailConstraint] = await sequelize.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'email'
    `);
    
    const [updatedPhoneConstraint] = await sequelize.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'phone'
    `);
    
    console.log('Updated email constraint:', updatedEmailConstraint[0]);
    console.log('Updated phone constraint:', updatedPhoneConstraint[0]);
    
    console.log('✅ Employee email and phone constraints fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing Employee constraints:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
fixEmployeeEmailPhoneConstraints()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
