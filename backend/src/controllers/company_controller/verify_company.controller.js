import { z } from "zod";
import { Company } from "../../../db/sequelize.js";

const paramsSchema = z.object({ id: z.string().uuid() });

export default async function verifyCompany(req, res) {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Apenas administradores." } });
    }
    const { id } = paramsSchema.parse(req.params);
    const c = await Company.findByPk(id);
    if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Empresa não encontrada." } });

    if (!c.verified) {
      await c.update({
        verified: true,
        verified_at: new Date(),
        verified_by: req.user.id,
      });
      await c.save();
    } else {
      return res.status(400).json({ error: { code: "ALREADY_VERIFIED", message: "Empresa já verificada." } });
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
    if (e.name === "ZodError") {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: e.errors } });
    }
    console.error("[companies.verify]", e);
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
