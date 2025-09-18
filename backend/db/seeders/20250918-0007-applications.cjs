/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const apps = [
      {
        id: "018c-appA-0000-0000-0000-000000000401",
        user_id: "018c-candA-0000-0000-0000-000000000004",
        job_id: "018c-jobA-0000-0000-0000-000000000201",
        resume_url: "https://cdn.example.com/resumes/carol.pdf",
        cover_letter_md: "Olá, tenho experiência com Next.js/Node...",
        answers: JSON.stringify({ github: "https://github.com/carol", q1: "..." }),
        status: "submitted",
      },
      {
        id: "018c-appB-0000-0000-0000-000000000402",
        user_id: "018c-candB-0000-0000-0000-000000000005",
        job_id: "018c-jobC-0000-0000-0000-000000000203",
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
        "018c-appA-0000-0000-0000-000000000401",
        "018c-appB-0000-0000-0000-000000000402",
      ],
    });
  },
};
