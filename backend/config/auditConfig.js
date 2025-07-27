/**
 * Comprehensive Audit Configuration System
 *
 * Centralized configuration for audit logging policies, rules, and settings.
 * Supports environment-specific configurations and runtime policy updates.
 */

/**
 * Environment-specific audit configurations
 */
const auditConfigurations = {
  development: {
    enableBatching: true,
    batchSize: 10,
    batchTimeout: 2000,
    enableMetrics: true,
    logLevel: "debug",
    retentionDays: 30,
    enableConsoleOutput: true
  },

  testing: {
    enableBatching: false,
    batchSize: 1,
    batchTimeout: 100,
    enableMetrics: false,
    logLevel: "error",
    retentionDays: 7,
    enableConsoleOutput: false
  },

  production: {
    enableBatching: true,
    batchSize: 100,
    batchTimeout: 5000,
    enableMetrics: true,
    logLevel: "info",
    retentionDays: 2555, // 7 years for compliance
    enableConsoleOutput: false,
    enableCompression: true,
    enableEncryption: true
  }
};

/**
 * Resource-specific audit policies
 */
export const auditPolicies = {
  // Authentication and Security
  authentication: {
    actions: {
      login: {
        priority: "high",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 90,
        alertOnFailure: true
      },
      login_failed: {
        priority: "critical",
        captureRequest: true,
        captureResponse: false,
        captureMetadata: true,
        retention: 365,
        alertOnFailure: true,
        maxFailuresPerHour: 5
      },
      logout: {
        priority: "medium",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 30
      },
      password_change: {
        priority: "high",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 365,
        requireApproval: false
      },
      token_refresh: {
        priority: "low",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 30
      }
    },
    sensitiveFields: ["password", "token", "oldPassword", "newPassword", "refreshToken"],
    defaultRetention: 90,
    complianceLevel: "high"
  },

  // User Management
  user_management: {
    actions: {
      create: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        requireApproval: true
      },
      update: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095,
        captureChanges: true
      },
      delete: {
        priority: "critical",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        requireApproval: true,
        alertOnAction: true
      },
      password_reset: {
        priority: "high",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 365
      },
      unlock: {
        priority: "medium",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 180
      }
    },
    sensitiveFields: ["password", "ssn", "personalInfo"],
    defaultRetention: 1095,
    complianceLevel: "high"
  },

  // Sales and Financial
  sales: {
    actions: {
      create: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        financialRecord: true
      },
      update: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        captureChanges: true,
        requireJustification: true
      },
      delete: {
        priority: "critical",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        requireApproval: true,
        alertOnAction: true,
        financialRecord: true
      },
      revert: {
        priority: "critical",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        requireApproval: true,
        financialRecord: true
      },
      soft_delete: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        financialRecord: true
      }
    },
    sensitiveFields: ["creditCard", "paymentDetails"],
    defaultRetention: 2555,
    complianceLevel: "critical",
    financialAudit: true
  },

  // Orders Management
  orders: {
    actions: {
      create: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095
      },
      update: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095,
        captureChanges: true
      },
      complete: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        businessCritical: true
      },
      cancel: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095,
        requireJustification: true
      },
      void: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        requireApproval: true,
        businessCritical: true
      }
    },
    defaultRetention: 1095,
    complianceLevel: "medium"
  },

  // Inventory and Stock
  stock_entries: {
    actions: {
      create: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095
      },
      update: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095,
        captureChanges: true
      },
      delete: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095,
        requireJustification: true
      },
      adjust: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095,
        requireJustification: true,
        businessCritical: true
      },
      transfer: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095
      },
      waste: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095,
        requireJustification: true
      }
    },
    defaultRetention: 1095,
    complianceLevel: "medium"
  },

  // Materials Management
  materials: {
    actions: {
      create: {
        priority: "low",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 365
      },
      update: {
        priority: "low",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 365,
        captureChanges: true
      },
      delete: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095,
        requireJustification: true
      }
    },
    defaultRetention: 365,
    complianceLevel: "low"
  },

  // Menu Items
  menu_items: {
    actions: {
      create: {
        priority: "low",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 365
      },
      update: {
        priority: "low",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 365,
        captureChanges: true
      },
      delete: {
        priority: "medium",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 1095
      }
    },
    defaultRetention: 365,
    complianceLevel: "low"
  },

  // System Operations
  system: {
    actions: {
      startup: {
        priority: "medium",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 365
      },
      shutdown: {
        priority: "medium",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 365
      },
      backup: {
        priority: "high",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 1095,
        systemCritical: true
      },
      restore: {
        priority: "critical",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 2555,
        systemCritical: true,
        requireApproval: true
      },
      maintenance: {
        priority: "medium",
        captureRequest: false,
        captureResponse: false,
        captureMetadata: true,
        retention: 365
      }
    },
    defaultRetention: 365,
    complianceLevel: "high"
  },

  // Day Operations
  day_operations: {
    actions: {
      open: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        businessCritical: true
      },
      close: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        businessCritical: true
      },
      cash_count: {
        priority: "high",
        captureRequest: true,
        captureResponse: true,
        captureMetadata: true,
        retention: 2555,
        financialRecord: true
      }
    },
    defaultRetention: 2555,
    complianceLevel: "high",
    financialAudit: true
  }
};

/**
 * Compliance and regulatory settings
 */
