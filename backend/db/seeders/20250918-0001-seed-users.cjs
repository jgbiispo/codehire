/** @type {import('sequelize-cli').Migration} */
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const users = [
      {
        id: "018c-admin-0000-0000-0000-000000000001",
        name: "Admin",
        email: "admin@codehire.dev",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "admin",
        avatar_url: null,
        headline: "System Administrator",
        location: "Remote",
      },
      {
        id: "018c-emplA-0000-0000-0000-000000000002",
        name: "Alice Employer",
        email: "alice@nidus.com",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "employer",
        avatar_url: null,
        headline: "Head of Engineering",
        location: "Global",
      },
      {
        id: "018c-emplB-0000-0000-0000-000000000003",
        name: "Bob Employer",
        email: "bob@techcorp.com.br",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "employer",
        avatar_url: null,
        headline: "Eng Manager",
        location: "São Paulo, BR",
      },
      {
        id: "018c-candA-0000-0000-0000-000000000004",
        name: "Carol Candidate",
        email: "carol@example.com",
        password_hash: bcrypt.hashSync("Password123!", 10),
        role: "candidate",
        avatar_url: null,
        headline: "Full-Stack Developer",
        location: "São Paulo, SP",
      },
      {
        id: "018c-candB-0000-0000-0000-000000000005",
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
        "018c-admin-0000-0000-0000-000000000001",
        "018c-emplA-0000-0000-0000-000000000002",
        "018c-emplB-0000-0000-0000-000000000003",
        "018c-candA-0000-0000-0000-000000000004",
        "018c-candB-0000-0000-0000-000000000005",
      ],
    });
  },
};
