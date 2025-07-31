# 🖨️ Printer Management System

A comprehensive printer management system for Point of Sale (POS) applications with support for multiple printer types, channels, and real-time job processing.

## 🌟 Features

### ✨ **Core Features**
- **Multi-Channel Support**: Organize printers by function (kitchen, bar, receipts, etc.)
- **Multiple Connection Types**: USB, Network (IP), Bluetooth, Serial
- **Real-Time Processing**: Queue-based job processing with priority support
- **Windows Integration**: Direct integration with Windows printer drivers
- **Network Discovery**: Automatic discovery of network printers
- **Health Monitoring**: Real-time printer status monitoring
- **Job Tracking**: Comprehensive print job history and metrics

### 🖨️ **Supported Printer Types**
- **Thermal Printers**: ESC/POS compatible receipt printers
- **Receipt Printers**: Standard POS receipt printers
- **Label Printers**: Barcode and product label printers
- **Inkjet/Laser**: Standard office printers
- **Network Printers**: IP-based printers (raw socket, LPR, IPP)

### 🔧 **Connection Types**
- **USB**: Direct Windows OS integration
- **Network**: TCP/IP socket connections
- **Bluetooth**: Wireless printer support (planned)
- **Serial**: RS232/COM port printers (planned)

## 🏗️ Architecture

### **Database Schema**

```sql
printer_channels
├── id (Primary Key)
├── name (Unique)
├── description
├── is_active
├── priority (1-10)
├── settings (JSONB)
└── created_by (Foreign Key → users)

printers
├── id (Primary Key)
├── name
├── channel_id (Foreign Key → printer_channels)
├── type (thermal|inkjet|laser|receipt|label)
├── connection_type (usb|network|bluetooth|serial)
├── network_config (JSONB)
├── os_config (JSONB)
├── settings (JSONB)
├── capabilities (JSONB)
├── status (online|offline|error|busy|maintenance)
└── created_by (Foreign Key → users)

print_jobs
├── id (Primary Key)
├── channel_id (Foreign Key → printer_channels)
├── printer_id (Foreign Key → printers)
├── job_type (receipt|label|report|invoice|ticket|barcode)
├── content (JSONB)
├── settings (JSONB)
├── status (pending|queued|printing|completed|failed|cancelled)
├── metadata (JSONB)
└── metrics (JSONB)
```

### **Service Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Backend APIs   │    │ Printer Service │
│                 │    │                 │    │                 │
│ • Channel Mgmt  │◄──►│ • REST APIs     │◄──►│ • Queue Mgmt    │
│ • Printer Setup │    │ • Validation    │    │ • Job Processing│
│ • Job Monitoring│    │ • Authentication│    │ • Health Monitor│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   PostgreSQL    │    │  Physical       │
                    │   Database      │    │  Printers       │
                    │                 │    │                 │
                    │ • Channels      │    │ • USB Printers  │
                    │ • Printers      │    │ • Network Print │
                    │ • Print Jobs    │    │ • Windows OS    │
                    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### **1. Database Setup**

Run the migration to create printer tables:

```bash
# Apply the migration
psql -d your_database -f backend/migrations/20250801_create_printer_tables.sql
```

### **2. Backend Setup**

The printer system is automatically initialized when the backend starts:

```javascript
// Backend automatically loads:
// ✅ Printer models and relationships
// ✅ Printer service with queue processing
// ✅ REST API endpoints
// ✅ Health monitoring
```

### **3. Frontend Access**

Navigate to **System Settings → Printers** in your application to access the printer management interface.

## 📡 API Endpoints

### **Printer Channels**

```http
GET    /api/printers/channels          # List all channels
POST   /api/printers/channels          # Create channel
PUT    /api/printers/channels/:id      # Update channel
DELETE /api/printers/channels/:id      # Delete channel
```

### **Printers**

```http
GET    /api/printers                   # List all printers
POST   /api/printers                   # Create printer
PUT    /api/printers/:id               # Update printer
DELETE /api/printers/:id               # Delete printer
POST   /api/printers/:id/test          # Test printer connection
GET    /api/printers/:id/stats         # Get printer statistics
```

### **Print Jobs**

```http
GET    /api/printers/jobs              # List print jobs
POST   /api/printers/jobs              # Create print job
GET    /api/printers/jobs/:id          # Get job details
POST   /api/printers/jobs/:id/cancel   # Cancel job
POST   /api/printers/jobs/:id/retry    # Retry failed job
GET    /api/printers/jobs/stats        # Get job statistics
POST   /api/printers/jobs/bulk-cancel  # Bulk cancel jobs
```

### **Discovery & Utilities**

```http
GET    /api/printers/discover/network  # Discover network printers
GET    /api/printers/discover/windows  # List Windows printers
GET    /api/printers/service/status    # Get service status
```

## 🔧 Configuration Examples

### **Network Printer Setup**

