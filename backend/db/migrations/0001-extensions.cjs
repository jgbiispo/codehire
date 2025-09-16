"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);
  },
  async down() {
    await queryInterface.sequelize.query(`DROP EXTENSION IF EXISTS "pgcrypto";`);
    await queryInterface.sequelize.query(`DROP EXTENSION IF EXISTS "pg_trgm";`);
  },
};
