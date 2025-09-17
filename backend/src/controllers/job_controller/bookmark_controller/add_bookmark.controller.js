import { z } from "zod";
import { sequelize, Job, Bookmark } from "../../../../db/sequelize.js";

const paramsSchema = z.object({ id: z.uuid() });

export default async function addBookmarkJob(req, res) {
  const t = await sequelize.transaction();
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) { await t.rollback(); return res.status(401).json({ error: { code: "UNAUTHORIZED" } }); }
    if (role !== "candidate") {
      await t.rollback();
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Apenas candidatos podem salvar vagas." } });
    }

    const { id: jobId } = paramsSchema.parse(req.params);

    const job = await Job.findByPk(jobId, {
      attributes: ["id", "status", "expires_at"],
      transaction: t,
      lock: { level: t.LOCK.UPDATE, of: Job },
    });
    if (!job) { await t.rollback(); return res.status(404).json({ error: { code: "JOB_NOT_FOUND" } }); }
    const isExpired = job.expires_at && new Date(job.expires_at) < new Date();
    if (job.status !== "approved") { await t.rollback(); return res.status(400).json({ error: { code: "JOB_NOT_OPEN" } }); }
    if (isExpired) { await t.rollback(); return res.status(400).json({ error: { code: "JOB_EXPIRED" } }); }

    const [row, created] = await Bookmark.findOrCreate({
      where: { user_id: uid, job_id: jobId },
      defaults: { created_at: new Date() },
      transaction: t,
    });

    await t.commit();
    return res.status(created ? 201 : 200).json({
      bookmarked: true,
      jobId,
      bookmarkedAt: row.created_at,
      created: !!created,
    });
  } catch (e) {
    await t.rollback();
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "INVALID_REQUEST", details: e.errors } });
    }
    console.error("[jobs.bookmark]", e);
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
