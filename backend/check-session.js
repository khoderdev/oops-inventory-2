import sequelize from './config/database.js';
import { User, Session } from './models/index.js';

async function checkSession() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get active sessions
    const sessions = await Session.findAll({
      where: { isActive: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName', 'role']
      }],
      order: [['lastActivity', 'DESC']]
    });
    
    console.log(`🔍 Found ${sessions.length} active sessions:`);
    
    sessions.forEach(session => {
      console.log(`\n📱 Session: ${session.token.substring(0, 16)}...`);
      console.log(`   User: ${session.user.username} (${session.user.role})`);
      console.log(`   Last Activity: ${session.lastActivity}`);
      console.log(`   IP: ${session.ipAddress}`);
    });
    
    if (sessions.length > 0) {
      const currentUser = sessions[0].user;
      console.log(`\n👤 Most recent active user: ${currentUser.username} (${currentUser.role})`);
      console.log(`   Has employee.read permission: ${currentUser.hasPermission ? currentUser.hasPermission('employee.read') : 'Unknown'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkSession();
