import { z } from "zod";
import { Company } from "../../../db/sequelize.js";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  website: z.url().optional(),
  description: z.string().min(1).max(20000).optional(),
  location: z.string().min(1).max(200).optional(),
  logoUrl: z.url().optional(),
  socials: z.record(z.string(), z.any()).optional(),
});

export default async function updateCompany(req, res) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token ausente." } });

    const { id } = paramsSchema.parse(req.params);
    const data = bodySchema.parse(req.body);

    const company = await Company.findByPk(id, { attributes: ["id", "owner_id", "name", "slug", "logo_url", "website", "description_md", "location", "verified", "socials"] });
    if (!company) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Empresa não encontrada." } });

    // Permissão: admin OU owner
    const isAdmin = role === "admin";
    const isOwner = company.owner_id === uid;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Sem permissão para editar esta empresa." } });
    }

    if (data.name !== undefined) company.name = data.name;
    if (data.website !== undefined) company.website = data.website;
    if (data.description !== undefined) company.description_md = data.description;
    if (data.location !== undefined) company.location = data.location;
    if (data.logoUrl !== undefined) company.logo_url = data.logoUrl;
    if (data.socials !== undefined) company.socials = data.socials;

    await company.save();

    const c = company.get({ plain: true });
    return res.json({
      id: c.id,
      name: c.name,
      slug: c.slug,
      logoUrl: c.logo_url,
      website: c.website,
      description: c.description_md,
      location: c.location,
      verified: c.verified,
      socials: c.socials || null,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details: e.errors } });
    }
    console.error("[updateCompany.error]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL", message: "Erro inesperado." } });
  }
}
