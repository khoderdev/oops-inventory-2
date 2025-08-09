import { EventEmitter } from "events";
import AuditLog from "../models/AuditLog.js";
import { getClientIP } from "../utils/ipUtils.js";

/**
 * Smart, Reusable, and Dynamic Audit Logging System
 *
 * Features:
 * - Pluggable architecture with decorator pattern
 * - Configurable audit policies per resource/action
 * - Async batch processing with queue management
 * - Structured logging with metadata enrichment
 * - Performance monitoring and metrics
 * - Plugin architecture for extensibility
 * - Comprehensive error handling and recovery
 */

class AuditLogger extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      batchSize: options.batchSize || 50,
      batchTimeout: options.batchTimeout || 3000, // 3 seconds
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      enableMetrics: options.enableMetrics !== false,
      enableBatching: options.enableBatching !== false,
      ...options
    };

    // Internal state
    this.auditQueue = [];
    this.batchTimer = null;
    this.isProcessing = false;
    this.metrics = {
      totalLogs: 0,
      successfulLogs: 0,
      failedLogs: 0,
      batchesProcessed: 0,
      averageProcessingTime: 0,
      lastProcessedAt: null
    };

    // Audit policies - configurable rules for different resources/actions
    this.auditPolicies = new Map();
    this.plugins = new Map();
    this.sensitiveFields = new Set(["password", "token", "secret", "key", "authorization", "cookie", "session", "csrf", "api_key", "access_token", "refresh_token", "credit_card", "ssn", "social_security", "pin", "otp"]);

    // Initialize default policies
    this._initializeDefaultPolicies();

    // Graceful shutdown handling
    process.on("SIGTERM", () => this._gracefulShutdown());
    process.on("SIGINT", () => this._gracefulShutdown());
  }

  /**
   * Initialize default audit policies for common resources
   */
  _initializeDefaultPolicies() {
    // Authentication policies
    this.setAuditPolicy("authentication", {
      actions: ["login", "logout", "login_failed", "password_change", "token_refresh"],
      captureRequest: false,
      captureResponse: false,
      captureMetadata: true,
      sensitiveFields: ["password", "token", "oldPassword", "newPassword"],
      retention: 90 // days
    });

    // User management policies
    this.setAuditPolicy("user_management", {
      actions: ["create", "update", "delete", "password_reset", "unlock"],
      captureRequest: true,
      captureResponse: true,
      captureMetadata: true,
      captureChanges: true,
      retention: 365
    });

    // Sales policies
    this.setAuditPolicy("sales", {
      actions: ["create", "update", "delete", "revert", "soft_delete"],
      captureRequest: true,
      captureResponse: true,
      captureMetadata: true,
      captureChanges: true,
      retention: 2555 // 7 years for financial records
    });

    // Orders policies
    this.setAuditPolicy("orders", {
      actions: ["create", "update", "complete", "cancel", "void"],
      captureRequest: true,
      captureResponse: true,
      captureMetadata: true,
      captureChanges: true,
      retention: 1095 // 3 years
    });

    // Stock entries policies
    this.setAuditPolicy("stock_entries", {
      actions: ["create", "update", "delete", "adjust", "transfer", "waste"],
      captureRequest: true,
      captureResponse: true,
      captureMetadata: true,
      captureChanges: true,
      retention: 1095
    });

    // System policies
    this.setAuditPolicy("system", {
      actions: ["startup", "shutdown", "backup", "restore", "maintenance"],
      captureRequest: false,
      captureResponse: false,
      captureMetadata: true,
      retention: 365
    });
  }

  /**
   * Set audit policy for a specific resource
   * @param {string} resource - Resource name
   * @param {Object} policy - Audit policy configuration
   */
  setAuditPolicy(resource, policy) {
    this.auditPolicies.set(resource.toLowerCase(), {
      actions: policy.actions || [],
      captureRequest: policy.captureRequest !== false,
      captureResponse: policy.captureResponse !== false,
      captureMetadata: policy.captureMetadata !== false,
      captureChanges: policy.captureChanges !== false,
      sensitiveFields: new Set(policy.sensitiveFields || []),
      retention: policy.retention || 365,
      customHandler: policy.customHandler,
      ...policy
    });
  }

  /**
   * Get audit policy for a resource
   * @param {string} resource - Resource name
   * @returns {Object} Audit policy
   */
  getAuditPolicy(resource) {
    return this.auditPolicies.get(resource.toLowerCase()) || this._getDefaultPolicy();
  }

  /**
   * Get default audit policy
   * @returns {Object} Default policy
   */
  _getDefaultPolicy() {
    return {
      actions: [],
      captureRequest: true,
      captureResponse: true,
      captureMetadata: true,
      captureChanges: true,
      sensitiveFields: new Set(),
      retention: 365
    };
  }

  /**
   * Register a plugin for extending audit functionality
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin object with hooks
   */
  registerPlugin(name, plugin) {
    this.plugins.set(name, plugin);
    this.emit("pluginRegistered", { name, plugin });
  }

  /**
   * Main audit logging method
   * @param {Object} auditData - Audit data to log
   * @returns {Promise<boolean>} Success status
   */
  async log(auditData) {
    try {
      // Validate required fields
      if (!auditData.action || !auditData.resource) {
        throw new Error("Action and resource are required for audit logging");
      }

      // Normalize and enrich audit data
      const enrichedData = await this._enrichAuditData(auditData);

      // Apply audit policy
      const policy = this.getAuditPolicy(enrichedData.resource);
      const processedData = this._applyAuditPolicy(enrichedData, policy);

      // Execute plugin hooks
      await this._executePluginHooks("beforeLog", processedData);

      // Add to queue or process immediately
      if (this.config.enableBatching) {
        this._addToQueue(processedData);
      } else {
        await this._processSingleLog(processedData);
      }

      // Update metrics
      if (this.config.enableMetrics) {
        this.metrics.totalLogs++;
      }

      // Execute plugin hooks
      await this._executePluginHooks("afterLog", processedData);

      return true;
    } catch (error) {
      this.emit("error", { error, auditData });
      if (this.config.enableMetrics) {
        this.metrics.failedLogs++;
      }
      return false;
    }
  }

  /**
   * Convenience method for logging user actions
   * @param {number} userId - User ID
   * @param {string} action - Action performed
   * @param {string} resource - Resource affected
   * @param {Object} options - Additional options
   */
  async logUserAction(userId, action, resource, options = {}) {
    return this.log({
      userId,
      action: action.toLowerCase(),
      resource: resource.toLowerCase(),
      resourceId: options.resourceId,
      oldValues: options.oldValues,
      newValues: options.newValues,
      status: options.status || "success",
      errorMessage: options.errorMessage,
      metadata: options.metadata,
      request: options.request
    });
  }

  /**
   * Convenience method for logging system actions
   * @param {string} action - System action
   * @param {string} resource - Resource affected
   * @param {Object} options - Additional options
   */
  async logSystemAction(action, resource, options = {}) {
    return this.log({
      userId: null,
      action: action.toLowerCase(),
      resource: resource.toLowerCase(),
      resourceId: options.resourceId,
      metadata: {
        ...options.metadata,
        systemAction: true,
        timestamp: new Date().toISOString()
      },
      status: options.status || "success",
      errorMessage: options.errorMessage
    });
  }

  /**
   * Convenience method for logging security events
   * @param {number|null} userId - User ID (null for anonymous)
   * @param {string} event - Security event
   * @param {Object} details - Event details
   * @param {Object} request - Request object
   */
  async logSecurityEvent(userId, event, details = {}, request = null) {
    return this.log({
      userId,
      action: event.toLowerCase(),
      resource: "security",
      status: details.success ? "success" : "failure",
      errorMessage: details.error,
      metadata: {
        ...details,
        securityEvent: true,
        severity: details.severity || "medium",
        timestamp: new Date().toISOString()
      },
      request
    });
  }

  /**
   * Enrich audit data with additional context
   * @param {Object} auditData - Original audit data
   * @returns {Object} Enriched audit data
   */
  async _enrichAuditData(auditData) {
    const enriched = {
      ...auditData,
      timestamp: new Date(),
      id: this._generateAuditId()
    };

    // Extract request information
    if (auditData.request) {
      const req = auditData.request;
      enriched.ipAddress = getClientIP(req);
      enriched.metadata = {
        ...enriched.metadata,
        endpoint: req.path || req.url,
        method: req.method,
        userAgent: req.get("User-Agent"),
        query: this._sanitizeData(req.query),
        params: this._sanitizeData(req.params),
        headers: this._sanitizeHeaders(req.headers)
      };
    }

    // Sanitize sensitive data
    if (enriched.oldValues) {
      enriched.oldValues = this._sanitizeData(enriched.oldValues);
    }
    if (enriched.newValues) {
      enriched.newValues = this._sanitizeData(enriched.newValues);
    }

    return enriched;
  }

  /**
   * Apply audit policy to data
   * @param {Object} auditData - Audit data
   * @param {Object} policy - Audit policy
   * @returns {Object} Processed audit data
   */
  _applyAuditPolicy(auditData, policy) {
    const processed = { ...auditData };

    // Check if action is allowed
    if (policy.actions.length > 0 && !policy.actions.includes(auditData.action)) {
      processed._skip = true;
      return processed;
    }

    // Apply capture rules
    if (!policy.captureRequest && processed.metadata?.query) {
      delete processed.metadata.query;
      delete processed.metadata.params;
    }

    if (!policy.captureResponse && processed.newValues) {
      processed.newValues = { _captured: false };
    }

    if (!policy.captureChanges) {
      delete processed.oldValues;
      delete processed.newValues;
    }

    // Apply sensitive field filtering
    if (policy.sensitiveFields.size > 0) {
      processed.oldValues = this._sanitizeData(processed.oldValues, policy.sensitiveFields);
      processed.newValues = this._sanitizeData(processed.newValues, policy.sensitiveFields);
    }

    // Set retention period
    processed.retentionDays = policy.retention;

    return processed;
  }

  /**
   * Add audit data to processing queue
   * @param {Object} auditData - Audit data
   */
  _addToQueue(auditData) {
    if (auditData._skip) return;

    this.auditQueue.push(auditData);

    // Process batch if queue is full
    if (this.auditQueue.length >= this.config.batchSize) {
      this._processBatch();
    } else if (!this.batchTimer) {
      // Set timer for batch processing
      this.batchTimer = setTimeout(() => {
        this._processBatch();
      }, this.config.batchTimeout);
    }
  }

  /**
   * Process batch of audit logs
   */
  async _processBatch() {
    if (this.isProcessing || this.auditQueue.length === 0) return;

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Clear timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }

      // Get batch to process
      const batch = this.auditQueue.splice(0, this.config.batchSize);

      // Process batch with retry logic
      await this._processBatchWithRetry(batch);

      // Update metrics
      if (this.config.enableMetrics) {
        this.metrics.batchesProcessed++;
        this.metrics.successfulLogs += batch.length;
        this.metrics.lastProcessedAt = new Date();

        const processingTime = Date.now() - startTime;
        this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime * (this.metrics.batchesProcessed - 1) + processingTime) / this.metrics.batchesProcessed;
      }

      this.emit("batchProcessed", { batchSize: batch.length, processingTime: Date.now() - startTime });
    } catch (error) {
      this.emit("batchError", { error, queueSize: this.auditQueue.length });
      if (this.config.enableMetrics) {
        this.metrics.failedLogs += this.auditQueue.length;
      }
    } finally {
      this.isProcessing = false;

      // Process remaining items if queue is not empty
      if (this.auditQueue.length > 0) {
        setImmediate(() => this._processBatch());
      }
    }
  }

  /**
   * Process batch with retry logic
   * @param {Array} batch - Batch of audit logs
   */
  async _processBatchWithRetry(batch, retryCount = 0) {
    try {
      // Prepare data for database insertion
      const auditLogs = batch.map(item => ({
        userId: item.userId,
        action: item.action,
        resource: item.resource,
        resourceId: item.resourceId?.toString() || null,
        oldValues: item.oldValues,
        newValues: item.newValues,
        metadata: item.metadata,
        ipAddress: item.ipAddress,
        status: item.status || "success",
        errorMessage: item.errorMessage,
        timestamp: item.timestamp
      }));

      // Bulk insert to database
      await AuditLog.bulkCreate(auditLogs, {
        validate: true,
        ignoreDuplicates: false
      });
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
        return this._processBatchWithRetry(batch, retryCount + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Process single audit log immediately
   * @param {Object} auditData - Audit data
   */
  async _processSingleLog(auditData) {
    if (auditData._skip) return;

    try {
      await AuditLog.create({
        userId: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId?.toString() || null,
        oldValues: auditData.oldValues,
        newValues: auditData.newValues,
        metadata: auditData.metadata,
        ipAddress: auditData.ipAddress,
        status: auditData.status || "success",
        errorMessage: auditData.errorMessage,
        timestamp: auditData.timestamp
      });

      if (this.config.enableMetrics) {
        this.metrics.successfulLogs++;
      }
    } catch (error) {
      if (this.config.enableMetrics) {
        this.metrics.failedLogs++;
      }
      throw error;
    }
  }

  /**
   * Execute plugin hooks
   * @param {string} hookName - Hook name
   * @param {Object} data - Data to pass to hooks
   */
  async _executePluginHooks(hookName, data) {
    for (const [name, plugin] of this.plugins) {
      try {
        if (plugin[hookName] && typeof plugin[hookName] === "function") {
          await plugin[hookName](data);
        }
      } catch (error) {
        this.emit("pluginError", { pluginName: name, hookName, error, data });
      }
    }
  }

  /**
   * Sanitize sensitive data
   * @param {*} data - Data to sanitize
   * @param {Set} additionalFields - Additional sensitive fields
   * @returns {*} Sanitized data
   */
  _sanitizeData(data, additionalFields = new Set()) {
    if (!data || typeof data !== "object") return data;

    const allSensitiveFields = new Set([...this.sensitiveFields, ...additionalFields]);

    if (Array.isArray(data)) {
      return data.map(item => this._sanitizeData(item, additionalFields));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = Array.from(allSensitiveFields).some(field => lowerKey.includes(field.toLowerCase()));

      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this._sanitizeData(value, additionalFields);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize HTTP headers
   * @param {Object} headers - HTTP headers
   * @returns {Object} Sanitized headers
   */
  _sanitizeHeaders(headers) {
    const sanitized = {};
    const sensitiveHeaders = ["authorization", "cookie", "x-api-key", "x-auth-token"];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Generate unique audit ID
   * @returns {string} Unique audit ID
   */
  _generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.auditQueue.length,
      isProcessing: this.isProcessing,
      uptime: process.uptime()
    };
  }

  /**
   * Flush all pending audit logs
   * @returns {Promise<void>}
   */
  async flush() {
    if (this.auditQueue.length > 0) {
      await this._processBatch();
    }
  }

  /**
   * Graceful shutdown
   */
  async _gracefulShutdown() {
    console.log("AuditLogger: Graceful shutdown initiated...");

    try {
      // Flush remaining logs
      await this.flush();

      // Clear timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      console.log("AuditLogger: Shutdown completed successfully");
    } catch (error) {
      console.error("AuditLogger: Error during shutdown:", error);
    }
  }
}

// Export singleton instance
export default new AuditLogger();

// Export class for custom instances
export { AuditLogger };
