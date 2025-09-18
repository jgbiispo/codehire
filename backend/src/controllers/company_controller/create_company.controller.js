import { z } from "zod";
import { Company, sequelize } from "../../../db/sequelize.js";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  website: z.url().optional(),
  description: z.string().min(1).max(20000).optional(),
  location: z.string().min(1).max(200).optional(),
  logoUrl: z.url().optional(),
  socials: z.record(z.string(), z.any()).optional(),
});

export default async function createCompany(req, res) {
  const t = await sequelize.transaction();
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token ausente." } });

    const data = bodySchema.parse(req.body);

    const isEmployer = role === "employer";
    if (!isEmployer) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Sem permissão para criar empresas." } });
    }

    const company = await Company.create({
      owner_id: uid,
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''),
      website: data.website || null,
      description_md: data.description || null,
      location: data.location || null,
      logo_url: data.logoUrl || null,
      socials: data.socials || null,
    });

    await t.commit();

    const pub = {
      id: company.id,
      name: company.name,
      slug: company.slug,
    };

    return res.status(201).json({ company: pub });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details: e.errors } });
    }
    console.error("[createCompany.error] Unexpected error:", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL", message: "Erro inesperado." } });
  }
} 