import sequelize from './config/database.js';
import { User } from './models/index.js';

async function checkPermissions() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const users = await User.findAll({
      attributes: ['id', 'username', 'firstName', 'lastName', 'role', 'permissions'],
      limit: 5
    });
    
    console.log('👥 Users and their permissions:');
    users.forEach(user => {
      console.log(`\n🔍 User: ${user.username} (${user.role})`);
      console.log(`   employee.read: ${user.permissions['employee.read']}`);
      console.log(`   employee.create: ${user.permissions['employee.create']}`);
      console.log(`   employee.update: ${user.permissions['employee.update']}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkPermissions();
