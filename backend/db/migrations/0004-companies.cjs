"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const { UUID, UUIDV4, TEXT, JSONB, DATE, BOOLEAN } = Sequelize;
    await queryInterface.createTable("companies", {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      name: { type: TEXT, allowNull: false },
      slug: { type: TEXT, allowNull: false, unique: true },
      logo_url: { type: TEXT },
      website: { type: TEXT },
      description_md: { type: TEXT, allowNull: false },
      location: { type: TEXT, allowNull: false },
      verified: { type: BOOLEAN, allowNull: false, defaultValue: false },
      owner_id: { type: UUID, references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      socials: { type: JSONB },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_companies_set_timestamp ON companies;
      CREATE TRIGGER trg_companies_set_timestamp BEFORE UPDATE ON companies
      FOR EACH ROW EXECUTE FUNCTION set_timestamp();
    `);

    await queryInterface.addIndex("companies", [{ attribute: "name", collate: "default" }], {
      name: "idx_companies_name_trgm",
      using: "gin",
      operator: "gin_trgm_ops",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("companies");
  },
};
