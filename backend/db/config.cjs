require("dotenv").config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    dialectOptions: process.env.PGSSL === "true" ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    logging: console.log,
  },
  test: {
    url: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    dialectOptions: process.env.PGSSL === "true" ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    logging: false,
  },
};