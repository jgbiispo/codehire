"use strict";

const IDs = {
  candidate: "33333333-3333-4333-8333-333333333333",
  job1: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
};

module.exports = {
  async up(q) {
    await q.bulkInsert("bookmarks", [
      { user_id: IDs.candidate, job_id: IDs.job1, created_at: new Date() },
    ]);
  },

  async down(q) {
    await q.bulkDelete("bookmarks", { user_id: IDs.candidate, job_id: IDs.job1 });
  },
};
