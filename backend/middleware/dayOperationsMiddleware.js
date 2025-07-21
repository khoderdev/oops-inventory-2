import { DayOperation } from "../models/index.js";

/**
 * DAY OPERATIONS MIDDLEWARE
 *
 * Automatically integrates day operations with sales and other business activities.
 * This middleware ensures that day operations are updated in real-time when:
 * - Sales are created, updated, or deleted
 * - Stock entries are modified
 * - Other business activities occur
 */

// Middleware to check if a day is currently open
export const checkDayOperationStatus = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const currentDay = await DayOperation.findOne({
      where: {
        date: today,
        status: "opened"
      }
    });

    // Add day operation info to request for use in other controllers
    req.currentDayOperation = currentDay;
    req.isDayOpen = !!currentDay;

    next();
  } catch (error) {
    console.error("Error checking day operation status:", error);
    // Don't block the request if day operation check fails
    req.currentDayOperation = null;
    req.isDayOpen = false;
    next();
  }
};

// Middleware to log business activities to day operations
export const logBusinessActivity = activityType => {
  return async (req, res, next) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json;

    res.json = function (data) {
      // Only log if the operation was successful (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log the activity asynchronously (don't block the response)
        logActivityAsync(req, activityType, data).catch(error => {
          console.error(`Error logging ${activityType} activity:`, error);
        });
      }

      // Call original res.json
      return originalJson.call(this, data);
    };

    next();
  };
};

// Async function to log activities
const logActivityAsync = async (req, activityType, responseData) => {
  try {
    if (!req.isDayOpen || !req.currentDayOperation) {
      // Day is not open, no need to log
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const currentTime = new Date();

    // Create activity log entry
    const activityLog = {
      timestamp: currentTime,
      type: activityType,
      userId: req.user?.id || "system", // If you have user authentication
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query
      }
    };

    // Find current day operation
    const dayOperation = await DayOperation.findOne({
      where: {
        date: today,
        status: "opened"
      }
    });

    if (dayOperation) {
      // Get existing activity logs or initialize empty array
      const existingLogs = dayOperation.activityLogs || [];

      // Add new log entry
      existingLogs.push(activityLog);

      // Update day operation with new activity log
      await dayOperation.update({
        activityLogs: existingLogs,
        lastActivity: currentTime
      });

      console.log(`📝 Logged ${activityType} activity for day ${today}`);
    }
  } catch (error) {
    console.error("Error in logActivityAsync:", error);
  }
};

// Middleware specifically for sales activities
export const logSaleActivity = logBusinessActivity("SALE");

// Middleware for stock activities
export const logStockActivity = logBusinessActivity("STOCK");

// Middleware for inventory activities
export const logInventoryActivity = logBusinessActivity("INVENTORY");

// Middleware to ensure day is open before certain operations
export const requireOpenDay = (req, res, next) => {
  if (!req.isDayOpen) {
    return res.status(400).json({
      error: "Day operation required",
      message: "Please open a day operation before performing this action",
      suggestion: "Navigate to Day Operations and open a new day"
    });
  }
  next();
};

// Middleware to warn if day is not open (but don't block)
export const warnIfDayClosed = (req, res, next) => {
  if (!req.isDayOpen) {
    console.warn(`⚠️  Business activity (${req.method} ${req.originalUrl}) performed without open day operation`);
  }
  next();
};