```javascript
{
  "name": "Kitchen Receipt Printer",
  "channelId": 1,
  "type": "thermal",
  "connectionType": "network",
  "networkConfig": {
    "ipAddress": "192.168.1.100",
    "port": 9100,
    "protocol": "raw"
  },
  "settings": {
    "paperSize": "80mm",
    "orientation": "portrait",
    "copies": 1
  },
  "capabilities": {
    "maxWidth": 80,
    "supportsCutter": true,
    "supportsDrawer": true,
    "supportedFormats": ["text", "escpos"]
  }
}
```

### **USB Printer Setup**

```javascript
{
  "name": "Receipt Printer USB",
  "channelId": 1,
  "type": "receipt",
  "connectionType": "usb",
  "osConfig": {
    "printerName": "EPSON TM-T88V Receipt",
    "driverName": "EPSON TM-T88V"
  },
  "settings": {
    "paperSize": "80mm",
    "copies": 1
  }
}
```

### **Print Job Creation**

```javascript
{
  "printerId": 1,
  "jobType": "receipt",
  "content": {
    "template": "receipt_template",
    "data": {
      "orderNumber": "ORD-001",
      "items": [
        { "name": "Coffee", "price": 3.50, "qty": 2 }
      ],
      "total": 7.00
    },
    "rawContent": "RECEIPT\\n=======\\nOrder: ORD-001\\n\\nThank you!",
    "format": "text"
  },
  "settings": {
    "copies": 1,
    "priority": "normal"
  },
  "metadata": {
    "orderId": 123,
    "source": "pos"
  }
}
```

## 🖥️ Frontend Components

### **Printer Management Interface**

- **Channel Management**: Create and organize printer channels
- **Printer Setup**: Add and configure printers with guided setup
- **Real-time Status**: Live printer status monitoring
- **Job Queue**: View and manage print jobs
- **Discovery Tools**: Automatic printer discovery

### **Key Features**

- ✅ **Responsive Design**: Works on desktop and tablet
- ✅ **Real-time Updates**: Live status and job updates
- ✅ **Form Validation**: Comprehensive input validation
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Bulk Operations**: Manage multiple items at once

## 🔍 Monitoring & Troubleshooting

### **Health Monitoring**

The system automatically monitors:
- ✅ Printer connectivity (every 30 seconds)
- ✅ Job queue status
- ✅ Error rates and patterns
- ✅ Performance metrics

### **Common Issues**

| Issue | Cause | Solution |
|-------|-------|----------|
| Printer Offline | Network/USB disconnection | Check physical connections |
| Jobs Stuck | Printer driver issues | Restart printer service |
| High Error Rate | Wrong printer settings | Verify printer configuration |
| Slow Processing | Network latency | Check network connectivity |

### **Logs & Debugging**

```bash
# Check printer service logs
tail -f logs/printer-service.log

# Test printer connectivity
node backend/scripts/testPrinterSystem.js

# Check database status
SELECT * FROM printers WHERE status != 'online';
```

## 🔐 Security & Permissions

### **Required Permissions**

- `PRINTERS_VIEW`: View printers and jobs
- `PRINTERS_MANAGE`: Create/edit/delete printers and channels
- `PRINTERS_PRINT`: Create print jobs

### **Security Features**

- ✅ **Authentication Required**: All endpoints require valid session
- ✅ **Permission Checks**: Role-based access control
- ✅ **Input Validation**: Comprehensive data validation
- ✅ **Audit Logging**: All actions are logged
- ✅ **Network Security**: IP-based printer access control

## 🚀 Performance & Scalability

### **Optimization Features**

- ✅ **Queue Processing**: Efficient job queue management
- ✅ **Connection Pooling**: Reuse printer connections
- ✅ **Batch Operations**: Bulk job processing
- ✅ **Caching**: Printer status caching
- ✅ **Database Indexing**: Optimized queries

### **Scaling Considerations**

- **Multiple Servers**: Service can run on multiple backend instances
- **Load Balancing**: Jobs distributed across available printers
- **Failover**: Automatic fallback to backup printers
- **Monitoring**: Built-in performance metrics

## 🧪 Testing

### **Run Tests**

```bash
# Test the complete printer system
node backend/scripts/testPrinterSystem.js

# Test specific components
npm test -- --grep "printer"
```

### **Test Coverage**

- ✅ Model validation and relationships
- ✅ API endpoint functionality
- ✅ Printer service operations
- ✅ Job queue processing
- ✅ Error handling scenarios

## 📚 Additional Resources

- **API Documentation**: See `/api/printers` endpoints
- **Database Schema**: Check migration files
- **Service Architecture**: Review `PrinterService.js`
- **Frontend Components**: Explore `components/system/printers/`

## 🤝 Contributing

1. Follow existing code patterns
2. Add comprehensive tests
3. Update documentation
4. Test with real printers when possible

---

**🎉 Your printer management system is now ready for production use!**

For support or questions, refer to the API documentation or check the service logs.
