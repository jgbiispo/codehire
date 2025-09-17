import { z } from "zod";
import { Job, Tag } from "../../../db/sequelize.js";

const paramsSchema = z.object({
  id: z.uuid(),
});

const bodySchema = z.object({
  title: z.string().min(3).max(140).optional(),
  descriptionMd: z.string().min(1).max(20000).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]).optional(),
  experienceLevel: z.enum(["junior", "pleno", "senior", "lead"]).optional(),
  salaryMin: z.coerce.number().int().min(0).nullable().optional(),
  salaryMax: z.coerce.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).transform(s => s.toUpperCase()).optional(),
  remote: z.coerce.boolean().optional(),
  timezone: z.string().max(120).optional(),
  visaSponsorship: z.coerce.boolean().optional(),
  location: z.string().max(160).optional(),
  status: z.enum(["draft", "pending", "approved", "rejected", "expired"]).optional(),
  featuredUntil: z.coerce.date().optional(),
  postedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  requirements: z.array(z.string().min(1)).max(100).optional(),
  benefits: z.array(z.string().min(1)).max(100).optional(),
  tags: z.array(z.union([z.string(), z.object({ name: z.string(), slug: z.string().optional(), type: z.enum(["tech", "role", "seniority", "other"]).optional() })])).optional()
}).refine(
  d => (d.salaryMin == null && d.salaryMax == null) || (d.salaryMin != null && d.salaryMax != null && d.salaryMin <= d.salaryMax),
  { message: "salaryMin deve ser <= salaryMax quando ambos forem enviados.", path: ["salaryMin"] }
);

export default async function updateJob(req, res) {
  try {
    const uid = req.user?.id;
    const { id } = paramsSchema.parse(req.params);
    const payload = bodySchema.parse(req.body);

    const job = await Job.findByPk(id);
    if (!job) { await t.rollback(); return res.status(404).json({ error: { code: "JOB_NOT_FOUND" } }); }

    const isAdmin = req.user?.role === "admin";
    const isOwner = job.company_id === uid;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Você não pode editar esta vaga." } });
    }

    if (payload.title !== undefined) {
      job.title = payload.title;
      job.slug = payload.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    }

    if (payload.descriptionMd !== undefined) job.description_md = payload.descriptionMd;
    if (payload.employmentType !== undefined) job.employment_type = payload.employmentType;
    if (payload.experienceLevel !== undefined) job.experience_level = payload.experienceLevel;
    if (payload.salaryMin !== undefined) job.salary_min = payload.salaryMin;
    if (payload.salaryMax !== undefined) job.salary_max = payload.salaryMax;
    if (payload.currency !== undefined) job.currency = payload.currency;
    if (payload.remote !== undefined) job.remote = payload.remote;
    if (payload.timezone !== undefined) job.timezone = payload.timezone;
    if (payload.visaSponsorship !== undefined) job.visa_sponsorship = payload.visaSponsorship;
    if (payload.location !== undefined) job.location = payload.location;
    if (payload.expiresAt !== undefined) job.expires_at = payload.expiresAt;
    if (payload.requirements !== undefined) job.requirements = payload.requirements;
    if (payload.benefits !== undefined) job.benefits = payload.benefits;
    if (payload.featuredUntil !== undefined) job.featured_until = payload.featuredUntil;
    if (payload.postedAt !== undefined) job.posted_at = payload.postedAt;

    const status = isAdmin ? (payload.status || job.status) : job.status;
    if (status) job.status = status;

    if (payload.tags !== undefined) {
      const tagRecords = [];
      for (const tagInput of payload.tags) {
        let tag;
        if (typeof tagInput === "string") {
          tag = await Tag.findOne({ where: { slug: tagInput } });
          if (!tag) {
            const name = tagInput.replace(/-/g, " ");
            const slug = tagInput.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
            tag = await Tag.create({ name, slug, type: "other" }, { transaction: t });
          }
        } else if (typeof tagInput === "object" && tagInput.name) {
          const slug = tagInput.slug
            ? tagInput.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "")
            : tagInput.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
          tag = await Tag.findOne({ where: { slug } });
          if (!tag) {
            tag = await Tag.create({ name: tagInput.name, slug, type: tagInput.type || "other" }, { transaction: t });
          }
        }
        if (tag) tagRecords.push(tag);
      }

      await job.setTags(tagRecords);
    }

    await job.save();

    const j = job.get({ plain: true });

    const pub = {
      id: j.id,
      title: j.title,
      slug: j.slug,
    }

    return res.json(pub);

  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details: e.errors } });
    }
    console.error("[jobs.update]", e);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Erro inesperado." } });
  }
}