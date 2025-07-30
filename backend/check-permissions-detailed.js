import sequelize from './config/database.js';
import { User } from './models/index.js';

async function checkPermissions() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const users = await User.findAll({
      limit: 5
    });
    
    console.log('👥 Users and their permissions:');
    users.forEach(user => {
      console.log(`\n🔍 User: ${user.username} (${user.role})`);
      console.log(`   Full permissions object:`, JSON.stringify(user.permissions, null, 2));
      
      if (user.permissions) {
        console.log(`   employee.read: ${user.permissions['employee.read']}`);
        console.log(`   employee.create: ${user.permissions['employee.create']}`);
        console.log(`   employee.update: ${user.permissions['employee.update']}`);
      } else {
        console.log('   ❌ No permissions object found');
      }
    });
    
    // Test the permission check method
    console.log('\n🧪 Testing permission check method:');
    const adminUser = users.find(u => u.role === 'admin');
    const staffUser = users.find(u => u.role === 'staff');
    
    if (adminUser) {
      console.log(`Admin hasPermission('employee.read'): ${adminUser.hasPermission('employee.read')}`);
    }
    
    if (staffUser) {
      console.log(`Staff hasPermission('employee.read'): ${staffUser.hasPermission('employee.read')}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkPermissions();
