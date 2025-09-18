/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [
      // Carol salva Full-Stack e DevOps
      {
        user_id: "44444444-4444-4444-8444-444444444444",
        job_id: "11112222-3333-4444-8888-aaaaaaaa0001",
        created_at: now,
      },
      {
        user_id: "44444444-4444-4444-8444-444444444444",
        job_id: "11112222-3333-4444-8888-aaaaaaaa0003",
        created_at: now,
      },
      // Dave salva React
      {
        user_id: "55555555-5555-4555-8555-555555555555",
        job_id: "11112222-3333-4444-8888-aaaaaaaa0002",
        created_at: now,
      },
    ];

    await queryInterface.bulkInsert("bookmarks", rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("bookmarks", {
      user_id: [
        "44444444-4444-4444-8444-444444444444",
        "55555555-5555-4555-8555-555555555555",
      ],
    });
  },
};
