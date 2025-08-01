import { exec } from "child_process";
import { EventEmitter } from "events";
import fs from "fs/promises";
import net from "net";
import os from "os";
import path from "path";
import { promisify } from "util";
import { Printer, PrinterChannel, PrintJob } from "../models/index.js";

const execAsync = promisify(exec);

class PrinterService extends EventEmitter {
  constructor() {
    super();
    this.activePrinters = new Map();
    this.printQueue = new Map(); // channelId -> jobs[]
    this.isProcessing = false;
    this.healthCheckInterval = null;

    this.initializeService();
  }

  async initializeService() {
    try {
      console.log("🖨️  Initializing Printer Service...");

      // Load active printers
      await this.loadActivePrinters();

      // Start health monitoring
      this.startHealthMonitoring();

      // Start queue processing
      this.startQueueProcessor();

      console.log("✅ Printer Service initialized successfully");
      this.emit("serviceReady");
    } catch (error) {
      console.error("❌ Failed to initialize Printer Service:", error);
      this.emit("serviceError", error);
    }
  }

  async loadActivePrinters() {
    const printers = await Printer.findAll({
      where: { isActive: true },
      include: [{ model: PrinterChannel, as: "channel" }]
    });

    for (const printer of printers) {
      try {
        await this.setupPrinter(printer);
        console.log(`✅ Printer "${printer.name}" loaded successfully`);
      } catch (error) {
        console.error(`❌ Failed to load printer "${printer.name}":`, error.message);
        await this.updatePrinterStatus(printer.id, "error", error.message);
      }
    }
  }

  async setupPrinter(printerConfig) {
    try {
      let printerInstance;

      switch (printerConfig.connectionType) {
        case "usb":
          printerInstance = await this.setupUSBPrinter(printerConfig);
          break;
        case "network":
          printerInstance = await this.setupNetworkPrinter(printerConfig);
          break;
        case "bluetooth":
          printerInstance = await this.setupBluetoothPrinter(printerConfig);
          break;
        case "serial":
          printerInstance = await this.setupSerialPrinter(printerConfig);
          break;
        default:
          throw new Error(`Unsupported connection type: ${printerConfig.connectionType}`);
      }

      this.activePrinters.set(printerConfig.id.toString(), {
        config: printerConfig,
        instance: printerInstance,
        lastUsed: new Date(),
        status: "online"
      });

      await this.updatePrinterStatus(printerConfig.id, "online");
      this.emit("printerConnected", printerConfig);

      return printerInstance;
    } catch (error) {
      await this.updatePrinterStatus(printerConfig.id, "error", error.message);
      this.emit("printerError", printerConfig, error);
      throw error;
    }
  }

  async setupUSBPrinter(config) {
    // Windows OS printer integration
    try {
      const { stdout } = await execAsync(`wmic printer where "name='${config.osConfig.printerName}'" get name,status`);
      if (!stdout.includes(config.osConfig.printerName)) {
        throw new Error(`Windows printer "${config.osConfig.printerName}" not found`);
      }
    } catch (error) {
      throw new Error(`Failed to verify Windows printer: ${error.message}`);
    }

    return {
      type: "windows",
      name: config.osConfig.printerName,
      print: async (data, options = {}) => {
        // Create temporary file
        const tempFile = path.join(os.tmpdir(), `print_${Date.now()}.txt`);
        await fs.writeFile(tempFile, data, options.encoding || "utf8");

        try {
          // Print using Windows command
          const printCommand = `print /D:"${config.osConfig.printerName}" "${tempFile}"`;
          await execAsync(printCommand);

          // Clean up temp file
          await fs.unlink(tempFile);

          return { success: true };
        } catch (error) {
          // Clean up temp file on error
          try {
            await fs.unlink(tempFile);
          } catch {}
          throw error;
        }
      },
      getStatus: async () => {
        try {
          const { stdout } = await execAsync(`wmic printer where "name='${config.osConfig.printerName}'" get status`);
          return stdout.includes("OK") ? "online" : "error";
        } catch {
          return "offline";
        }
      }
    };
  }

