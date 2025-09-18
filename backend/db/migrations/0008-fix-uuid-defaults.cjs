"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    const tables = [
      "users",
      "companies",
      "jobs",
      "tags",
      "applications"
    ];
    for (const t of tables) {
      await queryInterface.sequelize.query(`
        ALTER TABLE ${t}
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
      `);
    }

    await queryInterface.sequelize.query(`ALTER TABLE refresh_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
  },

  async down(queryInterface) {
    const tables = ["users", "companies", "jobs", "tags", "applications"];
    for (const t of tables) {
      await queryInterface.sequelize.query(`
        ALTER TABLE ${t}
        ALTER COLUMN id DROP DEFAULT;
      `);
    }
  },
};
