/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const jobs = [
      {
        // FEATURED (approved + featured_until futuro)
        id: "11112222-3333-4444-8888-aaaaaaaa0004",
        company_id: "aaaabbbb-cccc-4ddd-8eee-ffffffff0001", // Nidus
        title: "Platform Engineer (SRE)",
        slug: "platform-engineer-sre",
        description_md: "# Platform Engineer (SRE)\n\nResponsável por confiabilidade, escalabilidade e observabilidade.",
        employment_type: "full_time",
        experience_level: "senior",
        salary_min: 20000,
        salary_max: 32000,
        currency: "BRL",
        remote: true,
        timezone: null,
        visa_sponsorship: false,
        location: "Remote",
        status: "approved",
        featured_until: new Date("2025-10-15T00:00:00Z"),
        requirements: ["Kubernetes", "AWS", "Terraform", "Observability"],
        benefits: ["Remoto", "Plano de saúde", "Home-office stipend"],
        posted_at: new Date("2025-09-15T10:00:00Z"),
        expires_at: new Date("2025-10-30T23:59:59Z"),
      },
      {
        // EXPIRED
        id: "11112222-3333-4444-8888-aaaaaaaa0005",
        company_id: "aaaabbbb-cccc-4ddd-8eee-ffffffff0002", // TechCorp
        title: "Frontend Engineer (React)",
        slug: "frontend-engineer-react",
        description_md: "# Frontend Engineer (React)\n\nFoco em SPAs modernas e performance.",
        employment_type: "full_time",
        experience_level: "pleno",
        salary_min: 13000,
        salary_max: 19000,
        currency: "BRL",
        remote: true,
        timezone: null,
        visa_sponsorship: false,
        location: "Remote",
        status: "expired",
        featured_until: null,
        requirements: ["React", "TypeScript", "Testing", "A11y"],
        benefits: ["Remoto", "VR", "Plano de saúde"],
        posted_at: new Date("2025-08-01T10:00:00Z"),
        expires_at: new Date("2025-09-01T23:59:59Z"),
      },
    ];

    await queryInterface.bulkInsert("jobs", jobs, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("jobs", {
      id: [
        "11112222-3333-4444-8888-aaaaaaaa0004",
        "11112222-3333-4444-8888-aaaaaaaa0005",
      ],
    });
  },
};
