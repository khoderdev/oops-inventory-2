import AuditLog from "../models/AuditLog.js";
import Session from "../models/Session.js";
import crypto from "crypto";

// Sensitive fields to exclude from logging
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'key', 'authorization',
  'cookie', 'session', 'csrf', 'api_key', 'access_token',
  'refresh_token', 'credit_card', 'ssn', 'social_security'
];

// Helper function to sanitize data
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Helper function to determine resource type from URL
const getResourceFromUrl = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);
  if (pathSegments.length >= 2 && pathSegments[0] === 'api') {
    return pathSegments[1].replace(/s$/, ''); // Remove trailing 's' for plurals
  }
  return 'unknown';
};

// Helper function to extract resource ID from URL
const getResourceIdFromUrl = (url, method) => {
  const pathSegments = url.split('/').filter(segment => segment);
  if (method !== 'POST' && pathSegments.length >= 3) {
    const potentialId = pathSegments[2];
    // Check if it's a number or UUID
    if (/^\d+$/.test(potentialId) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId)) {
      return potentialId;
    }
  }
  return null;
};

// Helper function to determine action from method and URL
const getActionFromRequest = (method, url) => {
  const lowerUrl = url.toLowerCase();
  
  // Special action mappings
  if (lowerUrl.includes('/login')) return 'LOGIN';
  if (lowerUrl.includes('/logout')) return 'LOGOUT';
  if (lowerUrl.includes('/register')) return 'REGISTER';
  if (lowerUrl.includes('/reset-password')) return 'PASSWORD_RESET';
  if (lowerUrl.includes('/change-password')) return 'PASSWORD_CHANGE';
  if (lowerUrl.includes('/revert')) return 'REVERT';
  if (lowerUrl.includes('/void')) return 'VOID';
  if (lowerUrl.includes('/complete')) return 'COMPLETE';
  if (lowerUrl.includes('/cancel')) return 'CANCEL';
  if (lowerUrl.includes('/waste')) return 'WASTE';
  if (lowerUrl.includes('/add-stock')) return 'ADD_STOCK';
  
  // Standard CRUD mappings
  switch (method) {
    case 'POST': return 'CREATE';
    case 'GET': return 'READ';
    case 'PUT': 
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return method;
  }
};

// Main audit middleware
export const auditMiddleware = (options = {}) => {
  const {
    excludeRoutes = ['/health', '/ping', '/metrics'],
    excludeReadOperations = false,
    logRequestBody = true,
    logResponseBody = false,
    maxBodySize = 10000 // Maximum size of request/response body to log
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Skip excluded routes
    if (excludeRoutes.some(route => req.path.includes(route))) {
      return next();
    }

    // Skip GET requests if configured
    if (excludeReadOperations && req.method === 'GET') {
      return next();
    }

    // Extract audit information
    const userId = req.user?.id || null;
    const sessionId = req.sessionId || req.headers['x-session-id'] || null;
    const action = getActionFromRequest(req.method, req.path);
    const resource = getResourceFromUrl(req.path);
    const resourceId = getResourceIdFromUrl(req.path, req.method);
    
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData = null;
    let responseStatus = null;

    // Override response methods to capture data
    res.send = function(data) {
      responseStatus = res.statusCode;
      if (logResponseBody && data && typeof data === 'string' && data.length <= maxBodySize) {
        try {
          responseData = JSON.parse(data);
        } catch (e) {
          responseData = data.substring(0, 1000); // Truncate long responses
        }
      }
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      responseStatus = res.statusCode;
      if (logResponseBody && data) {
        responseData = sanitizeData(data);
      }
      return originalJson.call(this, data);
    };

    // Update session activity
    if (sessionId) {
      Session.update(
        { lastActivity: new Date() },
        { where: { token: sessionId, isActive: true } }
      ).catch(err => 
        console.error('Failed to update session activity:', err)
      );
    }

    // Continue with request processing
    next();

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const status = responseStatus >= 400 ? 'failure' : 'success';
        
        // Prepare request data
        let requestData = null;
        if (logRequestBody && req.body && Object.keys(req.body).length > 0) {
          const bodyString = JSON.stringify(req.body);
          if (bodyString.length <= maxBodySize) {
            requestData = sanitizeData(req.body);
          }
        }

        // Prepare audit log data
        const auditData = {
          userId,
          sessionId,
          action,
          resource,
          resourceId,
          endpoint: req.path,
          method: req.method,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestData,
          responseData: logResponseBody ? sanitizeData(responseData) : null,
          status,
          duration,
          metadata: {
            query: Object.keys(req.query).length > 0 ? req.query : null,
            params: Object.keys(req.params).length > 0 ? req.params : null,
            statusCode: responseStatus,
            contentLength: res.get('Content-Length'),
            timestamp: new Date().toISOString()
          }
        };

        // Add error message for failed requests
        if (status === 'failure' && responseData) {
          auditData.errorMessage = responseData.error || responseData.message || 'Unknown error';
        }

        // Create audit log
        await AuditLog.create(auditData);

      } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't throw error to avoid breaking the response
      }
    });
  };
};

