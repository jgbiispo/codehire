"use strict";

const IDs = {
  nidus: "44444444-4444-4444-8444-444444444444",
  techcorp: "55555555-5555-4555-8555-555555555555",
  job1: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  job2: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  job3: "12121212-1212-4121-8121-121212121212",
};

module.exports = {
  async up(q, Sequelize) {
    await q.bulkInsert("jobs", [
      {
        id: IDs.job1,
        company_id: IDs.nidus,
        title: "Senior Full-Stack Engineer",
        slug: "senior-full-stack-engineer",
        description_md: "Stack: **Next.js**, **Node.js**, **AWS**.\nBenefícios: remoto, horários flexíveis.",
        employment_type: "full_time",
        experience_level: "senior",
        salary_min: 18000,
        salary_max: 28000,
        currency: "BRL",
        remote: true,
        timezone: "UTC-3 ±3",
        visa_sponsorship: false,
        location: "Remote",
        status: "approved",
        featured_until: null,
        requirements: Sequelize.literal(`ARRAY['5+ anos com JS/TS','React/Next','Node','SQL']`),
        benefits: Sequelize.literal(`ARRAY['Remoto','Plano de saúde','Budget equipamento']`),
        posted_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: IDs.job2,
        company_id: IDs.techcorp,
        title: "React Developer",
        slug: "react-developer",
        description_md: "Frontend moderno com **React**.",
        employment_type: "full_time",
        experience_level: "pleno",
        salary_min: 12000,
        salary_max: 18000,
        currency: "BRL",
        remote: false,
        timezone: null,
        visa_sponsorship: false,
        location: "São Paulo, SP",
        status: "approved",
        featured_until: null,
        requirements: Sequelize.literal(`ARRAY['3+ anos com React','CSS/SASS','Git']`),
        benefits: Sequelize.literal(`ARRAY['CLT','VR R$600','Plano de saúde','Gympass']`),
        posted_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: IDs.job3,
        company_id: IDs.nidus,
        title: "Frontend Developer - Vue.js",
        slug: "frontend-developer-vuejs",
        description_md: "Buscamos dev **Vue.js**. Projeto inovador.",
        employment_type: "full_time",
        experience_level: "pleno",
        salary_min: 14000,
        salary_max: 20000,
        currency: "BRL",
        remote: true,
        timezone: null,
        visa_sponsorship: false,
        location: "Remote",
        status: "pending", // pendente (sem posted_at)
        featured_until: null,
        requirements: Sequelize.literal(`ARRAY['2+ anos com Vue.js','Nuxt.js','CSS moderno','APIs REST']`),
        benefits: Sequelize.literal(`ARRAY['Remoto','CLT','Plano de saúde','Férias flexíveis']`),
        posted_at: null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);
  },

  async down(q) {
    await q.bulkDelete("jobs", { slug: ["senior-full-stack-engineer", "react-developer", "frontend-developer-vuejs"] });
  },
};
