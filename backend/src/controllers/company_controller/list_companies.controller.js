import { z } from "zod";
import { Op, Sequelize } from "sequelize";
import { Company, Job } from "../../../db/sequelize.js";

const qSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  verified: z.coerce.boolean().optional(),
  ownerId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["recent", "jobs"]).default("recent"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export default async function listCompanies(req, res) {
  try {
    const { q, verified, ownerId, limit, offset, sort, order } = qSchema.parse(req.query);

    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { slug: { [Op.iLike]: `%${q}%` } },
        { description_md: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (typeof verified === "boolean") where.verified = verified;
    if (ownerId) where.owner_id = ownerId;

    const { rows, count } = await Company.findAndCountAll({
      where,
      attributes: {
        include: [[Sequelize.fn("COUNT", Sequelize.col(`jobs.id`)), "jobCount"]],
      },
      include: [
        {
          model: Job,
          as: "jobs",
          attributes: [],
          required: false,
        },
      ],
      group: ["Company.id"],
      order:
        sort === "jobs"
          ? [[Sequelize.literal(`"jobCount"`), order.toUpperCase()]]
          : [["created_at", order.toUpperCase()]],
      limit,
      offset,
      subQuery: false,
      distinct: false,
    });

    const total = Array.isArray(count) ? count.length : count;

    const items = rows.map((c) => {
      const data = c.get({ plain: true });
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url,
        website: data.website,
        description: data.description_md,
        location: data.location,
        verified: data.verified,
        verifiedAt: data.verified_at ?? null,
        jobCount: Number(data.jobCount || 0),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    });

    return res.json({ total, limit, offset, items });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos.", details: e.errors } });
    }
    console.error("[companies.list]", e);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Erro inesperado." } });
  }
}
