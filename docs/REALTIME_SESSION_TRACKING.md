# Real-Time User Session Tracking System

## Overview

This document describes the comprehensive real-time user session tracking system implemented for the Node.js backend. The system provides live monitoring of user sessions across multiple devices and terminals with WebSocket-based real-time updates.

## Features

### ✅ Core Features Implemented

1. **Real-time Status Tracking**: Online/offline status detection with heartbeat mechanism
2. **Per-Device Tracking**: Independent tracking for each computer/terminal
3. **WebSocket Integration**: Real-time updates across all connected devices
4. **Admin Dashboard APIs**: Live user status monitoring for administrators
5. **Session Management**: Enhanced session model with device tracking
6. **Heartbeat System**: Keep-alive mechanism for accurate status detection
7. **Event Broadcasting**: Real-time notifications for status changes
8. **Force Logout**: Admin ability to remotely logout users from specific devices
9. **Session Analytics**: Comprehensive session statistics and activity timeline

### 🔧 Technical Implementation

#### Enhanced Session Model
- **Device Tracking**: `deviceId`, `deviceName`, `deviceType`
- **Status Management**: `status` (online, offline, idle, away)
- **Real-time Fields**: `socketId`, `lastHeartbeat`, `logoutTime`
- **Metadata Storage**: JSONB field for additional session information

#### WebSocket Server
- **Socket.IO Integration**: Full-duplex communication
- **Authentication**: Token-based authentication with device registration
- **Heartbeat Monitoring**: Automatic detection of inactive sessions
- **Event Broadcasting**: Real-time status updates to admin users

#### Admin APIs
- **Session Management**: View, monitor, and control user sessions
- **Force Logout**: Remote logout capabilities for security
- **Analytics**: Session statistics and activity timelines
- **Real-time Monitoring**: Live user status dashboard

## API Endpoints

### Session Management APIs

#### `GET /api/sessions`
Get all active sessions with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `status` (string): Filter by status (online, offline, idle, away)
- `deviceType` (string): Filter by device type (web, pos, mobile, tablet, desktop)
- `userId` (number): Filter by specific user ID

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "token": "session-token",
        "userId": 1,
        "deviceId": "pos-terminal-1",
        "deviceName": "POS Terminal 1",
        "deviceType": "pos",
        "status": "online",
        "ipAddress": "192.168.1.100",
        "lastActivity": "2025-07-31T19:30:00Z",
        "lastHeartbeat": "2025-07-31T19:30:00Z",
        "isOnline": true,
        "user": {
          "id": 1,
          "username": "admin",
          "fullName": "Admin User",
          "role": "admin"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 50
    }
  }
}
```

#### `GET /api/sessions/online`
Get currently online users in real-time.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": 1,
        "username": "admin",
        "fullName": "Admin User",
        "role": "admin",
        "deviceId": "pos-terminal-1",
        "deviceName": "POS Terminal 1",
        "deviceType": "pos",
        "status": "online",
        "loginTime": "2025-07-31T18:00:00Z",
        "lastActivity": "2025-07-31T19:30:00Z",
        "lastHeartbeat": "2025-07-31T19:30:00Z",
        "ipAddress": "192.168.1.100"
      }
    ],
    "count": 1,
    "timestamp": "2025-07-31T19:30:00Z"
  }
}
```

#### `GET /api/sessions/stats`
Get comprehensive session statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 150,
    "activeSessions": 25,
    "onlineUsers": 12,
    "offlineUsers": 13,
    "realTimeOnlineUsers": 12,
    "deviceTypes": {
      "web": 8,
      "pos": 3,
      "mobile": 1
    },
    "statusBreakdown": {
      "online": 12,
      "idle": 8,
      "away": 3,
      "offline": 2
    },
    "timestamp": "2025-07-31T19:30:00Z"
  }
}
```

#### `GET /api/sessions/user/:userId`
Get all sessions for a specific user.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Admin User",
      "role": "admin"
    },
    "sessions": [
      {
        "id": 1,
        "deviceId": "pos-terminal-1",
        "deviceName": "POS Terminal 1",
        "deviceType": "pos",
        "status": "online",
        "isOnline": true,
        "lastActivity": "2025-07-31T19:30:00Z"
      }
    ],
    "activeSessions": 1,
    "onlineSessions": 1
  }
}
```

