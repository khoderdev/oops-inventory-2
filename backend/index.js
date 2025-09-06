import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import { createServer } from "http";
import sequelize, { resetAllSequences } from "./config/database.js";
import connectToDatabase from "./config/connectToDatabase.js";
import "./models/index.js";
import router from "./routes/index.js";
import PrinterService from "./services/PrinterService.js";
import realTimeSessionService from "./services/realTimeSessionService.js";
import { errorHandler } from "./utils/logger.js";

process.on("uncaughtException", error => {
  console.error("🚨 Uncaught Exception:", error.message);
  console.log("🔄 Server continuing to run despite uncaught exception...");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
  console.log("🔄 Server continuing to run despite unhandled rejection...");
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  gracefulShutdown();
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  gracefulShutdown();
});

const app = express();
const PORT = process.env.PORT || 3000;
let server = null;
let httpServer = null;

app.use(
  cors({
    origin: ["http://localhost", "http://localhost:5173", "http://192.168.88.86", "http://127.0.0.1", "http://192.168.88.86:5173", "https://oops-pos.vercel.app", "https://oops-pos-git-dev-66-khoderdevs-projects.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        console.error("🚨 Invalid JSON received:", e.message);
        res.status(400).json({ error: "Invalid JSON format" });
        return;
      }
    }
  })
);

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));
app.set("trust proxy", true);

app.get("/", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
      uptime: process.uptime()
    });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  res.on("finish", () => {
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
app.use("/api", router);

app.use(errorHandler);

const gracefulShutdown = async () => {
  console.log("🔄 Starting graceful shutdown...");
  try {
    realTimeSessionService.shutdown();
    const printerService = app.get("printerService");
    if (printerService) {
      await printerService.stopService();
      console.log("✅ Printer service stopped");
    }
    if (server) {
      await new Promise(resolve => {
        server.close(() => {
          console.log("✅ HTTP server closed");
          resolve();
        });
      });
    }
    if (sequelize) {
      await sequelize.close();
      console.log("✅ Database connection closed");
    }
    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("🚨 Error during graceful shutdown:", error.message);
    process.exit(1);
  }
};

connectToDatabase();

const startServer = async () => {
  try {
    console.log("🚀 Starting Cost Craft Converter Server...");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("💻 Environment:", process.env.NODE_ENV || "development");
    const dbResult = await connectToDatabase();
    const dbConnected = dbResult.connected;
    if (!dbConnected) {
      console.log("⚠️ Server starting in limited mode (no database)");
      console.log("❌ Database error details:", dbResult.error);
    }
    httpServer = createServer(app);
    realTimeSessionService.initialize(httpServer);
    if (dbConnected) {
      try {
        const printerService = new PrinterService();
        app.set("printerService", printerService);
        console.log("🖨️  Printer service initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize printer service:", error.message);
      }
    } else {
      console.log("⚠️ Printer service disabled (no database connection)");
    }

    server = httpServer.listen(PORT, () => {
      console.log("✅ =================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
      console.log(`📊 Database: ${dbConnected ? "Connected" : "Disconnected"}`);
      if (!dbConnected) {
        console.log(`🔍 Error type: ${dbResult.error.type}`);
      }
      console.log(`🕰️ Started at: ${new Date().toLocaleString()}`);
      console.log("✅ =================================");
    });

    server.on("error", error => {
      if (error.code === "EADDRINUSE") {
        console.error(`🚨 Port ${PORT} is already in use`);
        console.log("🔄 Trying alternative port...");
        const altPort = PORT + 1;
        server = httpServer.listen(altPort, () => {
          console.log(`🚀 Server running on alternative port ${altPort}`);
          console.log(`🔌 WebSocket server: ws://localhost:${altPort}`);
        });
      } else {
        console.error("🚨 Server error:", error.message);
      }
    });

    // Database health check (only if we initially connected)
    if (dbConnected) {
      setInterval(async () => {
        try {
          await sequelize.authenticate();
        } catch (error) {
          console.warn("⚠️ Database health check failed:", error.message);
          // You could add logic here to try to reconnect
        }
      }, 30000);
    }
  } catch (error) {
    console.error("🚨 Failed to start server:", error.message);
    console.error("Stack:", error.stack);
    console.log("🔄 Server will attempt to continue...");
  }
};

startServer().catch(error => {
  console.error("🚨 Critical startup error:", error.message);
  console.log("🔄 Attempting emergency server start...");
  try {
    server = app.listen(PORT, () => {
      console.log(`🆘 Emergency server running on port ${PORT} (limited functionality)`);
    });
  } catch (emergencyError) {
    console.error("🚨 Emergency server start failed:", emergencyError.message);
    process.exit(1); // Exit if emergency start also fails
  }
});
