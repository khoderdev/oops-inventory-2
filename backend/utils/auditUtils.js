/**
 * Audit Utilities and Helper Functions
 *
 * Collection of utility functions for audit logging system.
 * Provides data transformation, validation, and analysis tools.
 */

import crypto from "crypto";
import { performance } from "perf_hooks";

/**
 * Data sanitization and transformation utilities
 */
export class AuditDataUtils {
  /**
   * Deep clone object with circular reference handling
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  static deepClone(obj) {
    const seen = new WeakMap();

    function clone(item) {
      if (item === null || typeof item !== "object") return item;
      if (item instanceof Date) return new Date(item);
      if (item instanceof Array) return item.map(clone);

      if (seen.has(item)) return "[Circular Reference]";
      seen.set(item, true);

      const cloned = {};
      for (const key in item) {
        if (item.hasOwnProperty(key)) {
          cloned[key] = clone(item[key]);
        }
      }

      return cloned;
    }

    return clone(obj);
  }

  /**
   * Calculate data diff between old and new values
   * @param {Object} oldData - Original data
   * @param {Object} newData - Updated data
   * @returns {Object} Diff object
   */
  static calculateDiff(oldData, newData) {
    const diff = {
      added: {},
      modified: {},
      removed: {},
      unchanged: {}
    };

    if (!oldData && !newData) return diff;
    if (!oldData) return { added: newData };
    if (!newData) return { removed: oldData };

    const oldKeys = new Set(Object.keys(oldData));
    const newKeys = new Set(Object.keys(newData));

    // Find added keys
    for (const key of newKeys) {
      if (!oldKeys.has(key)) {
        diff.added[key] = newData[key];
      }
    }

    // Find removed keys
    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        diff.removed[key] = oldData[key];
      }
    }

    // Find modified and unchanged keys
    for (const key of oldKeys) {
      if (newKeys.has(key)) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          diff.modified[key] = {
            from: oldData[key],
            to: newData[key]
          };
        } else {
          diff.unchanged[key] = oldData[key];
        }
      }
    }

    return diff;
  }

  /**
   * Normalize resource name for consistency
   * @param {string} resource - Resource name
   * @returns {string} Normalized resource name
   */
  static normalizeResource(resource) {
    if (!resource) return "unknown";

    const resourceMap = {
      auth: "authentication",
      login: "authentication",
      logout: "authentication",
      register: "authentication",
      users: "user_management",
      user: "user_management",
      "stock-entries": "stock_entries",
      stockentries: "stock_entries",
      stock: "stock_entries",
      materials: "material",
      "menu-items": "menu_items",
      menuitems: "menu_items",
      orders: "pos",
      order: "pos",
      sales: "pos",
      sale: "pos",
      tables: "pos",
      table: "pos",
      sections: "section",
      section: "section",
      "day-operations": "day_operations",
      dayoperations: "day_operations"
    };

    const normalized = resource.toLowerCase().trim();
    return resourceMap[normalized] || normalized.replace(/s$/, "");
  }

  /**
   * Normalize action name for consistency
   * @param {string} action - Action name
   * @returns {string} Normalized action name
   */
  static normalizeAction(action) {
    if (!action) return "unknown";

    const actionMap = {
      LOGIN: "login",
      LOGOUT: "logout",
      CREATE: "create",
      READ: "read",
      UPDATE: "update",
      DELETE: "delete",
      REVERT: "revert",
      VOID: "void",
      COMPLETE: "complete",
      CANCEL: "cancel",
      SOFT_DELETE: "soft_delete",
      USER_CREATE: "create",
      USER_UPDATE: "update",
      USER_DELETE: "delete",
      SALE_CREATE: "create",
      SALE_UPDATE: "update",
      ORDER_CREATE: "create",
      ORDER_UPDATE: "update",
      STOCK_CREATE: "create",
      STOCK_UPDATE: "update"
    };

    const normalized = action.toUpperCase().trim();
    return actionMap[normalized] || action.toLowerCase();
  }

  /**
   * Extract meaningful data summary from complex objects
   * @param {*} data - Data to summarize
   * @param {number} maxLength - Maximum summary length
   * @returns {string} Data summary
   */
  static summarizeData(data, maxLength = 200) {
    if (!data) return "null";

    if (typeof data === "string") {
      return data.length > maxLength ? data.substring(0, maxLength) + "..." : data;
    }

    if (typeof data === "number" || typeof data === "boolean") {
      return String(data);
    }

    if (data instanceof Date) {
      return data.toISOString();
    }

    if (Array.isArray(data)) {
      return `Array(${data.length}) [${data
        .slice(0, 3)
        .map(item => this.summarizeData(item, 50))
        .join(", ")}${data.length > 3 ? "..." : ""}]`;
    }

    if (typeof data === "object") {
      const keys = Object.keys(data);
      const summary = keys
        .slice(0, 5)
        .map(key => `${key}: ${this.summarizeData(data[key], 30)}`)
        .join(", ");
      return `{${summary}${keys.length > 5 ? "..." : ""}}`;
    }

    return String(data);
  }

  /**
   * Generate hash for data integrity verification
   * @param {*} data - Data to hash
   * @returns {string} SHA-256 hash
   */
  static generateDataHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  /**
   * Validate audit data structure
   * @param {Object} auditData - Audit data to validate
   * @returns {Object} Validation result
   */
  static validateAuditData(auditData) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!auditData.action) errors.push("Action is required");
    if (!auditData.resource) errors.push("Resource is required");
    if (!auditData.timestamp) warnings.push("Timestamp is missing");

    // Data types
    if (auditData.userId && typeof auditData.userId !== "number") {
      errors.push("UserId must be a number");
    }

    if (auditData.resourceId && typeof auditData.resourceId !== "string") {
      warnings.push("ResourceId should be a string");
    }

    // Data size limits
    const dataString = JSON.stringify(auditData);
    if (dataString.length > 1000000) {
      // 1MB limit
      warnings.push("Audit data is very large (>1MB)");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Performance monitoring utilities
 */
export class AuditPerformanceUtils {
  static timers = new Map();

  /**
   * Start performance timer
   * @param {string} label - Timer label
   */
  static startTimer(label) {
    this.timers.set(label, performance.now());
  }

  /**
   * End performance timer and get duration
   * @param {string} label - Timer label
   * @returns {number} Duration in milliseconds
   */
  static endTimer(label) {
    const start = this.timers.get(label);
    if (!start) return 0;

    const duration = performance.now() - start;
    this.timers.delete(label);
    return duration;
  }

  /**
   * Measure function execution time
   * @param {Function} fn - Function to measure
   * @param {string} label - Measurement label
   * @returns {Promise<{result: *, duration: number}>} Result and duration
   */
  static async measureAsync(fn, label = "operation") {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - start;
      throw { error, duration };
    }
  }

  /**
   * Get memory usage statistics
   * @returns {Object} Memory usage info
   */
  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
    };
  }
}

