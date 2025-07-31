import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PrintJob = sequelize.define(
  "PrintJob",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'printer_channels',
        key: 'id'
      }
    },
    printerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'printers',
        key: 'id'
      }
    },
    jobType: {
      type: DataTypes.ENUM('receipt', 'label', 'report', 'invoice', 'ticket', 'barcode'),
      allowNull: false
    },
    
    // Content Configuration
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        template: null,
        data: {},
        rawContent: '',
        format: 'text',
        encoding: 'utf8'
      }
    },
    
    // Print Settings (can override printer defaults)
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        copies: 1,
        priority: 'normal',
        paperSize: null,
        margins: null,
        orientation: null,
        duplex: null,
        colorMode: null
      },
      allowNull: false
    },
    
    // Job Status & Tracking
    status: {
      type: DataTypes.ENUM('pending', 'queued', 'printing', 'completed', 'failed', 'cancelled', 'paused'),
      defaultValue: 'pending',
      allowNull: false
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Attempts cannot be negative"
        }
      }
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "Max attempts must be at least 1"
        },
        max: {
          args: [10],
          msg: "Max attempts cannot exceed 10"
        }
      }
    },
    
    // Timestamps
    timestamps: {
      type: DataTypes.JSONB,
      defaultValue: {
        created: null,
        queued: null,
        started: null,
        completed: null,
        failed: null,
        cancelled: null
      },
      allowNull: false
    },
    
    // Error Handling
    error: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    
    // Metadata & Context
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        userId: null,
        orderId: null,
        sessionId: null,
        clientIP: null,
        userAgent: null,
        source: 'pos'
      },
      allowNull: false
    },
    
    // Performance Metrics
    metrics: {
      type: DataTypes.JSONB,
      defaultValue: {
        queueTime: null,
        printTime: null,
        totalTime: null,
        dataSize: null
      },
      allowNull: false
    }
  },
  {
    tableName: "print_jobs",
    timestamps: true,
    indexes: [
      {
        fields: ['status', 'createdAt']
      },
      {
        fields: ['printerId', 'status']
      },
      {
        fields: ['channelId', 'status']
      },
      {
        fields: ['metadata']
      },
      {
        fields: ['settings']
      }
    ],
    hooks: {
      beforeSave: (job, options) => {
        // Update timestamps based on status changes
        const now = new Date();
        
        if (job.changed('status')) {
          const newTimestamps = { ...job.timestamps };
          
          switch (job.status) {
            case 'pending':
              newTimestamps.created = now;
              break;
            case 'queued':
              newTimestamps.queued = now;
              if (newTimestamps.created) {
                const newMetrics = { ...job.metrics };
                newMetrics.queueTime = now - new Date(newTimestamps.created);
                job.metrics = newMetrics;
              }
              break;
            case 'printing':
              newTimestamps.started = now;
              break;
            case 'completed':
              newTimestamps.completed = now;
              if (newTimestamps.started) {
                const newMetrics = { ...job.metrics };
                newMetrics.printTime = now - new Date(newTimestamps.started);
                if (newTimestamps.created) {
                  newMetrics.totalTime = now - new Date(newTimestamps.created);
                }
                job.metrics = newMetrics;
              }
              break;
            case 'failed':
              newTimestamps.failed = now;
              break;
            case 'cancelled':
              newTimestamps.cancelled = now;
              break;
          }
          
          job.timestamps = newTimestamps;
        }
        
        // Calculate content size
        if (job.changed('content') && job.content.rawContent) {
          const newMetrics = { ...job.metrics };
          newMetrics.dataSize = Buffer.byteLength(job.content.rawContent, job.content.encoding || 'utf8');
          job.metrics = newMetrics;
        }
      }
    }
  }
);

export default PrintJob;
