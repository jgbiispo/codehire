import { z } from "zod";
import { Company } from "../../../db/sequelize.js";

const paramsSchema = z.object({ id: z.string().uuid() });

export default async function verifyCompany(req, res) {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Apenas administradores podem verificar empresas." } });
    }

    const { id } = paramsSchema.parse(req.params);
    const company = await Company.findByPk(id);
    if (!company) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Empresa não encontrada." } });

    company.verified = true;
    await company.save();

    return res.json({ ok: true, id: company.id, verified: company.verified });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos.", details: e.errors } });
    }
    console.error("[companies.verify]", e);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Erro inesperado." } });
  }
}