#### `POST /api/sessions/user/:userId/logout`
Force logout user from all devices.

**Request Body:**
```json
{
  "reason": "Security violation detected"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revokedSessions": 2,
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Admin User"
    }
  },
  "message": "Successfully logged out user admin from 2 device(s)"
}
```

#### `POST /api/sessions/user/:userId/device/:deviceId/logout`
Force logout user from specific device.

**Response:**
```json
{
  "success": true,
  "data": {
    "revokedSessions": 1,
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Admin User"
    },
    "deviceId": "pos-terminal-1",
    "deviceName": "POS Terminal 1"
  },
  "message": "Successfully logged out user admin from device POS Terminal 1"
}
```

#### `GET /api/sessions/activity`
Get session activity timeline.

**Query Parameters:**
- `hours` (number): Number of hours to look back (default: 24)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "hour": "2025-07-31T18:00:00.000Z",
        "logins": 5,
        "logouts": 2,
        "uniqueUsers": 4
      }
    ],
    "totalSessions": 25,
    "timeRange": {
      "start": "2025-07-30T19:30:00Z",
      "end": "2025-07-31T19:30:00Z",
      "hours": 24
    }
  }
}
```

#### `POST /api/sessions/cleanup`
Manually cleanup expired sessions.

**Response:**
```json
{
  "success": true,
  "data": {
    "cleanedSessions": 5,
    "timestamp": "2025-07-31T19:30:00Z"
  },
  "message": "Successfully cleaned up 5 expired sessions"
}
```

## WebSocket Events

### Client to Server Events

#### `authenticate`
Authenticate the WebSocket connection.

**Payload:**
```json
{
  "token": "auth-token",
  "deviceId": "unique-device-id",
  "deviceName": "POS Terminal 1",
  "deviceType": "pos"
}
```

#### `heartbeat`
Send heartbeat to maintain connection.

**Payload:**
```json
{
  "timestamp": "2025-07-31T19:30:00Z",
  "activity": {
    "page": "/dashboard",
    "userAgent": "Mozilla/5.0...",
    "screenResolution": "1920x1080",
    "windowSize": "1200x800"
  }
}
```

#### `status_update`
Update user status.

**Payload:**
```json
{
  "status": "idle"
}
```

#### `device_info`
Update device information.

**Payload:**
```json
{
  "screenResolution": "1920x1080",
  "browserVersion": "Chrome 91.0",
  "customData": {}
}
```

#### `logout`
Initiate logout process.

### Server to Client Events

#### `authenticated`
Confirmation of successful authentication.

**Payload:**
```json
{
  "sessionId": "session-id",
  "userId": 1,
  "deviceId": "device-id",
  "status": "online"
}
```

#### `auth_error`
Authentication failed.

**Payload:**
```json
{
  "message": "Invalid token"
}
```

#### `heartbeat_ack`
Heartbeat acknowledgment.

**Payload:**
```json
{
  "timestamp": "2025-07-31T19:30:00Z"
}
```

#### `status_updated`
Status update confirmation.

**Payload:**
```json
{
  "status": "idle",
  "timestamp": "2025-07-31T19:30:00Z"
}
```

#### `user_status_update`
Real-time user status change (for admin users).

**Payload:**
```json
{
  "userId": 1,
  "status": "online",
  "deviceId": "device-id",
  "timestamp": "2025-07-31T19:30:00Z"
}
```

#### `force_logout`
Server-initiated logout.

**Payload:**
```json
{
  "reason": "Logged out by administrator",
  "timestamp": "2025-07-31T19:30:00Z"
}
```

#### `session_timeout`
Session timeout notification.

**Payload:**
```json
{
  "reason": "Heartbeat timeout",
  "timestamp": "2025-07-31T19:30:00Z"
}
```

## Frontend Integration

### JavaScript Client

Use the provided `RealTimeSessionClient` utility for easy integration:

```javascript
import { RealTimeSessionClient } from './utils/realTimeSessionClient.js';

