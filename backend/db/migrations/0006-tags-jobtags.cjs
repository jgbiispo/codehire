"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const { UUID, UUIDV4, TEXT, DATE } = Sequelize;
    await queryInterface.createTable("tags", {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      name: { type: TEXT, allowNull: false },
      slug: { type: TEXT, allowNull: false, unique: true },
      type: { type: "tag_type", allowNull: false, defaultValue: "tech" },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_tags_name_trgm ON tags USING gin (name gin_trgm_ops);`);

    await queryInterface.createTable("job_tags", {
      job_id: { type: UUID, allowNull: false, references: { model: "jobs", key: "id" }, onDelete: "CASCADE" },
      tag_id: { type: UUID, allowNull: false, references: { model: "tags", key: "id" }, onDelete: "CASCADE" },
    });
    await queryInterface.addConstraint("job_tags", { type: "primary key", fields: ["job_id", "tag_id"], name: "pk_job_tags" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("job_tags");
    await queryInterface.dropTable("tags");
  },
};