// Specific audit functions for different operations
export const auditSalesOperation = async (userId, action, saleData, oldData = null, req = null) => {
  try {
    const auditData = {
      userId,
      action: `SALE_${action.toUpperCase()}`,
      resource: 'sale',
      resourceId: saleData.id?.toString(),
      oldValues: oldData ? sanitizeData(oldData) : null,
      newValues: sanitizeData(saleData),
      metadata: {
        totalAmount: saleData.totalAmount,
        itemCount: saleData.items?.length || 0,
        menuItemCount: saleData.menuItems?.length || 0,
        sectionId: saleData.sectionId,
        timestamp: new Date().toISOString()
      }
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
      auditData.userAgent = req.get('User-Agent');
    }

    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Sales audit logging failed:', error);
  }
};

export const auditOrderOperation = async (userId, action, orderData, oldData = null, req = null) => {
  try {
    const auditData = {
      userId,
      action: `ORDER_${action.toUpperCase()}`,
      resource: 'order',
      resourceId: orderData.id?.toString(),
      oldValues: oldData ? sanitizeData(oldData) : null,
      newValues: sanitizeData(orderData),
      metadata: {
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType,
        status: orderData.status,
        tableId: orderData.tableId,
        total: orderData.total,
        itemCount: orderData.items?.length || 0,
        timestamp: new Date().toISOString()
      }
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
      auditData.userAgent = req.get('User-Agent');
    }

    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Order audit logging failed:', error);
  }
};

export const auditStockOperation = async (userId, action, stockData, oldData = null, req = null) => {
  try {
    const auditData = {
      userId,
      action: `STOCK_${action.toUpperCase()}`,
      resource: 'stock_entry',
      resourceId: stockData.id?.toString(),
      oldValues: oldData ? sanitizeData(oldData) : null,
      newValues: sanitizeData(stockData),
      metadata: {
        materialId: stockData.materialId,
        materialName: stockData.material?.name,
        supplier: stockData.supplier,
        purchasedQuantity: stockData.purchasedQuantity,
        purchasedUnit: stockData.purchasedUnit,
        totalCost: stockData.totalCost,
        timestamp: new Date().toISOString()
      }
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
      auditData.userAgent = req.get('User-Agent');
    }

    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Stock audit logging failed:', error);
  }
};

export const auditUserOperation = async (userId, action, userData, oldData = null, req = null) => {
  try {
    const auditData = {
      userId,
      action: `USER_${action.toUpperCase()}`,
      resource: 'user',
      resourceId: userData.id?.toString(),
      oldValues: oldData ? sanitizeData(oldData) : null,
      newValues: sanitizeData(userData),
      metadata: {
        username: userData.username,
        role: userData.role,
        email: userData.email,
        timestamp: new Date().toISOString()
      }
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
      auditData.userAgent = req.get('User-Agent');
    }

    await AuditLog.create(auditData);
  } catch (error) {
    console.error('User audit logging failed:', error);
  }
};

// Security-specific audit functions
export const auditSecurityEvent = async (userId, event, details, req = null) => {
  try {
    const auditData = {
      userId,
      action: `SECURITY_${event.toUpperCase()}`,
      resource: 'security',
      status: details.success ? 'success' : 'failure',
      errorMessage: details.error || null,
      metadata: {
        event,
        details: sanitizeData(details),
        timestamp: new Date().toISOString()
      }
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
      auditData.userAgent = req.get('User-Agent');
    }

    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Security audit logging failed:', error);
  }
};

export default {
  auditMiddleware,
  auditSalesOperation,
  auditOrderOperation,
  auditStockOperation,
  auditUserOperation,
  auditSecurityEvent
};
