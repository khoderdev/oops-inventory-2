// High-performance database configuration
const sequelizeConfig = {
  // Connection pooling for high concurrency
  pool: {
    max: 20,          // Maximum connections in pool
    min: 5,           // Minimum connections in pool
    acquire: 30000,   // Maximum time to get connection (30s)
    idle: 10000,      // Maximum time connection can be idle (10s)
    evict: 1000,      // Check for idle connections every 1s
    handleDisconnects: true
  },
  
  // Query optimization
  dialectOptions: {
    // Enable connection compression
    compress: true,
    // Set timezone
    timezone: 'local',
    // Enable multiple statements for better performance
    multipleStatements: true,
    // Connection timeout
    connectTimeout: 20000,
    // Socket timeout
    socketTimeout: 60000,
    // Enable SSL if needed
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  
  // Logging optimization
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Performance settings
  benchmark: process.env.NODE_ENV === 'development',
  
  // Query optimization
  define: {
    // Don't use camelCase for automatically added attributes
    underscored: true,
    // Don't delete database entries but set the newly added attribute deletedAt
    paranoid: false,
    // Don't use createdAt/updatedAt timestamps
    timestamps: true,
    // Disable the modification of table names
    freezeTableName: true
  },
  
  // Transaction settings for better performance
  transactionType: 'IMMEDIATE',
  isolationLevel: 'READ_COMMITTED',
  
  // Retry configuration
  retry: {
    max: 3,
    timeout: 5000,
    match: [
      /SQLITE_BUSY/,
      /ECONNRESET/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ]
  }
};

export default sequelizeConfig;
