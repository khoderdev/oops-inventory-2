/**
 * Real-Time Session Client Utility
 * 
 * This utility provides a JavaScript client for integrating with the real-time session tracking system.
 * It can be used in frontend applications to establish WebSocket connections and manage session state.
 * 
 * Usage Example:
 * 
 * import { RealTimeSessionClient } from './utils/realTimeSessionClient.js';
 * 
 * const sessionClient = new RealTimeSessionClient({
 *   serverUrl: 'ws://localhost:3000',
 *   token: 'your-auth-token',
 *   deviceId: 'unique-device-id',
 *   deviceName: 'POS Terminal 1',
 *   deviceType: 'pos'
 * });
 * 
 * sessionClient.connect();
 */

export class RealTimeSessionClient {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || 'ws://localhost:3000';
    this.token = options.token;
    this.deviceId = options.deviceId || this.generateDeviceId();
    this.deviceName = options.deviceName || 'Web Client';
    this.deviceType = options.deviceType || 'web';
    this.autoReconnect = options.autoReconnect !== false;
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30 seconds
    
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    
    this.eventHandlers = {
      connected: [],
      authenticated: [],
      disconnected: [],
      statusUpdate: [],
      userStatusUpdate: [],
      error: [],
      forceLogout: []
    };
  }

  generateDeviceId() {
    // Generate a unique device ID based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return 'web-' + Math.abs(hash).toString(36) + '-' + Date.now();
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('🔌 Already connected to real-time session service');
      return;
    }

    console.log('🔌 Connecting to real-time session service...');
    
    try {
      // Use Socket.IO client if available, otherwise fallback to WebSocket
      if (typeof io !== 'undefined') {
        this.socket = io(this.serverUrl, {
          transports: ['websocket'],
          upgrade: false
        });
        this.setupSocketIOHandlers();
      } else {
        // Fallback to native WebSocket (limited functionality)
        this.socket = new WebSocket(this.serverUrl.replace('http', 'ws'));
        this.setupWebSocketHandlers();
      }
    } catch (error) {
      console.error('🚨 Failed to connect to real-time session service:', error);
      this.emit('error', { type: 'connection', error });
      this.scheduleReconnect();
    }
  }

  setupSocketIOHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to real-time session service');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      this.authenticate();
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Authenticated with session service:', data);
      this.isAuthenticated = true;
      this.emit('authenticated', data);
      this.startHeartbeat();
    });

    this.socket.on('auth_error', (data) => {
      console.error('🚨 Authentication failed:', data);
      this.emit('error', { type: 'authentication', ...data });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from session service:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.stopHeartbeat();
      this.emit('disconnected', { reason });
      
      if (this.autoReconnect && reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('heartbeat_ack', (data) => {
      // Heartbeat acknowledged
    });

    this.socket.on('status_updated', (data) => {
      this.emit('statusUpdate', data);
    });

    this.socket.on('user_status_update', (data) => {
      this.emit('userStatusUpdate', data);
    });

    this.socket.on('force_logout', (data) => {
      console.log('🚨 Force logout received:', data);
      this.emit('forceLogout', data);
      this.disconnect();
    });

    this.socket.on('session_timeout', (data) => {
      console.log('⏰ Session timeout:', data);
      this.emit('error', { type: 'timeout', ...data });
      this.disconnect();
    });

    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
      this.emit('error', { type: 'socket', error });
    });
  }

  setupWebSocketHandlers() {
    this.socket.onopen = () => {
      console.log('✅ WebSocket connected to session service');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      this.authenticate();
    };

    this.socket.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.stopHeartbeat();
      this.emit('disconnected', { code: event.code, reason: event.reason });
      
      if (this.autoReconnect && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('🚨 WebSocket error:', error);
      this.emit('error', { type: 'websocket', error });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('🚨 Failed to parse WebSocket message:', error);
      }
    };
  }

  authenticate() {
    if (!this.token) {
      console.error('🚨 No authentication token provided');
      this.emit('error', { type: 'authentication', message: 'No token provided' });
      return;
    }

    const authData = {
      token: this.token,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      deviceType: this.deviceType
    };

    if (this.socket.emit) {
      // Socket.IO
      this.socket.emit('authenticate', authData);
    } else {
      // WebSocket
      this.socket.send(JSON.stringify({
        type: 'authenticate',
        data: authData
      }));
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.isAuthenticated) {
        const heartbeatData = {
          timestamp: new Date(),
          activity: {
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`
          }
        };

        if (this.socket.emit) {
          this.socket.emit('heartbeat', heartbeatData);
        } else {
          this.socket.send(JSON.stringify({
            type: 'heartbeat',
            data: heartbeatData
          }));
        }
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  updateStatus(status) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Cannot update status: not authenticated');
      return;
    }

    const statusData = { status };

    if (this.socket.emit) {
      this.socket.emit('status_update', statusData);
    } else {
      this.socket.send(JSON.stringify({
        type: 'status_update',
        data: statusData
      }));
    }
  }

  updateDeviceInfo(deviceInfo) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Cannot update device info: not authenticated');
      return;
    }

    if (this.socket.emit) {
      this.socket.emit('device_info', deviceInfo);
    } else {
      this.socket.send(JSON.stringify({
        type: 'device_info',
        data: deviceInfo
      }));
    }
  }

  logout() {
    if (this.socket && this.isConnected) {
      if (this.socket.emit) {
        this.socket.emit('logout');
      } else {
        this.socket.send(JSON.stringify({ type: 'logout' }));
      }
    }
    this.disconnect();
  }

  disconnect() {
    this.autoReconnect = false;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      if (this.socket.disconnect) {
        this.socket.disconnect();
      } else {
        this.socket.close();
      }
      this.socket = null;
    }

    this.isConnected = false;
    this.isAuthenticated = false;
  }

  scheduleReconnect() {
    if (!this.autoReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🚨 Max reconnection attempts reached or auto-reconnect disabled');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`🚨 Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods for automatic status detection
  setupAutomaticStatusDetection() {
    let idleTimer;
    let isIdle = false;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      if (isIdle) {
        isIdle = false;
        this.updateStatus('online');
      }
      
      idleTimer = setTimeout(() => {
        isIdle = true;
        this.updateStatus('idle');
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Track user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updateStatus('away');
      } else {
        this.updateStatus('online');
        resetIdleTimer();
      }
    });

    // Initial timer
    resetIdleTimer();
  }

  // Update token (for token refresh scenarios)
  updateToken(newToken) {
    this.token = newToken;
    if (this.isConnected && !this.isAuthenticated) {
      this.authenticate();
    }
  }
}

// Export for use in frontend applications
export default RealTimeSessionClient;
