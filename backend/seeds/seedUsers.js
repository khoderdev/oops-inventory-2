import bcrypt from "bcrypt";
import User from "../models/User.js";

/**
 * Seed initial users for the system
 */
export async function seedUsers() {
  try {
    console.log("👥 Starting user seeding...");

    const defaultUsers = [
      {
        username: "admin",
        password: "Admin@123",
        pin: "111111",
        firstName: "System",
        lastName: "Administrator",
        role: "admin",
        permissions: {
          canManageUsers: true,
          canManageInventory: true,
          canManageMenuItems: true,
          canViewReports: true,
          canManageSettings: true,
          canProcessOrders: true,
          canManageStock: true
        },
        isActive: true
      },
      {
        username: "manager",
        password: "Manager@123",
        pin: "222222",
        firstName: "Store",
        lastName: "Manager",
        role: "manager",
        permissions: {
          canManageInventory: true,
          canManageMenuItems: true,
          canViewReports: true,
          canProcessOrders: true,
          canManageStock: true
        },
        isActive: true
      },
      {
        username: "staff1",
        password: "Staff@123",
        pin: "333333",
        firstName: "John",
        lastName: "Doe",
        role: "staff",
        permissions: {
          canProcessOrders: true,
          canViewInventory: true
        },
        isActive: true
      },
      {
        username: "staff2",
        password: "Staff@123",
        pin: "444444",
        firstName: "Jane",
        lastName: "Smith",
        role: "staff",
        permissions: {
          canProcessOrders: true,
          canViewInventory: true
        },
        isActive: true
      },
      {
        username: "cashier",
        password: "Cashier@123",
        pin: "555555",
        firstName: "Mike",
        lastName: "Johnson",
        role: "staff",
        permissions: {
          canProcessOrders: true,
          canViewInventory: true
        },
        isActive: true
      }
    ];

    let created = 0;
    let existing = 0;
    let adminUserId = null;

    // First, try to find existing admin user for createdBy reference
    const existingAdmin = await User.findOne({
      where: { role: 'admin' }
    });
    if (existingAdmin) {
      adminUserId = existingAdmin.id;
    }

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          where: { username: userData.username }
        });

        if (existingUser) {
          console.log(`   ⏭️  User '${userData.username}' already exists, skipping...`);
          existing++;
          // Set adminUserId if this is the admin user
          if (userData.username === 'admin' && !adminUserId) {
            adminUserId = existingUser.id;
          }
          continue;
        }

        // Create the user with all necessary fields
        // (password and pin will be automatically hashed by User model hooks)
        const newUser = await User.create({
          ...userData,
          // Add createdBy reference (admin creates other users, admin creates itself as null)
          createdBy: userData.username === 'admin' ? null : adminUserId,
          // Ensure default values are explicitly set
          loginAttempts: 0,
          isActive: userData.isActive !== undefined ? userData.isActive : true
        });

        console.log(`   ✅ Created user: ${userData.username} (${userData.role}) with PIN: ${userData.pin}`);
        created++;

        // Set adminUserId if this is the admin user we just created
        if (userData.username === 'admin' && !adminUserId) {
          adminUserId = newUser.id;
        }
      } catch (error) {
        console.error(`   ❌ Error creating user ${userData.username}:`, error.message);
        // Continue with other users even if one fails
      }
    }

    console.log(`👥 Users seeding completed: ${created} created, ${existing} already existed`);

    return {
      created,
      existing,
      total: defaultUsers.length
    };
  } catch (error) {
    console.error("❌ Error in seedUsers:", error);
    throw error;
  }
}
