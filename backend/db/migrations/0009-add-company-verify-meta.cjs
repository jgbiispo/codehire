"use strict";
module.exports = {
  async up(q, Sequelize) {
    await q.addColumn("companies", "verified_at", { type: Sequelize.DATE });
    await q.addColumn("companies", "verified_by", {
      type: Sequelize.UUID,
      references: { model: "users", key: "id" }, onDelete: "SET NULL"
    });
  },
  async down(q) {
    await q.removeColumn("companies", "verified_by");
    await q.removeColumn("companies", "verified_at");
  },
};
