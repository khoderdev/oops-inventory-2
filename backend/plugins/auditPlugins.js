/**
 * Audit Plugins System
 *
 * Extensible plugin architecture for audit logging system.
 * Provides hooks for custom processing, enrichment, and integration.
 */

import fs from "fs/promises";
import path from "path";

/**
 * Performance Monitoring Plugin
 * Tracks audit system performance and generates metrics
 */
export class PerformanceMonitoringPlugin {
  constructor(options = {}) {
    this.options = {
      metricsInterval: options.metricsInterval || 60000, // 1 minute
      alertThreshold: options.alertThreshold || 1000, // 1 second
      enableDetailedMetrics: options.enableDetailedMetrics !== false,
      ...options
    };

    this.metrics = {
      processingTimes: [],
      errorCounts: {},
      throughput: 0,
      lastReset: Date.now()
    };

    // Start metrics collection
    if (this.options.enableDetailedMetrics) {
      this.metricsInterval = setInterval(() => {
        this._generateMetricsReport();
      }, this.options.metricsInterval);
    }
  }

  async beforeLog(auditData) {
    auditData._performanceStart = process.hrtime.bigint();
  }

  async afterLog(auditData) {
    if (auditData._performanceStart) {
      const processingTime = Number(process.hrtime.bigint() - auditData._performanceStart) / 1000000; // ms
      this.metrics.processingTimes.push(processingTime);

      // Alert on slow processing
      if (processingTime > this.options.alertThreshold) {
        console.warn(`Slow audit processing detected: ${processingTime}ms for ${auditData.resource}:${auditData.action}`);
      }

      // Keep only last 1000 measurements
      if (this.metrics.processingTimes.length > 1000) {
        this.metrics.processingTimes = this.metrics.processingTimes.slice(-1000);
      }
    }
  }

  async onError(error, auditData) {
    const errorKey = `${auditData.resource}:${auditData.action}`;
    this.metrics.errorCounts[errorKey] = (this.metrics.errorCounts[errorKey] || 0) + 1;
  }

  _generateMetricsReport() {
    const now = Date.now();
    const timeSinceReset = now - this.metrics.lastReset;

    if (this.metrics.processingTimes.length > 0) {
      const avgProcessingTime = this.metrics.processingTimes.reduce((a, b) => a + b, 0) / this.metrics.processingTimes.length;
      const maxProcessingTime = Math.max(...this.metrics.processingTimes);
      const minProcessingTime = Math.min(...this.metrics.processingTimes);

      console.log(`Audit Performance Metrics (${timeSinceReset}ms):`);
      console.log(`  Average Processing Time: ${avgProcessingTime.toFixed(2)}ms`);
      console.log(`  Max Processing Time: ${maxProcessingTime.toFixed(2)}ms`);
      console.log(`  Min Processing Time: ${minProcessingTime.toFixed(2)}ms`);
      console.log(`  Total Logs Processed: ${this.metrics.processingTimes.length}`);

      if (Object.keys(this.metrics.errorCounts).length > 0) {
        console.log("  Error Counts:", this.metrics.errorCounts);
      }
    }

    // Reset metrics
    this.metrics.processingTimes = [];
    this.metrics.errorCounts = {};
    this.metrics.lastReset = now;
  }

  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}

/**
 * Data Enrichment Plugin
 * Enriches audit data with additional context and metadata
 */
export class DataEnrichmentPlugin {
  constructor(options = {}) {
    this.options = {
      enableGeoLocation: options.enableGeoLocation !== false,
      enableUserAgent: options.enableUserAgent !== false,
      enableSessionInfo: options.enableSessionInfo !== false,
      enableBusinessContext: options.enableBusinessContext !== false,
      ...options
    };
  }

  async beforeLog(auditData) {
    // Enrich with session information
    if (this.options.enableSessionInfo && auditData.userId) {
      try {
        // This would integrate with your session management
        const sessionInfo = await this._getSessionInfo(auditData.userId);
        auditData.metadata = {
          ...auditData.metadata,
          sessionInfo
        };
      } catch (error) {
        // Silently fail enrichment
      }
    }

    // Enrich with business context
    if (this.options.enableBusinessContext) {
      auditData.metadata = {
        ...auditData.metadata,
        businessContext: await this._getBusinessContext(auditData)
      };
    }

    // Enrich with request context
    if (auditData.request) {
      auditData.metadata = {
        ...auditData.metadata,
        requestContext: this._getRequestContext(auditData.request)
      };
    }
  }

