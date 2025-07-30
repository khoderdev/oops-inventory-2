import chalk from "chalk";
import { Sequelize } from "sequelize";

const customLogger = (sql, timing) => {
  const timestamp = new Date().toLocaleTimeString();
  const method = sql.trim().split(" ")[0].toUpperCase();

  console.log(chalk.gray(`[${timestamp}]`), chalk.cyan(`[${method}]`), chalk.white(sql), chalk.green(timing ? `(${timing}ms)` : ""));
};

const sequelize = new Sequelize({
  dialect: "postgres",
  host: "localhost",
  database: "inventory_db",
  username: "postgres",
  password: "postgres",
  port: 5432,
  logging: console.log, // Enable SQL logging to see the problematic query
  benchmark: true
});

export default sequelize;
