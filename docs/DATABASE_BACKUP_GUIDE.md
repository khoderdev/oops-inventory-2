# Database Backup & Restore System

A comprehensive database backup and restore management system for your PostgreSQL inventory database.

## 🚀 Features

### ✅ Complete Backup Solution
- **Multiple Backup Formats**: Custom, Directory, and Plain SQL formats
- **Full Database Coverage**: Tables, schemas, data, indexes, constraints, and sequences
- **Organized Storage**: Individual timestamped folders for easy management
- **Metadata Tracking**: Database statistics and backup information

### ✅ User-Friendly Interface
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Progress**: Progress tracking for backup and restore operations
- **Comprehensive Management**: Create, download, restore, and delete backups
- **Detailed Information**: File sizes, creation dates, and database statistics

### ✅ Robust Backend
- **Native PostgreSQL Tools**: Uses `pg_dump` and `pg_restore` for reliability
- **RESTful API**: Well-structured endpoints for all operations
- **Error Handling**: Comprehensive error handling and logging
- **File Management**: Secure file upload and download capabilities

## 📁 Project Structure

```
├── backend/
│   ├── scripts/
│   │   └── pgDumpFixed.js          # Main backup script
│   ├── routes/
│   │   └── backup.js               # API endpoints
│   └── backups/                    # Backup storage directory
├── src/
│   ├── api/
│   │   └── backup.api.ts           # Frontend API client
│   ├── components/system/settings/
│   │   ├── DatabaseBackupManager.tsx  # Main UI component
│   │   └── index.tsx               # Component exports
│   └── pages/
│       └── SystemSettings.tsx      # Demo page
```

## 🛠️ Setup Instructions

### 1. Backend Setup
The backend is already configured with:
- ✅ PostgreSQL connection
- ✅ Backup script (`pgDumpFixed.js`)
- ✅ API routes (`/api/backup/*`)
- ✅ File upload support (multer)

### 2. Database Configuration
Update `backend/config/database.js` if needed:
```javascript
database: "your_database_name"  // Currently set to "test_restore"
```

### 3. PostgreSQL Path
The system auto-detects PostgreSQL at:
```
C:\Program Files\PostgreSQL\17\bin
```

### 4. Frontend Integration
Import and use the component:
```tsx
import { DatabaseBackupManager } from '@/components/system/settings';

function YourPage() {
  return (
    <div>
      <DatabaseBackupManager />
    </div>
  );
}
```

## 🎯 How to Use

### Creating Backups

1. **Access the Interface**
   - Navigate to your system settings page
   - Click "Create Backup" button

2. **Configure Backup**
   - Enter a descriptive name
   - Choose backup type:
     - **Custom**: Binary format, compressed (recommended)
     - **Directory**: Multiple files, parallel restore
     - **SQL**: Human-readable, cross-platform
   - Select what to include (schema/data)

3. **Monitor Progress**
   - Real-time progress updates
   - Current step information
   - Estimated completion time

### Managing Backups

1. **View Backups**
   - All backups listed with details
   - File sizes and creation dates
   - Database statistics

2. **Download Backups**
   - Click download button
   - Files saved with appropriate extensions
   - Ready for external storage

3. **Delete Backups**
   - Remove unwanted backups
   - Confirmation dialog for safety
   - Frees up storage space

### Restoring Backups

1. **Select Backup**
   - Choose from available backups
   - Click "Restore" button

2. **Configure Restore**
   - Optional target database name
   - Choose to drop existing tables
   - Select schema/data restoration

3. **Execute Restore**
   - Confirmation required
   - Progress monitoring
   - Success notification

## 📊 API Endpoints

### Database Information
```
GET /api/backup/database-info
```
Returns current database statistics.

### Backup Operations
```
POST /api/backup/create          # Create new backup
GET  /api/backup/list            # List all backups
GET  /api/backup/download/:id    # Download backup file
DELETE /api/backup/:id           # Delete backup
```

### Restore Operations
```
POST /api/backup/restore/:id     # Restore from backup
GET  /api/backup/progress/:id    # Get backup progress
```

### File Operations
```
POST /api/backup/upload          # Upload backup file
GET  /api/backup/validate/:id    # Validate backup
```

## 🔧 Technical Details

### Backup Formats

1. **Custom Format (.custom)**
   - Binary compressed format
   - Best for `pg_restore`
   - Compatible with pgAdmin
   - Recommended for production

2. **Directory Format**
   - Multiple files in directory
   - Supports parallel restore
   - Best for large databases
   - Flexible restore options

3. **Plain SQL (.sql)**
   - Human-readable SQL statements
   - Cross-platform compatible
   - Can be edited manually
   - Works with any PostgreSQL tool

### Security Features

- ✅ File size limits (1GB)
- ✅ Secure file handling
- ✅ Path validation
- ✅ Error sanitization
- ✅ Confirmation dialogs

### Performance Optimizations

- ✅ Caching for database info
- ✅ Efficient file streaming
- ✅ Background processing
- ✅ Progress tracking
- ✅ Memory management

## 🚨 Important Notes

### Database Connection
- Ensure PostgreSQL is running
- Verify connection credentials
- Check database permissions

### Storage Requirements
- Backups stored in `backend/backups/`
- Monitor disk space usage
- Regular cleanup recommended

### Restore Safety
- ⚠️ **Always backup current data before restoring**
- ⚠️ **Test restores on non-production databases**
- ⚠️ **Verify restored data integrity**

### File Permissions
- Ensure write permissions for backup directory
- PostgreSQL user needs database access
- File upload directory must be writable

## 🎨 UI Components Used

- **Cards**: Backup information display
- **Dialogs**: Create/restore modals
- **Progress**: Real-time progress bars
- **Tabs**: Organized interface sections
- **Badges**: Backup type indicators
- **Buttons**: Action triggers
- **Forms**: Input collection

## 🔄 Backup Workflow

1. **User initiates backup**
2. **Frontend calls API**
3. **Backend runs pg_dump script**
4. **Files organized in timestamped folder**
5. **Metadata extracted and stored**
6. **Success response with backup info**
7. **UI updates with new backup**

## 🔄 Restore Workflow

1. **User selects backup**
2. **Confirmation dialog shown**
3. **Backend validates backup**
4. **pg_restore/psql executed**
5. **Progress monitored**
6. **Success confirmation**
7. **Database updated**

## 📈 Future Enhancements

- [ ] Automated backup scheduling
- [ ] Email notifications
- [ ] Backup encryption
- [ ] Cloud storage integration
- [ ] Backup verification
- [ ] Incremental backups
- [ ] Backup compression options
- [ ] Multi-database support

## 🐛 Troubleshooting

### Common Issues

1. **pg_dump not found**
   - Verify PostgreSQL installation
   - Check PATH environment variable
   - Update PG_BIN_PATH in backup.js

2. **Permission denied**
   - Check file permissions
   - Verify database user privileges
   - Ensure backup directory is writable

3. **Backup fails**
   - Check database connection
   - Verify disk space
   - Review error logs

4. **Restore fails**
   - Validate backup file
   - Check target database exists
   - Verify PostgreSQL version compatibility

### Log Files
Check console output for detailed error messages and debugging information.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs
3. Verify PostgreSQL configuration
4. Test with smaller databases first

---

**✅ Your database backup system is ready to use!**

The system provides enterprise-level backup and restore capabilities with a modern, user-friendly interface. All components are properly integrated and ready for production use.
