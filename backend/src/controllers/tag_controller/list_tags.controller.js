import { z } from "zod";
import { Op, literal } from "sequelize";
import { sequelize, Tag, Job } from "../../../db/sequelize.js";

const TAG_TYPES = ["tech", "role", "seniority", "other"];

const querySchema = z.object({
  q: z.string().trim().optional(),
  type: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["alpha", "jobs"]).default("alpha"),
  withCount: z.coerce.boolean().optional().default(false)
});

export default async function listTags(req, res) {
  try {
    const { q, type, limit, offset, sort, withCount } = querySchema.parse(req.query);

    const where = {};
    if (q) where.name = { [Op.iLike]: `%${q}%` };

    if (type) {
      const asked = type.split(",").map(s => s.trim()).filter(Boolean);
      const valid = asked.filter(t => TAG_TYPES.includes(t));
      if (valid.length) where.type = { [Op.in]: valid };
      else where.type = { [Op.in]: TAG_TYPES };
    }

    if (sort === "alpha" && !withCount) {
      const { rows, count } = await Tag.findAndCountAll({
        where,
        attributes: ["id", "name", "slug", "type"],
        order: [["name", "ASC"]],
        limit,
        offset,
      });

      return res.json({
        total: count,
        limit,
        offset,
        items: rows.map(t => t.get({ plain: true })),
      });
    }
    const approvedAndLive = {
      status: "approved",
      posted_at: { [Op.ne]: null },
      [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
    };

    const total = await Tag.count({ where });

    const items = await Tag.findAll({
      where,
      attributes: [
        "id", "name", "slug", "type",
        [sequelize.fn("COUNT", sequelize.col("jobs.id")), "jobCount"],
      ],
      include: [{
        model: Job,
        as: "jobs",
        attributes: [],
        through: { attributes: [] },
        required: false,
        where: approvedAndLive,
      }],
      group: ["Tag.id"],
      order: (
        sort === "jobs"
          ? [[literal(`"jobCount"`), "DESC"], ["name", "ASC"]]
          : [["name", "ASC"]]
      ),
      limit,
      offset,
      subQuery: false,
    });

    return res.json({
      total,
      limit,
      offset,
      items: items.map(row => {
        const r = row.get({ plain: true });
        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          type: r.type,
          jobCount: Number(r.jobCount ?? 0),
        };
      }),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: e.errors } });
    }
    console.error("[tags.list]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
