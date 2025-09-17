"use strict";

const IDs = {
  job1: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  job2: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  job3: "12121212-1212-4121-8121-121212121212",
  nextjs: "66666666-6666-4666-8666-666666666666",
  node: "77777777-7777-4777-8777-777777777777",
  ts: "88888888-8888-4888-8888-888888888888",
  aws: "99999999-9999-4999-8999-999999999999",
  pg: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  react: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  devops: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  k8s: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
};

module.exports = {
  async up(q) {
    await q.bulkInsert("job_tags", [
      // job1
      { job_id: IDs.job1, tag_id: IDs.nextjs },
      { job_id: IDs.job1, tag_id: IDs.node },
      { job_id: IDs.job1, tag_id: IDs.ts },
      { job_id: IDs.job1, tag_id: IDs.aws },
      { job_id: IDs.job1, tag_id: IDs.pg },
      // job2
      { job_id: IDs.job2, tag_id: IDs.react },
      { job_id: IDs.job2, tag_id: IDs.ts },
      // job3 (Vue não temos; deixamos vazio ou só TS)
      { job_id: IDs.job3, tag_id: IDs.ts },
    ]);
  },

  async down(q) {
    await q.bulkDelete("job_tags", null, {});
  },
};
