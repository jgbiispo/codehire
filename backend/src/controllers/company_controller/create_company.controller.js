import { z } from "zod";
import { Company, sequelize } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  website: z.url().optional(),
  description: z.string().min(1).max(20000).optional(),
  location: z.string().min(1).max(200).optional(),
  logoUrl: z.url().optional(),
  socials: z.record(z.string(), z.any()).optional(),
});

export default async function createCompany(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) throw httpError(401, "UNAUTHORIZED", "Token ausente.");

    const data = bodySchema.parse(req.body);

    const isEmployer = role === "employer";
    if (!isEmployer) {
      throw httpError(403, "FORBIDDEN", "Apenas empregadores podem criar empresas.");
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
    next(e);
  }
} 