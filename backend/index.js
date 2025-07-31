import cors from "cors";
import express from "express";
import { createServer } from "http";
import sequelize from "./config/database.js";
import "./models/index.js";
import assignmentsRoutes from "./routes/assignments.js";
import authRoutes from "./routes/auth.js";
import backupRoutes from "./routes/backup.js";
import backupSchedulerRoutes from "./routes/backup-scheduler.js";
import dayOperationsRoutes from "./routes/dayOperations.js";
import employeeRoutes from "./routes/employees.js";
import logsRoutes from "./routes/logs.js";
import materialRoutes from "./routes/materials.js";
import menuItemsRoutes from "./routes/menuItems.js";
import ordersRoutes from "./routes/orders.js";
import posRoutes from "./routes/pos.js";
import salesRoutes from "./routes/sales.js";
import sectionRoutes from "./routes/sections.js";
import sessionsRoutes from "./routes/sessions.js";
import stockEntriesRoutes from "./routes/stockEntries.js";
import tablesRoutes from "./routes/tables.js";
import userRoutes from "./routes/users.js";
import realTimeSessionService from "./services/realTimeSessionService.js";
import { errorHandler } from "./utils/logger.js";
import { seedTables } from "./utils/seedTables.js";

// Enhanced error handling and process management
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  // Log the error but don't exit - keep server running
  console.log('🔄 Server continuing to run despite uncaught exception...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the error but don't exit - keep server running
  console.log('🔄 Server continuing to run despite unhandled rejection...');
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  gracefulShutdown();
});

const app = express();
const PORT = process.env.PORT || 3000;
let server = null;
let httpServer = null;

// Enhanced middleware with error handling
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('🚨 Invalid JSON received:', e.message);
      res.status(400).json({ error: 'Invalid JSON format' });
      return;
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy to get real IP addresses
app.set("trust proxy", true);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    
    if (status >= 400) {
      console.error(`🚨 [${timestamp}] ${method} ${url} - ${status} (${duration}ms)`);
    } else {
      console.log(`✅ [${timestamp}] ${method} ${url} - ${status} (${duration}ms)`);
    }
  });
  
  next();
});

// Routes
// Authentication routes (public)
app.use("/api/auth", authRoutes);

// Protected routes (require authentication)
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/stock-entries", stockEntriesRoutes);
app.use("/api/menu-items", menuItemsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/day-operations", dayOperationsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/backup-scheduler", backupSchedulerRoutes);

// Error handling middleware
// IMPORTANT: app.use(errorHandler) should be the *last* middleware
app.use(errorHandler);

// Graceful shutdown function
const gracefulShutdown = async () => {
  console.log('🔄 Starting graceful shutdown...');
  
  try {
    // Shutdown real-time session service
    realTimeSessionService.shutdown();
    
    // Close server
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      });
    }
    
    // Close database connection
    if (sequelize) {
      await sequelize.close();
      console.log('✅ Database connection closed');
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('🚨 Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

// Enhanced database connection with retry mechanism
const connectToDatabase = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${retries}...`);
      
      // Test database connection
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully');
      
      // Sync database with enhanced error handling
      try {
        console.log('🔄 Synchronizing database schema...');
        
        // Use validate instead of alter to avoid USING syntax errors
        await sequelize.sync({ 
          force: false, 
          alter: false,
          logging: (sql) => {
            // Only log non-SELECT queries to reduce noise
            if (!sql.trim().toUpperCase().startsWith('SELECT')) {
              console.log('📊 Database Query:', sql);
            }
          }
        });
        
        console.log('✅ Database schema synchronized successfully');
        
        // Seed initial data with error handling
        try {
          console.log('🌱 Seeding initial data...');
          await seedTables();
          console.log('✅ Initial data seeded successfully');
        } catch (seedError) {
          console.warn('⚠️ Warning: Failed to seed initial data:', seedError.message);
          console.log('🔄 Server will continue without seeding...');
        }
        
        return true; // Success
        
      } catch (syncError) {
        console.error('🚨 Database sync error:', syncError.message);
        
        // If it's a USING syntax error, try without sync
        if (syncError.message.includes('USING') || syncError.message.includes('syntax error')) {
          console.log('🔄 Attempting to continue without schema sync...');
          
          try {
            // Just seed data without sync
            await seedTables();
            console.log('✅ Continuing with existing schema');
            return true;
          } catch (seedError) {
            console.warn('⚠️ Warning: Failed to seed data:', seedError.message);
            console.log('🔄 Server will continue without seeding...');
            return true; // Continue anyway
          }
        }
        
        throw syncError; // Re-throw if not a USING error
      }
      
    } catch (error) {
      console.error(`🚨 Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        console.error('🚨 All database connection attempts failed');
        console.log('🔄 Starting server without database connection...');
        console.log('⚠️ Warning: Some features may not work properly');
        return false; // Failed but continue
      }
      
      console.log(`⏳ Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

// Enhanced server startup
const startServer = async () => {
  try {
    console.log('🚀 Starting Cost Craft Converter Server...');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('💻 Environment:', process.env.NODE_ENV || 'development');
    
    // Connect to database with retries
    const dbConnected = await connectToDatabase();
    
    if (!dbConnected) {
      console.log('⚠️ Server starting in limited mode (no database)');
    }
    
    // Create HTTP server
    httpServer = createServer(app);
    
    // Initialize real-time session service with WebSocket
    realTimeSessionService.initialize(httpServer);
    
    // Start HTTP server
    server = httpServer.listen(PORT, () => {
      console.log('✅ =================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
      console.log(`📊 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`🕰️ Started at: ${new Date().toLocaleString()}`);
      console.log('✅ =================================');
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`🚨 Port ${PORT} is already in use`);
        console.log('🔄 Trying alternative port...');
        
        // Try alternative port
        const altPort = PORT + 1;
        server = httpServer.listen(altPort, () => {
          console.log(`🚀 Server running on alternative port ${altPort}`);
          console.log(`🔌 WebSocket server: ws://localhost:${altPort}`);
        });
      } else {
        console.error('🚨 Server error:', error.message);
      }
    });
    
    // Keep server alive with periodic health checks
    setInterval(async () => {
      try {
        if (dbConnected) {
          await sequelize.authenticate();
        }
      } catch (error) {
        console.warn('⚠️ Database health check failed:', error.message);
      }
    }, 30000); // Check every 30 seconds
    
  } catch (error) {
    console.error('🚨 Failed to start server:', error.message);
    console.error('Stack:', error.stack);
    console.log('🔄 Server will attempt to continue...');
  }
};

// Start the server
startServer().catch((error) => {
  console.error('🚨 Critical startup error:', error.message);
  console.log('🔄 Attempting emergency server start...');
  
  // Emergency fallback - start server without database
  try {
    server = app.listen(PORT, () => {
      console.log(`🆘 Emergency server running on port ${PORT} (limited functionality)`);
    });
  } catch (emergencyError) {
    console.error('🚨 Emergency server start failed:', emergencyError.message);
  }
});