/**
 * Security and compliance utilities
 */
export class AuditSecurityUtils {
  /**
   * Generate secure audit trail signature
   * @param {Object} auditData - Audit data
   * @param {string} secretKey - Secret key for signing
   * @returns {string} Digital signature
   */
  static generateSignature(auditData, secretKey) {
    const dataString = JSON.stringify(auditData, Object.keys(auditData).sort());
    return crypto.createHmac("sha256", secretKey).update(dataString).digest("hex");
  }

  /**
   * Verify audit trail signature
   * @param {Object} auditData - Audit data
   * @param {string} signature - Signature to verify
   * @param {string} secretKey - Secret key for verification
   * @returns {boolean} Verification result
   */
  static verifySignature(auditData, signature, secretKey) {
    const expectedSignature = this.generateSignature(auditData, secretKey);
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"));
  }

  /**
   * Encrypt sensitive audit data
   * @param {string} data - Data to encrypt
   * @param {string} key - Encryption key
   * @returns {Object} Encrypted data with IV
   */
  static encryptData(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher("aes-256-cbc", key);
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      algorithm: "aes-256-cbc"
    };
  }

  /**
   * Decrypt sensitive audit data
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} key - Decryption key
   * @returns {string} Decrypted data
   */
  static decryptData(encryptedData, key) {
    const decipher = crypto.createDecipher("aes-256-cbc", key);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Anonymize personal data for compliance
   * @param {*} data - Data to anonymize
   * @param {Array} piiFields - PII field names
   * @returns {*} Anonymized data
   */
  static anonymizeData(data, piiFields = []) {
    if (!data || typeof data !== "object") return data;

    const anonymized = Array.isArray(data) ? [] : {};
    const defaultPiiFields = ["email", "phone", "address", "name", "ssn"];
    const allPiiFields = [...defaultPiiFields, ...piiFields];

    for (const [key, value] of Object.entries(data)) {
      const isPii = allPiiFields.some(field => key.toLowerCase().includes(field.toLowerCase()));

      if (isPii) {
        if (typeof value === "string") {
          anonymized[key] = this._generateAnonymizedValue(value);
        } else {
          anonymized[key] = "[ANONYMIZED]";
        }
      } else if (typeof value === "object" && value !== null) {
        anonymized[key] = this.anonymizeData(value, piiFields);
      } else {
        anonymized[key] = value;
      }
    }

    return anonymized;
  }

  /**
   * Generate anonymized value that preserves format
   * @param {string} originalValue - Original value
   * @returns {string} Anonymized value
   */
  static _generateAnonymizedValue(originalValue) {
    if (!originalValue) return originalValue;

    // Email format
    if (originalValue.includes("@")) {
      const [, domain] = originalValue.split("@");
      return `user${Math.random().toString(36).substr(2, 5)}@${domain}`;
    }

    // Phone format
    if (/^\+?[\d\s\-\(\)]+$/.test(originalValue)) {
      return originalValue.replace(/\d/g, () => Math.floor(Math.random() * 10));
    }

    // Default: preserve length and character types
    return originalValue.replace(/[a-zA-Z]/g, "X").replace(/\d/g, "0");
  }
}

