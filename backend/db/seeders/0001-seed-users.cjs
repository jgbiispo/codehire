"use strict";
const bcrypt = require("bcrypt");

const IDs = {
  admin: "11111111-1111-4111-8111-111111111111",
  nidus: "44444444-4444-4444-8444-444444444444",
  techcorp: "55555555-5555-4555-8555-555555555555",
  candidate: "33333333-3333-4333-8333-333333333333",
};

module.exports = {
  async up(queryInterface) {
    const [adminHash, nidusHash, techHash, candidateHash] = await Promise.all([
      bcrypt.hash("Admin#123", 12),
      bcrypt.hash("Nidus#123", 12),
      bcrypt.hash("Tech#123", 12),
      bcrypt.hash("StrongPass#123", 12),
    ]);

    await queryInterface.bulkInsert("users", [
      { id: IDs.admin, name: "Admin", email: "admin@example.com", password_hash: adminHash, role: "admin" },
      { id: IDs.nidus, name: "Nidus", email: "nidus@example.com", password_hash: nidusHash, role: "employer" },
      { id: IDs.techcorp, name: "Tech", email: "tech@example.com", password_hash: techHash, role: "employer" },
      { id: IDs.candidate, name: "Maria Dev", email: "maria.dev@example.com", password_hash: candidateHash, role: "candidate", headline: "Full-Stack JS", location: "São Paulo, SP" },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      id: [IDs.admin, IDs.employer, IDs.candidate],
    });
  },
};
