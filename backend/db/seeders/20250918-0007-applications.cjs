/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const apps = [
      {
        id: "bbbb0000-0000-4000-8000-000000000401",
        user_id: "44444444-4444-4444-8444-444444444444", // Carol
        job_id: "11112222-3333-4444-8888-aaaaaaaa0001", // Full-Stack
        resume_url: "https://cdn.example.com/resumes/carol.pdf",
        cover_letter_md: "Olá, tenho experiência com Next.js/Node...",
        answers: JSON.stringify({ github: "https://github.com/carol", q1: "..." }),
        status: "submitted",
      },
      {
        id: "bbbb0000-0000-4000-8000-000000000402",
        user_id: "55555555-5555-4555-8555-555555555555", // Dave
        job_id: "11112222-3333-4444-8888-aaaaaaaa0003", // DevOps
        resume_url: "https://cdn.example.com/resumes/dave.pdf",
        cover_letter_md: "Experiência forte em AWS, Docker, K8s...",
        answers: JSON.stringify({ github: "https://github.com/dave", q1: "..." }),
        status: "in_review",
      },
    ];

    await queryInterface.bulkInsert("applications", apps, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("applications", {
      id: [
        "bbbb0000-0000-4000-8000-000000000401",
        "bbbb0000-0000-4000-8000-000000000402",
      ],
    });
  },
};
