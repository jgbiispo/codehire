import { z } from "zod";
import { Op, literal } from "sequelize";
import { Job, Company, Tag } from "../../../db/sequelize.js";
import { slugify } from "../../utils/slug.util.js";

const querySchema = z.object({
  q: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  company: z.string().trim().optional(),
  experienceLevel: z.enum(["junior", "mid", "senior", "lead"]).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]).optional(),
  remote: z.coerce.boolean().optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["recent", "relevance"]).default("recent"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export default async function searchJobs(req, res) {
  try {
    const {
      q, tags, company, experienceLevel, employmentType,
      remote, salaryMin, salaryMax, sort, limit, offset
    } = querySchema.parse(req.query);

    const where = {
      status: "approved",
      posted_at: { [Op.ne]: null },
      [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
    };

    const tokens = (q || "").split(/\s+/).map(s => s.trim()).filter(Boolean).slice(0, 5);
    if (tokens.length) {
      where[Op.and] = tokens.map(t => ({
        [Op.or]: [
          { title: { [Op.iLike]: `%${t}%` } },
          { description_md: { [Op.iLike]: `%${t}%` } },
        ]
      }));
    }

    if (experienceLevel) where.experience_level = experienceLevel;
    if (employmentType) where.employment_type = employmentType;
    if (typeof remote === "boolean") where.remote = remote;

    if (salaryMin != null) {
      where[Op.and] = [...(where[Op.and] || []), {
        [Op.or]: [
          { salary_max: { [Op.gte]: salaryMin } },
          { salary_max: null },
        ]
      }];
    }

    if (salaryMax != null) {
      where[Op.and] = [...(where[Op.and] || []), {
        [Op.or]: [
          { salary_min: { [Op.lte]: salaryMax } },
          { salary_min: null },
        ]
      }];
    }

    const include = [
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "slug", "logo_url", "verified", "location"],
        ...(company ? { required: true, where: { slug: company } } : { required: false })
      },
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name", "slug", "type"],
        through: { attributes: [] },
      }
    ];

    let tagFilter = null;
    if (tags) {
      const slugs = tags.split(",").map(s => slugify(s.trim())).filter(Boolean);
      if (slugs.length) {
        include[1] = {
          ...include[1],
          required: true,
          where: { slug: { [Op.in]: slugs } },
        };
        tagFilter = slugs;
      }
    }

    const featuredRank = literal(`CASE WHEN "Job"."featured_until" IS NOT NULL AND "Job"."featured_until" > NOW() THEN 0 ELSE 1 END`);
    const order = [[featuredRank, "ASC"]];

    if (sort === "relevance" && tokens.length) {
      const parts = tokens.map(t => {
        const safe = t.replace(/'/g, "''");
        return [
          `CASE WHEN "Job"."title" ILIKE '%${safe}%' THEN 2 ELSE 0 END`,
          `CASE WHEN "Job"."description_md" ILIKE '%${safe}%' THEN 1 ELSE 0 END`,
        ].join(" + ");
      });
      const scoreExpr = parts.length ? parts.join(" + ") : "0";
      const score = literal(`(${scoreExpr})`);
      order.push([score, "DESC"]);
    }

    order.push(["posted_at", "DESC"]);

    console.log("[search.jobs] where:", where, "tagFilter:", tagFilter, "order:", order);

    const { rows, count } = await Job.findAndCountAll({
      where,
      include,
      distinct: true,
      limit,
      offset,
      order,
      subQuery: false,
    });

    const items = rows.map(j => {
      const r = j.get({ plain: true });
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description_md,
        employmentType: r.employment_type,
        experienceLevel: r.experience_level,
        salary: { min: r.salary_min, max: r.salary_max, currency: r.currency },
        remote: r.remote,
        timezone: r.timezone,
        visaSponsorship: r.visa_sponsorship,
        location: r.location,
        status: r.status,
        featuredUntil: r.featured_until,
        postedAt: r.posted_at,
        expiresAt: r.expires_at,
        company: r.company && {
          id: r.company.id,
          name: r.company.name,
          slug: r.company.slug,
          logoUrl: r.company.logo_url,
          verified: r.company.verified,
          location: r.company.location,
        },
        tags: (r.tags || []).map(t => ({ id: t.id, name: t.name, slug: t.slug, type: t.type })),
      };
    });

    return res.json({ total: count, limit, offset, items });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: e.errors } });
    }
    console.error("[search.jobs]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
