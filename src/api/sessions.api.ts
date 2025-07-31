import api from "../lib/http";

// Types for session management
export interface SessionDevice {
  id: number;
  token: string;
  userId: number;
  deviceId: string;
  deviceName: string;
  deviceType: "web" | "pos" | "mobile" | "tablet" | "desktop";
  status: "online" | "offline" | "idle" | "away";
  socketId?: string;
  ipAddress: string;
  userAgent?: string;
  lastActivity: string;
  lastHeartbeat: string;
  loginTime: string;
  logoutTime?: string;
  isOnline: boolean;
  metadata?: Record<string, unknown>;
  user?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  };
}

export interface OnlineUser {
  userId: number;
  username: string;
  fullName: string;
  role: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  status: string;
  loginTime: string;
  lastActivity: string;
  lastHeartbeat: string;
  ipAddress: string;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  onlineUsers: number;
  offlineUsers: number;
  realTimeOnlineUsers: number;
  deviceTypes: Record<string, number>;
  statusBreakdown: Record<string, number>;
  timestamp: string;
}

export interface SessionActivity {
  hour: string;
  logins: number;
  logouts: number;
  uniqueUsers: number;
}

export interface SessionActivityResponse {
  timeline: SessionActivity[];
  totalSessions: number;
  timeRange: {
    start: string;
    end: string;
    hours: number;
  };
}

export interface UserSessionsResponse {
  user: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  };
  sessions: SessionDevice[];
  activeSessions: number;
  onlineSessions: number;
}

export interface SessionsListResponse {
  sessions: SessionDevice[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface OnlineUsersResponse {
  users: OnlineUser[];
  count: number;
  timestamp: string;
}

// Session API functions
export const sessionAPI = {
  // Get all sessions with pagination and filtering
  getSessions: async (params?: { page?: number; limit?: number; status?: string; deviceType?: string; userId?: number }): Promise<SessionsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status) searchParams.append("status", params.status);
    if (params?.deviceType) searchParams.append("deviceType", params.deviceType);
    if (params?.userId) searchParams.append("userId", params.userId.toString());

    const response = await api.get<SessionsListResponse>(`/sessions?${searchParams.toString()}`);
    return response.data;
  },

  // Get currently online users
  getOnlineUsers: async (): Promise<OnlineUsersResponse> => {
    const response = await api.get<OnlineUsersResponse>("/sessions/online");
    return response.data;
  },

  // Get session statistics
  getSessionStats: async (): Promise<SessionStats> => {
    const response = await api.get<SessionStats>("/sessions/stats");
    return response.data;
  },

  // Get session activity timeline
  getSessionActivity: async (hours: number = 24): Promise<SessionActivityResponse> => {
    const response = await api.get<SessionActivityResponse>(`/sessions/activity?hours=${hours}`);
    return response.data;
  },

  // Get all sessions for a specific user
  getUserSessions: async (userId: number): Promise<UserSessionsResponse> => {
    const response = await api.get<UserSessionsResponse>(`/sessions/user/${userId}`);
    return response.data;
  },

  // Force logout user from all devices
  logoutUser: async (
    userId: number,
    reason?: string
  ): Promise<{
    revokedSessions: number;
    user: {
      id: number;
      username: string;
      fullName: string;
    };
  }> => {
    const response = await api.post<
      {
        revokedSessions: number;
        user: {
          id: number;
          username: string;
          fullName: string;
        };
      },
      { reason: string }
    >(`/sessions/user/${userId}/logout`, {
      reason: reason || "Logged out by administrator"
    });
    return response.data;
  },

  // Force logout user from specific device
  logoutUserDevice: async (
    userId: number,
    deviceId: string,
    reason?: string
  ): Promise<{
    revokedSessions: number;
    user: {
      id: number;
      username: string;
      fullName: string;
    };
    deviceId: string;
    deviceName: string;
  }> => {
    const response = await api.post<
      {
        revokedSessions: number;
        user: {
          id: number;
          username: string;
          fullName: string;
        };
        deviceId: string;
        deviceName: string;
      },
      { reason: string }
    >(`/sessions/user/${userId}/device/${deviceId}/logout`, {
      reason: reason || "Logged out by administrator"
    });
    return response.data;
  },

  // Manually cleanup expired sessions
  cleanupSessions: async (): Promise<{
    cleanedSessions: number;
    timestamp: string;
  }> => {
    const response = await api.post<
      {
        cleanedSessions: number;
        timestamp: string;
      },
      Record<string, never>
    >("/sessions/cleanup", {});
    return response.data;
  }
};

// Real-time session client for WebSocket integration
export class RealTimeSessionClient {
  private socket: {
    on: (event: string, handler: (data?: unknown) => void) => void;
    emit: (event: string, data?: unknown) => void;
    connected: boolean;
    disconnect: () => void;
  } | null = null;
  private token: string;
  private deviceId: string;
  private deviceName: string;
  private deviceType: string;
  private serverUrl: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Record<string, ((data?: unknown) => void)[]> = {};

  constructor(config: { serverUrl: string; token: string; deviceId: string; deviceName: string; deviceType: string }) {
    this.serverUrl = config.serverUrl;
    this.token = config.token;
    this.deviceId = config.deviceId;
    this.deviceName = config.deviceName;
    this.deviceType = config.deviceType;
  }

