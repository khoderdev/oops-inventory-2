import sequelize from './config/database.js';
import { Employee, User } from './models/index.js';

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const employeeCount = await Employee.count();
    console.log(`📊 Total employees: ${employeeCount}`);
    
    const userCount = await User.count();
    console.log(`👥 Total users: ${userCount}`);
    
    if (employeeCount > 0) {
      const employees = await Employee.findAll({ 
        limit: 3,
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] }]
      });
      console.log('📋 Sample employees:', JSON.stringify(employees, null, 2));
    }
    
    // Check if there are users without employee records
    const usersWithoutEmployees = await User.findAll({
      where: {
        '$employee.id$': null
      },
      include: [{
        model: Employee,
        as: 'employee',
        required: false
      }],
      limit: 5
    });
    
    console.log(`👤 Users without employee records: ${usersWithoutEmployees.length}`);
    if (usersWithoutEmployees.length > 0) {
      console.log('Sample users without employees:', usersWithoutEmployees.map(u => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName
      })));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkData();
