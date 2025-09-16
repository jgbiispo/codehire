"use strict";

module.exports = {
  async up(queryInterface) {
    // extensões
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`); // opcional, caso algo referencie uuid_generate_v4()

    // Troca os defaults para gen_random_uuid() (idempotente e sem DO $$)
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

    // Se seu refresh_tokens.id é jti que você define no app, não precisa default.
    // Mas se quiser ter fallback, pode setar também:
    // await queryInterface.sequelize.query(`ALTER TABLE refresh_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
  },

  async down(queryInterface) {
    // opcional: remover defaults
    const tables = ["users", "companies", "jobs", "tags", "applications"];
    for (const t of tables) {
      await queryInterface.sequelize.query(`
        ALTER TABLE ${t}
        ALTER COLUMN id DROP DEFAULT;
      `);
    }
  },
};
