import { z } from "zod";
import { Company, sequelize, Job, Tag } from "../../../db/sequelize.js";
import { slugify, uniqueJobSlug } from "../../utils/slug.util.js";

const paramsSchema = z.object({ id: z.uuid() });

const bodySchema = z.object({
  companyId: z.uuid().optional(),

  title: z.string().min(3).max(140).optional(),
  descriptionMd: z.string().min(1).max(20000).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]).optional(),
  experienceLevel: z.enum(["junior", "mid", "senior", "lead"]).optional(), // <- "mid" (não "pleno")
  salaryMin: z.coerce.number().int().min(0).nullable().optional(),
  salaryMax: z.coerce.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).transform(s => s.toUpperCase()).optional(),
  remote: z.coerce.boolean().optional(),
  timezone: z.string().max(120).optional(),
  visaSponsorship: z.coerce.boolean().optional(),
  location: z.string().max(160).optional(),

  status: z.enum(["draft", "pending", "approved", "rejected", "expired"]).optional(),
  featuredUntil: z.coerce.date().nullable().optional(),
  postedAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),

  requirements: z.array(z.string().min(1)).max(100).nullable().optional(),
  benefits: z.array(z.string().min(1)).max(100).nullable().optional(),

  tags: z.array(
    z.union([
      z.string(),
      z.object({
        name: z.string(),
        slug: z.string().optional(),
        type: z.enum(["tech", "role", "seniority", "other"]).optional(),
      })
    ])
  ).nullable().optional(),
}).refine(
  d => (d.salaryMin == null && d.salaryMax == null) || (d.salaryMin != null && d.salaryMax != null && d.salaryMin <= d.salaryMax),
  { message: "salaryMin deve ser <= salaryMax quando ambos forem enviados.", path: ["salaryMin"] }
);

export default async function updateJob(req, res) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED" } });

    const { id } = paramsSchema.parse(req.params);
    const payload = bodySchema.parse(req.body);

    const result = await sequelize.transaction(async (t) => {
      const job = await Job.findByPk(id, { transaction: t, lock: { level: t.LOCK.UPDATE, of: Job } });
      if (!job) throw Object.assign(new Error("JOB_NOT_FOUND"), { status: 404 });

      const company = await Company.findByPk(job.company_id, {
        transaction: t,
        attributes: ["id", "name", "slug", "owner_id"],
      });
      if (!company) throw Object.assign(new Error("COMPANY_NOT_FOUND"), { status: 404 });

      const isAdmin = role === "admin";
      const isOwner = company.owner_id === uid;
      if (!isAdmin && !isOwner) {
        throw Object.assign(new Error("FORBIDDEN"), { status: 403, message: "Você não pode editar esta vaga." });
      }

      if (payload.companyId && payload.companyId !== job.company_id) {
        throw Object.assign(new Error("COMPANY_IMMUTABLE"), { status: 400, message: "companyId não pode ser alterado." });
      }

      if (payload.title !== undefined && payload.title !== job.title) {
        const baseSlug = slugify(`${payload.title}-${company.slug || company.name || ""}`.trim());
        job.title = payload.title;
        job.slug = await uniqueJobSlug(baseSlug, t);
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

      if (isAdmin) {
        if (payload.featuredUntil !== undefined) job.featured_until = payload.featuredUntil;

        if (payload.status !== undefined) {
          job.status = payload.status;

          if (payload.status === "approved") {
            job.posted_at = (payload.postedAt !== undefined) ? payload.postedAt : new Date();
          } else {
            job.posted_at = null;
          }
        } else if (payload.postedAt !== undefined) {
          if (job.status === "approved") {
            job.posted_at = payload.postedAt;
          }
        }
      }

      if (payload.tags !== undefined) {
        const tagsInput = payload.tags || [];
        if (tagsInput.length === 0) {
          await job.setTags([], { transaction: t });
        } else {
          const norm = tagsInput.map((v) => {
            if (typeof v === "string") return { name: v, slug: slugify(v), type: "tech" };
            return { name: v.name, slug: v.slug ? slugify(v.slug) : slugify(v.name), type: v.type || "tech" };
          });

          const bySlug = new Map(norm.map(x => [x.slug, x]));
          const slugs = [...bySlug.keys()];

          const existing = await Tag.findAll({ where: { slug: slugs }, transaction: t });
          const existingBySlug = new Map(existing.map(e => [e.slug, e]));
          const toCreate = slugs.filter(s => !existingBySlug.has(s)).map(s => bySlug.get(s));

          const created = await Promise.all(
            toCreate.map(d => Tag.create({ name: d.name, slug: d.slug, type: d.type }, { transaction: t }))
          );

          await job.setTags([...existing, ...created], { transaction: t });
        }
      }

      await job.save({ transaction: t });

      return {
        id: job.id,
        title: job.title,
        slug: job.slug,
        status: job.status,
        postedAt: job.posted_at,
        featuredUntil: job.featured_until,
      };
    });

    return res.json({ job: result });
  } catch (e) {
    const status = e.status || 500;
    const code =
      e.message === "JOB_NOT_FOUND" ? "JOB_NOT_FOUND" :
        e.message === "COMPANY_NOT_FOUND" ? "COMPANY_NOT_FOUND" :
          e.message === "FORBIDDEN" ? "FORBIDDEN" :
            e.message === "COMPANY_IMMUTABLE" ? "COMPANY_IMMUTABLE" :
              (e instanceof z.ZodError) ? "VALIDATION_ERROR" : "INTERNAL";

    const body = (e instanceof z.ZodError)
      ? { error: { code, details: e.errors } }
      : { error: { code, message: e.message } };

    console.error("[jobs.update]", e);
    return res.status(status).json(body);
  }
}
