import AuditLogger from "../services/AuditLogger.js";

/**
 * Audit Decorator for Easy Controller Integration
 *
 * Provides decorators and middleware for seamless audit logging integration
 * into controllers and route handlers.
 */

/**
 * Method decorator for automatic audit logging
 * @param {Object} options - Audit options
 * @returns {Function} Decorator function
 */
export function auditAction(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const req = args[0]; // Express request object
      const res = args[1]; // Express response object

      let auditData = {
        action: options.action || propertyKey,
        resource: options.resource || "unknown",
        userId: req.user?.id || null,
        request: req,
        ...options.defaultData
      };

      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Extract audit data from result if needed
        if (options.extractData && typeof options.extractData === "function") {
          const extractedData = options.extractData(result, req, res);
          auditData = { ...auditData, ...extractedData };
        }

        // Log successful action
        auditData.status = "success";
        await AuditLogger.log(auditData);

        return result;
      } catch (error) {
        // Log failed action
        auditData.status = "failure";
        auditData.errorMessage = error.message;
        await AuditLogger.log(auditData);

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Class decorator for automatic audit logging of all methods
 * @param {Object} options - Audit options
 * @returns {Function} Class decorator
 */
export function auditController(options = {}) {
  return function (constructor) {
    const resource = options.resource || constructor.name.toLowerCase().replace("controller", "");

    // Get all method names
    const methodNames = Object.getOwnPropertyNames(constructor.prototype).filter(name => name !== "constructor" && typeof constructor.prototype[name] === "function");

    // Apply audit decorator to each method
    methodNames.forEach(methodName => {
      const method = constructor.prototype[methodName];
      const auditOptions = {
        resource,
        action: options.actionMap?.[methodName] || methodName,
        ...options.defaultOptions
      };

      constructor.prototype[methodName] = createAuditWrapper(method, auditOptions);
    });

    return constructor;
  };
}

/**
 * Create audit wrapper for a method
 * @param {Function} originalMethod - Original method
 * @param {Object} options - Audit options
 * @returns {Function} Wrapped method
 */
function createAuditWrapper(originalMethod, options) {
  return async function (...args) {
    const req = args[0];
    const res = args[1];

    let auditData = {
      action: options.action,
      resource: options.resource,
      userId: req.user?.id || null,
      request: req,
      ...options.defaultData
    };

    try {
      const result = await originalMethod.apply(this, args);

      auditData.status = "success";
      if (options.captureResult) {
        auditData.newValues = result;
      }

      await AuditLogger.log(auditData);
      return result;
    } catch (error) {
      auditData.status = "failure";
      auditData.errorMessage = error.message;
      await AuditLogger.log(auditData);
      throw error;
    }
  };
}

/**
 * Express middleware for automatic audit logging
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
export function auditMiddleware(options = {}) {
  return async (req, res, next) => {
    // Skip if disabled
    if (options.disabled) {
      return next();
    }

    // Skip certain routes
    if (options.skipRoutes && options.skipRoutes.some(route => req.path.includes(route))) {
      return next();
    }

    // Extract audit information
    const resource = options.resource || extractResourceFromPath(req.path);
    const action = options.action || extractActionFromMethod(req.method, req.path);

    // Store audit context in request
    req.auditContext = {
      resource,
      action,
      userId: req.user?.id || null,
      startTime: Date.now()
    };

    // Capture request body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(req.method) && options.captureRequest !== false) {
      req.auditContext.requestData = { ...req.body };
    }

    // Override res.json to capture response
    if (options.captureResponse !== false) {
      const originalJson = res.json;
      res.json = function (data) {
        req.auditContext.responseData = data;
        return originalJson.call(this, data);
      };
    }

    // Log after response
    res.on("finish", async () => {
      try {
        const auditData = {
          action: req.auditContext.action,
          resource: req.auditContext.resource,
          userId: req.auditContext.userId,
          request: req,
          status: res.statusCode >= 400 ? "failure" : "success",
          metadata: {
            statusCode: res.statusCode,
            responseTime: Date.now() - req.auditContext.startTime,
            ...options.metadata
          }
        };

        if (req.auditContext.requestData) {
          auditData.newValues = req.auditContext.requestData;
        }

        if (req.auditContext.responseData && res.statusCode < 400) {
          auditData.metadata.responsePreview = JSON.stringify(req.auditContext.responseData).substring(0, 500);
        }

        if (res.statusCode >= 400) {
          auditData.errorMessage = `HTTP ${res.statusCode} - ${req.method} ${req.path}`;
        }

        await AuditLogger.log(auditData);
      } catch (error) {
        console.error("Audit middleware error:", error);
      }
    });

    next();
  };
}

/**
 * Extract resource name from request path
 * @param {string} path - Request path
 * @returns {string} Resource name
 */
function extractResourceFromPath(path) {
  const segments = path.split("/").filter(segment => segment);
  if (segments.length >= 2 && segments[0] === "api") {
    const resource = segments[1];

    // Resource mapping for consistency
    const resourceMap = {
      auth: "authentication",
      users: "user_management",
      "stock-entries": "stock_entries",
      "menu-items": "menu_items",
      "day-operations": "day_operations"
    };

    return resourceMap[resource] || resource.replace(/s$/, ""); // Remove trailing 's'
  }

  return "unknown";
}

/**
 * Extract action from HTTP method and path
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @returns {string} Action name
 */
function extractActionFromMethod(method, path) {
  const hasId = /\/\d+(?:\/|$)/.test(path);

  switch (method.toUpperCase()) {
    case "GET":
      return hasId ? "read" : "list";
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return method.toLowerCase();
  }
}

/**
 * Audit helper for manual logging in controllers
 */
export class AuditHelper {
  /**
   * Log before and after data changes
   * @param {Object} options - Audit options
   */
  static async logDataChange(options) {
    const { userId, action, resource, resourceId, oldData, newData, request, metadata } = options;

    return AuditLogger.log({
      userId,
      action: action.toLowerCase(),
      resource: resource.toLowerCase(),
      resourceId: resourceId?.toString(),
      oldValues: oldData,
      newValues: newData,
      request,
      metadata: {
        ...metadata,
        changeType: "data_modification",
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log business operation
   * @param {Object} options - Business operation options
   */
  static async logBusinessOperation(options) {
    const { userId, operation, resource, data, impact, request, metadata } = options;

    return AuditLogger.log({
      userId,
      action: operation.toLowerCase(),
      resource: resource.toLowerCase(),
      newValues: data,
      request,
      metadata: {
        ...metadata,
        operationType: "business_operation",
        businessImpact: impact,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log security event
   * @param {Object} options - Security event options
   */
  static async logSecurityEvent(options) {
    const { userId, event, severity, details, request } = options;

    return AuditLogger.logSecurityEvent(
      userId,
      event,
      {
        ...details,
        severity: severity || "medium",
        success: !details.error
      },
      request
    );
  }

  /**
   * Log system event
   * @param {Object} options - System event options
   */
  static async logSystemEvent(options) {
    const { event, resource, data, metadata } = options;

    return AuditLogger.logSystemAction(event, resource || "system", {
      metadata: {
        ...metadata,
        ...data,
        eventType: "system_event",
        timestamp: new Date().toISOString()
      }
    });
  }
}

export default {
  auditAction,
  auditController,
  auditMiddleware,
  AuditHelper
};
