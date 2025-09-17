import { z } from "zod";
import { Company, Job, Tag } from "../../../db/sequelize.js";

const paramsSchema = z.object({
  slug: z.string().min(1),
});

export default async function getJobBySlug(req, res) {
  try {
    const { slug } = paramsSchema.parse(req.params);

    const job = await Job.findOne({
      where: { slug, status: "approved" },
      include: [
        { model: Company, as: "company", attributes: ["id", "name", "slug", "logo_url", "website", "verified"] },
        { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },
      ],
    });

    if (!job) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Vaga não encontrada." } });
    }

    const j = job.get({ plain: true });

    const pub = {
      id: j.id,
      title: j.title,
      slug: j.slug,
      description: j.description_md,
      employmentType: j.employment_type,
      experienceLevel: j.experience_level,
      salary: { min: j.salary_min, max: j.salary_max, currency: j.currency },
      remote: j.remote,
      timezone: j.timezone,
      visaSponsorship: j.visa_sponsorship,
      location: j.location,
      status: j.status,
      featuredUntil: j.featured_until,
      postedAt: j.posted_at,
      expiresAt: j.expires_at,
    }

    return res.json(pub);

  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "INVALID_REQUEST", message: e.errors.map(err => err.message).join(", ") } });
    }
    console.error(e);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ocorreu um erro interno." } });
  }
}