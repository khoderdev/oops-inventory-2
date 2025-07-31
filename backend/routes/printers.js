import express from "express";
import { createPrinter, createPrinterChannel, deletePrinter, deletePrinterChannel, getPrinterChannels, getPrinters, getPrinterStats, testPrinter, updatePrinter, updatePrinterChannel } from "../controllers/printerController.js";
import { bulkCancelJobs, cancelPrintJob, createPrintJob, getPrintJob, getPrintJobs, getPrintJobStats, retryPrintJob } from "../controllers/printJobController.js";
import { auditMiddleware } from "../middleware/auditMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Printer Channels Routes
router.get("/channels", auditMiddleware("get_printer_channels", "printer"), getPrinterChannels);
router.post("/channels", auditMiddleware("create_printer_channel", "printer"), createPrinterChannel);
router.put("/channels/:id", auditMiddleware("update_printer_channel", "printer"), updatePrinterChannel);
router.delete("/channels/:id", auditMiddleware("delete_printer_channel", "printer"), deletePrinterChannel);

// Printers Routes
router.get("/", auditMiddleware("get_printers", "printer"), getPrinters);
router.post("/", auditMiddleware("create_printer", "printer"), createPrinter);
router.put("/:id", auditMiddleware("update_printer", "printer"), updatePrinter);
router.delete("/:id", auditMiddleware("delete_printer", "printer"), deletePrinter);
router.post("/:id/test", auditMiddleware("test_printer", "printer"), testPrinter);
router.get("/:id/stats", auditMiddleware("get_printer_stats", "printer"), getPrinterStats);

// Print Jobs Routes
router.get("/jobs", auditMiddleware("get_print_jobs", "printer"), getPrintJobs);
router.get("/jobs/stats", auditMiddleware("get_print_job_stats", "printer"), getPrintJobStats);
router.post("/jobs", auditMiddleware("create_print_job", "printer"), createPrintJob);
router.get("/jobs/:id", auditMiddleware("get_print_job", "printer"), getPrintJob);
router.post("/jobs/:id/cancel", auditMiddleware("cancel_print_job", "printer"), cancelPrintJob);
router.post("/jobs/:id/retry", auditMiddleware("retry_print_job", "printer"), retryPrintJob);
router.post("/jobs/bulk-cancel", auditMiddleware("bulk_cancel_print_jobs", "printer"), bulkCancelJobs);

// Discovery and utility routes
router.get("/discover/network", auditMiddleware("discover_network_printers", "printer"), async (req, res) => {
  try {
    const { subnet } = req.query;
    const printerService = req.app.get("printerService");

    if (!printerService) {
      return res.status(500).json({
        success: false,
        message: "Printer service not available"
      });
    }

    const discoveries = await printerService.discoverNetworkPrinters(subnet);

    res.json({
      success: true,
      discoveries,
      count: discoveries.length
    });
  } catch (error) {
    console.error("Error discovering network printers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to discover network printers",
      error: error.message
    });
  }
});

router.get("/discover/windows", auditMiddleware("discover_windows_printers", "printer"), async (req, res) => {
  try {
    const printerService = req.app.get("printerService");

    if (!printerService) {
      return res.status(500).json({
        success: false,
        message: "Printer service not available"
      });
    }

    const printers = await printerService.getWindowsPrinters();

    res.json({
      success: true,
      printers,
      count: printers.length
    });
  } catch (error) {
    console.error("Error discovering Windows printers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to discover Windows printers",
      error: error.message
    });
  }
});

// Service status route
router.get("/service/status", auditMiddleware("get_printer_service_status", "printer"), (req, res) => {
  try {
    const printerService = req.app.get("printerService");

    if (!printerService) {
      return res.json({
        success: true,
        status: "unavailable",
        message: "Printer service not initialized"
      });
    }

    res.json({
      success: true,
      status: "running",
      activePrinters: printerService.activePrinters.size,
      queuedJobs: Array.from(printerService.printQueue.values()).reduce((total, queue) => total + queue.length, 0)
    });
  } catch (error) {
    console.error("Error getting service status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get service status",
      error: error.message
    });
  }
});

export default router;
