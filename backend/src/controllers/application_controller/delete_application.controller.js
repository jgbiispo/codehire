import { z } from "zod";
import { Application } from "../../../db/sequelize.js";

const pSchema = z.object({ id: z.uuid() });

export default async function deleteApplication(req, res) {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED" } });

    const { id } = pSchema.parse(req.params);
    const app = await Application.findByPk(id);
    if (!app) return res.status(404).json({ error: { code: "NOT_FOUND" } });

    if (app.user_id !== uid) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Você só pode remover suas próprias candidaturas." } });
    }
    if (app.status !== "submitted") {
      return res.status(400).json({ error: { code: "CANNOT_DELETE", message: "Só é possível remover candidaturas em estado 'submitted'." } });
    }

    await app.destroy();
    return res.status(204).send();
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: e.errors } });
    }
    console.error("[applications.delete]", e);
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
