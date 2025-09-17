"use strict";
const { randomUUID } = require("crypto");
const bcrypt = require("bcrypt");

const IDs = {
  admin: "11111111-1111-4111-8111-111111111111",
  employer: "22222222-2222-4222-8222-222222222222",
  candidate: "33333333-3333-4333-8333-333333333333",
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const [adminHash, employerHash, candidateHash] = await Promise.all([
      bcrypt.hash("Admin#123", 12),
      bcrypt.hash("Owner#123", 12),
      bcrypt.hash("StrongPass#123", 12),
    ]);

    await queryInterface.bulkInsert("users", [
      { id: IDs.admin, name: "Admin", email: "admin@example.com", password_hash: adminHash, role: "admin" },
      { id: IDs.employer, name: "Empresa Owner", email: "owner@example.com", password_hash: employerHash, role: "employer" },
      { id: IDs.candidate, name: "Maria Dev", email: "maria.dev@example.com", password_hash: candidateHash, role: "candidate", headline: "Full-Stack JS", location: "São Paulo, SP" },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", {
      id: [IDs.admin, IDs.employer, IDs.candidate],
    });
  },
};
