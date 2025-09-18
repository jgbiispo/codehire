import { z } from "zod";
import { Company } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const paramsSchema = z.object({ id: z.uuid() });

export default async function verifyCompany(req, res, next) {
  try {
    const { id } = paramsSchema.parse(req.params);
    const c = await Company.findByPk(id);
    if (!c) throw httpError(404, "NOT_FOUND", "Empresa não encontrada.");

    if (!c.verified) {
      await c.update({
        verified: true,
        verified_at: new Date(),
        verified_by: req.user.id,
      });
      await c.save();
    } else {
      throw httpError(400, "ALREADY_VERIFIED", "Empresa já está verificada.");
    }

    const pub = {
      id: c.id,
      name: c.name,
      verified: c.verified,
      verifiedAt: c.verified_at ?? null,
      verifiedBy: c.verified_by ?? null,
    };

    return res.json({ company: pub });

  } catch (e) {
    next(e);
  }
}
