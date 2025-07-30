import sequelize from './config/database.js';
import { User } from './models/index.js';

async function updatePermissions() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get all users
    const users = await User.findAll();
    
    console.log('🔄 Updating user permissions...');
    
    for (const user of users) {
      console.log(`\n👤 Updating permissions for: ${user.username} (${user.role})`);
      
      // Get the default permissions for this role using the instance method
      const defaultPermissions = user.getRolePermissions();
      
      // Merge existing permissions with default permissions (default permissions take precedence for missing keys)
      const updatedPermissions = { ...user.permissions, ...defaultPermissions };
      
      // Count new permissions added
      const existingKeys = Object.keys(user.permissions || {});
      const newKeys = Object.keys(updatedPermissions).filter(key => !existingKeys.includes(key));
      
      if (newKeys.length > 0) {
        console.log(`   ➕ Adding ${newKeys.length} new permissions`);
        console.log(`   📋 Employee permissions:`, newKeys.filter(k => k.startsWith('employee')));
        
        // Update the user
        await user.update({ permissions: updatedPermissions });
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`   ✅ No updates needed`);
      }
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const updatedUsers = await User.findAll({
      attributes: ['username', 'role']
    });
    
    for (const user of updatedUsers) {
      const hasEmployeeRead = user.hasPermission('employee.read');
      console.log(`   ${user.username} (${user.role}): employee.read = ${hasEmployeeRead}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

updatePermissions();
