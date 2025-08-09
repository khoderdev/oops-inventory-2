import { Op } from "sequelize";
import { AuditLog, User, Session } from "../models/index.js";
import realTimeSessionService from "../services/realTimeSessionService.js";

const sessionController = {
  // Get all active sessions with user details
  getActiveSessions: async (req, res, next) => {
    try {
      const { page = 1, limit = 50, status, deviceType, userId } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = { isActive: true };
      
      if (status) {
        whereClause.status = status;
      }
      
      if (deviceType) {
        whereClause.deviceType = deviceType;
      }
      
      if (userId) {
        whereClause.userId = userId;
      }

      const { count, rows: sessions } = await Session.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "firstName", "lastName", "role"],
            where: { isActive: true }
          }
        ],
        order: [["lastActivity", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate online status for each session
      const sessionsWithStatus = sessions.map(session => {
        const sessionData = session.toJSON();
        sessionData.isOnline = session.isOnline();
        sessionData.user.fullName = `${session.user.firstName} ${session.user.lastName}`;
        return sessionData;
      });

      res.status(200).json({
        success: true,
        data: {
          sessions: sessionsWithStatus,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        },
        message: `Retrieved ${sessions.length} active sessions`
      });

      // Log admin action
      await AuditLog.logUserAction(
        req.user.id,
        "view_sessions",
        "session",
        null,
        null,
        { 
          sessionCount: sessions.length,
          filters: { status, deviceType, userId }
        },
        req
      );
    } catch (error) {
      console.error("Get active sessions error:", error);
      next(error);
    }
  },

  // Get online users in real-time
  getOnlineUsers: async (req, res, next) => {
    try {
      const onlineUsers = await realTimeSessionService.getOnlineUsersForAdmin();

      res.status(200).json({
        success: true,
        data: {
          users: onlineUsers,
          count: onlineUsers.length,
          timestamp: new Date()
        },
        message: `Found ${onlineUsers.length} online users`
      });

      // Log admin action
      await AuditLog.logUserAction(
        req.user.id,
        "view_online_users",
        "session",
        null,
        null,
        { onlineUserCount: onlineUsers.length },
        req
      );
    } catch (error) {
      console.error("Get online users error:", error);
      next(error);
    }
  },

  // Get session statistics
  getSessionStats: async (req, res, next) => {
    try {
      const stats = await Session.getSessionStats();
      
      // Get additional real-time stats
      const onlineUsers = await realTimeSessionService.getOnlineUsersForAdmin();
      const deviceTypeStats = await Session.findAll({
        where: { isActive: true },
        attributes: [
          "deviceType",
          [Session.sequelize.fn("COUNT", Session.sequelize.col("id")), "count"]
        ],
        group: ["deviceType"]
      });

      const statusStats = await Session.findAll({
        where: { isActive: true },
        attributes: [
          "status",
          [Session.sequelize.fn("COUNT", Session.sequelize.col("id")), "count"]
        ],
        group: ["status"]
      });

      res.status(200).json({
        success: true,
        data: {
          ...stats,
          realTimeOnlineUsers: onlineUsers.length,
          deviceTypes: deviceTypeStats.reduce((acc, item) => {
            acc[item.deviceType] = parseInt(item.dataValues.count);
            return acc;
          }, {}),
          statusBreakdown: statusStats.reduce((acc, item) => {
            acc[item.status] = parseInt(item.dataValues.count);
            return acc;
          }, {}),
          timestamp: new Date()
        },
        message: "Session statistics retrieved successfully"
      });

      // Log admin action
      await AuditLog.logUserAction(
        req.user.id,
        "view_session_stats",
        "session",
        null,
        null,
        stats,
        req
      );
    } catch (error) {
      console.error("Get session stats error:", error);
      next(error);
    }
  },

  // Get user's devices/sessions
  getUserSessions: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { includeInactive = false } = req.query;

      // Verify user exists
      const user = await User.findByPk(userId, {
        attributes: ["id", "username", "firstName", "lastName", "role"]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const whereClause = { userId };
      if (!includeInactive) {
        whereClause.isActive = true;
      }

      const sessions = await Session.findAll({
        where: whereClause,
        order: [["lastActivity", "DESC"]]
      });

      const sessionsWithStatus = sessions.map(session => {
        const sessionData = session.toJSON();
        sessionData.isOnline = session.isOnline();
        return sessionData;
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            fullName: `${user.firstName} ${user.lastName}`,
            role: user.role
          },
          sessions: sessionsWithStatus,
          activeSessions: sessionsWithStatus.filter(s => s.isActive).length,
          onlineSessions: sessionsWithStatus.filter(s => s.isOnline).length
        },
        message: `Retrieved ${sessions.length} sessions for user ${user.username}`
      });

      // Log admin action
      await AuditLog.logUserAction(
        req.user.id,
        "view_user_sessions",
        "session",
        userId,
        null,
        { 
          targetUser: user.username,
          sessionCount: sessions.length
        },
        req
      );
    } catch (error) {
      console.error("Get user sessions error:", error);
      next(error);
    }
  },

  // Force logout user from all devices
  forceLogoutUser: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { reason = "Logged out by administrator" } = req.body;

      // Verify user exists
      const user = await User.findByPk(userId, {
        attributes: ["id", "username", "firstName", "lastName"]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Force logout through real-time service
      const revokedSessions = await realTimeSessionService.forceLogoutUser(userId);

      res.status(200).json({
        success: true,
        data: {
          revokedSessions,
          user: {
            id: user.id,
            username: user.username,
            fullName: `${user.firstName} ${user.lastName}`
          }
        },
        message: `Successfully logged out user ${user.username} from ${revokedSessions} device(s)`
      });

      // Log admin action
      await AuditLog.logUserAction(
        req.user.id,
        "force_logout_user",
        "session",
        userId,
        null,
        { 
          targetUser: user.username,
          revokedSessions,
          reason
        },
        req
      );
    } catch (error) {
      console.error("Force logout user error:", error);
      next(error);
    }
  },

  // Force logout user from specific device
  forceLogoutDevice: async (req, res, next) => {
    try {
      const { userId, deviceId } = req.params;
      const { reason = "Device logged out by administrator" } = req.body;

      // Verify user exists
      const user = await User.findByPk(userId, {
        attributes: ["id", "username", "firstName", "lastName"]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Find the specific session
      const session = await Session.findOne({
        where: { userId, deviceId, isActive: true }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Active session not found for this device"
        });
      }

      // Force logout through real-time service
      const revokedSessions = await realTimeSessionService.forceLogoutUser(userId, deviceId);

      res.status(200).json({
        success: true,
        data: {
          revokedSessions,
          user: {
            id: user.id,
            username: user.username,
            fullName: `${user.firstName} ${user.lastName}`
          },
          deviceId,
          deviceName: session.deviceName
        },
        message: `Successfully logged out user ${user.username} from device ${session.deviceName || deviceId}`
      });

      // Log admin action
      await AuditLog.logUserAction(
        req.user.id,
        "force_logout_device",
        "session",
        userId,
        null,
        { 
          targetUser: user.username,
          deviceId,
          deviceName: session.deviceName,
          reason
        },
        req
      );
    } catch (error) {
      console.error("Force logout device error:", error);
      next(error);
    }
  },

  // Cleanup expired sessions manually
  cleanupSessions: async (req, res, next) => {
    try {
      const cleanedCount = await Session.cleanupExpired();

      res.status(200).json({
        success: true,
        data: {
          cleanedSessions: cleanedCount,
          timestamp: new Date()
        },
        message: `Successfully cleaned up ${cleanedCount} expired sessions`
      });

      // Log admin action
      await AuditLog.logUserAction(
        req.user.id,
        "cleanup_sessions",
        "session",
        null,
        null,
        { cleanedSessions: cleanedCount },
        req
      );
    } catch (error) {
      console.error("Cleanup sessions error:", error);
      next(error);
    }
  },

  // Get session activity timeline
  getSessionActivity: async (req, res, next) => {
    try {
      const { hours = 24 } = req.query;
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      // Get sessions created in the time period
      const sessions = await Session.findAll({
        where: {
          createdAt: {
            [Op.gte]: startTime
          }
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "firstName", "lastName", "role"]
          }
        ],
        order: [["createdAt", "DESC"]]
      });

      // Group by hour for timeline
      const timeline = {};
      sessions.forEach(session => {
        const hour = new Date(session.createdAt).toISOString().slice(0, 13) + ":00:00.000Z";
        if (!timeline[hour]) {
          timeline[hour] = {
            logins: 0,
            logouts: 0,
            activeUsers: new Set()
          };
        }
        timeline[hour].logins++;
        timeline[hour].activeUsers.add(session.userId);
        
        if (session.logoutTime && session.logoutTime >= startTime) {
          const logoutHour = new Date(session.logoutTime).toISOString().slice(0, 13) + ":00:00.000Z";
          if (!timeline[logoutHour]) {
            timeline[logoutHour] = {
              logins: 0,
              logouts: 0,
              activeUsers: new Set()
            };
          }
          timeline[logoutHour].logouts++;
        }
      });

      // Convert to array format
      const activityData = Object.entries(timeline).map(([hour, data]) => ({
        hour,
        logins: data.logins,
        logouts: data.logouts,
        uniqueUsers: data.activeUsers.size
      })).sort((a, b) => new Date(a.hour) - new Date(b.hour));

      res.status(200).json({
        success: true,
        data: {
          timeline: activityData,
          totalSessions: sessions.length,
          timeRange: {
            start: startTime,
            end: new Date(),
            hours: parseInt(hours)
          }
        },
        message: `Retrieved session activity for the last ${hours} hours`
      });

      // Log admin action
      await AuditLog.logUserAction(
        req.user.id,
        "view_session_activity",
        "session",
        null,
        null,
        { 
          timeRange: hours,
          sessionCount: sessions.length
        },
        req
      );
    } catch (error) {
      console.error("Get session activity error:", error);
      next(error);
    }
  }
};

export default sessionController;
