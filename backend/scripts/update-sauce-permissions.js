import sequelize from "../config/database.js";
import User from "../models/User.js";

const updateSaucePermissions = async () => {
  try {
    console.log("🔄 Updating sauce permissions for admin users...");
    
    // Get all admin users
    const adminUsers = await User.findAll({
      where: { role: 'admin' }
    });

    console.log(`📋 Found ${adminUsers.length} admin user(s)`);

    for (const user of adminUsers) {
      const currentPermissions = user.permissions || {};
      
      // Add sauce permissions
      const updatedPermissions = {
        ...currentPermissions,
        "sauces.create": true,
        "sauces.read": true,
        "sauces.update": true,
        "sauces.delete": true,
        "sauces.bulkDelete": true,
        "sauces.togglePOSVisibility": true,
        "sauces.toggleActiveStatus": true,
        "sauces.calculateCost": true
      };

      await user.update({ permissions: updatedPermissions });
      
      console.log(`✅ Updated permissions for user: ${user.username} (ID: ${user.id})`);
    }

    console.log("🎉 Sauce permissions updated successfully!");
    
  } catch (error) {
    console.error("❌ Error updating sauce permissions:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

updateSaucePermissions();
