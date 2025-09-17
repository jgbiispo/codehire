"use strict";

const IDs = {
  candidate: "33333333-3333-4333-8333-333333333333",
  job1: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  app1: "abababab-abab-4bab-8bab-abababababab",
};

module.exports = {
  async up(q) {
    await q.bulkInsert("applications", [
      {
        id: IDs.app1,
        job_id: IDs.job1,
        user_id: IDs.candidate,
        resume_url: "https://cdn.example.com/resume.pdf",
        cover_letter_md: "Olá! Tenho X anos de experiência com JS/TS...",
        answers: JSON.stringify({ q1: "resp", q2: 42 }),
        status: "submitted",
      },
    ]);
  },

  async down(q) {
    await q.bulkDelete("applications", { id: IDs.app1 });
  },
};
