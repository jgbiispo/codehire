import { z } from "zod";
import { Op, Sequelize } from "sequelize";
import { Job, Company, User, Tag } from "../../../db/sequelize.js";

const qSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  companyId: z.uuid().optional(),
  status: z.enum(["draft", "pending", "approved", "rejected", "expired"]).optional(),
  remote: z.coerce.boolean().optional(),
  tag: z.string().trim().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["recent", "salary", "company", "title"]).default("recent"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export default async function listJobs(req, res) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;

    const { q, companyId, status, remote, tag, limit, offset, sort, order } = qSchema.parse(req.query);
    const where = {};
   
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description_md: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
      ];
    }
    
    if (companyId) where.company_id = companyId;
    if (typeof remote === "boolean") where.remote = remote;
    if (status) {
      if (["admin", "employer"].includes(role)) {
        where.status = status;
      } else {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Apenas administradores e empregadores podem filtrar por status." } });
      }
    } else {
      where.status = "approved";
    }

    if (tag) {
      const tagInstance = await Tag.findOne({ where: { [Op.or]: [{ name: tag }, { slug: tag }] } });
      if (!tagInstance) {
        return res.status(200).json({ items: [], total: 0 });
      }
      where.id = {
        [Op.in]: Sequelize.literal(`(SELECT "job_id" FROM "JobTags" WHERE "tag_id" = '${tagInstance.id}')`)
      };
    }

    const include = [
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "slug", "verified"],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "name", "email"],
          },
        ],
      },
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name", "slug", "type"],
        through: { attributes: [] },
      },
    ];

    if (role === "admin" || role === "employer") {
      // employers can see jobs of their companies
      if (role === "employer" && uid) {
        const employerCompanies = await Company.findAll({ where: { owner_id: uid }, attributes: ["id"] });
        const employerCompanyIds = employerCompanies.map(c => c.id);
        if (where.company_id) {
          if (!employerCompanyIds.includes(where.company_id)) {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "Você não pode ver vagas de outras empresas." } });
          }
        } else {
          where.company_id = { [Op.in]: employerCompanyIds };
        }
      }
    } else {
      where.status = "approved";
    }

    const orderBy =
      sort === "recent" ? ["created_at", order.toUpperCase()] :
        sort === "salary" ? ["salary_max", order.toUpperCase()] :
          sort === "company" ? [{ model: Company, as: "company" }, "name", order.toUpperCase()] :
            sort === "title" ? ["title", order.toUpperCase()] :
              ["created_at", "DESC"];
    const { rows, count } = await Job.findAndCountAll({
      where,
      include,
      order: [orderBy],
      limit,
      offset,
      distinct: true,
    });

    const items = rows.map((j) => {
      const data = j.get({ plain: true });
      return {
        id: data.id,
        company: data.company ? {
          id: data.company.id,
          name: data.company.name,
          slug: data.company.slug,
          verified: data.company.verified,
        } : null,
        title: data.title,
        slug: data.slug,
        descriptionMd: data.description_md,
        employmentType: data.employment_type,
        experienceLevel: data.experience_level,
        salaryMin: data.salary_min,
        salaryMax: data.salary_max,
        currency: data.currency,
        remote: data.remote,
        timezone: data.timezone,
        visaSponsorship: data.visa_sponsorship,
        location: data.location,
        status: data.status,
        featuredUntil: data.featured_until ?? null,
        requirements: data.requirements || [],
        benefits: data.benefits || [],
        tags: data.tags ? data.tags.map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          type: t.type,
        })) : [],
        postedAt: data.posted_at,
        expiresAt: data.expires_at ?? null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    });

    return res.json({ total: count, limit, offset, items });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos.", details: e.errors } });
    }
    console.error("[jobs.list]", e);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Erro ao listar vagas." } });
  }
}