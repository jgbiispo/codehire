"use strict";

async function ensureEnum(qi, name, values) {
  const [rows] = await qi.sequelize.query(
    `SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = :name) AS "exists"`,
    { replacements: { name } }
  );
  if (!rows[0].exists) {
    const vals = values.map((v) => qi.sequelize.escape(v)).join(", ");
    await qi.sequelize.query(`CREATE TYPE "${name}" AS ENUM (${vals});`);
  }
}

module.exports = {
  async up(queryInterface /*, Sequelize */) {
    await ensureEnum(queryInterface, "role", ["candidate", "employer", "admin"]);
    await ensureEnum(queryInterface, "employment_type", ["full_time", "part_time", "contract", "internship", "temporary"]);
    await ensureEnum(queryInterface, "experience_level", ["junior", "pleno", "senior", "lead"]);
    await ensureEnum(queryInterface, "job_status", ["draft", "pending", "approved", "rejected", "expired"]);
    await ensureEnum(queryInterface, "application_status", ["submitted", "in_review", "shortlisted", "rejected", "hired"]);
    await ensureEnum(queryInterface, "tag_type", ["tech", "role", "seniority", "other"]);
  },

  async down(queryInterface /*, Sequelize */) {
    // IMPORTANTE: só derrube os tipos depois de remover as tabelas que os usam
    // (ou o down de 0003+ já terá dropado as tabelas).
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "tag_type";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "application_status";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "job_status";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "experience_level";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "employment_type";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "role";`);
  },
};