  async setupNetworkPrinter(config) {
    const { ipAddress, port, protocol } = config.networkConfig;

    // Test connectivity
    const isReachable = await this.testNetworkConnection(ipAddress, port);
    if (!isReachable) {
      throw new Error(`Network printer at ${ipAddress}:${port} is not reachable`);
    }

    return {
      type: "network",
      host: ipAddress,
      port: port,
      protocol: protocol,
      print: async (data, options = {}) => {
        return new Promise((resolve, reject) => {
          const client = new net.Socket();
          const timeout = options.timeout || 10000;

          client.setTimeout(timeout);

          client.connect(port, ipAddress, () => {
            client.write(data, options.encoding || "utf8");
            client.end();
          });

          client.on("close", () => {
            resolve({ success: true });
          });

          client.on("error", error => {
            reject(new Error(`Network print error: ${error.message}`));
          });

          client.on("timeout", () => {
            client.destroy();
            reject(new Error("Print timeout"));
          });
        });
      },
      getStatus: async () => {
        const isReachable = await this.testNetworkConnection(ipAddress, port);
        return isReachable ? "online" : "offline";
      }
    };
  }

  async setupBluetoothPrinter(config) {
    throw new Error("Bluetooth printers not yet supported");
  }

  async setupSerialPrinter(config) {
    throw new Error("Serial printers not yet supported");
  }

  async testNetworkConnection(host, port, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!host) {
        return reject(new Error('Host address is required'));
      }
      
      if (!port || isNaN(port) || port < 1 || port > 65535) {
        return reject(new Error('Invalid port number'));
      }

      const socket = new net.Socket();
      let isResolved = false;

      const cleanup = () => {
        if (!isResolved) {
          socket.destroy();
          isResolved = true;
        }
      };

      const onSuccess = () => {
        if (!isResolved) {
          cleanup();
          resolve(true);
        }
      };

      const onError = (error) => {
        if (!isResolved) {
          cleanup();
          resolve(false);
        }
      };

      socket.setTimeout(timeout);
      
      socket.once('connect', onSuccess);
      socket.once('timeout', () => onError(new Error('Connection timeout')));
      socket.once('error', onError);

