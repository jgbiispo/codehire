import { z } from "zod";
import { Op } from "sequelize";
import { User } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const querySchema = z.object({
  q: z.string().trim().optional(),              // busca por nome/email
  role: z.enum(["candidate", "employer", "admin"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export default async function listAdminUsers(req, res, next) {
  try {
    const { q, role, limit, offset } = querySchema.parse(req.query);
    const where = {};
    if (role) where.role = role;
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ["id", "name", "email", "role", "avatar_url", "headline", "location"],
      order: [["name", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.json({ total: count, limit, offset, items: rows });
  } catch (e) {
    return next(e);
  }
}
