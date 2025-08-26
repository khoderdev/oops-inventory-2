import chalk from "chalk";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Production database URL
const PRODUCTION_DATABASE_URL = "postgresql://inventory_db_n6g9_user:yOnU8Ma28mZNx3TBOx6Zj4usNMI8OVFa@dpg-d2jmt88dl3ps73cfqug0-a/inventory_db_n6g9";

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === "production";

console.log(`🔧 Database Config - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔧 Database Config - Using ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} database`);

const sequelize = isProduction 
  ? new Sequelize(PRODUCTION_DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      benchmark: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      dialect: "postgres",
      host: "localhost",
      database: "inventory_db",
      username: "postgres",
      password: "postgres",
      port: 5432,
      logging: false,
      // logging: console.log,
      benchmark: true
    });

export default sequelize;