      try {
        socket.connect(port, host);
      } catch (error) {
        cleanup();
        resolve(false);
      }
    });
  }

  async addPrintJob(jobData) {
    try {
      // Validate printer exists and is active
      const printer = await Printer.findByPk(jobData.printerId, {
        include: [{ model: PrinterChannel, as: "channel" }]
      });

      if (!printer || !printer.isActive) {
        throw new Error("Printer not found or inactive");
      }

      // Create print job
      const printJob = await PrintJob.create({
        ...jobData,
        channelId: printer.channelId,
        status: "pending",
        timestamps: { created: new Date() }
      });

      // Add to queue
      const channelId = printer.channelId.toString();
      if (!this.printQueue.has(channelId)) {
        this.printQueue.set(channelId, []);
      }

      this.printQueue.get(channelId).push(printJob);

      // Sort queue by priority
      this.sortQueueByPriority(channelId);

      this.emit("jobQueued", printJob);
      console.log(`📄 Print job ${printJob.id} queued for printer ${printer.name}`);

      return printJob;
    } catch (error) {
      console.error("Failed to add print job:", error);
      throw error;
    }
  }

  sortQueueByPriority(channelId) {
    const queue = this.printQueue.get(channelId);
    if (!queue) return;

    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };

    queue.sort((a, b) => {
      const aPriority = priorityOrder[a.settings.priority] || 2;
      const bPriority = priorityOrder[b.settings.priority] || 2;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      return new Date(a.timestamps.created) - new Date(b.timestamps.created); // FIFO for same priority
    });
  }

  async startQueueProcessor() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log("🔄 Starting print queue processor...");

    const processQueue = async () => {
      try {
        for (const [channelId, jobs] of this.printQueue.entries()) {
          if (jobs.length === 0) continue;

          const job = jobs[0]; // Get first job

          // Check if printer is available
          const printerInstance = this.activePrinters.get(job.printerId.toString());
          if (!printerInstance || printerInstance.status !== "online") {
            continue; // Skip this channel for now
          }

          // Process the job
          jobs.shift(); // Remove from queue
          await this.processJob(job, printerInstance);
        }
      } catch (error) {
        console.error("Queue processor error:", error);
      }

      // Continue processing
      if (this.isProcessing) {
        setTimeout(processQueue, 1000); // Check every second
      }
    };

    processQueue();
  }

  async processJob(job, printerInstance) {
    try {
      console.log(`🖨️  Processing job ${job.id} on printer ${printerInstance.config.name}`);

      // Update job status
      await job.update({
        status: "printing",
        timestamps: { ...job.timestamps, started: new Date() }
      });

      // Prepare print data
      const printData = await this.preparePrintData(job, printerInstance.config);

      // Execute print
      await printerInstance.instance.print(printData, {
        copies: job.settings.copies || 1,
        encoding: job.content.encoding || "utf8"
      });

      // Update printer stats
      await Printer.update(
        {
          totalJobs: printerInstance.config.totalJobs + 1,
          lastPrintJob: new Date()
        },
        { where: { id: job.printerId } }
      );

      // Mark job as completed
      await job.update({
        status: "completed",
        timestamps: { ...job.timestamps, completed: new Date() }
      });

      this.emit("jobCompleted", job);
      console.log(`✅ Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);

      // Handle retry logic
      const newAttempts = job.attempts + 1;

      if (newAttempts < job.maxAttempts) {
        await job.update({
          status: "pending",
          attempts: newAttempts,
          error: {
            code: "PRINT_ERROR",
            message: error.message,
            timestamp: new Date()
          }
        });

        // Re-queue job
        const channelId = job.channelId.toString();
        if (!this.printQueue.has(channelId)) {
          this.printQueue.set(channelId, []);
        }
        this.printQueue.get(channelId).push(job);

        console.log(`🔄 Job ${job.id} re-queued (attempt ${newAttempts}/${job.maxAttempts})`);
      } else {
        await job.update({
          status: "failed",
          attempts: newAttempts,
          error: {
            code: "MAX_RETRIES_EXCEEDED",
            message: `Failed after ${job.maxAttempts} attempts: ${error.message}`,
            timestamp: new Date()
          },
          timestamps: { ...job.timestamps, failed: new Date() }
        });

        this.emit("jobFailed", job);
      }
    }
  }

  async preparePrintData(job, printerConfig) {
    switch (job.content.format) {
      case "text":
        return job.content.rawContent;

      case "escpos":
        return job.content.rawContent;

      case "html":
        return await this.convertHTMLToPrintFormat(job.content.rawContent, printerConfig);

      default:
        return job.content.rawContent;
    }
  }

  async convertHTMLToPrintFormat(htmlContent, printerConfig) {
    // Simple HTML to text conversion
    return htmlContent
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  }

  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Check every 30 seconds

    console.log("💓 Printer health monitoring started");
  }

  async performHealthCheck() {
    for (const [printerId, printerInstance] of this.activePrinters.entries()) {
      try {
        if (printerInstance.instance.getStatus) {
          const status = await printerInstance.instance.getStatus();

          if (status !== printerInstance.status) {
            printerInstance.status = status;
            await this.updatePrinterStatus(printerId, status);
            this.emit("printerStatusChanged", printerId, status);
          }
        }
      } catch (error) {
        console.error(`Health check failed for printer ${printerId}:`, error);
        await this.updatePrinterStatus(printerId, "error", error.message);
      }
    }
  }

  async updatePrinterStatus(printerId, status, errorMessage = null) {
    try {
      const updateData = {
        status,
        lastPing: new Date()
      };

      if (status === "error") {
        updateData.errorCount = Printer.literal("error_count + 1");
      }

      await Printer.update(updateData, { where: { id: printerId } });

      this.emit("printerStatusUpdated", printerId, status, errorMessage);
    } catch (error) {
      console.error(`Failed to update printer status:`, error);
    }
  }

  async discoverNetworkPrinters(subnet = "192.168.1") {
    const discoveries = [];
    const promises = [];

    for (let i = 1; i <= 254; i++) {
      const ip = `${subnet}.${i}`;
      promises.push(
        this.testNetworkConnection(ip, 9100, 2000).then(isReachable => {
          if (isReachable) {
            discoveries.push({
              ipAddress: ip,
              port: 9100,
              type: "network",
              status: "discovered"
            });
          }
        })
      );
    }

    await Promise.all(promises);
    return discoveries;
  }

  async getWindowsPrinters() {
    try {
      const { stdout } = await execAsync("wmic printer get name,status,drivername");
      const lines = stdout.split("\n").filter(line => line.trim());
      const printers = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(/\s{2,}/);
          if (parts.length >= 2) {
            printers.push({
              name: parts[1],
              driverName: parts[0],
              status: parts[2] || "Unknown",
              type: "usb",
              connectionType: "usb"
            });
          }
        }
      }

      return printers;
    } catch (error) {
      console.error("Failed to get Windows printers:", error);
      return [];
    }
  }

  async stopService() {
    this.isProcessing = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all printer connections
    for (const [printerId, printerInstance] of this.activePrinters.entries()) {
      try {
        if (printerInstance.instance.close) {
          await printerInstance.instance.close();
        }
      } catch (error) {
        console.error(`Failed to close printer ${printerId}:`, error);
      }
    }

    this.activePrinters.clear();
    this.printQueue.clear();

    console.log("🛑 Printer Service stopped");
    this.emit("serviceStopped");
  }
}

export default PrinterService;
