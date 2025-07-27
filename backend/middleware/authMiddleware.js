import { AuditLog, Session, User } from "../models/index.js";

// Extract token from request headers
const extractToken = req => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

// Static testing token for development (remove in production)
const STATIC_TEST_TOKEN = "test-admin-token-123";

// Middleware to authenticate user and attach to request
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      await AuditLog.logFailedAction(null, "access_denied", "authentication", "No token provided", req);
      return res.status(401).json({
        error: "Access denied",
        message: "No authentication token provided"
      });
    }

    // Check for static test token (DEVELOPMENT ONLY)
    if (token === STATIC_TEST_TOKEN) {
      console.log("🔧 Using static test token for development");

      // Create a mock admin user for testing
      const mockAdminUser = {
        id: 1,
        username: "admin",
        firstName: "Test",
        lastName: "Admin",
        role: "admin",
        isActive: true,
        permissions: {},
        getFullName: () => "Test Admin",
        hasPermission: () => true, // Admin has all permissions
        getRolePermissions: () => ({
          "users.create": true,
          "users.read": true,
          "users.update": true,
          "users.delete": true,
          "materials.create": true,
          "materials.read": true,
          "materials.update": true,
          "materials.delete": true,
          "stock.create": true,
          "stock.read": true,
          "stock.update": true,
          "stock.delete": true,
          "sales.create": true,
          "sales.read": true,
          "sales.update": true,
          "sales.delete": true,
          "sales.revert": true,
          "sections.create": true,
          "sections.read": true,
          "sections.update": true,
          "sections.delete": true,
          "assignments.create": true,
          "assignments.read": true,
          "assignments.update": true,
          "assignments.delete": true,
          "menuItems.create": true,
          "menuItems.read": true,
          "menuItems.update": true,
          "menuItems.delete": true,
          "dayOperations.create": true,
          "dayOperations.read": true,
          "dayOperations.update": true,
          "dayOperations.delete": true,
          "reports.read": true,
          "reports.export": true,
          "analytics.read": true,
          "system.settings": true
        }),
        isLocked: () => false
      };

      // Mock session
      const mockSession = {
        id: "test-session-1",
        token: STATIC_TEST_TOKEN,
        userId: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        update: async () => {}, // Mock update function
        isExpired: () => false
      };

      // Attach mock user and session to request
      req.user = mockAdminUser;
      req.session = mockSession;
      req.isAuthenticated = true;

      return next();
    }

    // Find active session with token
    const session = await Session.findOne({
      where: {
        token,
        isActive: true
      },
      include: [
        {
          model: User,
          as: "user",
          where: { isActive: true }
        }
      ]
    });

    if (!session || session.isExpired()) {
      await AuditLog.logFailedAction(null, "access_denied", "authentication", "Invalid or expired token", req);
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid or expired authentication token"
      });
    }

    const user = session.user;

    // Check if user account is locked
    if (user.isLocked()) {
      await AuditLog.logFailedAction(user.id, "access_denied", "authentication", "Account is locked", req);
      return res.status(423).json({
        error: "Account locked",
        message: "Your account has been temporarily locked due to multiple failed login attempts"
      });
    }

    // Update session activity
    await session.update({
      lastActivity: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent")
    });

    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.isAuthenticated = true;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    await AuditLog.logFailedAction(null, "authentication_error", "system", error.message, req);
    return res.status(500).json({
      error: "Authentication error",
      message: "An error occurred during authentication"
    });
  }
};

// Middleware to check if user has specific permission
export const requirePermission = permission => {
  return async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to access this resource"
        });
      }

      const hasPermission = req.user.hasPermission(permission);

      if (!hasPermission) {
        await AuditLog.logFailedAction(req.user.id, "permission_denied", "authorization", `Missing permission: ${permission}`, req);
        return res.status(403).json({
          error: "Access forbidden",
          message: `You don't have permission to perform this action`,
          requiredPermission: permission
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        error: "Authorization error",
        message: "An error occurred during authorization"
      });
    }
  };
};

// Middleware to check if user has one of multiple permissions
export const requireAnyPermission = permissions => {
  return async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to access this resource"
        });
      }

      const hasAnyPermission = permissions.some(permission => req.user.hasPermission(permission));

      if (!hasAnyPermission) {
        await AuditLog.logFailedAction(req.user.id, "permission_denied", "authorization", `Missing any of permissions: ${permissions.join(", ")}`, req);
        return res.status(403).json({
          error: "Access forbidden",
          message: `You don't have permission to perform this action`,
          requiredPermissions: permissions
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        error: "Authorization error",
        message: "An error occurred during authorization"
      });
    }
  };
};

// Middleware to check if user has specific role
export const requireRole = roles => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to access this resource"
        });
      }

      if (!roleArray.includes(req.user.role)) {
        await AuditLog.logFailedAction(req.user.id, "role_denied", "authorization", `Required role: ${roleArray.join(" or ")}, user role: ${req.user.role}`, req);
        return res.status(403).json({
          error: "Access forbidden",
          message: `This action requires ${roleArray.join(" or ")} role`,
          userRole: req.user.role,
          requiredRoles: roleArray
        });
      }

      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return res.status(500).json({
        error: "Authorization error",
        message: "An error occurred during role authorization"
      });
    }
  };
};

// Middleware to check if user can access their own resources or is admin/manager
export const requireOwnershipOrRole = (userIdField = "userId", allowedRoles = ["admin", "manager"]) => {
  return async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to access this resource"
        });
      }

      // Admin and managers can access any resource
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];

      if (resourceUserId && parseInt(resourceUserId) === req.user.id) {
        return next();
      }

      await AuditLog.logFailedAction(req.user.id, "ownership_denied", "authorization", `User ${req.user.id} attempted to access resource owned by ${resourceUserId}`, req);

      return res.status(403).json({
        error: "Access forbidden",
        message: "You can only access your own resources"
      });
    } catch (error) {
      console.error("Ownership authorization error:", error);
      return res.status(500).json({
        error: "Authorization error",
        message: "An error occurred during ownership authorization"
      });
    }
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      req.isAuthenticated = false;
      return next();
    }

    const session = await Session.findOne({
      where: {
        token,
        isActive: true
      },
      include: [
        {
          model: User,
          as: "user",
          where: { isActive: true }
        }
      ]
    });

    if (session && !session.isExpired() && !session.user.isLocked()) {
      req.user = session.user;
      req.session = session;
      req.isAuthenticated = true;

      // Update session activity
      await session.update({
        lastActivity: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent")
      });
    } else {
      req.isAuthenticated = false;
    }

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    req.isAuthenticated = false;
    next();
  }
};

// Middleware to log user actions for audit trail
export const auditAction = (action, resource) => {
  return async (req, res, next) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json;
    const originalSend = res.send;

    res.json = function (data) {
      // Log successful actions, but skip logout actions to prevent duplicates
      // (logout is already logged explicitly in the auth controller with detailed session data)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user && action !== 'logout') {
        AuditLog.logUserAction(req.user.id, action, resource, req.params.id || null, req.auditOldValues || null, req.auditNewValues || data, req).catch(error => {
          console.error("Error logging audit action:", error);
        });
      }

      return originalJson.call(this, data);
    };

    res.send = function (data) {
      // Log failed actions
      if (res.statusCode >= 400 && req.user) {
        AuditLog.logFailedAction(req.user.id, action, resource, data.message || data.error || "Unknown error", req).catch(error => {
          console.error("Error logging audit failure:", error);
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

export default {
  authenticate,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireOwnershipOrRole,
  optionalAuth,
  auditAction
};