  // Event handler management
  on(event: string, handler: (data?: unknown) => void) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  off(event: string, handler?: (data?: unknown) => void) {
    if (!this.eventHandlers[event]) return;
    if (handler) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    } else {
      this.eventHandlers[event] = [];
    }
  }

  private emit(event: string, data?: unknown) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  // Connect to WebSocket server
  async connect(): Promise<void> {
    try {
      // Dynamically import socket.io-client (optional dependency)
      let io: ((url: string, options?: unknown) => unknown) | undefined;
      try {
        const socketModule = await import("socket.io-client");
        io = (socketModule as { io: (url: string, options?: unknown) => unknown }).io;
      } catch (error) {
        console.warn("socket.io-client not available. Real-time features disabled.");
        this.emit("connectionError", new Error("socket.io-client not installed"));
        return;
      }

      if (!io) {
        this.emit("connectionError", new Error("socket.io not available"));
        return;
      }

      this.socket = io(this.serverUrl, {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true
      }) as {
        on: (event: string, handler: (data?: unknown) => void) => void;
        emit: (event: string, data?: unknown) => void;
        connected: boolean;
        disconnect: () => void;
      };

      this.socket.on("connect", () => {
        console.log("🔌 Connected to session service");
        this.reconnectAttempts = 0;
        this.emit("connected");
        this.authenticate();
      });

      this.socket.on("authenticated", (data: unknown) => {
        console.log("✅ Session authenticated:", data);
        this.emit("authenticated", data);
        this.startHeartbeat();
      });

      this.socket.on("auth_error", (data: unknown) => {
        console.error("🚨 Authentication failed:", data);
        this.emit("authError", data);
      });

      this.socket.on("heartbeat_ack", (data: unknown) => {
        this.emit("heartbeatAck", data);
      });

      this.socket.on("status_updated", (data: unknown) => {
        this.emit("statusUpdated", data);
      });

      this.socket.on("user_status_update", (data: unknown) => {
        this.emit("userStatusUpdate", data);
      });

      this.socket.on("force_logout", (data: unknown) => {
        console.warn("🚪 Force logout received:", data);
        this.emit("forceLogout", data);
        this.disconnect();
      });

      this.socket.on("session_timeout", (data: unknown) => {
        console.warn("⏰ Session timeout:", data);
        this.emit("sessionTimeout", data);
        this.disconnect();
      });

      this.socket.on("disconnect", (reason: string) => {
        console.log("🔌 Disconnected from session service:", reason);
        this.emit("disconnected", reason);
        this.stopHeartbeat();

        if (reason === "io server disconnect") {
          // Server disconnected, don't reconnect
          return;
        }

        // Attempt to reconnect
        this.attemptReconnect();
      });

      this.socket.on("connect_error", (error: unknown) => {
        console.error("🚨 Connection error:", error);
        this.emit("connectionError", error);
        this.attemptReconnect();
      });
    } catch (error) {
      console.error("🚨 Failed to connect to session service:", error);
      this.emit("connectionError", error);
    }
  }

  // Authenticate with the server
  private authenticate() {
    if (this.socket) {
      this.socket.emit("authenticate", {
        token: this.token,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        deviceType: this.deviceType
      });
    }
  }

  // Start heartbeat
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 30 seconds
  }

  // Stop heartbeat
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Send heartbeat
  sendHeartbeat() {
    if (this.socket && this.socket.connected) {
      this.socket.emit("heartbeat", {
        timestamp: new Date().toISOString(),
        activity: {
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          windowSize: `${window.innerWidth}x${window.innerHeight}`
        }
      });
    }
  }

  // Update status
  updateStatus(status: "online" | "idle" | "away") {
    if (this.socket && this.socket.connected) {
      this.socket.emit("status_update", { status });
    }
  }

  // Update device info
  updateDeviceInfo(info: Record<string, unknown>) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("device_info", info);
    }
  }

  // Logout
  logout() {
    if (this.socket && this.socket.connected) {
      this.socket.emit("logout");
    }
    this.disconnect();
  }

  // Disconnect
  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Attempt to reconnect
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("🚨 Max reconnection attempts reached");
      this.emit("maxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Setup automatic status detection
  setupAutomaticStatusDetection() {
    let idleTimer: NodeJS.Timeout;
    let awayTimer: NodeJS.Timeout;
    let isIdle = false;
    let isAway = false;

    const resetTimers = () => {
      clearTimeout(idleTimer);
      clearTimeout(awayTimer);

      if (isIdle || isAway) {
        this.updateStatus("online");
        isIdle = false;
        isAway = false;
      }

      // Set idle after 5 minutes of inactivity
      idleTimer = setTimeout(
        () => {
          this.updateStatus("idle");
          isIdle = true;

          // Set away after 15 minutes of inactivity
          awayTimer = setTimeout(
            () => {
              this.updateStatus("away");
              isAway = true;
            },
            10 * 60 * 1000
          ); // 10 more minutes
        },
        5 * 60 * 1000
      ); // 5 minutes
    };

    // Listen for user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    events.forEach(event => {
      document.addEventListener(event, resetTimers, { passive: true });
    });

    // Listen for visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.updateStatus("away");
      } else {
        this.updateStatus("online");
        resetTimers();
      }
    });

    // Initial timer setup
    resetTimers();
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }
}