/**
 * Audit analysis and reporting utilities
 */
export class AuditAnalysisUtils {
  /**
   * Analyze audit patterns for anomaly detection
   * @param {Array} auditLogs - Array of audit logs
   * @returns {Object} Analysis results
   */
  static analyzePatterns(auditLogs) {
    const analysis = {
      totalLogs: auditLogs.length,
      timeRange: this._getTimeRange(auditLogs),
      userActivity: this._analyzeUserActivity(auditLogs),
      resourceActivity: this._analyzeResourceActivity(auditLogs),
      actionDistribution: this._analyzeActionDistribution(auditLogs),
      errorPatterns: this._analyzeErrorPatterns(auditLogs),
      anomalies: this._detectAnomalies(auditLogs)
    };

    return analysis;
  }

  /**
   * Generate audit summary report
   * @param {Array} auditLogs - Array of audit logs
   * @param {Object} options - Report options
   * @returns {Object} Summary report
   */
  static generateSummaryReport(auditLogs, options = {}) {
    const analysis = this.analyzePatterns(auditLogs);

    return {
      reportGenerated: new Date().toISOString(),
      period: analysis.timeRange,
      summary: {
        totalActivities: analysis.totalLogs,
        uniqueUsers: Object.keys(analysis.userActivity).length,
        resourcesAccessed: Object.keys(analysis.resourceActivity).length,
        errorRate: analysis.errorPatterns.errorRate,
        anomaliesDetected: analysis.anomalies.length
      },
      topUsers: this._getTopUsers(analysis.userActivity),
      topResources: this._getTopResources(analysis.resourceActivity),
      actionBreakdown: analysis.actionDistribution,
      securityEvents: this._extractSecurityEvents(auditLogs),
      recommendations: this._generateRecommendations(analysis)
    };
  }

  static _getTimeRange(auditLogs) {
    if (auditLogs.length === 0) return null;

    const timestamps = auditLogs.map(log => new Date(log.timestamp)).sort();
    return {
      start: timestamps[0].toISOString(),
      end: timestamps[timestamps.length - 1].toISOString(),
      duration: timestamps[timestamps.length - 1] - timestamps[0]
    };
  }

  static _analyzeUserActivity(auditLogs) {
    const userActivity = {};

    auditLogs.forEach(log => {
      const userId = log.userId || "anonymous";
      if (!userActivity[userId]) {
        userActivity[userId] = {
          totalActions: 0,
          actions: {},
          resources: new Set(),
          errors: 0,
          lastActivity: null
        };
      }

      userActivity[userId].totalActions++;
      userActivity[userId].actions[log.action] = (userActivity[userId].actions[log.action] || 0) + 1;
      userActivity[userId].resources.add(log.resource);

      if (log.status === "failure") {
        userActivity[userId].errors++;
      }

      if (!userActivity[userId].lastActivity || new Date(log.timestamp) > new Date(userActivity[userId].lastActivity)) {
        userActivity[userId].lastActivity = log.timestamp;
      }
    });

    // Convert sets to arrays for JSON serialization
    Object.keys(userActivity).forEach(userId => {
      userActivity[userId].resources = Array.from(userActivity[userId].resources);
    });

    return userActivity;
  }