export const complianceSettings = {
  // Financial regulations (e.g., SOX, PCI DSS)
  financial: {
    enabled: true,
    retentionYears: 7,
    encryptionRequired: true,
    immutableLogs: true,
    digitalSignatures: true
  },

  // Data protection regulations (e.g., GDPR, CCPA)
  dataProtection: {
    enabled: true,
    anonymizeAfterDays: 1095,
    rightToErasure: true,
    consentTracking: true
  },

  // Industry-specific regulations (e.g., FDA for food service)
  foodService: {
    enabled: true,
    traceabilityRequired: true,
    temperatureLogging: true,
    supplierTracking: true
  }
};

/**
 * Alert and notification settings
 */
export const alertSettings = {
  // Security alerts
  security: {
    enabled: true,
    channels: ["email", "sms", "webhook"],
    thresholds: {
      failedLogins: 5,
      suspiciousActivity: 3,
      dataBreachAttempt: 1
    }
  },

  // Business alerts
  business: {
    enabled: true,
    channels: ["email", "dashboard"],
    thresholds: {
      largeTransactions: 1000,
      inventoryAdjustments: 100,
      systemDowntime: 300 // seconds
    }
  },

  // Compliance alerts
  compliance: {
    enabled: true,
    channels: ["email", "compliance_system"],
    thresholds: {
      retentionViolation: 1,
      accessViolation: 1,
      dataExport: 1
    }
  }
};

/**
 * Performance optimization settings
 */
export const performanceSettings = {
  // Database optimization
  database: {
    useIndexes: true,
    partitioning: {
      enabled: true,
      strategy: "monthly",
      retentionMonths: 36
    },
    compression: {
      enabled: true,
      algorithm: "gzip",
      level: 6
    }
  },

  // Memory management
  memory: {
    maxQueueSize: 10000,
    gcInterval: 300000, // 5 minutes
    memoryThreshold: 0.8
  },

  // Network optimization
  network: {
    batchCompression: true,
    connectionPooling: true,
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxDelay: 30000
    }
  }
};

/**
 * Get configuration for current environment
 * @param {string} environment - Environment name
 * @returns {Object} Environment configuration
 */
export function getEnvironmentConfig(environment = process.env.NODE_ENV || "development") {
  return auditConfigurations[environment] || auditConfigurations.development;
}

/**
 * Get audit policy for a resource and action
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Object} Audit policy
 */
export function getAuditPolicy(resource, action) {
  const resourcePolicy = auditPolicies[resource.toLowerCase()];
  if (!resourcePolicy) {
    return getDefaultPolicy();
  }

  const actionPolicy = resourcePolicy.actions[action.toLowerCase()];
  if (!actionPolicy) {
    return {
      ...getDefaultPolicy(),
      retention: resourcePolicy.defaultRetention,
      complianceLevel: resourcePolicy.complianceLevel
    };
  }

  return {
    ...actionPolicy,
    resource,
    action,
    sensitiveFields: resourcePolicy.sensitiveFields || [],
    complianceLevel: resourcePolicy.complianceLevel || "low"
  };
}

/**
 * Get default audit policy
 * @returns {Object} Default policy
 */
function getDefaultPolicy() {
  return {
    priority: "low",
    captureRequest: true,
    captureResponse: true,
    captureMetadata: true,
    captureChanges: false,
    retention: 365,
    complianceLevel: "low",
    sensitiveFields: []
  };
}

/**
 * Validate audit configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
export function validateAuditConfig(config) {
  const errors = [];
  const warnings = [];

  // Validate batch settings
  if (config.batchSize && (config.batchSize < 1 || config.batchSize > 1000)) {
    errors.push("Batch size must be between 1 and 1000");
  }

  if (config.batchTimeout && (config.batchTimeout < 100 || config.batchTimeout > 60000)) {
    warnings.push("Batch timeout should be between 100ms and 60s for optimal performance");
  }

  // Validate retention settings
  if (config.retentionDays && config.retentionDays < 1) {
    errors.push("Retention days must be at least 1");
  }

  // Validate compliance settings
  if (complianceSettings.financial.enabled && config.retentionDays < 2555) {
    warnings.push("Financial compliance requires minimum 7 years (2555 days) retention");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create audit configuration for specific use case
 * @param {string} useCase - Use case identifier
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Audit configuration
 */
export function createAuditConfig(useCase, overrides = {}) {
  const baseConfig = getEnvironmentConfig();

  const useCaseConfigs = {
    "high-security": {
      enableBatching: false,
      enableMetrics: true,
      logLevel: "debug",
      retentionDays: 2555,
      enableEncryption: true,
      alertOnFailure: true
    },

    "high-performance": {
      enableBatching: true,
      batchSize: 200,
      batchTimeout: 1000,
      enableMetrics: false,
      enableCompression: true
    },

    "compliance-focused": {
      enableBatching: true,
      retentionDays: 2555,
      enableEncryption: true,
      immutableLogs: true,
      digitalSignatures: true
    },

    development: {
      enableBatching: false,
      enableMetrics: true,
      enableConsoleOutput: true,
      logLevel: "debug",
      retentionDays: 30
    }
  };

  const useCaseConfig = useCaseConfigs[useCase] || {};

  return {
    ...baseConfig,
    ...useCaseConfig,
    ...overrides
  };
}

export default {
  auditPolicies,
  complianceSettings,
  alertSettings,
  performanceSettings,
  getEnvironmentConfig,
  getAuditPolicy,
  validateAuditConfig,
  createAuditConfig
};