// Initialize client
const sessionClient = new RealTimeSessionClient({
  serverUrl: 'ws://localhost:3000',
  token: 'your-auth-token',
  deviceId: 'pos-terminal-1',
  deviceName: 'POS Terminal 1',
  deviceType: 'pos'
});

// Set up event handlers
sessionClient.on('connected', () => {
  console.log('Connected to session service');
});

sessionClient.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});

sessionClient.on('userStatusUpdate', (data) => {
  console.log('User status changed:', data);
  // Update UI to show user status
});

sessionClient.on('forceLogout', (data) => {
  console.log('Force logout:', data);
  // Redirect to login page
  window.location.href = '/login';
});

// Connect and enable automatic status detection
sessionClient.connect();
sessionClient.setupAutomaticStatusDetection();
```

### Enhanced Login Integration

Update your login API calls to include device information:

```javascript
const loginData = {
  username: 'admin',
  password: 'password',
  deviceId: 'pos-terminal-1',
  deviceName: 'POS Terminal 1',
  deviceType: 'pos'
};

const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
});

const result = await response.json();
// result.session contains device and session information
```

## Security Considerations

### Authentication & Authorization
- All session management APIs require authentication
- Admin permissions (`auth.manageSessions`) required for session management
- Token-based WebSocket authentication
- IP address tracking and validation

### Session Security
- Automatic session expiration (24 hours default)
- Heartbeat timeout detection (5 minutes)
- Force logout capabilities for security incidents
- Comprehensive audit logging

### Data Protection
- Sensitive session data encrypted in transit
- JSONB metadata field for secure additional data storage
- IP address logging for security analysis

## Monitoring & Analytics

### Real-time Monitoring
- Live user status dashboard
- Device type distribution
- Session activity timeline
- Heartbeat monitoring

### Audit Logging
- All session events logged to audit trail
- Login/logout tracking with device information
- Admin actions on sessions logged
- Failed authentication attempts tracked

### Performance Metrics
- Session creation/destruction rates
- WebSocket connection stability
- Heartbeat response times
- Database query performance

## Deployment Notes

### Database Migration
Run the migration to add real-time session fields:

```bash
# The migration will be automatically applied when the server starts
# Or run manually if needed
```

### Environment Variables
```env
# WebSocket configuration
FRONTEND_URL=http://localhost:3000  # CORS origin for WebSocket
NODE_ENV=production                 # Environment mode

# Session configuration
SESSION_HEARTBEAT_INTERVAL=30000    # Heartbeat interval in ms
SESSION_TIMEOUT=300000              # Session timeout in ms (5 minutes)
SESSION_CLEANUP_INTERVAL=1800000   # Cleanup interval in ms (30 minutes)
```

### Production Considerations
- Use Redis for session storage in multi-server deployments
- Configure load balancer for WebSocket sticky sessions
- Monitor WebSocket connection limits
- Set up alerts for session anomalies

## Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Check CORS configuration
- Verify firewall settings
- Ensure Socket.IO client version compatibility

#### Authentication Errors
- Verify token validity and expiration
- Check user permissions
- Validate device ID format

#### Session Cleanup Issues
- Monitor database performance
- Check cleanup service logs
- Verify migration completion

### Debug Logging
Enable debug logging for troubleshooting:

```javascript
// In development
console.log('🔌 WebSocket events enabled');
```

## Future Enhancements

### Planned Features
- [ ] Redis integration for scalability
- [ ] Session recording and playback
- [ ] Advanced analytics dashboard
- [ ] Mobile push notifications
- [ ] Geolocation tracking
- [ ] Multi-factor authentication integration

### API Versioning
Current version: v1
Future versions will maintain backward compatibility.

---

## Support

For technical support or questions about the real-time session tracking system, please refer to the development team or create an issue in the project repository.
