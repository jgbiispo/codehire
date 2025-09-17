import { z } from "zod";
import { sequelize, Bookmark } from "../../../../db/sequelize.js";

const paramsSchema = z.object({ id: z.string().uuid() });

export default async function unbookmarkJob(req, res) {
  const t = await sequelize.transaction();
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) { await t.rollback(); return res.status(401).json({ error: { code: "UNAUTHORIZED" } }); }
    if (role !== "candidate") {
      await t.rollback();
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Apenas candidatos podem remover vagas salvas." } });
    }

    const { id: jobId } = paramsSchema.parse(req.params);

    await Bookmark.destroy({
      where: { user_id: uid, job_id: jobId },
      transaction: t,
    });

    await t.commit();
    return res.status(204).send(); // idempotente
  } catch (e) {
    await t.rollback();
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "INVALID_REQUEST", details: e.errors } });
    }
    console.error("[jobs.unbookmark]", e);
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
