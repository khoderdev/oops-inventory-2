import { Op } from "sequelize";
import { AuditLog, Session, User } from "../models/index.js";

const userController = {
  // Get all users (admin/manager only)
  getAllUsers: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [{ username: { [Op.iLike]: `%${search}%` } }, { firstName: { [Op.iLike]: `%${search}%` } }, { lastName: { [Op.iLike]: `%${search}%` } }];
      }

      if (role) {
        whereClause.role = role;
      }

      if (isActive !== undefined) {
        whereClause.isActive = isActive === "true";
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ["password"] },
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "username", "firstName", "lastName"],
            required: false
          }
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          loginAttempts: user.loginAttempts,
          isLocked: user.isLocked(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          createdBy: user.creator
            ? {
                id: user.creator.id,
                username: user.creator.username,
                fullName: `${user.creator.firstName} ${user.creator.lastName}`
              }
            : null
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalUsers: count,
          hasNext: offset + users.length < count,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error("Get all users error:", error);
      next(error);
    }
  },

  // Get user by ID
  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "username", "firstName", "lastName"],
            required: false
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found"
        });
      }

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          role: user.role,
          permissions: user.getRolePermissions(),
          specificPermissions: user.permissions,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          loginAttempts: user.loginAttempts,
          isLocked: user.isLocked(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          createdBy: user.creator
            ? {
                id: user.creator.id,
                username: user.creator.username,
                fullName: `${user.creator.firstName} ${user.creator.lastName}`
              }
            : null
        }
      });
    } catch (error) {
      console.error("Get user by ID error:", error);
      next(error);
    }
  },

  // Create new user (admin only)
  createUser: async (req, res, next) => {
    try {
      const { username, password, firstName, lastName, role, permissions } = req.body;

      // Validation
      if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: "Validation error",
          message: "Username, password, first name, and last name are required"
        });
      }

      // Only admin can create admin users
      if (role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({
          error: "Access forbidden",
          message: "Only administrators can create admin users"
        });
      }

      const user = await User.create({
        username: username.toLowerCase(),
        password,
        firstName,
        lastName,
        role: role || "staff",
        permissions: permissions || {},
        createdBy: req.user.id
      });

      await AuditLog.logUserAction(
        req.user.id,
        "user_create",
        "user",
        user.id,
        null,
        {
          username: user.username,
          role: user.role
        },
        req
      );

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error("Create user error:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          error: "Conflict",
          message: "Username already exists"
        });
      }
      next(error);
    }
  },

  // Update user (admin/manager or self)
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { username, firstName, lastName, role, permissions, isActive } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found"
        });
      }

      // Check permissions
      const isSelf = parseInt(id) === req.user.id;
      const isAdmin = req.user.role === "admin";
      const isManager = req.user.role === "manager";

      // Only admin can update admin users (except themselves)
      if (user.role === "admin" && !isSelf && !isAdmin) {
        return res.status(403).json({
          error: "Access forbidden",
          message: "Only administrators can update admin users"
        });
      }

      // Only admin can change roles or permissions
      if ((role !== undefined || permissions !== undefined) && !isAdmin) {
        return res.status(403).json({
          error: "Access forbidden",
          message: "Only administrators can change user roles or permissions"
        });
      }

      // Only admin can deactivate users
      if (isActive !== undefined && !isAdmin) {
        return res.status(403).json({
          error: "Access forbidden",
          message: "Only administrators can activate/deactivate users"
        });
      }

      // Store old values for audit
      const oldValues = {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive
      };

      const updates = { updatedBy: req.user.id };
      if (username !== undefined) updates.username = username.toLowerCase();
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (role !== undefined) updates.role = role;
      if (permissions !== undefined) updates.permissions = permissions;
      if (isActive !== undefined) updates.isActive = isActive;

      await user.update(updates);

      // If user is deactivated, revoke all their sessions
      if (isActive === false) {
        await Session.revokeUserSessions(user.id);
      }

      await AuditLog.logUserAction(req.user.id, "user_update", "user", user.id, oldValues, updates, req);

      res.status(200).json({
        message: "User updated successfully",
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          role: user.role,
          isActive: user.isActive,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error("Update user error:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          error: "Conflict",
          message: "Username already exists"
        });
      }
      next(error);
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found"
        });
      }

      // Can't delete yourself
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          error: "Bad request",
          message: "You cannot delete your own account"
        });
      }

      // Store user data for audit before deletion
      const userData = {
        username: user.username,
        role: user.role
      };

      // Revoke all user sessions
      await Session.revokeUserSessions(user.id);

      // Soft delete - deactivate instead of hard delete
      await user.update({ isActive: false, updatedBy: req.user.id });

      await AuditLog.logUserAction(req.user.id, "user_delete", "user", user.id, userData, null, req);

      res.status(200).json({
        message: "User deleted successfully"
      });
    } catch (error) {
      console.error("Delete user error:", error);
      next(error);
    }
  },

  // Reset user password (admin/manager only)
  resetUserPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          error: "Validation error",
          message: "New password is required"
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found"
        });
      }

      await user.update({ password: newPassword });

      // Revoke all user sessions to force re-login
      await Session.revokeUserSessions(user.id);

      await AuditLog.logUserAction(req.user.id, "password_reset", "user", user.id, null, null, req);

      res.status(200).json({
        message: "Password reset successfully"
      });
    } catch (error) {
      console.error("Reset password error:", error);
      next(error);
    }
  },

  // Unlock user account (admin only)
  unlockUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found"
        });
      }

      await user.update({
        loginAttempts: 0,
        lockUntil: null
      });

      await AuditLog.logUserAction(req.user.id, "user_unlock", "user", user.id, null, null, req);

      res.status(200).json({
        message: "User account unlocked successfully"
      });
    } catch (error) {
      console.error("Unlock user error:", error);
      next(error);
    }
  },

  // Get user activity logs
  getUserActivity: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found"
        });
      }

      const activities = await AuditLog.findAll({
        where: { userId: id },
        order: [["timestamp", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalCount = await AuditLog.count({
        where: { userId: id }
      });

      res.status(200).json({
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalActivities: totalCount,
          hasNext: offset + activities.length < totalCount,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error("Get user activity error:", error);
      next(error);
    }
  }
};

export default userController;
