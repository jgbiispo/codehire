/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const jobs = [
      {
        id: "018c-jobA-0000-0000-0000-000000000201",
        company_id: "018c-compA-0000-0000-0000-000000000101",
        title: "Senior Full-Stack Engineer",
        slug: "senior-full-stack-engineer",
        description_md: "# Sobre a vaga\n\nEstamos procurando um **Senior Full-Stack Engineer**...",
        employment_type: "full_time",
        experience_level: "senior",
        salary_min: 18000,
        salary_max: 28000,
        currency: "BRL",
        remote: true,
        timezone: null,
        visa_sponsorship: false,
        location: "Remote",
        status: "approved",
        featured_until: null,
        requirements: JSON.stringify([
          "5+ anos com JavaScript/TypeScript",
          "Experiência sólida com React/Next.js",
          "APIs Node.js e SQL"
        ]),
        benefits: JSON.stringify([
          "Trabalho 100% remoto",
          "Plano de saúde",
          "Budget para equipamentos"
        ]),
        posted_at: new Date("2025-09-10T10:00:00Z"),
        expires_at: new Date("2025-10-10T23:59:59Z"),
      },
      {
        id: "018c-jobB-0000-0000-0000-000000000202",
        company_id: "018c-compB-0000-0000-0000-000000000102",
        title: "React Developer",
        slug: "react-developer",
        description_md: "# Vaga: React Developer\n\nProcuramos um dev React...",
        employment_type: "full_time",
        experience_level: "mid",
        salary_min: 12000,
        salary_max: 18000,
        currency: "BRL",
        remote: false,
        timezone: null,
        visa_sponsorship: false,
        location: "São Paulo, SP",
        status: "pending",   // pending -> posted_at pode ser null
        featured_until: null,
        requirements: JSON.stringify(["3+ anos com React", "CSS/SASS", "Git"]),
        benefits: JSON.stringify(["CLT", "VR R$ 600", "Plano de saúde"]),
        posted_at: null,
        expires_at: new Date("2025-10-12T23:59:59Z"),
      },
      {
        id: "018c-jobC-0000-0000-0000-000000000203",
        company_id: "018c-compC-0000-0000-0000-000000000103",
        title: "DevOps Engineer",
        slug: "devops-engineer",
        description_md: "# DevOps Engineer - Remoto\n\nOportunidade em fintech...",
        employment_type: "contract",
        experience_level: "senior",
        salary_min: 15000,
        salary_max: 25000,
        currency: "BRL",
        remote: true,
        timezone: null,
        visa_sponsorship: false,
        location: "Remote",
        status: "approved",
        featured_until: null,
        requirements: JSON.stringify(["AWS", "Docker/Kubernetes", "CI/CD"]),
        benefits: JSON.stringify(["PJ", "Horário flexível", "Equity"]),
        posted_at: new Date("2025-09-13T09:15:00Z"),
        expires_at: new Date("2025-10-13T23:59:59Z"),
      },
    ];

    await queryInterface.bulkInsert("jobs", jobs, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("jobs", {
      id: [
        "018c-jobA-0000-0000-0000-000000000201",
        "018c-jobB-0000-0000-0000-000000000202",
        "018c-jobC-0000-0000-0000-000000000203",
      ],
    });
  },
};
