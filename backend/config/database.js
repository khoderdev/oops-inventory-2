import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
  dialect: "postgres",
  host: "localhost",
  database: "inventory_db",
  username: "postgres",
  password: "postgres",
  port: 5432
});

export default sequelize;
