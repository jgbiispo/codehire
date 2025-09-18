/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const rows = [
      // Carol salva Full-Stack e DevOps
      {
        user_id: "018c-candA-0000-0000-0000-000000000004",
        job_id: "018c-jobA-0000-0000-0000-000000000201",
        created_at: new Date(),
      },
      {
        user_id: "018c-candA-0000-0000-0000-000000000004",
        job_id: "018c-jobC-0000-0000-0000-000000000203",
        created_at: new Date(),
      },
      // Dave salva React
      {
        user_id: "018c-candB-0000-0000-0000-000000000005",
        job_id: "018c-jobB-0000-0000-0000-000000000202",
        created_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("bookmarks", rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("bookmarks", {
      user_id: [
        "018c-candA-0000-0000-0000-000000000004",
        "018c-candB-0000-0000-0000-000000000005",
      ],
    });
  },
};
