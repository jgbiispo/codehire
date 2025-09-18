/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const rows = [
      // job A (Full-Stack)
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0001", tag_id: "aaaa0000-0000-4000-8000-000000000302" }, // nextjs
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0001", tag_id: "aaaa0000-0000-4000-8000-000000000304" }, // nodejs
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0001", tag_id: "aaaa0000-0000-4000-8000-000000000303" }, // typescript
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0001", tag_id: "aaaa0000-0000-4000-8000-000000000305" }, // aws
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0001", tag_id: "aaaa0000-0000-4000-8000-000000000306" }, // postgresql

      // job B (React)
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0002", tag_id: "aaaa0000-0000-4000-8000-000000000301" }, // react
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0002", tag_id: "aaaa0000-0000-4000-8000-000000000303" }, // typescript

      // job C (DevOps)
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0003", tag_id: "aaaa0000-0000-4000-8000-000000000305" }, // aws
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0003", tag_id: "aaaa0000-0000-4000-8000-000000000307" }, // docker
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0003", tag_id: "aaaa0000-0000-4000-8000-000000000308" }, // kubernetes
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0003", tag_id: "aaaa0000-0000-4000-8000-000000000309" }, // devops (role)
      { job_id: "11112222-3333-4444-8888-aaaaaaaa0003", tag_id: "aaaa0000-0000-4000-8000-00000000030b" }, // senior (seniority)
    ];

    await queryInterface.bulkInsert("job_tags", rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("job_tags", {
      job_id: [
        "11112222-3333-4444-8888-aaaaaaaa0001",
        "11112222-3333-4444-8888-aaaaaaaa0002",
        "11112222-3333-4444-8888-aaaaaaaa0003",
      ],
    });
  },
};
