import { AuditLog, Session, User } from "../models/index.js";

const extractToken = req => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

const STATIC_TEST_TOKEN = "test-admin-token-123";
const SESSION_CONFIG = {
  MIN_UPDATE_INTERVAL: 5 * 60 * 1000
};

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

    if (token === STATIC_TEST_TOKEN) {
      console.log("🔧 Using static test token for development");
      return res.status(501).json({
        error: "Development token",
        message: "Static test token detected but no mock user implementation"
      });
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

    if (!session) {
      await AuditLog.logFailedAction(null, "access_denied", "authentication", "Invalid token", req);
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid authentication token"
      });
    }
    const user = session.user;
    if (user.isLocked()) {
      await AuditLog.logFailedAction(user.id, "access_denied", "authentication", "Account is locked", req);
      return res.status(423).json({
        error: "Account locked",
        message: "Your account has been temporarily locked due to multiple failed login attempts"
      });
    }
    const now = new Date();
    const lastActivity = session.lastActivity ? new Date(session.lastActivity) : new Date(session.createdAt);
    const timeSinceLastUpdate = now.getTime() - lastActivity.getTime();
    const shouldUpdateSession = timeSinceLastUpdate >= SESSION_CONFIG.MIN_UPDATE_INTERVAL;
    if (shouldUpdateSession) {
      const updateData = {
        lastActivity: now,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent")
      };
      await session.update(updateData);
    }
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

export const requireOwnershipOrRole = (userIdField = "userId", allowedRoles = ["admin", "manager"]) => {
  return async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to access this resource"
        });
      }
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }
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

export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      req.isAuthenticated = false;
      return next();
    }
    const session = await Session.findOne({
      where: { token, isActive: true },
      include: [ { model: User, as: "user", where: { isActive: true } } ]
    });
    if (session && !session.user.isLocked()) {
      req.user = session.user;
      req.session = session;
      req.isAuthenticated = true;
      const now = new Date();
      const lastActivity = session.lastActivity ? new Date(session.lastActivity) : new Date(session.createdAt);
      const timeSinceLastUpdate = now.getTime() - lastActivity.getTime();
      const shouldUpdateSession = timeSinceLastUpdate >= SESSION_CONFIG.MIN_UPDATE_INTERVAL;
      if (shouldUpdateSession) {
        const updateData = { lastActivity: now, ipAddress: req.ip || req.connection.remoteAddress, userAgent: req.get("User-Agent") };
        await session.update(updateData);
      }
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

export const auditAction = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const originalSend = res.send;
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user && action !== "logout") {
        AuditLog.logUserAction(req.user.id, action, resource, req.params.id || null, req.auditOldValues || null, req.auditNewValues || data, req).catch(error => {
          console.error("Error logging audit action:", error);
        });
      }
      return originalJson.call(this, data);
    };
    res.send = function (data) {
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
