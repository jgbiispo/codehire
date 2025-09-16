import { z } from "zod";
import { Company, Job, Tag } from "../../../db/sequelize.js";

const paramsSchema = z.object({
  slug: z.string().min(1),
});

export default async function getCompanyBySlug(req, res) {
  try {
    const { slug } = paramsSchema.parse(req.params);

    const company = await Company.findOne({
      where: { slug },
      include: [
        {
          model: Job,
          as: "jobs",
          where: { status: "approved" },
          required: false,
          attributes: [
            "id", "title", "slug", "location", "remote", "employment_type", "experience_level",
            "salary_min", "salary_max", "currency", "posted_at", "expires_at", "featured_until", "status",
          ],
          include: [{ model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } }],
          order: [["posted_at", "DESC"]],
        },
      ],
    });

    if (!company) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Empresa não encontrada." } });
    }

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
      jobs: (c.jobs || []).map((j) => ({
        id: j.id,
        title: j.title,
        slug: j.slug,
        location: j.location,
        remote: j.remote,
        employmentType: j.employment_type,
        experienceLevel: j.experience_level,
        salary: { min: j.salary_min, max: j.salary_max, currency: j.currency },
        postedAt: j.posted_at,
        expiresAt: j.expires_at,
        featuredUntil: j.featured_until,
        status: j.status,
        tags: (j.tags || []).map((t) => ({ id: t.id, name: t.name, slug: t.slug, type: t.type })),
      })),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos.", details: e.errors } });
    }
    console.error("[companies.getBySlug]", e);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Erro inesperado." } });
  }
}
