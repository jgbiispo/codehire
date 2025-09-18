import { z } from "zod";
import { sequelize, Job, Company, Tag } from "../../../db/sequelize.js";
import { slugify, uniqueJobSlug } from "../../utils/slug.util.js";
import { httpError } from "../../server/http-error.js";

const bodySchema = z.object({
  companyId: z.uuid(),
  title: z.string().min(3).max(140),
  descriptionMd: z.string().min(1).max(20000),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]),
  experienceLevel: z.enum(["junior", "mid", "senior", "lead"]),
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

export default async function createJob(req, res) {
  const t = await sequelize.transaction();
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) {
      await t.rollback();
      throw httpError(401, "UNAUTHORIZED");
    }

    const payload = bodySchema.parse(req.body);

    const company = await Company.findByPk(payload.companyId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!company) { await t.rollback(); return res.status(404).json({ error: { code: "COMPANY_NOT_FOUND" } }); }

    const isAdmin = role === "admin";
    const isOwner = company.owner_id === uid;
    if (!isAdmin && !isOwner) {
      await t.rollback();
      throw httpError(403, "FORBIDDEN", "Apenas administradores ou o dono da empresa podem criar vagas para ela.");
    }

    const status = isAdmin ? (payload.status || "approved") : "pending";
    const featured_until = isAdmin ? payload.featuredUntil || null : null;

    const posted_at = isAdmin
      ? (payload.postedAt || new Date())
      : null;

    const baseSlug = slugify(`${payload.title}-${company.slug || company.name || ""}`.trim());
    const slug = await uniqueJobSlug(baseSlug, t);

    const job = await Job.create({
      company_id: company.id,
      title: payload.title,
      slug,
      description_md: payload.descriptionMd,
      employment_type: payload.employmentType,
      experience_level: payload.experienceLevel,
      salary_min: payload.salaryMin ?? null,
      salary_max: payload.salaryMax ?? null,
      currency: payload.currency || "BRL",
      remote: payload.remote ?? true,
      timezone: payload.timezone || null,
      visa_sponsorship: payload.visaSponsorship ?? false,
      location: payload.location || (payload.remote ? "Remote" : null),
      status,
      featured_until,
      requirements: payload.requirements || null,
      benefits: payload.benefits || null,
      posted_at,
      expires_at: payload.expiresAt || null,
    }, { transaction: t });

    // tags (findOrCreate)
    if (payload.tags?.length) {
      const norm = payload.tags.map((v) => {
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

      const allTags = [...existing, ...created];
      await job.setTags(allTags, { transaction: t });
    }

    await t.commit();

    const full = await Job.findByPk(job.id, {
      include: [
        { model: Company, as: "company", attributes: ["id", "name", "slug", "logo_url", "verified", "location"] },
        { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },
      ]
    });

    const j = full.get({ plain: true });

    return res.status(201).json({
      job: {
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
        company: j.company && {
          id: j.company.id, name: j.company.name, slug: j.company.slug, logoUrl: j.company.logo_url, verified: j.company.verified, location: j.company.location,
        },
        tags: (j.tags || []).map(tg => ({ id: tg.id, name: tg.name, slug: tg.slug, type: tg.type })),
      }
    });

  } catch (e) {
    next(e);
  }
}
