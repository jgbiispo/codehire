import { z } from "zod";
import { Op, Sequelize } from "sequelize";
import { Job, Company } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const querySchema = z.object({
  status: z.enum(["draft", "pending", "approved", "rejected", "expired"]).optional(),
  q: z.string().trim().optional(),
  companyId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export default async function listAdminJobs(req, res, next) {
  try {
    if (req.user?.role !== "admin") throw httpError(403, "FORBIDDEN", "Apenas administradores.");

    const { status, q, companyId, limit, offset } = querySchema.parse(req.query);
    const where = {};
    if (status) where.status = status;
    if (companyId) where.company_id = companyId;
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { slug: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { rows, count } = await Job.findAndCountAll({
      where,
      include: [
        { model: Company, as: "company", attributes: ["id", "name", "slug", "verified", "location", "logo_url"] }
      ],
      order: [
        [Sequelize.literal(`CASE WHEN status='approved' THEN 0 ELSE 1 END`), "ASC"],
        [Sequelize.literal(`(featured_until IS NOT NULL)`), "DESC"],
        [Sequelize.literal(`posted_at IS NULL, posted_at DESC`)],
        ["title", "ASC"]
      ],
      limit,
      offset,
      distinct: true,
    });

    const items = rows.map(j => {
      const x = j.get({ plain: true });
      return {
        id: x.id,
        title: x.title,
        slug: x.slug,
        status: x.status,
        postedAt: x.posted_at,
        featuredUntil: x.featured_until,
        expiresAt: x.expires_at,
        company: x.company && {
          id: x.company.id, name: x.company.name, slug: x.company.slug,
          verified: x.company.verified, location: x.company.location, logoUrl: x.company.logo_url
        }
      };
    });

    return res.json({ total: count, limit, offset, items });
  } catch (e) {
    return next(e);
  }
}
