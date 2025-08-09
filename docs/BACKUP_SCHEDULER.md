# Database Backup Scheduler

A comprehensive automated backup scheduling system for PostgreSQL databases with a modern React frontend and robust Node.js backend.

## Features

### 🕒 **Flexible Scheduling**
- **Daily Backups**: Run at specified time every day
- **Weekly Backups**: Run on specific day of week at specified time
- **Monthly Backups**: Run on specific day of month at specified time
- **Manual Execution**: Run any schedule immediately on demand

### 📦 **Multiple Backup Formats**
- **Custom Format**: PostgreSQL's custom binary format (recommended)
- **Directory Format**: Directory with separate files for each table
- **SQL Format**: Plain SQL dump file

### 🎛️ **Advanced Configuration**
- **Schema/Data Options**: Choose to include schema, data, or both
- **Retention Policy**: Automatic cleanup of old backups (1-365 days)
- **Target Database**: Optional separate target database for restores
- **Backup Naming**: Automatic timestamped backup names

### 📊 **Monitoring & Management**
- **Real-time Status**: Live scheduler status and next run times
- **Execution History**: Complete audit trail of all backup executions
- **Error Handling**: Comprehensive error logging and recovery
- **Progress Tracking**: Real-time backup progress monitoring

### 🔧 **Enterprise Features**
- **Scheduler Control**: Start/stop the entire scheduler system
- **Schedule Management**: Enable/disable individual schedules
- **Backup Validation**: Automatic backup integrity checks
- **Resource Management**: Efficient memory and disk usage

## Architecture

### Frontend Components

#### `BackupScheduler.tsx`
Main React component providing the scheduler interface:
- Schedule creation and editing
- Scheduler status monitoring
- Execution history viewing
- Real-time updates every 30 seconds

#### `backup-scheduler.api.ts`
TypeScript API client with full CRUD operations:
- Schedule management (CRUD)
- Scheduler control (start/stop)
- Execution monitoring
- Utility functions for formatting

### Backend Components

#### `backup-scheduler.js`
Express.js router handling all scheduler operations:
- RESTful API endpoints
- Cron job management using `node-cron`
- Backup execution using `pg_dump`
- Automatic cleanup and retention

#### Database Models
- `BackupSchedule.js`: Schedule configuration storage
- `ScheduleExecution.js`: Execution history tracking

## API Endpoints

### Schedule Management
```
GET    /api/backup-scheduler/schedules           # List all schedules
GET    /api/backup-scheduler/schedules/:id       # Get single schedule
POST   /api/backup-scheduler/schedules           # Create new schedule
PUT    /api/backup-scheduler/schedules/:id       # Update schedule
DELETE /api/backup-scheduler/schedules/:id       # Delete schedule
```

### Scheduler Control
```
GET    /api/backup-scheduler/status              # Get scheduler status
POST   /api/backup-scheduler/start               # Start scheduler
POST   /api/backup-scheduler/stop                # Stop scheduler
POST   /api/backup-scheduler/schedules/:id/run   # Run schedule now
```

### Execution History
```
GET    /api/backup-scheduler/executions          # Get execution history
GET    /api/backup-scheduler/executions/:id      # Get single execution
```

## Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=postgres
DB_PASSWORD=your_password

# PostgreSQL Tools Path
PG_DUMP_PATH=C:\Program Files\PostgreSQL\17\bin\pg_dump.exe
PG_RESTORE_PATH=C:\Program Files\PostgreSQL\17\bin\pg_restore.exe

# Backup Storage
BACKUP_DIR=./backups
```

### Schedule Configuration
```typescript
interface ScheduleCreateRequest {
  name: string;                    // Human-readable schedule name
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;                    // HH:MM format (24-hour)
  dayOfWeek?: number;             // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number;            // 1-31 for monthly
  backupType: 'custom' | 'directory' | 'sql';
  includeData: boolean;           // Include table data
  includeSchema: boolean;         // Include table schemas
  retentionDays: number;          // Days to keep backups (1-365)
}
```

## Usage Examples

### Creating a Daily Backup Schedule
```typescript
const schedule = await backupSchedulerAPI.createSchedule({
  name: "Daily Production Backup",
  frequency: "daily",
  time: "02:00",
  backupType: "custom",
  includeData: true,
  includeSchema: true,
  retentionDays: 30
});
```

### Creating a Weekly Backup Schedule
```typescript
const schedule = await backupSchedulerAPI.createSchedule({
  name: "Weekly Full Backup",
  frequency: "weekly",
  time: "01:00",
  dayOfWeek: 0, // Sunday
  backupType: "directory",
  includeData: true,
  includeSchema: true,
  retentionDays: 90
});
```

### Starting the Scheduler
```typescript
await backupSchedulerAPI.startScheduler();
const status = await backupSchedulerAPI.getSchedulerStatus();
console.log(`Scheduler running: ${status.data.isRunning}`);
```

## Backup File Structure

Scheduled backups are stored in the following structure:
```
backend/backups/
├── scheduled_Daily_Production_Backup_2025-01-30T02-00-00-000Z/
│   ├── backup.custom
│   └── metadata.json
├── scheduled_Weekly_Full_Backup_2025-01-26T01-00-00-000Z/
│   ├── backup_directory/
│   │   ├── toc.dat
│   │   ├── table1.dat
│   │   └── table2.dat
│   └── metadata.json
└── manual_backup_2025-01-30T10-15-30-000Z/
    ├── backup.sql
    └── metadata.json
