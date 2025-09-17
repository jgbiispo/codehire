"use strict";

const IDs = {
  admin: "11111111-1111-4111-8111-111111111111",
  candidate: "33333333-3333-4333-8333-333333333333",
  nidus: "44444444-4444-4444-8444-444444444444",
  techcorp: "55555555-5555-4555-8555-555555555555",
};

module.exports = {
  async up(q) {
    await q.bulkInsert("companies", [
      {
        id: IDs.nidus,
        name: "Nidus Solutions",
        slug: "nidus-solutions",
        logo_url: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop&crop=center",
        website: "https://nidus.com",
        description_md: "Somos uma empresa de tecnologia focada em soluções remotas e inovadoras.",
        location: "Global",
        verified: true,
        verified_at: new Date(),
        verified_by: IDs.admin,
        socials: JSON.stringify({ linkedin: "https://linkedin.com/company/nidus" }),
        owner_id: IDs.nidus,
      },
      {
        id: IDs.techcorp,
        name: "TechCorp Brasil",
        slug: "techcorp-brasil",
        logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center",
        website: "https://techcorp.com.br",
        description_md: "Líder em desenvolvimento de software no Brasil.",
        location: "São Paulo, BR",
        verified: true,
        verified_at: new Date(),
        verified_by: IDs.admin,
        socials: JSON.stringify({ site: "https://techcorp.com.br" }),
        owner_id: IDs.techcorp,
      },
    ]);
  },

  async down(q) {
    await q.bulkDelete("companies", { id: [IDs.nidus, IDs.techcorp] });
  },
};
