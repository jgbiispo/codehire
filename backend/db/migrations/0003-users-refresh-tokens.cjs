"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { UUID, UUIDV4, STRING, TEXT, DATE, INET, BOOLEAN } = Sequelize;

    await queryInterface.createTable("users", {
      id: { type: UUID, allowNull: false, primaryKey: true, defaultValue: UUIDV4 },
      name: { type: TEXT, allowNull: false },
      email: { type: TEXT, allowNull: false, unique: true },
      password_hash: { type: TEXT, allowNull: false },
      role: { type: "role", allowNull: false, defaultValue: "candidate" },
      avatar_url: { type: TEXT },
      headline: { type: TEXT },
      location: { type: TEXT },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addIndex("users", ["email"], { name: "idx_users_email" });

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_timestamp() RETURNS trigger AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_users_set_timestamp ON users;
      CREATE TRIGGER trg_users_set_timestamp BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_timestamp();
    `);

    await queryInterface.createTable("refresh_tokens", {
      id: { type: UUID, allowNull: false, primaryKey: true }, // jti
      user_id: {
        type: UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      token_hash: { type: TEXT, allowNull: false, unique: true },
      user_agent: { type: TEXT },
      ip: { type: INET },
      expires_at: { type: DATE, allowNull: false },
      revoked_at: { type: DATE },
    });
    await queryInterface.addIndex("refresh_tokens", ["user_id"], { name: "idx_refresh_tokens_user" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("refresh_tokens");
    await queryInterface.dropTable("users");
  },
};