  static _analyzeResourceActivity(auditLogs) {
    const resourceActivity = {};

    auditLogs.forEach(log => {
      if (!resourceActivity[log.resource]) {
        resourceActivity[log.resource] = {
          totalAccess: 0,
          actions: {},
          users: new Set(),
          errors: 0
        };
      }

      resourceActivity[log.resource].totalAccess++;
      resourceActivity[log.resource].actions[log.action] = (resourceActivity[log.resource].actions[log.action] || 0) + 1;
      resourceActivity[log.resource].users.add(log.userId || "anonymous");

      if (log.status === "failure") {
        resourceActivity[log.resource].errors++;
      }
    });

    // Convert sets to arrays
    Object.keys(resourceActivity).forEach(resource => {
      resourceActivity[resource].users = Array.from(resourceActivity[resource].users);
    });

    return resourceActivity;
  }

  static _analyzeActionDistribution(auditLogs) {
    const distribution = {};

    auditLogs.forEach(log => {
      distribution[log.action] = (distribution[log.action] || 0) + 1;
    });

    return distribution;
  }

  static _analyzeErrorPatterns(auditLogs) {
    const errors = auditLogs.filter(log => log.status === "failure");
    const totalLogs = auditLogs.length;

    return {
      totalErrors: errors.length,
      errorRate: totalLogs > 0 ? ((errors.length / totalLogs) * 100).toFixed(2) + "%" : "0%",
      errorsByResource: this._groupBy(errors, "resource"),
      errorsByAction: this._groupBy(errors, "action"),
      errorsByUser: this._groupBy(errors, "userId")
    };
  }

  static _detectAnomalies(auditLogs) {
    const anomalies = [];

    // Detect unusual activity patterns
    const userActivity = this._analyzeUserActivity(auditLogs);

    Object.entries(userActivity).forEach(([userId, activity]) => {
      // High error rate
      if (activity.errors > activity.totalActions * 0.5) {
        anomalies.push({
          type: "high_error_rate",
          userId,
          severity: "high",
          description: `User ${userId} has high error rate: ${activity.errors}/${activity.totalActions}`
        });
      }

      // Unusual activity volume
      const avgActivity = Object.values(userActivity).reduce((sum, u) => sum + u.totalActions, 0) / Object.keys(userActivity).length;
      if (activity.totalActions > avgActivity * 5) {
        anomalies.push({
          type: "unusual_activity_volume",
          userId,
          severity: "medium",
          description: `User ${userId} has unusually high activity: ${activity.totalActions} actions`
        });
      }
    });

    return anomalies;
  }

  static _getTopUsers(userActivity) {
    return Object.entries(userActivity)
      .sort(([, a], [, b]) => b.totalActions - a.totalActions)
      .slice(0, 10)
      .map(([userId, activity]) => ({
        userId,
        totalActions: activity.totalActions,
        errorRate: activity.errors > 0 ? ((activity.errors / activity.totalActions) * 100).toFixed(2) + "%" : "0%"
      }));
  }

  static _getTopResources(resourceActivity) {
    return Object.entries(resourceActivity)
      .sort(([, a], [, b]) => b.totalAccess - a.totalAccess)
      .slice(0, 10)
      .map(([resource, activity]) => ({
        resource,
        totalAccess: activity.totalAccess,
        uniqueUsers: activity.users.length
      }));
  }

  static _extractSecurityEvents(auditLogs) {
    return auditLogs
      .filter(log => log.resource === "authentication" || log.action.includes("login") || log.status === "failure")
      .map(log => ({
        timestamp: log.timestamp,
        event: log.action,
        userId: log.userId,
        status: log.status,
        details: log.errorMessage || "Success"
      }));
  }

  static _generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.errorPatterns.errorRate > 10) {
      recommendations.push({
        type: "high_error_rate",
        priority: "high",
        message: "System has high error rate. Review error patterns and improve error handling."
      });
    }

    if (analysis.anomalies.length > 0) {
      recommendations.push({
        type: "anomalies_detected",
        priority: "medium",
        message: `${analysis.anomalies.length} anomalies detected. Review user activity patterns.`
      });
    }

    return recommendations;
  }

  static _groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key] || "unknown";
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }
}

export default {
  AuditDataUtils,
  AuditPerformanceUtils,
  AuditSecurityUtils,
  AuditAnalysisUtils
};
