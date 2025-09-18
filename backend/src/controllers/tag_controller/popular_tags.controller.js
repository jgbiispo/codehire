import { z } from "zod";
import { Op, Sequelize } from "sequelize";
import { Tag, Job } from "../../../db/sequelize.js";

const TAG_TYPES = ["tech", "role", "seniority", "other"];

const querySchema = z.object({
  sinceDays: z.coerce.number().int().min(1).max(3650).default(90),
  q: z.string().trim().optional(),
  type: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export default async function popularTags(req, res, next) {
  try {
    const { sinceDays, q, type, limit, offset } = querySchema.parse(req.query);

    const since = new Date(Date.now() - sinceDays * 864e5);
    const now = new Date();

    const tagWhere = {};
    if (q) tagWhere.name = { [Op.iLike]: `%${q}%` };
    if (type) {
      const asked = type.split(",").map(s => s.trim()).filter(Boolean);
      const valid = asked.filter(t => TAG_TYPES.includes(t));
      if (valid.length) tagWhere.type = { [Op.in]: valid };
    }

    const jobWhere = {
      status: "approved",
      posted_at: { [Op.gte]: since },
      [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now } }],
    };

    const total = await Tag.count({
      where: tagWhere,
      distinct: true,
      col: "Tag.id",
      include: [{
        model: Job,
        as: "jobs",
        attributes: [],
        through: { attributes: [] },
        required: true,
        where: jobWhere,
      }],
    });

    const items = await Tag.findAll({
      where: tagWhere,
      attributes: [
        "id", "name", "slug", "type",
        [Sequelize.fn("COUNT", Sequelize.col("jobs.id")), "jobCount"],
      ],
      include: [{
        model: Job,
        as: "jobs",
        attributes: [],
        through: { attributes: [] },
        required: true,
        where: jobWhere,
      }],
      group: ["Tag.id"],
      order: [
        [Sequelize.literal(`"jobCount"`), "DESC"],
        ["name", "ASC"],
      ],
      limit,
      offset,
      subQuery: false,
    });

    return res.json({
      total,
      limit,
      offset,
      sinceDays,
      items: items.map(r => {
        const t = r.get({ plain: true });
        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          type: t.type,
          jobCount: Number(t.jobCount ?? 0),
        };
      }),
    });
  } catch (e) {
    next(e);
  }
}
