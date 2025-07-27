import AuditLog from "../models/AuditLog.js";
import Session from "../models/Session.js";

class AuditService {
  constructor() {
    this.batchSize = 100;
    this.batchTimeout = 5000; // 5 seconds
    this.auditQueue = [];
    this.batchTimer = null;
  }

  /**
   * Log user activity with comprehensive tracking
   */
  async logActivity(userId, action, resource, data = {}, req = null) {
    try {
      // Map resource names for consistency
      const resourceMap = {
        'user': 'user_management',
        'stock': 'stock_entries',
        'stock_entry': 'stock_entries',
        'material': 'material',
        'order': 'pos',
        'sale': 'pos',
        'table': 'pos',
        'auth': 'authentication',
        'security': 'authentication'
      };
      
      const mappedResource = resourceMap[resource.toLowerCase()] || resource.toLowerCase();
      
      const auditData = {
        userId,
        action: action.toLowerCase(),
        resource: mappedResource,
        resourceId: data.resourceId?.toString() || null,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        status: data.status || 'success',
        errorMessage: data.errorMessage ? `${data.errorMessage} | Action: ${action} | Resource: ${mappedResource}` : null,
        metadata: {
          ...data.metadata,
          timestamp: new Date().toISOString(),
          endpoint: req?.path,
          method: req?.method,
          query: req?.query,
          params: req?.params
        }
      };

      if (req) {
        auditData.ipAddress = req.ip || req.connection.remoteAddress;
      }

      // Add to batch queue for performance
      this.auditQueue.push(auditData);
      
      // Process immediately for critical actions
      const criticalActions = ['login', 'logout', 'delete', 'void', 'revert'];
      if (criticalActions.includes(action.toLowerCase())) {
        await this.processBatch();
      } else {
        this.scheduleBatchProcess();
      }

    } catch (error) {
      console.error('Failed to log audit activity:', error);
    }
  }

  /**
   * Log security events (login attempts, permission denials, etc.)
   */
  async logSecurityEvent(userId, event, details = {}, req = null) {
    const securityData = {
      action: event.toLowerCase(),
      resource: 'authentication',
      status: details.success ? 'success' : 'failure',
      errorMessage: details.error ? `Security Event: ${details.error} | Event: ${event} | Attempts: ${details.attempts || 1} | Context: ${details.context || 'Security monitoring'}` : null,
      metadata: {
        event,
        details: this.sanitizeData(details),
        timestamp: new Date().toISOString(),
        attempts: details.attempts || 1,
        blocked: details.blocked || false
      }
    };

    await this.logActivity(userId, securityData.action, securityData.resource, securityData, req);
  }

  /**
   * Log user session activities
   */
  async logSessionActivity(sessionId, action, userId = null, req = null) {
    try {
      const sessionData = {
        action: action.toLowerCase(),
        resource: 'authentication',
        resourceId: sessionId,
        metadata: {
          sessionId,
          operationType: 'session',
          timestamp: new Date().toISOString()
        }
      };

      // Update session last activity
      if (sessionId && action !== 'END') {
        await Session.update(
          { lastActivity: new Date() },
          { where: { token: sessionId, isActive: true } }
        );
      }

      await this.logActivity(userId, sessionData.action, sessionData.resource, sessionData, req);
    } catch (error) {
      console.error('Failed to log session activity:', error);
    }
  }

  /**
   * Log business operations (sales, orders, inventory)
   */
  async logBusinessOperation(userId, operation, entity, data = {}, req = null) {
    // Map entity to consistent resource names
    const entityResourceMap = {
      'sale': 'pos',
      'order': 'pos', 
      'stock': 'stock_entries',
      'stock_entry': 'stock_entries',
      'material': 'material',
      'user': 'user_management'
    };
    
    const mappedResource = entityResourceMap[entity.toLowerCase()] || entity.toLowerCase();
    
    const businessData = {
      action: operation.toLowerCase(),
      resource: mappedResource,
      resourceId: data.id?.toString() || data.resourceId?.toString(),
      oldValues: data.oldValues || null,
      newValues: data.newValues || null,
      metadata: {
        ...data.metadata,
        operationType: entity.toLowerCase(),
        businessImpact: this.calculateBusinessImpact(entity, operation, data),
        timestamp: new Date().toISOString()
      }
    };

    await this.logActivity(userId, businessData.action, businessData.resource, businessData, req);
  }

