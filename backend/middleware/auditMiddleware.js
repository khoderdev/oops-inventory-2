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

// Helper function to determine resource type from URL with better consistency
const getResourceFromUrl = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);
  if (pathSegments.length >= 2 && pathSegments[0] === 'api') {
    const resource = pathSegments[1];
    
    // Map specific resources for better consistency
    const resourceMap = {
      'auth': 'authentication',
      'login': 'authentication', 
      'logout': 'authentication',
      'register': 'authentication',
      'users': 'user_management',
      'stock-entries': 'stock_entries',
      'stockentries': 'stock_entries',
      'materials': 'material',
      'menu-items': 'menu_item',
      'menuitems': 'menu_item',
      'orders': 'pos',
      'sales': 'pos',
      'tables': 'pos',
      'sections': 'section',
      'day-operations': 'day_operations'
    };
    
    return resourceMap[resource] || resource.replace(/s$/, ''); // Remove trailing 's' for plurals
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

// Store recent logout actions to prevent duplicates
const recentLogouts = new Map();
const LOGOUT_DEDUP_WINDOW = 5000; // 5 seconds

// Helper function to determine action from method and URL
const getActionFromRequest = (method, url) => {
  const lowerUrl = url.toLowerCase();
  
  // Special action mappings
  if (lowerUrl.includes('/login')) return 'login';
  if (lowerUrl.includes('/logout')) return 'logout';
  if (lowerUrl.includes('/register')) return 'register';
  if (lowerUrl.includes('/reset-password')) return 'password_reset';
  if (lowerUrl.includes('/change-password')) return 'password_change';
  if (lowerUrl.includes('/revert')) return 'revert';
  if (lowerUrl.includes('/void')) return 'void';
  if (lowerUrl.includes('/complete')) return 'complete';
  if (lowerUrl.includes('/cancel')) return 'cancel';
  if (lowerUrl.includes('/waste')) return 'waste';
  if (lowerUrl.includes('/add-stock')) return 'add_stock';
  
  // Standard CRUD mappings
  switch (method) {
    case 'POST': return 'create';
    case 'GET': return 'read';
    case 'PUT': 
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    default: return method.toLowerCase();
  }
};

// Helper function to check if logout should be deduplicated
const shouldDeduplicateLogout = (userId, sessionId, requestData, responseData) => {
  const key = `${userId || 'anonymous'}_${sessionId || 'no-session'}`;
  const now = Date.now();
  
  // Skip middleware-generated logout logs (response-based)
  // Keep only the explicit logout logs from authController (with sessionId in newValues)
  if (responseData && responseData.message === 'Logout successful' && 
      (!requestData || !requestData.sessionId)) {
    return true; // Skip response-based logout logs
  }
  
  if (recentLogouts.has(key)) {
    const lastLogout = recentLogouts.get(key);
    if (now - lastLogout < LOGOUT_DEDUP_WINDOW) {
      return true; // Skip duplicate logout within time window
    }
  }
  
  recentLogouts.set(key, now);
  
  // Clean up old entries
  for (const [k, timestamp] of recentLogouts.entries()) {
    if (now - timestamp > LOGOUT_DEDUP_WINDOW) {
      recentLogouts.delete(k);
    }
  }
  
  return false;
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
        
        // Skip duplicate logout entries
        if (action === 'logout' && shouldDeduplicateLogout(userId, sessionId, requestData, responseData)) {
          return;
        }

        // Prepare enhanced error message
        let errorMessage = null;
        if (status === 'failure' && responseData) {
          const baseError = responseData.error || responseData.message || 'Unknown error';
          const statusCode = responseStatus;
          const endpoint = req.path;
          const method = req.method;
          
          errorMessage = `${baseError} | Status: ${statusCode} | Endpoint: ${method} ${endpoint}`;
          
          // Add additional context for common errors
          if (statusCode === 401) {
            errorMessage += ' | Context: Authentication required or token expired';
          } else if (statusCode === 403) {
            errorMessage += ' | Context: Insufficient permissions for this operation';
          } else if (statusCode === 404) {
            errorMessage += ' | Context: Resource not found or endpoint does not exist';
          } else if (statusCode === 422) {
            errorMessage += ' | Context: Validation failed or invalid input data';
          } else if (statusCode >= 500) {
            errorMessage += ' | Context: Internal server error - check server logs';
          }
        }

        // Prepare audit log data
        const auditData = {
          userId,
          action,
          resource,
          resourceId,
          oldValues: null,
          newValues: requestData,
          metadata: {
            endpoint: req.path,
            method: req.method,
            query: Object.keys(req.query).length > 0 ? req.query : null,
            params: Object.keys(req.params).length > 0 ? req.params : null,
            statusCode: responseStatus,
            duration: `${duration}ms`,
            contentLength: res.get('Content-Length'),
            responseData: logResponseBody ? sanitizeData(responseData) : null,
            timestamp: new Date().toISOString()
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          status,
          errorMessage
        };

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
      action: `${action.toLowerCase()}`,
      resource: 'pos',
      resourceId: saleData.id?.toString(),
      oldValues: oldData ? sanitizeData(oldData) : null,
      newValues: sanitizeData(saleData),
      metadata: {
        operationType: 'sale',
        totalAmount: saleData.totalAmount,
        itemCount: saleData.items?.length || 0,
        menuItemCount: saleData.menuItems?.length || 0,
        sectionId: saleData.sectionId,
        timestamp: new Date().toISOString()
      },
      status: 'success'
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
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
      action: `${action.toLowerCase()}`,
      resource: 'pos',
      resourceId: orderData.id?.toString(),
      oldValues: oldData ? sanitizeData(oldData) : null,
      newValues: sanitizeData(orderData),
      metadata: {
        operationType: 'order',
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType,
        status: orderData.status,
        tableId: orderData.tableId,
        total: orderData.total,
        itemCount: orderData.items?.length || 0,
        timestamp: new Date().toISOString()
      },
      status: 'success'
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
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
      action: `${action.toLowerCase()}`,
      resource: 'stock_entries',
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
      },
      status: 'success'
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
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
      action: `${action.toLowerCase()}`,
      resource: 'user_management',
      resourceId: userData.id?.toString(),
      oldValues: oldData ? sanitizeData(oldData) : null,
      newValues: sanitizeData(userData),
      metadata: {
        username: userData.username,
        role: userData.role,
        email: userData.email,
        timestamp: new Date().toISOString()
      },
      status: 'success'
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
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
      action: `${event.toLowerCase()}`,
      resource: 'authentication',
      status: details.success ? 'success' : 'failure',
      errorMessage: details.error ? `Security Event: ${details.error} | Event: ${event} | Context: ${details.context || 'Security monitoring'}` : null,
      metadata: {
        event,
        details: sanitizeData(details),
        timestamp: new Date().toISOString()
      }
    };

    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
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
