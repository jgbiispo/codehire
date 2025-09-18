/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const tags = [
      { id: "018c-tagR-0000-0000-0000-000000000301", name: "React", slug: "react", type: "tech" },
      { id: "018c-tagN-0000-0000-0000-000000000302", name: "Next.js", slug: "nextjs", type: "tech" },
      { id: "018c-tagT-0000-0000-0000-000000000303", name: "TypeScript", slug: "typescript", type: "tech" },
      { id: "018c-tagn-0000-0000-0000-000000000304", name: "Node.js", slug: "nodejs", type: "tech" },
      { id: "018c-tagA-0000-0000-0000-000000000305", name: "AWS", slug: "aws", type: "tech" },
      { id: "018c-tagP-0000-0000-0000-000000000306", name: "PostgreSQL", slug: "postgresql", type: "tech" },
      { id: "018c-tagD-0000-0000-0000-000000000307", name: "Docker", slug: "docker", type: "tech" },
      { id: "018c-tagK-0000-0000-0000-000000000308", name: "Kubernetes", slug: "kubernetes", type: "tech" },
      { id: "018c-tagO-0000-0000-0000-000000000309", name: "DevOps", slug: "devops", type: "role" },
      { id: "018c-tagF-0000-0000-0000-00000000030a", name: "Frontend", slug: "frontend", type: "role" },
      { id: "018c-tagS-0000-0000-0000-00000000030b", name: "Senior", slug: "senior", type: "seniority" },
    ];

    await queryInterface.bulkInsert("tags", tags, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("tags", {
      id: [
        "018c-tagR-0000-0000-0000-000000000301",
        "018c-tagN-0000-0000-0000-000000000302",
        "018c-tagT-0000-0000-0000-000000000303",
        "018c-tagn-0000-0000-0000-000000000304",
        "018c-tagA-0000-0000-0000-000000000305",
        "018c-tagP-0000-0000-0000-000000000306",
        "018c-tagD-0000-0000-0000-000000000307",
        "018c-tagK-0000-0000-0000-000000000308",
        "018c-tagO-0000-0000-0000-000000000309",
        "018c-tagF-0000-0000-0000-00000000030a",
        "018c-tagS-0000-0000-0000-00000000030b",
      ],
    });
  },
};
