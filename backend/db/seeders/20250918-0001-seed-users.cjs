/** @type {import('sequelize-cli').Migration} */
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface) {
    const users = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Admin",
        email: "admin@codehire.dev",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "admin",
        avatar_url: null,
        headline: "System Administrator",
        location: "Remote",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Alice Employer",
        email: "alice@nidus.com",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "employer",
        avatar_url: null,
        headline: "Head of Engineering",
        location: "Global",
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Bob Employer",
        email: "bob@techcorp.com.br",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "employer",
        avatar_url: null,
        headline: "Eng Manager",
        location: "São Paulo, BR",
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        name: "Carol Candidate",
        email: "carol@example.com",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "candidate",
        avatar_url: null,
        headline: "Full-Stack Developer",
        location: "São Paulo, SP",
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        name: "Dave Candidate",
        email: "dave@example.com",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "candidate",
        avatar_url: null,
        headline: "DevOps Engineer",
        location: "Remote",
      },
    ];
    await queryInterface.bulkInsert("users", users, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      id: [
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "33333333-3333-4333-8333-333333333333",
        "44444444-4444-4444-8444-444444444444",
        "55555555-5555-4555-8555-555555555555",
      ],
    });
  },
};
