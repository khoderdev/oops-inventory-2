import { Server } from "socket.io";
import { AuditLog, User, Session } from "../models/index.js";

class RealTimeSessionService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // socketId -> userSession
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.heartbeatInterval = null;
    this.cleanupInterval = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupSocketHandlers();
    
    // Start services with error handling
    try {
      this.startHeartbeatService();
      this.startCleanupService();
      console.log("🔌 Real-time session service initialized successfully");
    } catch (error) {
      console.error("⚠️ Error starting session services:", error);
      console.log("🔄 Session service will continue without background services");
    }
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`🔗 New socket connection: ${socket.id}`);

      // Handle authentication
      socket.on("authenticate", async (data) => {
        try {
          await this.authenticateSocket(socket, data);
        } catch (error) {
          console.error("Socket authentication error:", error);
          socket.emit("auth_error", { message: "Authentication failed" });
          socket.disconnect();
        }
      });

      // Handle heartbeat
      socket.on("heartbeat", async (data) => {
        try {
          await this.handleHeartbeat(socket, data);
        } catch (error) {
          console.error("Heartbeat error:", error);
        }
      });

      // Handle status updates
      socket.on("status_update", async (data) => {
        try {
          await this.handleStatusUpdate(socket, data);
        } catch (error) {
          console.error("Status update error:", error);
        }
      });

      // Handle device info updates
      socket.on("device_info", async (data) => {
        try {
          await this.handleDeviceInfo(socket, data);
        } catch (error) {
          console.error("Device info error:", error);
        }
      });

      // Handle disconnection
      socket.on("disconnect", async (reason) => {
        try {
          await this.handleDisconnect(socket, reason);
        } catch (error) {
          console.error("Disconnect handling error:", error);
        }
      });

      // Handle manual logout
      socket.on("logout", async () => {
        try {
          await this.handleLogout(socket);
        } catch (error) {
          console.error("Logout handling error:", error);
        }
      });
    });
  }

  async authenticateSocket(socket, data) {
    const { token, deviceId, deviceName, deviceType } = data;

    if (!token || !deviceId) {
      throw new Error("Token and deviceId are required");
    }

    // Find session by token
    const session = await Session.findOne({
      where: {
        token,
        isActive: true
      },
      include: [
        {
          model: User,
          as: "user",
          where: { isActive: true }
        }
      ]
    });

    if (!session || session.isExpired()) {
      throw new Error("Invalid or expired token");
    }

    // Update session with socket info
    await session.updateSocketId(socket.id);
    
    // Update device info if provided
    if (deviceName) session.deviceName = deviceName;
    if (deviceType) session.deviceType = deviceType;
    await session.save();

    // Store connection info
    this.connectedUsers.set(socket.id, session);
    
    if (!this.userSockets.has(session.userId)) {
      this.userSockets.set(session.userId, new Set());
    }
    this.userSockets.get(session.userId).add(socket.id);

    // Join user to their personal room
    socket.join(`user_${session.userId}`);
    socket.join(`device_${session.deviceId}`);

    // Emit successful authentication
    socket.emit("authenticated", {
      sessionId: session.sessionId,
      userId: session.userId,
      deviceId: session.deviceId,
      status: session.status
    });

    // Broadcast user online status to admins
    this.broadcastUserStatusUpdate(session.userId, "online", {
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      loginTime: session.loginTime
    });

    // Log authentication
    await AuditLog.logUserAction(
      session.userId,
      "socket_connected",
      "session",
      null,
      null,
      {
        socketId: socket.id,
        deviceId: session.deviceId,
        deviceType: session.deviceType
      }
    );

    console.log(`✅ Socket authenticated: User ${session.userId} on device ${session.deviceId}`);
  }

  async handleHeartbeat(socket, data) {
    const session = this.connectedUsers.get(socket.id);
    if (!session) return;

    await session.updateHeartbeat();
    
    // Update activity data if provided
    if (data && data.activity) {
      session.metadata = {
        ...session.metadata,
        lastActivity: data.activity,
        timestamp: new Date()
      };
      await session.save();
    }

    socket.emit("heartbeat_ack", { timestamp: new Date() });
  }

  async handleStatusUpdate(socket, data) {
    const session = this.connectedUsers.get(socket.id);
    if (!session) return;

    const { status } = data;
    const validStatuses = ["online", "idle", "away"];
    
    if (!validStatuses.includes(status)) {
      socket.emit("error", { message: "Invalid status" });
      return;
    }

    const oldStatus = session.status;
    session.status = status;
    session.lastActivity = new Date();
    await session.save();

    // Broadcast status change
    this.broadcastUserStatusUpdate(session.userId, status, {
      deviceId: session.deviceId,
      previousStatus: oldStatus
    });

    socket.emit("status_updated", { status, timestamp: new Date() });
  }

  async handleDeviceInfo(socket, data) {
    const session = this.connectedUsers.get(socket.id);
    if (!session) return;

    // Update device metadata
    session.metadata = {
      ...session.metadata,
      ...data,
      updatedAt: new Date()
    };
    
    if (data.deviceName) session.deviceName = data.deviceName;
    await session.save();

    socket.emit("device_info_updated", { timestamp: new Date() });
  }

  async handleDisconnect(socket, reason) {
    const session = this.connectedUsers.get(socket.id);
    if (!session) return;

    console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);

    // Update session status
    await session.setOffline();

    // Remove from tracking
    this.connectedUsers.delete(socket.id);
    
    if (this.userSockets.has(session.userId)) {
      this.userSockets.get(session.userId).delete(socket.id);
      if (this.userSockets.get(session.userId).size === 0) {
        this.userSockets.delete(session.userId);
      }
    }

    // Check if user is still online on other devices
    const userStillOnline = await this.isUserOnline(session.userId);
    
    if (!userStillOnline) {
      this.broadcastUserStatusUpdate(session.userId, "offline", {
        deviceId: session.deviceId,
        logoutTime: session.logoutTime,
        reason
      });
    }

    // Log disconnection
    await AuditLog.logUserAction(
      session.userId,
      "socket_disconnected",
      "session",
      null,
      null,
      {
        socketId: socket.id,
        deviceId: session.deviceId,
        reason,
        sessionDuration: new Date() - new Date(session.loginTime)
      }
    );
  }

  async handleLogout(socket) {
    const session = this.connectedUsers.get(socket.id);
    if (!session) return;

    // Set session offline
    await session.setOffline();

    // Emit logout confirmation
    socket.emit("logged_out", { timestamp: new Date() });

    // Disconnect socket
    socket.disconnect();
  }

  async isUserOnline(userId) {
    const onlineSessions = await Session.getActiveUserSessions(userId);
    return onlineSessions.some(session => session.isOnline());
  }

  broadcastUserStatusUpdate(userId, status, metadata = {}) {
    // Broadcast to admin users
    this.io.to("admin_room").emit("user_status_update", {
      userId,
      status,
      timestamp: new Date(),
      ...metadata
    });

    // Broadcast to the user's other devices
    this.io.to(`user_${userId}`).emit("user_status_change", {
      status,
      timestamp: new Date(),
      ...metadata
    });
  }

  async getOnlineUsersForAdmin() {
    const onlineUsers = await Session.getOnlineUsers();
    return onlineUsers.map(session => ({
      userId: session.userId,
      username: session.user.username,
      fullName: `${session.user.firstName} ${session.user.lastName}`,
      role: session.user.role,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      status: session.status,
      loginTime: session.createdAt, // Using createdAt as loginTime
      lastActivity: session.lastActivity,
      lastHeartbeat: session.lastHeartbeat,
      ipAddress: session.ipAddress,
      socketId: session.socketId
    }));
  }

  async forceLogoutUser(userId, deviceId = null) {
    let sessions;
    
    if (deviceId) {
      sessions = await Session.findAll({
        where: { userId, deviceId, isActive: true }
      });
    } else {
      sessions = await Session.findAll({
        where: { userId, isActive: true }
      });
    }

    for (const session of sessions) {
      // Disconnect socket if connected
      if (session.socketId) {
        const socket = this.io.sockets.sockets.get(session.socketId);
        if (socket) {
          socket.emit("force_logout", { 
            reason: "Logged out by administrator",
            timestamp: new Date()
          });
          socket.disconnect();
        }
      }

      // Update session
      await session.setOffline();
    }

    // Revoke sessions in database
    if (deviceId) {
      await Session.revokeDeviceSession(userId, deviceId);
    } else {
      await Session.revokeUserSessions(userId);
    }

    return sessions.length;
  }

  startHeartbeatService() {
    // Check for inactive sessions every 2 minutes
    this.heartbeatInterval = setInterval(async () => {
      try {
        // Safety check: ensure Session model is available
        if (!Session || typeof Session.findAll !== 'function') {
          console.warn("⚠️ Session model not available, skipping heartbeat check");
          return;
        }
        const inactiveSessions = await Session.findAll({
          where: {
            isActive: true,
            status: "online",
            lastHeartbeat: {
              [Session.sequelize.Sequelize.Op.lt]: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
            }
          }
        });

        for (const session of inactiveSessions) {
          await session.setOffline();
          
          // Disconnect socket if still connected
          if (session.socketId) {
            const socket = this.io.sockets.sockets.get(session.socketId);
            if (socket) {
              socket.emit("session_timeout", { 
                reason: "Heartbeat timeout",
                timestamp: new Date()
              });
              socket.disconnect();
            }
          }

          this.broadcastUserStatusUpdate(session.userId, "offline", {
            deviceId: session.deviceId,
            reason: "heartbeat_timeout"
          });
        }

        if (inactiveSessions.length > 0) {
          console.log(`⏰ Marked ${inactiveSessions.length} sessions as offline due to heartbeat timeout`);
        }
      } catch (error) {
        console.error("Heartbeat service error:", error);
      }
    }, 2 * 60 * 1000); // 2 minutes
  }

  startCleanupService() {
    // Cleanup expired sessions every 30 minutes
    this.cleanupInterval = setInterval(async () => {
      try {
        await Session.cleanupExpired();
      } catch (error) {
        console.error("Cleanup service error:", error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  addAdminToRoom(socketId) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join("admin_room");
    }
  }

  removeAdminFromRoom(socketId) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave("admin_room");
    }
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.io) {
      this.io.close();
    }
    console.log("🔌 Real-time session service shut down");
  }
}

export default new RealTimeSessionService();