  /**
   * Log system events (automated processes, cleanup, etc.)
   */
  async logSystemEvent(event, details = {}) {
    try {
      await AuditLog.create({
        userId: null, // System event
        action: event.toLowerCase(),
        resource: 'system',
        status: details.success !== false ? 'success' : 'failure',
        errorMessage: details.error ? `System Event: ${details.error} | Event: ${event} | Context: Automated system process` : null,
        metadata: {
          event,
          details: this.sanitizeData(details),
          timestamp: new Date().toISOString(),
          automated: true
        }
      });
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  /**
   * Get user activity report
   */
  async getUserActivityReport(userId, options = {}) {
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      endDate = new Date(),
      actions = null,
      resources = null,
      limit = 100
    } = options;

    const whereClause = {
      userId,
      timestamp: {
        [AuditLog.sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };

    if (actions) {
      whereClause.action = {
        [AuditLog.sequelize.Sequelize.Op.in]: actions.map(a => a.toLowerCase())
      };
    }

    if (resources) {
      whereClause.resource = {
        [AuditLog.sequelize.Sequelize.Op.in]: resources.map(r => r.toLowerCase())
      };
    }

    return await AuditLog.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit
    });
  }

  /**
   * Get security events report
   */
  async getSecurityReport(options = {}) {
    const {
      hours = 24,
      includeSuccessful = false
    } = options;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const whereClause = {
      timestamp: {
        [AuditLog.sequelize.Sequelize.Op.gte]: since
      },
      resource: 'authentication',
      action: {
        [AuditLog.sequelize.Sequelize.Op.in]: ['login', 'logout', 'login_failed', 'password_change', 'account_locked', 'permission_denied']
      }
    };

    if (!includeSuccessful) {
      whereClause.status = 'failure';
    }

    return await AuditLog.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      include: [
        {
          model: AuditLog.sequelize.models.User,
          as: 'user',
          attributes: ['id', 'username', 'role'],
          required: false
        }
      ]
    });
  }

  /**
   * Get business analytics from audit logs
   */
  async getBusinessAnalytics(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date()
    } = options;

    const analytics = await AuditLog.findAll({
      where: {
        timestamp: {
          [AuditLog.sequelize.Sequelize.Op.between]: [startDate, endDate]
        },
        resource: {
          [AuditLog.sequelize.Sequelize.Op.in]: ['pos', 'stock_entries', 'material']
        }
      },
      attributes: [
        'resource',
        'action',
        [AuditLog.sequelize.Sequelize.fn('COUNT', AuditLog.sequelize.Sequelize.col('id')), 'count'],
        [AuditLog.sequelize.Sequelize.fn('DATE', AuditLog.sequelize.Sequelize.col('timestamp')), 'date']
      ],
      group: ['resource', 'action', AuditLog.sequelize.Sequelize.fn('DATE', AuditLog.sequelize.Sequelize.col('timestamp'))],
      order: [[AuditLog.sequelize.Sequelize.fn('DATE', AuditLog.sequelize.Sequelize.col('timestamp')), 'DESC']]
    });

    return this.formatAnalytics(analytics);
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const deletedCount = await AuditLog.destroy({
        where: {
          timestamp: {
            [AuditLog.sequelize.Sequelize.Op.lt]: cutoffDate
          },
          // Keep security and critical business events longer
          resource: {
            [AuditLog.sequelize.Sequelize.Op.notIn]: ['authentication', 'pos']
          }
        }
      });

      await this.logSystemEvent('audit_cleanup', {
        success: true,
        deletedCount,
        retentionDays,
        cutoffDate
      });

      return deletedCount;
    } catch (error) {
      await this.logSystemEvent('audit_cleanup', {
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process audit log batch
   */
  async processBatch() {
    if (this.auditQueue.length === 0) return;

    try {
      const batch = this.auditQueue.splice(0, this.batchSize);
      await AuditLog.bulkCreate(batch);
      
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
    } catch (error) {
      console.error('Failed to process audit batch:', error);
      // Re-add failed items to queue for retry
      this.auditQueue.unshift(...batch);
    }
  }

  /**
   * Schedule batch processing
   */
  scheduleBatchProcess() {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchTimeout);
  }

  /**
   * Calculate business impact of operations
   */
  calculateBusinessImpact(entity, operation, data) {
    const impact = {
      financial: 0,
      inventory: 0,
      customer: 0,
      operational: 1
    };

    switch (entity.toLowerCase()) {
      case 'sale':
        impact.financial = data.newValues?.totalAmount || 0;
        impact.customer = 1;
        if (operation === 'DELETE' || operation === 'REVERT') {
          impact.financial *= -1;
        }
        break;
      
      case 'order':
        impact.operational = operation === 'CREATE' ? 1 : 0;
        impact.customer = 1;
        break;
      
      case 'stock_entry':
        impact.inventory = data.newValues?.purchasedQuantity || 0;
        impact.financial = data.newValues?.totalCost || 0;
        if (operation === 'DELETE') {
          impact.inventory *= -1;
          impact.financial *= -1;
        }
        break;
    }

    return impact;
  }

  /**
   * Sanitize sensitive data
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'csrf', 'api_key', 'access_token',
      'refresh_token', 'credit_card', 'ssn', 'social_security'
    ];

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Format analytics data
   */
  formatAnalytics(rawAnalytics) {
    const formatted = {
      daily: {},
      totals: {},
      trends: {}
    };

    rawAnalytics.forEach(item => {
      const date = item.date;
      const resource = item.resource;
      const action = item.action;
      const count = parseInt(item.count);

      // Daily breakdown
      if (!formatted.daily[date]) {
        formatted.daily[date] = {};
      }
      if (!formatted.daily[date][resource]) {
        formatted.daily[date][resource] = {};
      }
      formatted.daily[date][resource][action] = count;

      // Totals
      if (!formatted.totals[resource]) {
        formatted.totals[resource] = {};
      }
      if (!formatted.totals[resource][action]) {
        formatted.totals[resource][action] = 0;
      }
      formatted.totals[resource][action] += count;
    });

    return formatted;
  }
}

// Export singleton instance
export default new AuditService();
