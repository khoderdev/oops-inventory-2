import cors from "cors";
import express from "express";
import sequelize from "./config/database.js";
import "./models/index.js";
import assignmentsRoutes from "./routes/assignments.js";
import materialRoutes from "./routes/materials.js";
import menuItemsRoutes from "./routes/menuItems.js";
import salesRoutes from "./routes/sales.js";
import sectionRoutes from "./routes/sections.js";
import stockEntriesRoutes from "./routes/stockEntries.js";
import { errorHandler } from "./utils/logger.js";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/materials", materialRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/stock-entries", stockEntriesRoutes);
app.use("/api/menu-items", menuItemsRoutes);
app.use("/api/sales", salesRoutes);

// Error handling middleware
// IMPORTANT: app.use(errorHandler) should be the *last* middleware
app.use(errorHandler);

// Database sync and server start
sequelize
  .sync({ force: false, alter: true })
  .then(() => {
    console.log("✅ Database connected and synced.");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Unable to connect to the database:", err.message);
    process.exit(1);
  });
