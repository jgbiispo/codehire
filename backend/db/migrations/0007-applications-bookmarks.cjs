"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const { UUID, UUIDV4, TEXT, JSONB, DATE } = Sequelize;

    await queryInterface.createTable("applications", {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      job_id: { type: UUID, allowNull: false, references: { model: "jobs", key: "id" }, onDelete: "CASCADE" },
      user_id: { type: UUID, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      resume_url: { type: TEXT, allowNull: false },
      cover_letter_md: { type: TEXT },
      answers: { type: JSONB },
      status: { type: "application_status", allowNull: false, defaultValue: "submitted" },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addConstraint("applications", {
      type: "unique",
      fields: ["job_id", "user_id"],
      name: "uniq_applications_job_user",
    });
    await queryInterface.addIndex("applications", ["job_id", "status"], { name: "idx_applications_job_status" });

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_applications_set_timestamp ON applications;
      CREATE TRIGGER trg_applications_set_timestamp BEFORE UPDATE ON applications
      FOR EACH ROW EXECUTE FUNCTION set_timestamp();
    `);

    await queryInterface.createTable("bookmarks", {
      user_id: { type: UUID, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      job_id: { type: UUID, allowNull: false, references: { model: "jobs", key: "id" }, onDelete: "CASCADE" },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addConstraint("bookmarks", { type: "primary key", fields: ["user_id", "job_id"], name: "pk_bookmarks" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bookmarks");
    await queryInterface.dropTable("applications");
  },
};
