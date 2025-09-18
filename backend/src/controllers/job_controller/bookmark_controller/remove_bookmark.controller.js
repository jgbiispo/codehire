import { z } from "zod";
import { Bookmark } from "../../../../db/sequelize.js";

const paramsSchema = z.object({ id: z.uuid() });

export default async function unbookmarkJob(req, res) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
    if (role !== "candidate") {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Apenas candidatos podem remover vagas salvas." } });
    }

    const { id: jobId } = paramsSchema.parse(req.params);

    await Bookmark.destroy({ where: { user_id: uid, job_id: jobId } });
    return res.status(204).send();
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "INVALID_REQUEST", details: e.errors } });
    }
    console.error("[jobs.unbookmark]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