  async _getSessionInfo(userId) {
    // Implement session info retrieval
    return {
      activeSessionCount: 1,
      lastActivity: new Date().toISOString(),
      deviceType: "web"
    };
  }

  async _getBusinessContext(auditData) {
    const context = {
      businessHours: this._isBusinessHours(),
      dayOfWeek: new Date().getDay(),
      quarter: Math.floor((new Date().getMonth() + 3) / 3)
    };

    // Add resource-specific context
    if (auditData.resource === "sales") {
      context.salesContext = {
        isHighVolumePeriod: this._isHighVolumePeriod(),
        estimatedRevenue: this._estimateRevenue(auditData)
      };
    }

    return context;
  }

  _getRequestContext(request) {
    return {
      correlationId: request.headers["x-correlation-id"] || this._generateCorrelationId(),
      requestSize: JSON.stringify(request.body || {}).length,
      acceptLanguage: request.headers["accept-language"],
      referer: request.headers.referer
    };
  }

  _isBusinessHours() {
    const hour = new Date().getHours();
    return hour >= 8 && hour <= 22; // 8 AM to 10 PM
  }

  _isHighVolumePeriod() {
    const hour = new Date().getHours();
    return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21); // Lunch and dinner
  }

  _estimateRevenue(auditData) {
    // Simple revenue estimation based on audit data
    if (auditData.newValues && auditData.newValues.totalAmount) {
      return auditData.newValues.totalAmount;
    }
    return 0;
  }

  _generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Compliance Plugin
 * Ensures audit logs meet regulatory and compliance requirements
 */
export class CompliancePlugin {
  constructor(options = {}) {
    this.options = {
      enablePII: options.enablePII !== false,
      enableFinancialCompliance: options.enableFinancialCompliance !== false,
      enableDataRetention: options.enableDataRetention !== false,
      complianceStandards: options.complianceStandards || ["SOX", "PCI-DSS", "GDPR"],
      ...options
    };

    this.piiFields = new Set(["email", "phone", "address", "ssn", "creditCard", "personalInfo", "firstName", "lastName", "dateOfBirth", "customerName", "customerPhone"]);
  }

  async beforeLog(auditData) {
    // Apply PII protection
    if (this.options.enablePII) {
      auditData = this._protectPII(auditData);
    }

    // Apply financial compliance rules
    if (this.options.enableFinancialCompliance && this._isFinancialRecord(auditData)) {
      auditData.metadata = {
        ...auditData.metadata,
        complianceFlags: {
          financialRecord: true,
          retentionRequired: true,
          immutable: true,
          auditTrail: true
        }
      };
    }

    // Apply data retention policies
    if (this.options.enableDataRetention) {
      auditData.metadata = {
        ...auditData.metadata,
        retentionPolicy: this._getRetentionPolicy(auditData)
      };
    }

    return auditData;
  }

  _protectPII(auditData) {
    // Mask PII in old and new values
    if (auditData.oldValues) {
      auditData.oldValues = this._maskPII(auditData.oldValues);
    }
    if (auditData.newValues) {
      auditData.newValues = this._maskPII(auditData.newValues);
    }

    return auditData;
  }

  _maskPII(data) {
    if (!data || typeof data !== "object") return data;

    const masked = { ...data };

    for (const [key, value] of Object.entries(masked)) {
      const lowerKey = key.toLowerCase();

      if (this.piiFields.has(lowerKey) || this._containsPII(lowerKey)) {
        if (typeof value === "string" && value.length > 0) {
          // Mask all but first and last character
          if (value.length <= 2) {
            masked[key] = "*".repeat(value.length);
          } else {
            masked[key] = value[0] + "*".repeat(value.length - 2) + value[value.length - 1];
          }
        } else {
          masked[key] = "[PII_MASKED]";
        }
      } else if (typeof value === "object" && value !== null) {
        masked[key] = this._maskPII(value);
      }
    }

    return masked;
  }

  _containsPII(fieldName) {
    const piiKeywords = ["name", "email", "phone", "address", "personal", "customer"];
    return piiKeywords.some(keyword => fieldName.includes(keyword));
  }

  _isFinancialRecord(auditData) {
    const financialResources = ["sales", "orders", "day_operations"];
    const financialActions = ["create", "update", "delete", "complete", "revert"];

    return financialResources.includes(auditData.resource) && financialActions.includes(auditData.action);
  }

