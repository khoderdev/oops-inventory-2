import cors from "cors";
import express from "express";
import sequelize from "./config/database.js";
import "./models/index.js";
import assignmentsRoutes from "./routes/assignments.js";
import authRoutes from "./routes/auth.js";
import dayOperationsRoutes from "./routes/dayOperations.js";
import materialRoutes from "./routes/materials.js";
import menuItemsRoutes from "./routes/menuItems.js";
import ordersRoutes from "./routes/orders.js";
import salesRoutes from "./routes/sales.js";
import sectionRoutes from "./routes/sections.js";
import stockEntriesRoutes from "./routes/stockEntries.js";
import tablesRoutes from "./routes/tables.js";
import userRoutes from "./routes/users.js";
import { errorHandler } from "./utils/logger.js";
import { seedTables } from "./utils/seedTables.js";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Trust proxy to get real IP addresses
app.set("trust proxy", true);

// Routes
// Authentication routes (public)
app.use("/api/auth", authRoutes);

// Protected routes (require authentication)
app.use("/api/users", userRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/stock-entries", stockEntriesRoutes);
app.use("/api/menu-items", menuItemsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/day-operations", dayOperationsRoutes);

// Error handling middleware
// IMPORTANT: app.use(errorHandler) should be the *last* middleware
app.use(errorHandler);

// Database sync and server start
sequelize
  .sync({ force: false, alter: false })
  .then(async () => {
    console.log("✅ Database connected successfully");
    
    // Seed initial data
    await seedTables();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Unable to connect to the database:", err.message);
    process.exit(1);
  });
