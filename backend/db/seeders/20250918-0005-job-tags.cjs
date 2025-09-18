/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const rows = [
      // job A (Full-Stack)
      { job_id: "018c-jobA-0000-0000-0000-000000000201", tag_id: "018c-tagN-0000-0000-0000-000000000302" }, // nextjs
      { job_id: "018c-jobA-0000-0000-0000-000000000201", tag_id: "018c-tagn-0000-0000-0000-000000000304" }, // nodejs
      { job_id: "018c-jobA-0000-0000-0000-000000000201", tag_id: "018c-tagT-0000-0000-0000-000000000303" }, // typescript
      { job_id: "018c-jobA-0000-0000-0000-000000000201", tag_id: "018c-tagA-0000-0000-0000-000000000305" }, // aws
      { job_id: "018c-jobA-0000-0000-0000-000000000201", tag_id: "018c-tagP-0000-0000-0000-000000000306" }, // postgresql

      // job B (React)
      { job_id: "018c-jobB-0000-0000-0000-000000000202", tag_id: "018c-tagR-0000-0000-0000-000000000301" }, // react
      { job_id: "018c-jobB-0000-0000-0000-000000000202", tag_id: "018c-tagT-0000-0000-0000-000000000303" }, // typescript

      // job C (DevOps)
      { job_id: "018c-jobC-0000-0000-0000-000000000203", tag_id: "018c-tagA-0000-0000-0000-000000000305" }, // aws
      { job_id: "018c-jobC-0000-0000-0000-000000000203", tag_id: "018c-tagD-0000-0000-0000-000000000307" }, // docker
      { job_id: "018c-jobC-0000-0000-0000-000000000203", tag_id: "018c-tagK-0000-0000-0000-000000000308" }, // kubernetes
      { job_id: "018c-jobC-0000-0000-0000-000000000203", tag_id: "018c-tagO-0000-0000-0000-000000000309" }, // devops (role)
      { job_id: "018c-jobC-0000-0000-0000-000000000203", tag_id: "018c-tagS-0000-0000-0000-00000000030b" }, // senior (seniority)
    ];

    await queryInterface.bulkInsert("job_tags", rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("job_tags", {
      job_id: [
        "018c-jobA-0000-0000-0000-000000000201",
        "018c-jobB-0000-0000-0000-000000000202",
        "018c-jobC-0000-0000-0000-000000000203",
      ],
    });
  },
};