  _getRetentionPolicy(auditData) {
    // Determine retention based on compliance standards
    let maxRetention = 365; // Default 1 year

    if (this.options.complianceStandards.includes("SOX") && this._isFinancialRecord(auditData)) {
      maxRetention = Math.max(maxRetention, 2555); // 7 years
    }

    if (this.options.complianceStandards.includes("PCI-DSS") && this._isPaymentRecord(auditData)) {
      maxRetention = Math.max(maxRetention, 365); // 1 year minimum
    }

    if (this.options.complianceStandards.includes("GDPR") && this._containsPersonalData(auditData)) {
      maxRetention = Math.max(maxRetention, 1095); // 3 years
    }

    return {
      retentionDays: maxRetention,
      complianceStandards: this.options.complianceStandards,
      autoDelete: true,
      archiveAfterDays: Math.floor(maxRetention * 0.8)
    };
  }

  _isPaymentRecord(auditData) {
    return auditData.resource === "sales" || (auditData.metadata && auditData.metadata.paymentMethod);
  }

  _containsPersonalData(auditData) {
    const dataString = JSON.stringify({
      oldValues: auditData.oldValues,
      newValues: auditData.newValues
    }).toLowerCase();

    return Array.from(this.piiFields).some(field => dataString.includes(field));
  }
}

/**
 * Alert and Notification Plugin
 * Sends alerts based on audit events and patterns
 */
export class AlertPlugin {
  constructor(options = {}) {
    this.options = {
      enableSecurityAlerts: options.enableSecurityAlerts !== false,
      enableBusinessAlerts: options.enableBusinessAlerts !== false,
      alertChannels: options.alertChannels || ["console"],
      thresholds: {
        failedLogins: 5,
        largeTransactions: 1000,
        systemErrors: 10,
        ...options.thresholds
      },
      ...options
    };

    this.alertCounters = new Map();
    this.alertHistory = [];
  }

  async afterLog(auditData) {
    // Check for security alerts
    if (this.options.enableSecurityAlerts) {
      await this._checkSecurityAlerts(auditData);
    }

    // Check for business alerts
    if (this.options.enableBusinessAlerts) {
      await this._checkBusinessAlerts(auditData);
    }
  }

  async onError(error, auditData) {
    await this._sendAlert({
      type: "system_error",
      severity: "high",
      message: `Audit logging error: ${error.message}`,
      data: auditData,
      timestamp: new Date().toISOString()
    });
  }

  async _checkSecurityAlerts(auditData) {
    // Failed login attempts
    if (auditData.action === "login_failed") {
      const key = `failed_login_${auditData.userId || auditData.ipAddress}`;
      const count = this._incrementCounter(key);

      if (count >= this.options.thresholds.failedLogins) {
        await this._sendAlert({
          type: "security_threat",
          severity: "critical",
          message: `Multiple failed login attempts detected`,
          data: {
            userId: auditData.userId,
            ipAddress: auditData.ipAddress,
            attempts: count
          }
        });
      }
    }

    // Suspicious activity patterns
    if (auditData.action === "delete" && auditData.resource === "sales") {
      await this._sendAlert({
        type: "suspicious_activity",
        severity: "high",
        message: `Sales record deletion detected`,
        data: auditData
      });
    }
  }

  async _checkBusinessAlerts(auditData) {
    // Large transactions
    if (auditData.resource === "sales" && auditData.newValues?.totalAmount) {
      const amount = parseFloat(auditData.newValues.totalAmount);
      if (amount >= this.options.thresholds.largeTransactions) {
        await this._sendAlert({
          type: "large_transaction",
          severity: "medium",
          message: `Large transaction detected: $${amount}`,
          data: auditData
        });
      }
    }

    // Inventory adjustments
    if (auditData.resource === "stock_entries" && auditData.action === "adjust") {
      await this._sendAlert({
        type: "inventory_adjustment",
        severity: "low",
        message: `Inventory adjustment made`,
        data: auditData
      });
    }
  }

  _incrementCounter(key) {
    const current = this.alertCounters.get(key) || 0;
    const newCount = current + 1;
    this.alertCounters.set(key, newCount);

    // Reset counter after 1 hour
    setTimeout(() => {
      this.alertCounters.delete(key);
    }, 3600000);

    return newCount;
  }

  async _sendAlert(alert) {
    // Add to history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    // Send to configured channels
    for (const channel of this.options.alertChannels) {
      try {
        await this._sendToChannel(channel, alert);
      } catch (error) {
        console.error(`Failed to send alert to ${channel}:`, error);
      }
    }
  }

