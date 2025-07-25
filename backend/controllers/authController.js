import { Op } from "sequelize";
import { AuditLog, Session, User } from "../models/index.js";

const authController = {
  // User login
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: "Validation error",
          message: "Username and password are required"
        });
      }

      // Find user by username or email
      const user = await User.findOne({
        where: {
          [Op.or]: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
          isActive: true
        }
      });

      if (!user) {
        await AuditLog.logFailedAction(null, "login_failed", "authentication", `Login attempt with invalid username: ${username}`, req);
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid username or password"
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        await AuditLog.logFailedAction(user.id, "login_failed", "authentication", "Account is locked", req);
        return res.status(423).json({
          error: "Account locked",
          message: "Your account has been temporarily locked due to multiple failed login attempts"
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        await User.incLoginAttempts(user.id);
        await AuditLog.logFailedAction(user.id, "login_failed", "authentication", "Invalid password", req);
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid username or password"
        });
      }

      // Reset login attempts on successful login
      await User.resetLoginAttempts(user.id);

      // Create new session
      const session = await Session.create({
        userId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Log successful login
      await AuditLog.logUserAction(user.id, "login", "authentication", null, null, { sessionId: session.id }, req);

      // Return user info and token
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          role: user.role,
          permissions: user.getRolePermissions(),
          lastLogin: user.lastLogin
        },
        token: session.token,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      console.error("Login error:", error);
      next(error);
    }
  },

  // User logout
  logout: async (req, res, next) => {
    try {
      if (req.session) {
        await req.session.update({ isActive: false });

        await AuditLog.logUserAction(req.user.id, "logout", "authentication", null, null, { sessionId: req.session.id }, req);
      }

      res.status(200).json({
        message: "Logout successful"
      });
    } catch (error) {
      console.error("Logout error:", error);
      next(error);
    }
  },

  // Logout from all devices
  logoutAll: async (req, res, next) => {
    try {
      const revokedCount = await Session.revokeUserSessions(req.user.id);

      await AuditLog.logUserAction(req.user.id, "logout_all", "authentication", null, null, { revokedSessions: revokedCount }, req);

      res.status(200).json({
        message: "Logged out from all devices",
        revokedSessions: revokedCount
      });
    } catch (error) {
      console.error("Logout all error:", error);
      next(error);
    }
  },

  // Get current user profile
  getProfile: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] }
      });

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          role: user.role,
          permissions: user.getRolePermissions(),
          specificPermissions: user.permissions,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error("Get profile error:", error);
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const { firstName, lastName, email } = req.body;
      const user = req.user;

      // Store old values for audit
      const oldValues = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      };

      const updates = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (email !== undefined) updates.email = email;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: "Validation error",
          message: "No valid fields provided for update"
        });
      }

      await user.update(updates);

      await AuditLog.logUserAction(user.id, "profile_update", "user", user.id, oldValues, updates, req);

      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          role: user.role
        }
      });
    } catch (error) {
      console.error("Update profile error:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          error: "Conflict",
          message: "Email already exists"
        });
      }
      next(error);
    }
  },

  // Change password
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: "Validation error",
          message: "Current password and new password are required"
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        await AuditLog.logFailedAction(user.id, "password_change_failed", "authentication", "Invalid current password", req);
        return res.status(401).json({
          error: "Authentication failed",
          message: "Current password is incorrect"
        });
      }

      // Update password
      await user.update({ password: newPassword });

      // Revoke all other sessions except current one
      await Session.revokeUserSessions(user.id, req.session.token);

      await AuditLog.logUserAction(user.id, "password_change", "authentication", user.id, null, null, req);

      res.status(200).json({
        message: "Password changed successfully"
      });
    } catch (error) {
      console.error("Change password error:", error);
      next(error);
    }
  },

  // Refresh session token
  refreshToken: async (req, res, next) => {
    try {
      const session = req.session;

      // Extend session expiration
      await session.extend(24); // 24 hours

      await AuditLog.logUserAction(req.user.id, "token_refresh", "authentication", null, null, { sessionId: session.id }, req);

      res.status(200).json({
        message: "Token refreshed successfully",
        token: session.token,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      next(error);
    }
  },

  // Get user sessions
  getSessions: async (req, res, next) => {
    try {
      const sessions = await Session.findAll({
        where: {
          userId: req.user.id,
          isActive: true
        },
        attributes: ["id", "ipAddress", "userAgent", "lastActivity", "expiresAt", "createdAt"],
        order: [["lastActivity", "DESC"]]
      });

      res.status(200).json({
        sessions: sessions.map(session => ({
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          lastActivity: session.lastActivity,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
          isCurrent: session.id === req.session.id
        }))
      });
    } catch (error) {
      console.error("Get sessions error:", error);
      next(error);
    }
  },

  // Revoke specific session
  revokeSession: async (req, res, next) => {
    try {
      const { sessionId } = req.params;

      const session = await Session.findOne({
        where: {
          id: sessionId,
          userId: req.user.id,
          isActive: true
        }
      });

      if (!session) {
        return res.status(404).json({
          error: "Not found",
          message: "Session not found"
        });
      }

      await session.update({ isActive: false });

      await AuditLog.logUserAction(req.user.id, "session_revoke", "authentication", sessionId, null, null, req);

      res.status(200).json({
        message: "Session revoked successfully"
      });
    } catch (error) {
      console.error("Revoke session error:", error);
      next(error);
    }
  }
};

export default authController;
