import sequelize from './config/database.js';
import { Employee, User } from './models/index.js';
import { Op } from 'sequelize';

async function testQuery() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Test the exact query from getAllEmployees
    const department = undefined;
    const isActive = "true"; // This comes as string from query params
    const search = undefined;
    
    const where = {};
    if (department) where.department = department;
    if (isActive !== undefined) where.isActive = isActive === "true";
    
    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } }, 
        { lastName: { [Op.iLike]: `%${search}%` } }, 
        { username: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    console.log('🔍 Employee where clause:', where);
    console.log('🔍 User where clause:', userWhere);
    console.log('🔍 User where keys length:', Object.keys(userWhere).length);
    
    const { count, rows: employees } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "role", "isActive"],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined
        }
      ],
      order: [["employeeNumber", "ASC"]],
      limit: 50,
      offset: 0
    });
    
    console.log(`📊 Found ${count} employees`);
    console.log('📋 Employees:', JSON.stringify(employees, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testQuery();
