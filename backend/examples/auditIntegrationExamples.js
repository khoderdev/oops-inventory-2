/**
 * Audit Integration Examples and Usage Documentation
 * 
 * This file demonstrates how to integrate the smart audit logging system
 * into your controllers and services with various patterns and use cases.
 */

import AuditLogger from '../services/AuditLogger.js';
import { auditAction, auditController, auditMiddleware, AuditHelper } from '../decorators/auditDecorator.js';
import { PluginFactory } from '../plugins/auditPlugins.js';
import auditConfig from '../config/auditConfig.js';

/**
 * Example 1: Basic Controller Integration with Decorators
 */

// Using method decorator for specific actions
class SalesControllerExample {
  @auditAction({
    resource: 'sales',
    action: 'create',
    extractData: (result, req, res) => ({
      resourceId: result.id,
      newValues: result,
      metadata: {
        totalAmount: result.totalAmount,
        itemCount: result.items?.length || 0
      }
    })
  })
  async createSale(req, res) {
    try {
      // Your existing sale creation logic
      const saleData = req.body;
      const sale = await Sale.create(saleData);
      
      res.status(201).json(sale);
      return sale;
    } catch (error) {
      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  // Manual audit logging for complex scenarios
  async updateSale(req, res) {
    try {
      const saleId = req.params.id;
      const updateData = req.body;
      
      // Get original data for audit trail
      const originalSale = await Sale.findByPk(saleId);
      if (!originalSale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      // Perform update
      const updatedSale = await originalSale.update(updateData);

      // Manual audit logging with before/after data
      await AuditHelper.logDataChange({
        userId: req.user.id,
        action: 'update',
        resource: 'sales',
        resourceId: saleId,
        oldData: originalSale.toJSON(),
        newData: updatedSale.toJSON(),
        request: req,
        metadata: {
          updateFields: Object.keys(updateData),
          businessImpact: 'revenue_adjustment'
        }
      });

      res.json(updatedSale);
    } catch (error) {
      // Log failed operation
      await AuditLogger.log({
        userId: req.user?.id,
        action: 'update',
        resource: 'sales',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: error.message,
        request: req
      });

      res.status(500).json({ error: error.message });
    }
  }
}

/**
 * Example 2: Class-Level Decorator for Automatic Auditing
 */

@auditController({
  resource: 'user_management',
  actionMap: {
    createUser: 'create',
    updateUser: 'update',
    deleteUser: 'delete',
    getUserById: 'read',
    getAllUsers: 'list'
  },
  defaultOptions: {
    captureResult: true
  }
})
class UserControllerExample {
  async createUser(req, res) {
    // All methods in this class are automatically audited
    const userData = req.body;
    const user = await User.create(userData);
    res.status(201).json(user);
    return user;
  }

  async updateUser(req, res) {
    const userId = req.params.id;
    const updateData = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await user.update(updateData);
    res.json(updatedUser);
    return updatedUser;
  }

  async deleteUser(req, res) {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    res.status(204).send();
    return { deletedUserId: userId };
  }
}

/**
 * Example 3: Middleware Integration for Route-Level Auditing
 */

// Apply audit middleware to specific routes
import express from 'express';
const router = express.Router();

// Audit all operations on this route
router.use('/api/inventory', auditMiddleware({
  resource: 'stock_entries',
  captureRequest: true,
  captureResponse: true,
  metadata: {
    module: 'inventory_management'
  }
}));

// Audit with custom configuration
router.use('/api/financial', auditMiddleware({
  resource: 'financial',
  captureRequest: true,
  captureResponse: false, // Don't capture sensitive financial data in response
  skipRoutes: ['/api/financial/reports'], // Skip certain routes
  metadata: {
    complianceRequired: true,
    sensitivityLevel: 'high'
  }
}));

/**
 * Example 4: Service-Level Integration
 */

class OrderServiceExample {
  async processOrder(orderData, userId) {
    const auditContext = {
      userId,
      resource: 'orders',
      metadata: {
        orderType: orderData.orderType,
        itemCount: orderData.items?.length || 0,
        totalAmount: orderData.totalAmount
      }
    };

    try {
      // Log order creation start
      await AuditLogger.logUserAction(userId, 'create', 'orders', {
        ...auditContext,
        newValues: orderData,
        metadata: {
          ...auditContext.metadata,
          stage: 'initiated'
        }
      });

      // Process order
      const order = await Order.create(orderData);

      // Log successful creation
      await AuditLogger.logUserAction(userId, 'create', 'orders', {
        ...auditContext,
        resourceId: order.id,
        newValues: order.toJSON(),
        metadata: {
          ...auditContext.metadata,
          stage: 'completed',
          processingTime: Date.now() - auditContext.startTime
        }
      });

      return order;

    } catch (error) {
      // Log failed creation
      await AuditLogger.logUserAction(userId, 'create', 'orders', {
        ...auditContext,
        status: 'failure',
        errorMessage: error.message,
        metadata: {
          ...auditContext.metadata,
          stage: 'failed',
          errorType: error.constructor.name
        }
      });

      throw error;
    }
  }

  async voidOrder(orderId, userId, reason) {
    // Log business operation with impact assessment
    await AuditHelper.logBusinessOperation({
      userId,
      operation: 'void',
      resource: 'orders',
      data: {
        orderId,
        reason,
        voidedAt: new Date().toISOString()
      },
      impact: 'revenue_loss',
      metadata: {
        businessProcess: 'order_management',
        requiresApproval: true,
        financialImpact: true
      }
    });

    // Perform void operation
    const order = await Order.findByPk(orderId);
    await order.update({ status: 'voided', voidReason: reason });

    return order;
  }
}

/**
 * Example 5: Security Event Logging
 */

class AuthServiceExample {
  async login(username, password, req) {
    try {
      const user = await User.findOne({ where: { username } });
      
      if (!user) {
        // Log failed login attempt
        await AuditHelper.logSecurityEvent({
          userId: null,
          event: 'login_failed',
          severity: 'medium',
          details: {
            username,
            reason: 'user_not_found',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          },
          request: req
        });
        
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await user.validatePassword(password);
      
      if (!isValidPassword) {
        // Log failed password attempt
        await AuditHelper.logSecurityEvent({
          userId: user.id,
          event: 'login_failed',
          severity: 'high',
          details: {
            username,
            reason: 'invalid_password',
            attemptCount: await this.getFailedAttemptCount(user.id),
            ipAddress: req.ip
          },
          request: req
        });
        
        throw new Error('Invalid credentials');
      }

      // Log successful login
      await AuditHelper.logSecurityEvent({
        userId: user.id,
        event: 'login_success',
        severity: 'low',
        details: {
          username,
          loginMethod: 'password',
          ipAddress: req.ip,
          sessionId: req.sessionID
        },
        request: req
      });

      return user;

    } catch (error) {
      throw error;
    }
  }

  async logout(userId, req) {
    await AuditHelper.logSecurityEvent({
      userId,
      event: 'logout',
      severity: 'low',
      details: {
        sessionDuration: this.calculateSessionDuration(req.session),
        ipAddress: req.ip
      },
      request: req
    });
  }
}

/**
 * Example 6: System Event Logging
 */

class SystemServiceExample {
  async performBackup() {
    const backupId = `backup_${Date.now()}`;
    
    try {
      // Log backup start
      await AuditHelper.logSystemEvent({
        event: 'backup_started',
        resource: 'system',
        data: {
          backupId,
          backupType: 'full',
          scheduledBackup: true
        },
        metadata: {
          systemProcess: true,
          criticalOperation: true
        }
      });

      // Perform backup
      const backupResult = await this.executeBackup();

      // Log backup completion
      await AuditHelper.logSystemEvent({
        event: 'backup_completed',
        resource: 'system',
        data: {
          backupId,
          backupSize: backupResult.size,
          duration: backupResult.duration,
          location: backupResult.path
        },
        metadata: {
          systemProcess: true,
          criticalOperation: true,
          success: true
        }
      });

      return backupResult;

    } catch (error) {
      // Log backup failure
      await AuditHelper.logSystemEvent({
        event: 'backup_failed',
        resource: 'system',
        data: {
          backupId,
          error: error.message,
          failureReason: error.code
        },
        metadata: {
          systemProcess: true,
          criticalOperation: true,
          success: false,
          requiresAttention: true
        }
      });

      throw error;
    }
  }
}

/**
 * Example 7: Plugin Configuration and Usage
 */

class AuditSystemSetup {
  static async initializeAuditSystem() {
    // Configure audit logger with environment-specific settings
    const config = auditConfig.getEnvironmentConfig();
    
    // Register performance monitoring plugin
    const performancePlugin = PluginFactory.createPerformanceMonitor({
      metricsInterval: 60000,
      alertThreshold: 1000,
      enableDetailedMetrics: true
    });
    AuditLogger.registerPlugin('performance', performancePlugin);

    // Register data enrichment plugin
    const enrichmentPlugin = PluginFactory.createDataEnricher({
      enableGeoLocation: false,
      enableUserAgent: true,
      enableSessionInfo: true,
      enableBusinessContext: true
    });
    AuditLogger.registerPlugin('enrichment', enrichmentPlugin);

    // Register compliance plugin
    const compliancePlugin = PluginFactory.createComplianceEnforcer({
      enablePII: true,
      enableFinancialCompliance: true,
      enableDataRetention: true,
      complianceStandards: ['SOX', 'PCI-DSS', 'GDPR']
    });
    AuditLogger.registerPlugin('compliance', compliancePlugin);

    // Register alert plugin
    const alertPlugin = PluginFactory.createAlerter({
      enableSecurityAlerts: true,
      enableBusinessAlerts: true,
      alertChannels: ['console', 'file'],
      thresholds: {
        failedLogins: 5,
        largeTransactions: 1000,
        systemErrors: 10
      }
    });
    AuditLogger.registerPlugin('alerts', alertPlugin);

    // Register file export plugin
    const exportPlugin = PluginFactory.createFileExporter({
      exportFormats: ['json', 'csv'],
      exportPath: './exports/audit',
      batchSize: 1000
    });
    AuditLogger.registerPlugin('export', exportPlugin);

    console.log('Audit system initialized with all plugins');
  }

  static async setupCustomAuditPolicies() {
    // Set custom audit policy for high-security operations
    AuditLogger.setAuditPolicy('financial_operations', {
      actions: ['create', 'update', 'delete', 'transfer'],
      captureRequest: true,
      captureResponse: true,
      captureMetadata: true,
      captureChanges: true,
      sensitiveFields: ['accountNumber', 'routingNumber', 'cardNumber'],
      retention: 2555, // 7 years
      requiresApproval: true,
      encryptionRequired: true
    });

    // Set policy for user management
    AuditLogger.setAuditPolicy('user_management', {
      actions: ['create', 'update', 'delete', 'password_reset'],
      captureRequest: true,
      captureResponse: false, // Don't capture user data in response
      captureMetadata: true,
      captureChanges: true,
      sensitiveFields: ['password', 'ssn', 'personalInfo'],
      retention: 1095,
      requiresApproval: true
    });
  }
}

/**
 * Example 8: Advanced Usage Patterns
 */

class AdvancedAuditExamples {
  // Conditional auditing based on business rules
  async processTransaction(transactionData, userId) {
    const shouldAudit = transactionData.amount > 1000 || 
                       transactionData.type === 'refund' ||
                       transactionData.paymentMethod === 'cash';

    if (shouldAudit) {
      await AuditLogger.logUserAction(userId, 'transaction', 'financial', {
        resourceId: transactionData.id,
        newValues: transactionData,
        metadata: {
          auditReason: 'high_value_transaction',
          complianceRequired: true,
          reviewRequired: transactionData.amount > 5000
        }
      });
    }

    // Process transaction...
  }

  // Batch auditing for bulk operations
  async bulkUpdateInventory(updates, userId) {
    const auditBatch = updates.map(update => ({
      userId,
      action: 'bulk_update',
      resource: 'stock_entries',
      resourceId: update.id,
      oldValues: update.oldValues,
      newValues: update.newValues,
      metadata: {
        batchOperation: true,
        batchId: `batch_${Date.now()}`,
        updateType: update.type
      }
    }));

    // Log all updates in batch
    for (const auditData of auditBatch) {
      await AuditLogger.log(auditData);
    }
  }

  // Audit with correlation tracking
  async processOrderWorkflow(orderData, userId) {
    const correlationId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const baseAuditData = {
      userId,
      metadata: {
        correlationId,
        workflowType: 'order_processing'
      }
    };

    try {
      // Step 1: Validate order
      await AuditLogger.log({
        ...baseAuditData,
        action: 'validate',
        resource: 'orders',
        newValues: orderData,
        metadata: {
          ...baseAuditData.metadata,
          step: 1,
          stepName: 'validation'
        }
      });

      // Step 2: Reserve inventory
      await AuditLogger.log({
        ...baseAuditData,
        action: 'reserve',
        resource: 'stock_entries',
        metadata: {
          ...baseAuditData.metadata,
          step: 2,
          stepName: 'inventory_reservation'
        }
      });

      // Step 3: Process payment
      await AuditLogger.log({
        ...baseAuditData,
        action: 'process_payment',
        resource: 'financial',
        metadata: {
          ...baseAuditData.metadata,
          step: 3,
          stepName: 'payment_processing'
        }
      });

      // Step 4: Complete order
      await AuditLogger.log({
        ...baseAuditData,
        action: 'complete',
        resource: 'orders',
        metadata: {
          ...baseAuditData.metadata,
          step: 4,
          stepName: 'order_completion',
          workflowStatus: 'completed'
        }
      });

    } catch (error) {
      // Log workflow failure
      await AuditLogger.log({
        ...baseAuditData,
        action: 'workflow_failed',
        resource: 'orders',
        status: 'failure',
        errorMessage: error.message,
        metadata: {
          ...baseAuditData.metadata,
          workflowStatus: 'failed',
          failurePoint: 'unknown'
        }
      });
    }
  }
}

/**
 * Example 9: Testing and Monitoring
 */

class AuditSystemMonitoring {
  static async getSystemHealth() {
    const metrics = AuditLogger.getMetrics();
    
    return {
      status: metrics.failedLogs / metrics.totalLogs < 0.01 ? 'healthy' : 'degraded',
      metrics,
      recommendations: this.generateHealthRecommendations(metrics)
    };
  }

  static generateHealthRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.queueSize > 1000) {
      recommendations.push('Consider increasing batch size or reducing batch timeout');
    }
    
    if (metrics.averageProcessingTime > 100) {
      recommendations.push('Audit processing is slow, consider optimizing database queries');
    }
    
    if (metrics.failedLogs > 0) {
      recommendations.push('Some audit logs are failing, check error logs');
    }
    
    return recommendations;
  }

  static async flushAllPendingLogs() {
    await AuditLogger.flush();
    console.log('All pending audit logs have been flushed');
  }
}

// Export examples for documentation
export {
  SalesControllerExample,
  UserControllerExample,
  OrderServiceExample,
  AuthServiceExample,
  SystemServiceExample,
  AuditSystemSetup,
  AdvancedAuditExamples,
  AuditSystemMonitoring
};

/**
 * Usage Instructions:
 * 
 * 1. Initialize the audit system in your main application file:
 *    ```javascript
 *    import { AuditSystemSetup } from './examples/auditIntegrationExamples.js';
 *    await AuditSystemSetup.initializeAuditSystem();
 *    ```
 * 
 * 2. Use decorators for automatic auditing:
 *    ```javascript
 *    @auditAction({ resource: 'sales', action: 'create' })
 *    async createSale(req, res) { ... }
 *    ```
 * 
 * 3. Use manual logging for complex scenarios:
 *    ```javascript
 *    await AuditLogger.logUserAction(userId, 'update', 'sales', {
 *      resourceId: saleId,
 *      oldValues: originalData,
 *      newValues: updatedData
 *    });
 *    ```
 * 
 * 4. Apply middleware for route-level auditing:
 *    ```javascript
 *    router.use('/api/sensitive', auditMiddleware({ resource: 'sensitive' }));
 *    ```
 * 
 * 5. Monitor system health:
 *    ```javascript
 *    const health = await AuditSystemMonitoring.getSystemHealth();
 *    ```
 */