```

## Monitoring & Alerts

### Scheduler Status
The scheduler provides real-time status information:
- **Running State**: Whether the scheduler is active
- **Active Schedules**: Number of enabled schedules
- **Next Run**: When the next backup will execute
- **Last Error**: Most recent error message

### Execution History
Complete audit trail includes:
- **Start/End Times**: Precise execution timing
- **Duration**: How long each backup took
- **Status**: Success, failure, or running
- **Backup ID**: Reference to created backup
- **Error Details**: Full error messages for failed backups

### Error Handling
Comprehensive error handling includes:
- **Schedule Validation**: Prevents invalid configurations
- **Backup Failures**: Graceful handling of pg_dump errors
- **Resource Issues**: Disk space and permission problems
- **Network Issues**: Database connection problems

## Security Considerations

### Database Credentials
- Store database passwords in environment variables
- Use PostgreSQL's `.pgpass` file for password-less authentication
- Consider using connection pooling for better security

### File Permissions
- Ensure backup directory has appropriate permissions
- Restrict access to backup files containing sensitive data
- Consider encrypting backup files for additional security

### Network Security
- Use SSL connections to PostgreSQL when possible
- Restrict network access to backup storage locations
- Consider using VPN for remote backup storage

## Performance Optimization

### Resource Management
- **Memory Usage**: Efficient streaming for large databases
- **Disk Space**: Automatic cleanup based on retention policies
- **CPU Usage**: Scheduled during low-activity periods
- **Network Bandwidth**: Compression options for remote storage

### Backup Optimization
- **Custom Format**: Best compression and fastest restore
- **Parallel Processing**: Multiple worker processes for large databases
- **Incremental Backups**: Future enhancement for large datasets
- **Compression**: Built-in compression for all backup formats

## Troubleshooting

### Common Issues

#### Scheduler Won't Start
```bash
# Check if PostgreSQL tools are accessible
pg_dump --version

# Verify environment variables
echo $PG_DUMP_PATH
echo $DB_HOST
```

#### Backup Failures
```bash
# Test manual backup
pg_dump -h localhost -U postgres -d your_db -f test_backup.sql

# Check disk space
df -h

# Verify permissions
ls -la backend/backups/
```

#### Schedule Not Running
- Verify scheduler is started
- Check schedule is enabled
- Confirm cron expression is valid
- Review execution history for errors

### Log Files
The scheduler logs all activities:
- **Console Output**: Real-time scheduler status
- **Execution Records**: Database-stored execution history
- **Error Messages**: Detailed error information

## Future Enhancements

### Planned Features
- **Incremental Backups**: Delta backups for large databases
- **Remote Storage**: S3, Azure Blob, Google Cloud integration
- **Backup Encryption**: Built-in encryption for sensitive data
- **Email Notifications**: Alerts for backup success/failure
- **Backup Verification**: Automatic restore testing
- **Multi-Database Support**: Backup multiple databases
- **Backup Compression**: Advanced compression algorithms
- **Backup Deduplication**: Reduce storage requirements

### Integration Opportunities
- **Monitoring Systems**: Prometheus, Grafana integration
- **Alerting Platforms**: PagerDuty, Slack notifications
- **Cloud Storage**: AWS S3, Azure, Google Cloud
- **Container Orchestration**: Kubernetes CronJobs
- **CI/CD Pipelines**: Automated backup testing

## Contributing

### Development Setup
1. Install dependencies: `npm install node-cron uuid`
2. Configure environment variables
3. Start the development server
4. Access the scheduler at `/settings` → `Schedule` tab

### Testing
- Unit tests for schedule validation
- Integration tests for backup execution
- End-to-end tests for full workflow
- Performance tests for large databases

### Code Style
- Follow existing TypeScript/JavaScript conventions
- Use ESLint and Prettier for code formatting
- Add comprehensive JSDoc comments
- Include error handling for all operations

## License

This backup scheduler system is part of the Cost Craft Converter project and follows the same licensing terms.

## Support

For issues, questions, or feature requests:
1. Check the troubleshooting section
2. Review execution history for error details
3. Check server logs for additional information
4. Create an issue with detailed reproduction steps
