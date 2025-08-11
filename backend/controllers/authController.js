import { Op } from "sequelize";
import { AuditLog, Session, User } from "../models/index.js";
import { getClientIP } from "../utils/ipUtils.js";

const authController = {
  // User login (supports both password and PIN authentication)
  login: async (req, res, next) => {
    try {
      const { username, password, pin, deviceId, deviceName, deviceType = "web" } = req.body;

      // Handle PIN-only authentication (for lock screen/POS)
      if (pin && !username && !password) {
        return await authController.handlePinLogin(req, res, next);
      }

      // Handle regular username/password authentication
      if (!username || !password) {
        const missingFields = [];
        if (!username) missingFields.push("username");
        if (!password) missingFields.push("password");

        return res.status(400).json({
          error: "Validation error",
          message: `Please enter your ${missingFields.join(" and ")}.`,
          code: "MISSING_CREDENTIALS",
          fields: missingFields
        });
      }

      // Find user by username or email
      const user = await User.findOne({
        where: {
          [Op.or]: [{ username: username.toLowerCase() }],
          isActive: true
        }
      });

      if (!user) {
        await AuditLog.logFailedAction(null, "login_failed", "authentication", `Login attempt with invalid username: ${username}`, req);
        return res.status(401).json({
          error: "Authentication failed",
          message: "The username you entered doesn't exist. Please check your username and try again.",
          code: "USER_NOT_FOUND",
          field: "username"
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        await AuditLog.logFailedAction(user.id, "login_failed", "authentication", "Account is locked", req);

        const lockTimeLeft = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60)); // Minutes left

        return res.status(423).json({
          error: "Account locked",
          message: `Your account has been temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeLeft} minute${lockTimeLeft === 1 ? "" : "s"}.`,
          code: "ACCOUNT_LOCKED",
          field: "username",
          lockTimeLeft
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        await User.incLoginAttempts(user.id);
        await AuditLog.logFailedAction(user.id, "login_failed", "authentication", "Invalid password", req);

        // Check remaining attempts before lockout
        const updatedUser = await User.findByPk(user.id);
        const attemptsLeft = 5 - updatedUser.loginAttempts; // Assuming max 5 attempts

        return res.status(401).json({
          error: "Authentication failed",
          message: attemptsLeft > 0 ? `Invalid password. You have ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before your account is locked.` : "Invalid password. Your account will be locked after one more failed attempt.",
          code: "INVALID_PASSWORD",
          field: "password",
          attemptsLeft
        });
      }

      // Reset login attempts on successful login
      await User.resetLoginAttempts(user.id);

      // Create new session with device tracking
      const session = await Session.create({
        userId: user.id,
        deviceId: deviceId || `${getClientIP(req)}-${Date.now()}`, // Generate deviceId if not provided
        deviceName: deviceName || `${deviceType} Device`,
        deviceType,
        ipAddress: getClientIP(req),
        userAgent: req.get("User-Agent"),
        status: "online",
        lastHeartbeat: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Update user's last login time
      await user.update({ lastLogin: new Date() });

      // Log successful login
      await AuditLog.logUserAction(user.id, "login", "authentication", null, null, { 
        sessionId: session.id,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        deviceType: session.deviceType
      }, req);

      // Return user info and token
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          role: user.role,
          permissions: user.getRolePermissions(),
          lastLogin: new Date()
        },
        session: {
          token: session.token,
          sessionId: session.id,
          deviceId: session.deviceId,
          deviceName: session.deviceName,
          deviceType: session.deviceType,
          status: session.status,
          expiresAt: session.expiresAt
        },
        // Legacy fields for backward compatibility
        token: session.token,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      console.error("Login error:", error);
      next(error);
    }
  },

  // Helper method for PIN-based authentication
  handlePinLogin: async (req, res, next) => {
    try {
      const { pin, deviceId, deviceName, deviceType = "pos" } = req.body;

      if (!pin) {
        return res.status(400).json({
          error: "Validation error",
          message: "Please enter your PIN.",
          code: "MISSING_PIN",
          field: "pin"
        });
      }

      // Validate PIN format (6 digits)
      if (!/^\d{6}$/.test(pin)) {
        return res.status(400).json({
          error: "Validation error",
          message: "PIN must be exactly 6 digits.",
          code: "INVALID_PIN_FORMAT",
          field: "pin"
        });
      }

      // Find user by PIN (we need to check all users since PIN is hashed)
      const users = await User.findAll({
        where: {
          isActive: true,
          pin: { [Op.not]: null }
        }
      });

      let authenticatedUser = null;
      for (const user of users) {
        const isPinValid = await user.comparePin(pin);
        if (isPinValid) {
          authenticatedUser = user;
          break;
        }
      }

      if (!authenticatedUser) {
        await AuditLog.logFailedAction(null, "pin_login_failed", "authentication", `PIN login attempt with invalid PIN`, req);
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid PIN. Please check your PIN and try again.",
          code: "INVALID_PIN",
          field: "pin"
        });
      }

      // Check if account is locked
      if (authenticatedUser.isLocked()) {
        await AuditLog.logFailedAction(authenticatedUser.id, "pin_login_failed", "authentication", "Account is locked", req);

        const lockTimeLeft = Math.ceil((authenticatedUser.lockUntil - Date.now()) / (1000 * 60)); // Minutes left

        return res.status(423).json({
          error: "Account locked",
          message: `Your account has been temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeLeft} minute${lockTimeLeft === 1 ? "" : "s"}.`,
          code: "ACCOUNT_LOCKED",
          field: "pin",
          lockTimeLeft
        });
      }

      // Reset login attempts on successful login
      await User.resetLoginAttempts(authenticatedUser.id);

      // Create new session with device tracking
      const session = await Session.create({
        userId: authenticatedUser.id,
        deviceId: deviceId || `${getClientIP(req)}-${Date.now()}`,
        deviceName: deviceName || `${deviceType} Device`,
        deviceType,
        ipAddress: getClientIP(req),
        userAgent: req.get("User-Agent"),
        status: "online",
        lastHeartbeat: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Update user's last login time
      await authenticatedUser.update({ lastLogin: new Date() });

      // Log successful PIN login
      await AuditLog.logUserAction(authenticatedUser.id, "pin_login", "authentication", null, null, { 
        sessionId: session.id,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        deviceType: session.deviceType
      }, req);

      // Return user info and token
      res.status(200).json({
        message: "PIN login successful",
        user: {
          id: authenticatedUser.id,
          username: authenticatedUser.username,
          firstName: authenticatedUser.firstName,
          lastName: authenticatedUser.lastName,
          fullName: authenticatedUser.getFullName(),
          role: authenticatedUser.role,
          permissions: authenticatedUser.getRolePermissions(),
          lastLogin: new Date()
        },
        session: {
          token: session.token,
          sessionId: session.id,
          deviceId: session.deviceId,
          deviceName: session.deviceName,
          deviceType: session.deviceType,
          status: session.status,
          expiresAt: session.expiresAt
        },
        // Legacy fields for backward compatibility
        token: session.token,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      console.error("PIN login error:", error);
      next(error);
    }
  },

  // User logout
  logout: async (req, res, next) => {
    try {
      if (req.session) {
        const sessionData = {
          sessionId: req.session.id,
          userId: req.user.id,
          username: req.user.username,
          sessionDuration: new Date() - new Date(req.session.createdAt),
          lastActivity: req.session.lastActivity
        };

        await req.session.update({ isActive: false });

        await AuditLog.logUserAction(req.user.id, "logout", "authentication", null, null, sessionData, req);
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
      const { firstName, lastName } = req.body;
      const user = req.user;

      // Store old values for audit
      const oldValues = {
        firstName: user.firstName,
        lastName: user.lastName
      };

      const updates = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

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
          message: "Username already exists"
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
