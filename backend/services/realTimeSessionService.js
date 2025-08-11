import { Server } from "socket.io";
import { AuditLog, User, Session } from "../models/index.js";

class RealTimeSessionService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.userSockets = new Map();
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
    this.io.on("connection", socket => {
      console.log(`🔗 New socket connection: ${socket.id}`);
      socket.on("authenticate", async data => {
        try {
          await this.authenticateSocket(socket, data);
        } catch (error) {
          console.error("Socket authentication error:", error);
          socket.emit("auth_error", { message: "Authentication failed" });
          socket.disconnect();
        }
      });
      socket.on("heartbeat", async data => {
        try {
          await this.handleHeartbeat(socket, data);
        } catch (error) {
          console.error("Heartbeat error:", error);
        }
      });
      socket.on("status_update", async data => {
        try {
          await this.handleStatusUpdate(socket, data);
        } catch (error) {
          console.error("Status update error:", error);
        }
      });
      socket.on("device_info", async data => {
        try {
          await this.handleDeviceInfo(socket, data);
        } catch (error) {
          console.error("Device info error:", error);
        }
      });
      socket.on("disconnect", async reason => {
        try {
          await this.handleDisconnect(socket, reason);
        } catch (error) {
          console.error("Disconnect handling error:", error);
        }
      });
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
    const session = await Session.findOne({
      where: { token, isActive: true },
      include: [ { model: User, as: "user", where: { isActive: true } } ]
    });
    if (!session) {
      throw new Error("Invalid token");
    }
    await session.updateSocketId(socket.id);
    if (deviceName) session.deviceName = deviceName;
    if (deviceType) session.deviceType = deviceType;
    await session.save();
    this.connectedUsers.set(socket.id, session);
    if (!this.userSockets.has(session.userId)) {
      this.userSockets.set(session.userId, new Set());
    }
    this.userSockets.get(session.userId).add(socket.id);
    socket.join(`user_${session.userId}`);
    socket.join(`device_${session.deviceId}`);
    socket.emit("authenticated", {
      sessionId: session.sessionId,
      userId: session.userId,
      deviceId: session.deviceId,
      status: session.status
    });
    this.broadcastUserStatusUpdate(session.userId, "online", {
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      loginTime: session.loginTime
    });
    await AuditLog.logUserAction(session.userId, "socket_connected", "session", null, null, {
      socketId: socket.id,
      deviceId: session.deviceId,
      deviceType: session.deviceType
    });
    console.log(`✅ Socket authenticated: User ${session.userId} on device ${session.deviceId}`);
  }

  async handleHeartbeat(socket, data) {
    const session = this.connectedUsers.get(socket.id);
    if (!session) return;
    await session.updateHeartbeat();
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
    this.broadcastUserStatusUpdate(session.userId, status, {
      deviceId: session.deviceId,
      previousStatus: oldStatus
    });
    socket.emit("status_updated", { status, timestamp: new Date() });
  }

  async handleDeviceInfo(socket, data) {
    const session = this.connectedUsers.get(socket.id);
    if (!session) return;
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
    await session.setOffline();
    this.connectedUsers.delete(socket.id);
    if (this.userSockets.has(session.userId)) {
      this.userSockets.get(session.userId).delete(socket.id);
      if (this.userSockets.get(session.userId).size === 0) {
        this.userSockets.delete(session.userId);
      }
    }
    const userStillOnline = await this.isUserOnline(session.userId);
    if (!userStillOnline) {
      this.broadcastUserStatusUpdate(session.userId, "offline", {
        deviceId: session.deviceId,
        logoutTime: session.logoutTime,
        reason
      });
    }
    await AuditLog.logUserAction(session.userId, "socket_disconnected", "session", null, null, {
      socketId: socket.id,
      deviceId: session.deviceId,
      reason,
      sessionDuration: new Date() - new Date(session.loginTime)
    });
  }

  async handleLogout(socket) {
    const session = this.connectedUsers.get(socket.id);
    if (!session) return;
    await session.setOffline();
    socket.emit("logged_out", { timestamp: new Date() });
    socket.disconnect();
  }

  async isUserOnline(userId) {
    const onlineSessions = await Session.getActiveUserSessions(userId);
    return onlineSessions.some(session => session.isOnline());
  }

  broadcastUserStatusUpdate(userId, status, metadata = {}) {
    this.io.to("admin_room").emit("user_status_update", {
      userId,
      status,
      timestamp: new Date(),
      ...metadata
    });
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
      loginTime: session.createdAt,
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
      await session.setOffline();
    }
    if (deviceId) {
      await Session.revokeDeviceSession(userId, deviceId);
    } else {
      await Session.revokeUserSessions(userId);
    }
    return sessions.length;
  }

  startHeartbeatService() {
    console.log("🔄 Heartbeat service disabled - sessions will not timeout automatically");
  }

  startCleanupService() {
    console.log("🔄 Cleanup service disabled - expired sessions will not be automatically removed");
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
    if (this.io) {
      this.io.close();
    }
    console.log("🔌 Real-time session service shut down");
  }
}

export default new RealTimeSessionService();
