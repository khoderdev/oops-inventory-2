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

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          where: { username: userData.username }
        });

        if (existingUser) {
          console.log(`   ⏭️  User '${userData.username}' already exists, skipping...`);
          existing++;
          continue;
        }

        // Create the user (password will be automatically hashed by User model hooks)
        await User.create({
          ...userData
        });

        console.log(`   ✅ Created user: ${userData.username} (${userData.role})`);
        created++;
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
