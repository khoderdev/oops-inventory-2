import chalk from "chalk";
import { Material } from "../models/index.js";

// Custom Sequelize query logger
const customLogger = (sql, timing) => {
  const timestamp = new Date().toLocaleTimeString();
  const method = sql.trim().split(" ")[0].toUpperCase();
  console.log(chalk.gray(`[${timestamp}]`), chalk.cyan(`[SQL:${method}]`), chalk.white(sql), timing ? chalk.green(`(${timing} ms)`) : "");
};

// Centralized error logger function
const logError = (error, context = "") => {
  const timestamp = new Date().toLocaleTimeString();
  console.error(chalk.red.bold(`[${timestamp}] [ERROR]`), chalk.yellow(context), "\n", chalk.red(error.message));
  if (error.stack) {
    console.error(chalk.gray(error.stack));
  }
};

// Database sync is handled in index.js after all models are loaded

// Example Express error middleware for catching errors & logging them
// (assuming you use Express)
const errorHandler = (err, req, res, next) => {
  logError(err, `Request failed: ${req.method} ${req.url}`);
  res.status(500).json({ error: "Internal Server Error" });
};

// Usage in your Sequelize calls (in controllers), wrap async calls:
const getAllMaterials = async (req, res, next) => {
  try {
    const materials = await Material.findAll();
    res.json(materials);
  } catch (err) {
    logError(err, "Failed to fetch materials");
    next(err);
  }
};

// Export custom logger to Sequelize config
export { customLogger, errorHandler, getAllMaterials, logError };
