/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const tags = [
      { id: "aaaa0000-0000-4000-8000-000000000301", name: "React", slug: "react", type: "tech" },
      { id: "aaaa0000-0000-4000-8000-000000000302", name: "Next.js", slug: "nextjs", type: "tech" },
      { id: "aaaa0000-0000-4000-8000-000000000303", name: "TypeScript", slug: "typescript", type: "tech" },
      { id: "aaaa0000-0000-4000-8000-000000000304", name: "Node.js", slug: "nodejs", type: "tech" },
      { id: "aaaa0000-0000-4000-8000-000000000305", name: "AWS", slug: "aws", type: "tech" },
      { id: "aaaa0000-0000-4000-8000-000000000306", name: "PostgreSQL", slug: "postgresql", type: "tech" },
      { id: "aaaa0000-0000-4000-8000-000000000307", name: "Docker", slug: "docker", type: "tech" },
      { id: "aaaa0000-0000-4000-8000-000000000308", name: "Kubernetes", slug: "kubernetes", type: "tech" },
      { id: "aaaa0000-0000-4000-8000-000000000309", name: "DevOps", slug: "devops", type: "role" },
      { id: "aaaa0000-0000-4000-8000-00000000030a", name: "Frontend", slug: "frontend", type: "role" },
      { id: "aaaa0000-0000-4000-8000-00000000030b", name: "Senior", slug: "senior", type: "seniority" },
    ];

    await queryInterface.bulkInsert("tags", tags, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("tags", {
      id: [
        "aaaa0000-0000-4000-8000-000000000301",
        "aaaa0000-0000-4000-8000-000000000302",
        "aaaa0000-0000-4000-8000-000000000303",
        "aaaa0000-0000-4000-8000-000000000304",
        "aaaa0000-0000-4000-8000-000000000305",
        "aaaa0000-0000-4000-8000-000000000306",
        "aaaa0000-0000-4000-8000-000000000307",
        "aaaa0000-0000-4000-8000-000000000308",
        "aaaa0000-0000-4000-8000-000000000309",
        "aaaa0000-0000-4000-8000-00000000030a",
        "aaaa0000-0000-4000-8000-00000000030b",
      ],
    });
  },
};
