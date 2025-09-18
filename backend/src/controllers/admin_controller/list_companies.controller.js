import { z } from "zod";
import { Op } from "sequelize";
import { Company, User } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const querySchema = z.object({
  q: z.string().trim().optional(),
  verified: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export default async function listAdminCompanies(req, res, next) {
  try {
    if (req.user?.role !== "admin") throw httpError(403, "FORBIDDEN", "Apenas administradores.");

    const { q, verified, limit, offset } = querySchema.parse(req.query);
    const where = {};
    if (typeof verified === "string") where.verified = verified === "true";
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { slug: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { rows, count } = await Company.findAndCountAll({
      where,
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "email", "role"] },
        { model: User, as: "verifiedBy", attributes: ["id", "name", "email", "role"], required: false },
      ],
      order: [["name", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    const items = rows.map(c => {
      const x = c.get({ plain: true });
      return {
        id: x.id,
        name: x.name,
        slug: x.slug,
        website: x.website,
        verified: x.verified,
        verifiedAt: x.verified_at ?? null,
        owner: x.owner ? { id: x.owner.id, name: x.owner.name, email: x.owner.email } : null,
        verifiedBy: x.verifiedBy ? { id: x.verifiedBy.id, name: x.verifiedBy.name, email: x.verifiedBy.email } : null,
      };
    });

    return res.json({ total: count, limit, offset, items });
  } catch (e) {
    return next(e);
  }
}
