/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const companies = [
      {
        id: "018c-compA-0000-0000-0000-000000000101",
        owner_id: "018c-emplA-0000-0000-0000-000000000002",
        name: "Nidus Solutions",
        slug: "nidus-solutions",
        logo_url: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop&crop=center",
        website: "https://nidus.com",
        description_md: "Somos uma empresa de tecnologia focada em soluções remotas e inovadoras.",
        location: "Global",
        verified: true,
        socials: JSON.stringify({ linkedin: "https://linkedin.com/company/nidus" }),
        verified_at: now,
        verified_by: "018c-admin-0000-0000-0000-000000000001",
      },
      {
        id: "018c-compB-0000-0000-0000-000000000102",
        owner_id: "018c-emplB-0000-0000-0000-000000000003",
        name: "TechCorp Brasil",
        slug: "techcorp-brasil",
        logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center",
        website: "https://techcorp.com.br",
        description_md: "Líder em desenvolvimento de software no Brasil.",
        location: "São Paulo, BR",
        verified: true,
        socials: JSON.stringify({ site: "https://techcorp.com.br" }),
        verified_at: now,
        verified_by: "018c-admin-0000-0000-0000-000000000001",
      },
      {
        id: "018c-compC-0000-0000-0000-000000000103",
        owner_id: "018c-emplA-0000-0000-0000-000000000002",
        name: "StartupXYZ",
        slug: "startupxyz",
        logo_url: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&h=100&fit=crop&crop=center",
        website: "https://startupxyz.io",
        description_md: "Startup inovadora em fintech e blockchain.",
        location: "Remote",
        verified: false,
        socials: JSON.stringify({ twitter: "https://x.com/startupxyz" }),
        verified_at: null,
        verified_by: null,
      },
    ];

    await queryInterface.bulkInsert("companies", companies, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("companies", {
      id: [
        "018c-compA-0000-0000-0000-000000000101",
        "018c-compB-0000-0000-0000-000000000102",
        "018c-compC-0000-0000-0000-000000000103",
      ],
    });
  },
};
