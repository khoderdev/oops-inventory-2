import sequelize from './config/database.js';
import { User } from './models/index.js';

async function fixStaffPermissions() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Find the staff user
    const staffUser = await User.findOne({ where: { role: 'staff' } });
    
    if (!staffUser) {
      console.log('❌ No staff user found');
      process.exit(1);
    }
    
    console.log(`👤 Found staff user: ${staffUser.username}`);
    console.log(`   Current employee.read permission: ${staffUser.hasPermission('employee.read')}`);
    
    // Update staff user to have employee.read permission
    const updatedPermissions = { ...staffUser.permissions };
    updatedPermissions['employee.read'] = true;
    
    await staffUser.update({ permissions: updatedPermissions });
    
    console.log('✅ Updated staff user permissions');
    
    // Verify the change
    const updatedUser = await User.findByPk(staffUser.id);
    console.log(`   New employee.read permission: ${updatedUser.hasPermission('employee.read')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixStaffPermissions();
