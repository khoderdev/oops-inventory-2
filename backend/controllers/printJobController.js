import { Op } from "sequelize";
import { PrintJob, Printer, PrinterChannel } from "../models/index.js";

// Get all print jobs
export const getPrintJobs = async (req, res) => {
  try {
    const { status, printerId, channelId, page = 1, limit = 50, startDate, endDate } = req.query;

    const where = {};

    if (status) where.status = status;
    if (printerId) where.printerId = printerId;
    if (channelId) where.channelId = channelId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: jobs } = await PrintJob.findAndCountAll({
      where,
      include: [
        {
          model: Printer,
          as: "printer",
          attributes: ["id", "name", "type", "status"],
          include: [
            {
              model: PrinterChannel,
              as: "channel",
              attributes: ["id", "name"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      jobs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching print jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch print jobs",
      error: error.message
    });
  }
};

// Get single print job
export const getPrintJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await PrintJob.findByPk(id, {
      include: [
        {
          model: Printer,
          as: "printer",
          attributes: ["id", "name", "type", "status", "settings"],
          include: [
            {
              model: PrinterChannel,
              as: "channel",
              attributes: ["id", "name", "priority"]
            }
          ]
        }
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Print job not found"
      });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error("Error fetching print job:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch print job",
      error: error.message
    });
  }
};

// Create print job
export const createPrintJob = async (req, res) => {
  try {
    const { printerId, jobType, content, settings, metadata } = req.body;

    // Validate printer exists and is active
    const printer = await Printer.findByPk(printerId, {
      include: [{ model: PrinterChannel, as: "channel" }]
    });

    if (!printer || !printer.isActive) {
      return res.status(404).json({
        success: false,
        message: "Printer not found or inactive"
      });
    }

    if (!printer.channel || !printer.channel.isActive) {
      return res.status(400).json({
        success: false,
        message: "Printer channel is inactive"
      });
    }

    // Create the print job
    const jobData = {
      printerId,
      channelId: printer.channelId,
      jobType,
      content: {
        template: content.template || null,
        data: content.data || {},
        rawContent: content.rawContent || "",
        format: content.format || "text",
        encoding: content.encoding || "utf8"
      },
      settings: {
        copies: settings?.copies || 1,
        priority: settings?.priority || "normal",
        paperSize: settings?.paperSize || printer.settings.paperSize,
        margins: settings?.margins || printer.settings.margins,
        orientation: settings?.orientation || printer.settings.orientation,
        duplex: settings?.duplex !== undefined ? settings.duplex : printer.settings.duplex,
        colorMode: settings?.colorMode || printer.settings.colorMode
      },
      metadata: {
        userId: req.user?.id || null,
        orderId: metadata?.orderId || null,
        sessionId: req.sessionID || null,
        clientIP: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        source: metadata?.source || "api"
      }
    };

    const job = await PrintJob.create(jobData);

    // Add to printer service queue
    const printerService = req.app.get("printerService");
    if (printerService) {
      try {
        await printerService.addPrintJob(job);
      } catch (serviceError) {
        console.error("Failed to add job to printer service:", serviceError);
        // Update job status to failed
        await job.update({
          status: "failed",
          error: {
            code: "SERVICE_ERROR",
            message: serviceError.message,
            timestamp: new Date()
          }
        });
      }
    }

    // Return job with relations
    const jobWithRelations = await PrintJob.findByPk(job.id, {
      include: [
        {
          model: Printer,
          as: "printer",
          attributes: ["id", "name", "type"],
          include: [
            {
              model: PrinterChannel,
              as: "channel",
              attributes: ["id", "name"]
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Print job created successfully",
      job: jobWithRelations
    });
  } catch (error) {
    console.error("Error creating print job:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create print job",
      error: error.message
    });
  }
};

// Cancel print job
export const cancelPrintJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const job = await PrintJob.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Print job not found"
      });
    }

    if (!["pending", "queued"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel job with status: ${job.status}`
      });
    }

    await job.update({
      status: "cancelled",
      error: {
        code: "USER_CANCELLED",
        message: reason || "Job cancelled by user",
        timestamp: new Date()
      },
      timestamps: {
        ...job.timestamps,
        cancelled: new Date()
      }
    });

    res.json({
      success: true,
      message: "Print job cancelled successfully",
      job
    });
  } catch (error) {
    console.error("Error cancelling print job:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel print job",
      error: error.message
    });
  }
};

// Retry print job
export const retryPrintJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await PrintJob.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Print job not found"
      });
    }

    if (job.status !== "failed") {
      return res.status(400).json({
        success: false,
        message: `Cannot retry job with status: ${job.status}`
      });
    }

    // Reset job for retry
    await job.update({
      status: "pending",
      attempts: 0,
      error: null,
      timestamps: {
        ...job.timestamps,
        failed: null
      }
    });

    // Add back to printer service queue
    const printerService = req.app.get("printerService");
    if (printerService) {
      try {
        await printerService.addPrintJob(job);
      } catch (serviceError) {
        console.error("Failed to add retry job to printer service:", serviceError);
        await job.update({
          status: "failed",
          error: {
            code: "SERVICE_ERROR",
            message: serviceError.message,
            timestamp: new Date()
          }
        });
      }
    }

    res.json({
      success: true,
      message: "Print job queued for retry",
      job
    });
  } catch (error) {
    console.error("Error retrying print job:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retry print job",
      error: error.message
    });
  }
};

// Get print job statistics
export const getPrintJobStats = async (req, res) => {
  try {
    const { days = 7, channelId, printerId } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = {
      createdAt: {
        [Op.gte]: startDate
      }
    };

    if (channelId) where.channelId = channelId;
    if (printerId) where.printerId = printerId;

    // Total jobs by status
    const statusStats = await PrintJob.findAll({
      where,
      attributes: ["status", [PrintJob.sequelize.fn("COUNT", "*"), "count"]],
      group: ["status"]
    });

    // Jobs by day
    const dailyStats = await PrintJob.findAll({
      where,
      attributes: [[PrintJob.sequelize.fn("DATE", PrintJob.sequelize.col("createdAt")), "date"], "status", [PrintJob.sequelize.fn("COUNT", "*"), "count"]],
      group: [PrintJob.sequelize.fn("DATE", PrintJob.sequelize.col("createdAt")), "status"],
      order: [[PrintJob.sequelize.fn("DATE", PrintJob.sequelize.col("createdAt")), "ASC"]]
    });

    // Jobs by printer
    const printerStats = await PrintJob.findAll({
      where,
      attributes: ["printerId", "status", [PrintJob.sequelize.fn("COUNT", "*"), "count"]],
      include: [
        {
          model: Printer,
          as: "printer",
          attributes: ["name", "type"]
        }
      ],
      group: ["printerId", "status", "printer.id", "printer.name", "printer.type"]
    });

    // Average processing times
    const avgTimes = await PrintJob.findAll({
      where: {
        ...where,
        status: "completed"
      },
      attributes: [
        [PrintJob.sequelize.fn("AVG", PrintJob.sequelize.literal("(metrics->>'printTime')::integer")), "avgPrintTime"],
        [PrintJob.sequelize.fn("AVG", PrintJob.sequelize.literal("(metrics->>'totalTime')::integer")), "avgTotalTime"],
        [PrintJob.sequelize.fn("AVG", PrintJob.sequelize.literal("(metrics->>'queueTime')::integer")), "avgQueueTime"]
      ]
    });

    const totalJobs = statusStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0);
    const completedJobs = statusStats.find(s => s.status === "completed")?.dataValues.count || 0;
    const failedJobs = statusStats.find(s => s.status === "failed")?.dataValues.count || 0;

    res.json({
      success: true,
      stats: {
        totalJobs,
        completedJobs: parseInt(completedJobs),
        failedJobs: parseInt(failedJobs),
        successRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) : 0,
        statusBreakdown: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        dailyStats,
        printerStats,
        averageTimes: avgTimes[0]?.dataValues || {},
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error("Error fetching print job stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch print job statistics",
      error: error.message
    });
  }
};

// Bulk operations
export const bulkCancelJobs = async (req, res) => {
  try {
    const { jobIds, reason } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Job IDs array is required"
      });
    }

    const result = await PrintJob.update(
      {
        status: "cancelled",
        error: {
          code: "BULK_CANCELLED",
          message: reason || "Jobs cancelled in bulk operation",
          timestamp: new Date()
        },
        timestamps: PrintJob.sequelize.literal(`
          jsonb_set(
            timestamps, 
            '{cancelled}', 
            to_jsonb(NOW())
          )
        `)
      },
      {
        where: {
          id: {
            [Op.in]: jobIds
          },
          status: {
            [Op.in]: ["pending", "queued"]
          }
        }
      }
    );

    res.json({
      success: true,
      message: `${result[0]} jobs cancelled successfully`,
      cancelledCount: result[0]
    });
  } catch (error) {
    console.error("Error bulk cancelling jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel jobs",
      error: error.message
    });
  }
};
