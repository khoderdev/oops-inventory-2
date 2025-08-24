import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { DayOperation, DayOperationReport, User } from "../models/index.js";

const dayOperationReportsController = {
  getAllReports: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, reportType, startDate, endDate, reportStatus } = req.query;
      const offset = (page - 1) * limit;
      const whereClause = {};
      if (reportType && ["daily", "weekly", "monthly", "custom"].includes(reportType)) {
        whereClause.reportType = reportType;
      }
      if (startDate && endDate) {
        whereClause.reportDate = {
          [Op.between]: [startDate, endDate]
        };
      } else if (startDate) {
        whereClause.reportDate = {
          [Op.gte]: startDate
        };
      } else if (endDate) {
        whereClause.reportDate = {
          [Op.lte]: endDate
        };
      }
      if (reportStatus && ["draft", "final", "amended"].includes(reportStatus)) {
        whereClause.reportStatus = reportStatus;
      }
      const reports = await DayOperationReport.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: DayOperation,
            as: "dayOperation",
            attributes: ["id", "date", "status", "openedAt", "closedAt"]
          }
        ],
        order: [["reportDate", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      res.status(200).json({
        reports: reports.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(reports.count / limit),
          totalItems: reports.count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error("Error fetching day operation reports:", error);
      next(error);
    }
  },

  // Get report by ID
  getReportById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const report = await DayOperationReport.findByPk(id, {
        include: [
          {
            model: DayOperation,
            as: "dayOperation",
            attributes: ["id", "date", "status", "openedAt", "closedAt", "openedBy", "closedBy"]
          }
        ]
      });
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.status(200).json({ report });
    } catch (error) {
      console.error("Error fetching report:", error);
      next(error);
    }
  },

  // Get reports for a specific day operation
  getReportsByDayOperation: async (req, res, next) => {
    try {
      const { dayOperationId } = req.params;
      const reports = await DayOperationReport.findAll({
        where: { dayOperationId },
        order: [["createdAt", "DESC"]]
      });
      res.status(200).json({
        reports,
        dayOperationId
      });
    } catch (error) {
      console.error("Error fetching reports for day operation:", error);
      next(error);
    }
  },

  // Create a new report
  createReport: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { dayOperationId, reportType = "daily", salesSummary, cashSummary, inventorySummary, topSellingItems, salesByCategory, salesBySection, salesByHour, paymentMethodBreakdown, stockMovements, significantVariances, notes, generatedBy = "System", reportStatus = "final" } = req.body;
      const dayOperation = await DayOperation.findByPk(dayOperationId, { transaction });
      if (!dayOperation) {
        await transaction.rollback();
        return res.status(404).json({ error: "Day operation not found" });
      }
      const report = await DayOperationReport.create(
        {
          dayOperationId,
          reportDate: dayOperation.date,
          reportType,
          salesSummary: salesSummary || {},
          cashSummary: cashSummary || {},
          inventorySummary: inventorySummary || {},
          topSellingItems: topSellingItems || [],
          salesByCategory: salesByCategory || {},
          salesBySection: salesBySection || {},
          salesByHour: salesByHour || [],
          paymentMethodBreakdown: paymentMethodBreakdown || {},
          stockMovements: stockMovements || [],
          significantVariances: significantVariances || [],
          notes,
          generatedBy,
          reportStatus,
          generatedAt: new Date()
        },
        { transaction }
      );
      await transaction.commit();
      res.status(201).json({
        message: "Report created successfully",
        report
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating report:", error);
      next(error);
    }
  },

  // Update an existing report
  updateReport: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const updates = req.body;
      const report = await DayOperationReport.findByPk(id, { transaction });
      if (!report) {
        await transaction.rollback();
        return res.status(404).json({ error: "Report not found" });
      }
      if (report.reportStatus === "final" && updates.reportStatus === "amended") {
        updates.reportStatus = "amended";
      }
      await report.update(updates, { transaction });
      await transaction.commit();
      res.status(200).json({
        message: "Report updated successfully",
        report
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating report:", error);
      next(error);
    }
  },

  // Generate a report for a day operation
  generateReport: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { dayOperationId } = req.params;
      const { generatedBy = "System" } = req.body;
      const dayOperation = await DayOperation.findByPk(dayOperationId, {
        transaction
      });
      if (!dayOperation) {
        await transaction.rollback();
        return res.status(404).json({ error: "Day operation not found" });
      }
      if (dayOperation.status !== "closed") {
        await transaction.rollback();
        return res.status(400).json({
          error: "Cannot generate report for an open day operation",
          dayOperationStatus: dayOperation.status
        });
      }
      const existingReport = await DayOperationReport.findOne({
        where: {
          dayOperationId,
          reportType: "daily"
        },
        transaction
      });

      if (existingReport) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Report already exists for this day operation",
          existingReportId: existingReport.id
        });
      }
      const allUserStats = Array.isArray(dayOperation.reportData?.userOrderStats)
        ? dayOperation.reportData.userOrderStats
        : [];

      // Determine staff users based on roles for the user IDs present in stats (robust to missing associations)
      const allUserIds = Array.from(new Set(allUserStats.map(s => s.userId).filter(Boolean)));
      let staffUserIds = new Set();
      if (allUserIds.length > 0) {
        const usersForStats = await User.findAll({
          where: { id: allUserIds },
          attributes: ["id", "role"]
        });
        staffUserIds = new Set(usersForStats.filter(u => u.role === "staff").map(u => u.id));
      }

      // Keep full per-user breakdown for visibility
      const userReports = [];
      for (const userStat of allUserStats) {
        const openingCash = userStat.openingCash || 0;
        const totalCashSales = userStat.cashSales || 0;
        const expectedClosingCash = openingCash + totalCashSales;
        const actualClosingCash = userStat.closingCash || 0;
        const variance = actualClosingCash - expectedClosingCash;
        const variancePercentage = expectedClosingCash > 0 ? (variance / expectedClosingCash) * 100 : 0;
        userReports.push({
          userId: userStat.userId,
          userName: userStat.userName,
          openingTime: userStat.openingTime,
          closingTime: userStat.closingTime,
          openingCash: openingCash,
          closingCash: actualClosingCash,
          expectedClosingCash: expectedClosingCash,
          variance: variance,
          variancePercentage: variancePercentage,
          orderCount: userStat.orderCount || 0,
          totalAmount: userStat.totalAmount || 0,
          notes: userStat.notes
        });
      }

      let adjustedCashSummary = dayOperation.reportData?.cash || {};
      let adjustedSalesSummary = dayOperation.reportData?.sales || {};

      if (allUserStats.length > 0) {
        // Filter out staff users for aggregate calculations
        const nonStaffStats = allUserStats.filter(s => !staffUserIds.has(s.userId));

        const filteredOrderCount = nonStaffStats.reduce((sum, s) => sum + (s.orderCount || 0), 0);
        const filteredTotalAmount = nonStaffStats.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
        const filteredCashSales = nonStaffStats.reduce((sum, s) => sum + parseFloat(s.cashSales || 0), 0);

        // Recompute summaries excluding staff transactions
        const openingCash = parseFloat(dayOperation.openingCash || 0);
        const actualClosingCash = dayOperation.reportData?.cash?.actual != null
          ? parseFloat(dayOperation.reportData.cash.actual)
          : parseFloat(dayOperation.closingCash || 0);
        const expectedClosingCash = openingCash + filteredCashSales;
        const variance = actualClosingCash - expectedClosingCash;
        const variancePercentage = expectedClosingCash > 0 ? (variance / expectedClosingCash) * 100 : 0;

        adjustedCashSummary = {
          opening: openingCash,
          expected: expectedClosingCash,
          actual: actualClosingCash,
          variance,
          variancePercentage
        };

        const existingSalesSummary = dayOperation.reportData?.sales || {};
        adjustedSalesSummary = {
          ...existingSalesSummary,
          totalAmount: filteredTotalAmount,
          totalTransactions: filteredOrderCount,
          averageTicket: filteredOrderCount > 0 ? filteredTotalAmount / filteredOrderCount : 0
        };
      }
      const report = await DayOperationReport.create(
        {
          dayOperationId,
          reportDate: dayOperation.date,
          reportType: "daily",
          userReports: userReports,
          // Use adjusted summaries that exclude staff transactions
          salesSummary: adjustedSalesSummary,
          cashSummary: adjustedCashSummary,
          inventorySummary: dayOperation.reportData?.inventory || {},
          topSellingItems: [],
          salesByCategory: {},
          salesBySection: dayOperation.reportData?.sales?.salesBySection || {},
          salesByHour: [],
          paymentMethodBreakdown: {},
          stockMovements: [],
          significantVariances: dayOperation.stockVariances || [],
          notes: dayOperation.notes,
          generatedBy,
          reportStatus: "final",
          generatedAt: new Date()
        },
        { transaction }
      );
      await transaction.commit();
      res.status(201).json({
        message: "Report generated successfully",
        report
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error generating report:", error);
      next(error);
    }
  },

  // Delete a report
  deleteReport: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const report = await DayOperationReport.findByPk(id, { transaction });
      if (!report) {
        await transaction.rollback();
        return res.status(404).json({ error: "Report not found" });
      }
      if (report.reportStatus !== "draft") {
        await transaction.rollback();
        return res.status(400).json({
          error: "Only draft reports can be deleted",
          reportStatus: report.reportStatus
        });
      }
      await report.destroy({ transaction });
      await transaction.commit();
      res.status(200).json({
        message: "Report deleted successfully",
        reportId: id
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting report:", error);
      next(error);
    }
  }
};

export default dayOperationReportsController;