  async _sendToChannel(channel, alert) {
    switch (channel) {
      case "console":
        console.warn(`[AUDIT ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.data);
        break;

      case "email":
        // Implement email sending
        console.log(`Email alert would be sent: ${alert.message}`);
        break;

      case "webhook":
        // Implement webhook sending
        console.log(`Webhook alert would be sent: ${alert.message}`);
        break;

      case "file":
        await this._writeToFile(alert);
        break;
    }
  }

  async _writeToFile(alert) {
    const logDir = path.join(process.cwd(), "logs", "alerts");
    await fs.mkdir(logDir, { recursive: true });

    const filename = path.join(logDir, `alerts-${new Date().toISOString().split("T")[0]}.log`);
    const logEntry = `${new Date().toISOString()} [${alert.severity.toUpperCase()}] ${alert.message}\n`;

    await fs.appendFile(filename, logEntry);
  }

  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(-limit);
  }
}

/**
 * File Export Plugin
 * Exports audit logs to various file formats
 */
export class FileExportPlugin {
  constructor(options = {}) {
    this.options = {
      exportFormats: options.exportFormats || ["json"],
      exportPath: options.exportPath || path.join(process.cwd(), "exports"),
      batchSize: options.batchSize || 1000,
      enableScheduledExports: options.enableScheduledExports !== false,
      ...options
    };

    this.exportQueue = [];
  }

  async afterLog(auditData) {
    // Add to export queue if needed
    if (this._shouldExport(auditData)) {
      this.exportQueue.push(auditData);

      if (this.exportQueue.length >= this.options.batchSize) {
        await this._processBatchExport();
      }
    }
  }

  async _shouldExport(auditData) {
    // Export critical actions immediately
    const criticalActions = ["delete", "revert", "void"];
    const criticalResources = ["sales", "user_management"];

    return criticalActions.includes(auditData.action) || criticalResources.includes(auditData.resource);
  }

  async _processBatchExport() {
    if (this.exportQueue.length === 0) return;

    const batch = this.exportQueue.splice(0, this.options.batchSize);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    for (const format of this.options.exportFormats) {
      try {
        await this._exportBatch(batch, format, timestamp);
      } catch (error) {
        console.error(`Failed to export batch in ${format} format:`, error);
      }
    }
  }

  async _exportBatch(batch, format, timestamp) {
    const filename = `audit-export-${timestamp}.${format}`;
    const filepath = path.join(this.options.exportPath, filename);

    // Ensure export directory exists
    await fs.mkdir(this.options.exportPath, { recursive: true });

    let content;
    switch (format) {
      case "json":
        content = JSON.stringify(batch, null, 2);
        break;

      case "csv":
        content = this._convertToCSV(batch);
        break;

      case "xml":
        content = this._convertToXML(batch);
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    await fs.writeFile(filepath, content);
    console.log(`Exported ${batch.length} audit records to ${filepath}`);
  }

  _convertToCSV(batch) {
    if (batch.length === 0) return "";

    const headers = ["timestamp", "userId", "action", "resource", "resourceId", "status", "ipAddress"];
    const rows = batch.map(item =>
      headers
        .map(header => {
          const value = item[header];
          return typeof value === "object" ? JSON.stringify(value) : value || "";
        })
        .join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  }

  _convertToXML(batch) {
    const xmlItems = batch
      .map(item => {
        const fields = Object.entries(item)
          .map(([key, value]) => {
            const xmlValue = typeof value === "object" ? `<![CDATA[${JSON.stringify(value)}]]>` : String(value || "");
            return `    <${key}>${xmlValue}</${key}>`;
          })
          .join("\n");

        return `  <audit-record>\n${fields}\n  </audit-record>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<audit-logs>\n${xmlItems}\n</audit-logs>`;
  }

  async flush() {
    if (this.exportQueue.length > 0) {
      await this._processBatchExport();
    }
  }
}

// Plugin factory for easy registration
export class PluginFactory {
  static createPerformanceMonitor(options) {
    return new PerformanceMonitoringPlugin(options);
  }

  static createDataEnricher(options) {
    return new DataEnrichmentPlugin(options);
  }

  static createComplianceEnforcer(options) {
    return new CompliancePlugin(options);
  }

  static createAlerter(options) {
    return new AlertPlugin(options);
  }

  static createFileExporter(options) {
    return new FileExportPlugin(options);
  }
}

export default {
  PerformanceMonitoringPlugin,
  DataEnrichmentPlugin,
  CompliancePlugin,
  AlertPlugin,
  FileExportPlugin,
  PluginFactory
};
