import { z } from "zod";
import { sequelize, Job, Company, Tag } from "../../../db/sequelize.js";
import { slugify, uniqueJobSlug } from "../../utils/slug.util.js";
import { httpError } from "../../server/http-error.js";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  companyId: z.uuid().optional(),
  title: z.string().min(3).max(140).optional(),
  descriptionMd: z.string().min(1).max(20000).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]).optional(),
  experienceLevel: z.enum(["junior", "mid", "senior", "lead"]).optional(),
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

  tags: z.array(z.union([
    z.string(),
    z.object({ name: z.string(), slug: z.string().optional(), type: z.enum(["tech", "role", "seniority", "other"]).optional() })
  ])).optional(),
}).refine(
  d => (d.salaryMin == null && d.salaryMax == null) || (d.salaryMin != null && d.salaryMax != null && d.salaryMin <= d.salaryMax),
  { message: "salaryMin deve ser <= salaryMax quando ambos forem enviados.", path: ["salaryMin"] }
);

export default async function duplicateJob(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) {
      await t.rollback();
      throw httpError(401, "UNAUTHORIZED");
    }

    const { id } = paramsSchema.parse(req.params);
    const payload = bodySchema.parse(req.body);

    const source = await Job.findByPk(id, {
      transaction: t,
      of: Job,
      include: [
        { model: Company, as: "company", attributes: ["id", "name", "slug", "owner_id"] },
        { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },
      ],
    });
    if (!source) { await t.rollback(); return res.status(404).json({ error: { code: "JOB_NOT_FOUND" } }); }

    const targetCompanyId = payload.companyId ?? source.company_id;
    const targetCompany = await Company.findByPk(targetCompanyId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!targetCompany) {
      await t.rollback();
      throw httpError(404, "COMPANY_NOT_FOUND");
    }

    const isAdmin = role === "admin";

    const title = payload.title ?? source.title;
    const description_md = payload.descriptionMd ?? source.description_md;
    const employment_type = payload.employmentType ?? source.employment_type;
    const experience_level = payload.experienceLevel ?? source.experience_level;
    const salary_min = (payload.salaryMin !== undefined) ? payload.salaryMin : source.salary_min;
    const salary_max = (payload.salaryMax !== undefined) ? payload.salaryMax : source.salary_max;
    const currency = payload.currency ?? source.currency ?? "BRL";
    const remote = (payload.remote !== undefined) ? payload.remote : source.remote;
    const timezone = (payload.timezone !== undefined) ? payload.timezone : source.timezone;
    const visa_sponsorship = (payload.visaSponsorship !== undefined) ? payload.visaSponsorship : source.visa_sponsorship;
    const location = (payload.location !== undefined) ? payload.location : (source.location ?? (remote ? "Remote" : null));
    const requirements = (payload.requirements !== undefined) ? payload.requirements : source.requirements;
    const benefits = (payload.benefits !== undefined) ? payload.benefits : source.benefits;

    let status, posted_at, featured_until;
    if (isAdmin) {
      status = payload.status ?? "approved";
      featured_until = payload.featuredUntil ?? null;
      posted_at = status === "approved" ? (payload.postedAt ?? new Date()) : null;
    } else {
      status = "pending";
      featured_until = null;
      posted_at = null;
    }
    const expires_at = (payload.expiresAt !== undefined) ? payload.expiresAt : null; // reset por padrão

    const baseSlug = slugify(`${title}-${targetCompany.slug || targetCompany.name || ""}`.trim());
    const slug = await uniqueJobSlug(baseSlug, t);

    const cloned = await Job.create({
      company_id: targetCompany.id,
      title,
      slug,
      description_md,
      employment_type,
      experience_level,
      salary_min,
      salary_max,
      currency,
      remote,
      timezone,
      visa_sponsorship,
      location,
      status,
      featured_until,
      requirements,
      benefits,
      posted_at,
      expires_at,
    }, { transaction: t });

    if (payload.tags?.length) {
      const norm = payload.tags.map((v) =>
        typeof v === "string"
          ? { name: v, slug: slugify(v), type: "tech" }
          : { name: v.name, slug: v.slug ? slugify(v.slug) : slugify(v.name), type: v.type || "tech" }
      );

      const bySlug = new Map(norm.map(x => [x.slug, x]));
      const slugs = [...bySlug.keys()];
      const existing = await Tag.findAll({ where: { slug: slugs }, transaction: t });
      const existingBySlug = new Map(existing.map(e => [e.slug, e]));
      const toCreate = slugs.filter(s => !existingBySlug.has(s)).map(s => bySlug.get(s));

      const created = await Promise.all(
        toCreate.map(d => Tag.create({ name: d.name, slug: d.slug, type: d.type }, { transaction: t }))
      );
      await cloned.setTags([...existing, ...created], { transaction: t });
    } else if (source.tags?.length) {
      await cloned.setTags(source.tags.map(tg => tg.id), { transaction: t });
    }

    await t.commit();

    const full = await Job.findByPk(cloned.id, {
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
