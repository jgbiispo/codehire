"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const { UUID, UUIDV4, TEXT, INTEGER, BOOLEAN, DATE, ARRAY } = Sequelize;

    await queryInterface.createTable("jobs", {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      company_id: { type: UUID, allowNull: false, references: { model: "companies", key: "id" }, onDelete: "CASCADE" },
      title: { type: TEXT, allowNull: false },
      slug: { type: TEXT, allowNull: false, unique: true },
      description_md: { type: TEXT, allowNull: false },
      employment_type: { type: "employment_type", allowNull: false },
      experience_level: { type: "experience_level", allowNull: false },
      salary_min: { type: INTEGER, allowNull: false },
      salary_max: { type: INTEGER, allowNull: false },
      currency: { type: Sequelize.CHAR(3), allowNull: false },
      remote: { type: BOOLEAN, allowNull: false },
      timezone: { type: TEXT },
      visa_sponsorship: { type: BOOLEAN, allowNull: false, defaultValue: false },
      location: { type: TEXT, allowNull: false },
      status: { type: "job_status", allowNull: false, defaultValue: "pending" },
      featured_until: { type: DATE },
      requirements: { type: ARRAY(TEXT), allowNull: false, defaultValue: [] },
      benefits: { type: ARRAY(TEXT), allowNull: false, defaultValue: [] },
      posted_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      expires_at: { type: DATE },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addConstraint("jobs", {
      type: "check",
      fields: ["salary_min", "salary_max"],
      name: "salary_range_ok",
      where: { salary_min: { [Sequelize.Op.lte]: Sequelize.col("salary_max") } },
    });

    await queryInterface.addIndex("jobs", ["status", "posted_at"], { name: "idx_jobs_status_posted_at" });
    await queryInterface.addIndex("jobs", ["featured_until"], { name: "idx_jobs_featured_until" });

    // Triggers & índices de busca
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_jobs_set_timestamp ON jobs;
      CREATE TRIGGER trg_jobs_set_timestamp BEFORE UPDATE ON jobs
      FOR EACH ROW EXECUTE FUNCTION set_timestamp();
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs
      USING gin (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description_md,'')));
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("jobs");
  },
};
